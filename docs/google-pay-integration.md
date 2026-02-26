# Google Pay (GPay) Payment Integration Guide

## Table of Contents
- [Understanding the Payment Flow](#understanding-the-payment-flow)
- [What is Razorpay?](#what-is-razorpay)
- [Why We Use Razorpay for Google Pay](#why-we-use-razorpay-for-google-pay)
- [How UPI Payments Work](#how-upi-payments-work)
- [Step-by-Step Integration](#step-by-step-integration)
- [Backend Implementation](#backend-implementation)
- [Frontend Implementation](#frontend-implementation)
- [Webhook Configuration](#webhook-configuration)
- [Security Tips](#security-tips)
- [Common Errors & Solutions](#common-errors--solutions)
- [Final Checklist](#final-checklist)

---

## Understanding the Payment Flow

```
User (GPay App) → Razorpay Checkout → Your Backend → Payment Verification → Subscription Activation
```

**Important Note**: Google Pay does not provide a direct API for web applications. Instead, we use **Razorpay's UPI payment method**, which supports Google Pay, PhonePe, Paytm, and other UPI apps.

---

## What is Razorpay?

**Razorpay** is India's leading payment gateway that allows businesses to accept payments via:
- UPI (Google Pay, PhonePe, Paytm, etc.)
- Credit/Debit Cards
- Net Banking
- Wallets
- EMI

### Why Razorpay?
- Easy integration
- Supports all major UPI apps including Google Pay
- Secure payment processing
- Comprehensive dashboard
- Webhook support for automatic verification

---

## Why We Use Razorpay to Accept Google Pay

### The Problem:
Google Pay does not provide a direct API for normal web applications to accept payments. The Google Pay API is only available for:
- Large enterprises with special partnerships
- Specific use cases like transit tickets
- Android app integrations

### The Solution:
**Razorpay UPI Integration** allows users to pay using their Google Pay app through the UPI protocol.

### How It Works:
1. User clicks "Pay with Google Pay" on your website
2. Razorpay checkout opens with UPI option
3. User enters their UPI ID or selects Google Pay
4. User receives notification on their Google Pay app
5. User approves payment in Google Pay app
6. Razorpay processes and verifies the payment
7. Your backend receives confirmation via webhook

---

## How UPI Payments Work

### What is UPI?
**Unified Payments Interface (UPI)** is India's real-time payment system developed by NPCI. It allows instant money transfer between bank accounts using a UPI ID.

### UPI Payment Flow:
```
1. Customer enters UPI ID (e.g., username@okaxis)
2. Razorpay sends collect request to customer's bank
3. Customer receives notification on UPI app (Google Pay)
4. Customer approves payment in app
5. Bank debits customer account
6. Razorpay confirms payment success
7. Your server receives webhook notification
```

---

## Step-by-Step Integration

### Step 1: Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Click **"Sign Up"**
3. Fill in your business details:
   - Business name: FinTrack Pro
   - Email: your email
   - Phone: your phone number
4. Complete email verification
5. Complete KYC (Know Your Customer) process
   - Upload PAN card
   - Upload business proof
   - Add bank account details

### Step 2: Get Test API Keys

1. Log in to Razorpay Dashboard
2. Switch to **"Test Mode"** (toggle in top right)
3. Go to **Settings** → **API Keys**
4. Click **"Generate Key"**
5. Copy:
   - **Key ID**: Starts with `rzp_test_`
   - **Key Secret**: Keep this secret! 

### Step 3: Add Keys in .env

Add these to your `backend/.env` file:

```env
# Razorpay Test Keys
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here

# Razorpay Webhook Secret (we'll get this later)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## Backend Implementation

### 1. Install Razorpay SDK

```bash
cd backend
npm install razorpay
```

### 2. Create Payment Controller

Create `backend/controllers/paymentController.js`:

```javascript
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Order
exports.createOrder = async (req, res) => {
    try {
        const { plan, billingCycle } = req.body;

        // Determine amount based on plan
        let amount;
        if (plan === 'pro' && billingCycle === 'monthly') {
            amount = 199; // INR 199
        } else if (plan === 'pro' && billingCycle === 'yearly') {
            amount = 1999; // INR 1999
        } else {
            return res.status(400).json({ message: 'Invalid plan' });
        }

        // Create Razorpay order
        const options = {
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}_${req.user._id}`,
            notes: {
                userId: req.user._id.toString(),
                plan: billingCycle === 'monthly' ? 'pro_monthly' : 'pro_yearly'
            }
        };

        const order = await razorpay.orders.create(options);

        // Save payment record
        const payment = await Payment.create({
            user: req.user._id,
            razorpayOrderId: order.id,
            amount: amount,
            currency: 'INR',
            plan: billingCycle === 'monthly' ? 'pro_monthly' : 'pro_yearly',
            status: 'created'
        });

        res.json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                paymentId: payment._id
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: 'Error creating order' });
    }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        // Update payment record
        const payment = await Payment.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'paid'
            },
            { new: true }
        );

        // Activate subscription
        const subscription = await Subscription.findOneAndUpdate(
            { user: req.user._id },
            {
                plan: 'pro',
                status: 'active',
                paymentId: payment._id,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: { payment, subscription }
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
};

// Webhook Handler
exports.handleWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body;

    // Handle payment captured event
    if (event.event === 'payment.captured') {
        const paymentData = event.payload.payment.entity;
        
        await Payment.findOneAndUpdate(
            { razorpayOrderId: paymentData.order_id },
            {
                razorpayPaymentId: paymentData.id,
                status: 'paid',
                method: paymentData.method
            }
        );
    }

    res.json({ received: true });
};
```

### 3. Create Payment Routes

Create `backend/routes/paymentRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Create order
router.post('/create-order', protect, paymentController.createOrder);

// Verify payment
router.post('/verify', protect, paymentController.verifyPayment);

// Webhook (must be raw body for signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Get payment history
router.get('/history', protect, paymentController.getPaymentHistory);

module.exports = router;
```

---

## Frontend Implementation

### 1. Add Razorpay Checkout Script

Add to your `index.html` head section:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 2. Create Payment Component

Create `frontend/src/components/PaymentButton.jsx`:

```jsx
import { useState } from 'react';
import { paymentAPI, subscriptionAPI } from '../services/api';

const PaymentButton = ({ plan, billingCycle, amount, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        
        try {
            // Step 1: Create order on backend
            const orderRes = await paymentAPI.createOrder({ plan, billingCycle });
            const { orderId, keyId } = orderRes.data.data;

            // Step 2: Initialize Razorpay checkout
            const options = {
                key: keyId,
                amount: amount * 100,
                currency: 'INR',
                name: 'FinTrack Pro',
                description: `${plan} Subscription`,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        // Step 3: Verify payment on backend
                        await paymentAPI.verify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        // Step 4: Upgrade subscription
                        await subscriptionAPI.upgrade({
                            plan,
                            billingCycle,
                            paymentId: orderRes.data.data.paymentId
                        });

                        alert('Payment successful!');
                        onSuccess();
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: '',
                    email: '',
                },
                theme: {
                    color: '#3B82F6'
                },
                // Enable UPI for Google Pay
                config: {
                    display: {
                        blocks: {
                            upi: {
                                name: 'Pay via UPI',
                                instruments: [
                                    { method: 'upi' }
                                ]
                            }
                        },
                        sequence: ['block.upi'],
                        preferences: {
                            show_default_blocks: true
                        }
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
            
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to initiate payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handlePayment} 
            disabled={loading}
            className="btn btn-primary"
        >
            {loading ? 'Processing...' : `Pay ₹${amount}`}
        </button>
    );
};

export default PaymentButton;
```

---

## Webhook Configuration

### Step 1: Set Up Webhook in Razorpay Dashboard

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Click **"Add New Webhook"**
3. Enter URL: `https://your-api-url.com/api/payments/webhook`
4. Select Events:
   - `payment.captured`
   - `payment.failed`
5. Click **"Create Webhook"**
6. Copy the **Webhook Secret**
7. Add to your `.env` file:

```env
RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 2: Why Webhooks Are Important

Webhooks ensure your database is updated even if:
- User closes browser after payment
- Network issues occur during verification
- Payment takes time to process

**Without webhooks**: Payment might succeed but subscription not activated

**With webhooks**: Automatic synchronization guaranteed

---

## Security Tips

### 1. Never Expose Secret Keys

**DON'T:**
```javascript
// BAD - Never do this!
const razorpay = new Razorpay({
    key_id: 'rzp_test_xxx',  // Don't hardcode
    key_secret: 'secret_xxx'  // Never expose this!
});
```

**DO:**
```javascript
// GOOD - Use environment variables
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

### 2. Always Verify Signatures

Payment signatures prevent tampering. Always verify:
- Webhook signatures
- Payment verification signatures

### 3. Use HTTPS in Production

Never use HTTP for payment processing in production. Always use HTTPS.

### 4. Store Minimal Payment Data

Only store:
- Order ID
- Payment ID
- Amount
- Status
- Timestamp

**Never store:**
- Card numbers
- CVV
- UPI PINs
- Full card details

### 5. Implement Idempotency

Prevent duplicate charges by checking if payment already processed:

```javascript
const existingPayment = await Payment.findOne({
    razorpayOrderId: orderId
});

if (existingPayment && existingPayment.status === 'paid') {
    return res.json({ message: 'Payment already processed' });
}
```

---

## Common Errors & Solutions

### Error 1: "Invalid API Key"

**Cause**: Wrong API keys or using test keys in production

**Solution**:
1. Check if you're using correct environment (Test/Live)
2. Verify keys are correctly copied
3. Restart server after updating .env

### Error 2: "Order ID is mandatory"

**Cause**: Order not created before opening checkout

**Solution**:
1. Always create order on backend first
2. Use the returned order_id in checkout options

### Error 3: "Signature verification failed"

**Cause**: Wrong secret key or modified data

**Solution**:
1. Verify you're using Key Secret, not Key ID
2. Check that data wasn't modified before verification
3. Ensure correct encoding (UTF-8)

### Error 4: "Payment failed" in UPI

**Cause**: User's UPI app issue or insufficient funds

**Solution**:
1. Show user-friendly error message
2. Allow retry
3. Offer alternative payment methods

### Error 5: "Webhook not received"

**Cause**: Wrong webhook URL or server not accessible

**Solution**:
1. Verify webhook URL is correct and publicly accessible
2. Check server logs for incoming requests
3. Use tools like ngrok for local testing

---

## Final Checklist

Before going live, verify:

- [ ] Razorpay account created and KYC completed
- [ ] Test API keys obtained
- [ ] Backend order creation endpoint working
- [ ] Payment verification implemented
- [ ] Webhook configured and tested
- [ ] Frontend checkout integration complete
- [ ] Error handling implemented
- [ ] Security measures in place (signature verification)
- [ ] Test payments successful in Test Mode
- [ ] Switch to Live Mode with Live API keys
- [ ] Update webhook URL to production
- [ ] Test one live payment with small amount

---

## Testing Payments

### Test UPI ID
Use this test UPI ID in Razorpay Test Mode:
- `success@razorpay` - Simulates successful payment
- `failure@razorpay` - Simulates failed payment

### Test Cards
Use these test card numbers:
- **Success**: 5267 3181 8797 5449
- **Failure**: 4111 1111 1111 1111

Any CVV and future expiry date works.

---

**Need Help?**
- Razorpay Documentation: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- Razorpay Support: support@razorpay.com
