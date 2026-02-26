const Razorpay = require('razorpay');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');

// Check if Razorpay keys are configured
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('ERROR: Razorpay API keys are not configured!');
    console.error('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
}

// Initialize Razorpay
let razorpay;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('Razorpay initialized successfully with key:', process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...');
} catch (error) {
    console.error('Failed to initialize Razorpay:', error.message);
}

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
const createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { plan, billingCycle } = req.body;

        // Determine amount based on plan
        let amount;
        let planType;
        
        if (plan === 'pro' && billingCycle === 'monthly') {
            amount = 199; // INR 199
            planType = 'pro_monthly';
        } else if (plan === 'pro' && billingCycle === 'yearly') {
            amount = 1999; // INR 1999
            planType = 'pro_yearly';
        } else {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid plan or billing cycle' 
            });
        }

        // Create Razorpay order
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-8)}`, // Max 40 chars
            notes: {
                userId: req.user._id.toString(),
                plan: planType,
                billingCycle
            }
        };

        console.log('Creating Razorpay order with options:', options);
        
        let order;
        try {
            order = await razorpay.orders.create(options);
            console.log('Razorpay order created:', order.id);
        } catch (razorpayError) {
            console.error('Razorpay API error:', razorpayError);
            throw new Error(`Razorpay error: ${JSON.stringify(razorpayError)}`);
        }

        // Save payment record
        const payment = await Payment.create({
            user: req.user._id,
            razorpayOrderId: order.id,
            amount: amount,
            currency: 'INR',
            plan: planType,
            status: 'created',
            notes: {
                billingCycle,
                userEmail: req.user.email
            }
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
        
        // Extract meaningful error message
        let errorMessage = 'Unknown error';
        if (error.message) {
            errorMessage = error.message;
        } else if (typeof error === 'object') {
            errorMessage = JSON.stringify(error);
        } else if (error.toString) {
            errorMessage = error.toString();
        }
        
        console.error('Error message:', errorMessage);
        res.status(500).json({ 
            success: false,
            message: `Error creating payment order: ${errorMessage}`
        });
    }
};

// @desc    Verify payment and update subscription
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature 
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid payment signature' 
            });
        }

        // Update payment record
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        
        if (!payment) {
            return res.status(404).json({ 
                success: false,
                message: 'Payment record not found' 
            });
        }

        // Get payment details from Razorpay
        const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = razorpayPayment.status === 'captured' ? 'paid' : 'failed';
        payment.method = razorpayPayment.method;
        
        // Store additional details based on payment method
        if (razorpayPayment.method === 'upi') {
            payment.upiTransactionId = razorpayPayment.acquirer_data?.upi_transaction_id;
        } else if (razorpayPayment.method === 'card') {
            payment.cardDetails = {
                network: razorpayPayment.card?.network,
                last4: razorpayPayment.card?.last4,
                type: razorpayPayment.card?.type
            };
        } else if (razorpayPayment.method === 'netbanking') {
            payment.bank = razorpayPayment.bank;
        } else if (razorpayPayment.method === 'wallet') {
            payment.wallet = razorpayPayment.wallet;
        }

        await payment.save();

        if (payment.status !== 'paid') {
            return res.status(400).json({ 
                success: false,
                message: 'Payment failed or not captured' 
            });
        }

        // Update subscription
        const startDate = new Date();
        const endDate = new Date();
        
        if (payment.plan === 'pro_monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (payment.plan === 'pro_yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        let subscription = await Subscription.findOne({ user: req.user._id });

        if (subscription) {
            subscription.plan = 'pro';
            subscription.status = 'active';
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.amount = payment.amount;
            subscription.currency = payment.currency;
            subscription.billingCycle = payment.plan === 'pro_monthly' ? 'monthly' : 'yearly';
            subscription.paymentId = payment._id;
            await subscription.save();
        } else {
            subscription = await Subscription.create({
                user: req.user._id,
                plan: 'pro',
                status: 'active',
                startDate,
                endDate,
                amount: payment.amount,
                currency: payment.currency,
                billingCycle: payment.plan === 'pro_monthly' ? 'monthly' : 'yearly',
                paymentId: payment._id
            });
        }

        res.json({
            success: true,
            message: 'Payment verified and subscription activated',
            data: {
                payment: {
                    id: payment._id,
                    amount: payment.amount,
                    status: payment.status,
                    method: payment.method
                },
                subscription: {
                    plan: subscription.plan,
                    status: subscription.status,
                    endDate: subscription.endDate
                }
            }
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error verifying payment' 
        });
    }
};

// @desc    Handle Razorpay webhook
// @route   POST /api/payments/webhook
// @access  Public (secured by signature)
const handleWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        // Verify webhook signature
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest !== signature) {
            return res.status(400).json({ message: 'Invalid webhook signature' });
        }

        const event = req.body;

        // Handle different event types
        switch (event.event) {
            case 'payment.captured':
                // Payment captured - update payment record
                const paymentData = event.payload.payment.entity;
                await Payment.findOneAndUpdate(
                    { razorpayOrderId: paymentData.order_id },
                    {
                        razorpayPaymentId: paymentData.id,
                        status: 'paid',
                        method: paymentData.method
                    }
                );
                break;

            case 'payment.failed':
                // Payment failed - update status
                const failedPayment = event.payload.payment.entity;
                await Payment.findOneAndUpdate(
                    { razorpayOrderId: failedPayment.order_id },
                    {
                        status: 'failed',
                        failureReason: failedPayment.error_description,
                        failureCode: failedPayment.error_code
                    }
                );
                break;

            case 'subscription.charged':
                // Handle subscription renewal
                // This would be used for recurring subscriptions
                break;

            default:
                console.log('Unhandled webhook event:', event.event);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook processing error' });
    }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        const skip = (Number(page) - 1) * Number(limit);

        const payments = await Payment.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Payment.countDocuments({ user: req.user._id });

        res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get payment details
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res) => {
    try {
        const payment = await Payment.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!payment) {
            return res.status(404).json({ 
                success: false,
                message: 'Payment not found' 
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    handleWebhook,
    getPaymentHistory,
    getPayment
};
