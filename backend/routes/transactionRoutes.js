const express = require('express');
const { body } = require('express-validator');
const {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlySummary
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const transactionValidation = [
    body('type')
        .notEmpty().withMessage('Transaction type is required')
        .isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('category')
        .notEmpty().withMessage('Category is required')
        .isMongoId().withMessage('Invalid category ID'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
    body('date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
    body('isRecurring')
        .optional()
        .isBoolean().withMessage('isRecurring must be a boolean'),
    body('recurringFrequency')
        .optional()
        .isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid frequency'),
    body('paymentMethod')
        .optional()
        .isIn(['cash', 'card', 'upi', 'bank_transfer', 'other']).withMessage('Invalid payment method')
];

// Routes
router.get('/', protect, getTransactions);
router.get('/summary/monthly', protect, getMonthlySummary);
router.get('/:id', protect, getTransaction);
router.post('/', protect, transactionValidation, createTransaction);
router.put('/:id', protect, transactionValidation, updateTransaction);
router.delete('/:id', protect, deleteTransaction);

module.exports = router;
