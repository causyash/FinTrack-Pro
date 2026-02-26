const mongoose = require('mongoose');

const investmentHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    totalInvested: {
        type: Number,
        default: 0
    },
    currentValue: {
        type: Number,
        default: 0
    },
    profitLoss: {
        type: Number,
        default: 0
    },
    profitLossPercentage: {
        type: Number,
        default: 0
    },
    entryCount: {
        type: Number,
        default: 1
    },
    isDeletable: {
        type: Boolean,
        default: true
    },
    entryType: {
        type: String,
        enum: ['initial', 'update', 'append'],
        default: 'initial'
    }
}, {
    timestamps: true
});

// Compound index to ensure one entry per user per day
investmentHistorySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('InvestmentHistory', investmentHistorySchema);
