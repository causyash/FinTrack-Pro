const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Razorpay details
    razorpayOrderId: {
        type: String,
        required: true
    },
    razorpayPaymentId: {
        type: String
    },
    razorpaySignature: {
        type: String
    },
    // Payment details
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['created', 'attempted', 'paid', 'failed', 'refunded'],
        default: 'created'
    },
    // Plan details
    plan: {
        type: String,
        enum: ['pro_monthly', 'pro_yearly'],
        required: true
    },
    // Payment method details
    method: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet', 'emi', 'paylater', null],
        default: null
    },
    // UPI specific (for Google Pay)
    upiTransactionId: {
        type: String
    },
    // Card details (masked)
    cardDetails: {
        network: String,
        last4: String,
        type: String
    },
    // Bank details
    bank: {
        type: String
    },
    // Wallet details
    wallet: {
        type: String
    },
    // Failure details
    failureReason: {
        type: String
    },
    failureCode: {
        type: String
    },
    // Refund details
    refundStatus: {
        type: String,
        enum: [null, 'partial', 'full'],
        default: null
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    // Invoice details
    invoiceId: {
        type: String
    },
    // Description
    description: {
        type: String,
        default: 'FinTrack Pro Subscription'
    },
    // Metadata
    notes: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Index for faster queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
