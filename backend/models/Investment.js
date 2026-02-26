const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['sip', 'stock', 'mutual_fund', 'fd', 'bond', 'other'],
        required: [true, 'Please specify investment type']
    },
    name: {
        type: String,
        required: [true, 'Please provide investment name'],
        trim: true
    },
    symbol: {
        type: String,
        trim: true,
        uppercase: true
    },
    // For SIP investments
    sipAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    sipFrequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly', null],
        default: 'monthly'
    },
    sipStartDate: {
        type: Date
    },
    sipEndDate: {
        type: Date
    },
    // For lump sum investments (stocks, etc.)
    totalInvested: {
        type: Number,
        required: true,
        min: 0
    },
    currentValue: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0
    },
    averageBuyPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    // Calculated fields
    profitLoss: {
        type: Number,
        default: 0
    },
    profitLossPercentage: {
        type: Number,
        default: 0
    },
    // Additional info
    sector: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate profit/loss before saving
investmentSchema.pre('save', async function () {
    this.profitLoss = this.currentValue - this.totalInvested;
    if (this.totalInvested > 0) {
        this.profitLossPercentage = ((this.profitLoss / this.totalInvested) * 100).toFixed(2);
    }
    this.lastUpdated = Date.now();
});

investmentSchema.index({ user: 1, type: 1 });
investmentSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Investment', investmentSchema);
