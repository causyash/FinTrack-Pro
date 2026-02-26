const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    plan: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free'
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'pending'],
        default: 'active'
    },
    // Pro plan details
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    // For pro plan
    amount: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly', null],
        default: null
    },
    // Payment reference
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    razorpaySubscriptionId: {
        type: String
    },
    // Features access tracking
    features: {
        transactions: {
            type: Boolean,
            default: true
        },
        investments: {
            type: Boolean,
            default: true
        },
        goals: {
            type: Boolean,
            default: true
        },
        advancedCharts: {
            type: Boolean,
            default: false
        },
        exportData: {
            type: Boolean,
            default: false
        },
        prioritySupport: {
            type: Boolean,
            default: false
        }
    },
    // Cancellation details
    cancelledAt: {
        type: Date
    },
    cancellationReason: {
        type: String
    },
    autoRenew: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Update features based on plan before saving
subscriptionSchema.pre('save', async function () {
    if (this.plan === 'free') {
        this.features.advancedCharts = false;
        this.features.exportData = false;
        this.features.prioritySupport = false;
    } else if (this.plan === 'pro') {
        this.features.advancedCharts = true;
        this.features.exportData = true;
        this.features.prioritySupport = true;
    }
});

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function () {
    if (this.plan === 'free') return true;
    if (this.status !== 'active') return false;
    if (!this.endDate) return true;
    return new Date() < this.endDate;
};

subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
