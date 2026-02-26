const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please provide a goal title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    targetAmount: {
        type: Number,
        required: [true, 'Please provide target amount'],
        min: [0, 'Target amount cannot be negative']
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Progress percentage (calculated automatically)
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    category: {
        type: String,
        enum: ['emergency_fund', 'vacation', 'education', 'home', 'vehicle', 'retirement', 'wedding', 'other'],
        default: 'other'
    },
    targetDate: {
        type: Date,
        required: [true, 'Please provide target date']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedDate: {
        type: Date
    },
    // Monthly contribution suggestion
    monthlyContribution: {
        type: Number,
        default: 0
    },
    icon: {
        type: String,
        default: '🎯'
    },
    color: {
        type: String,
        default: '#3B82F6'
    }
}, {
    timestamps: true
});

// Calculate progress before saving
goalSchema.pre('save', async function () {
    if (this.targetAmount > 0) {
        this.progressPercentage = Math.min(
            ((this.currentAmount / this.targetAmount) * 100).toFixed(2),
            100
        );
    }

    // Check if goal is completed
    if (this.currentAmount >= this.targetAmount && !this.isCompleted) {
        this.isCompleted = true;
        this.completedDate = new Date();
    }

    // Calculate monthly contribution needed
    if (this.targetDate > new Date()) {
        const monthsRemaining = Math.max(
            1,
            (this.targetDate - new Date()) / (1000 * 60 * 60 * 24 * 30)
        );
        const remainingAmount = this.targetAmount - this.currentAmount;
        this.monthlyContribution = remainingAmount > 0
            ? (remainingAmount / monthsRemaining).toFixed(2)
            : 0;
    }
});

goalSchema.index({ user: 1, isCompleted: 1 });
goalSchema.index({ user: 1, targetDate: 1 });

module.exports = mongoose.model('Goal', goalSchema);
