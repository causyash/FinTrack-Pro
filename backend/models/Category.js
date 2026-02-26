const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a category name'],
        trim: true
    },
    type: {
        type: String,
        enum: ['income', 'expense', 'investment'],
        required: [true, 'Please specify category type']
    },
    icon: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: '#000000'
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate categories per user
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
