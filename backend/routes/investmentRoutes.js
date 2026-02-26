const express = require('express');
const { body } = require('express-validator');
const {
    getInvestments,
    getInvestment,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    updateCurrentValue,
    getGrowthData,
    deleteInvestmentHistory
} = require('../controllers/investmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const investmentValidation = [
    body('type')
        .notEmpty().withMessage('Investment type is required')
        .isIn(['sip', 'stock', 'mutual_fund', 'fd', 'bond', 'other']).withMessage('Invalid investment type'),
    body('name')
        .notEmpty().withMessage('Investment name is required')
        .trim()
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('symbol')
        .optional()
        .trim()
        .toUpperCase(),
    body('totalInvested')
        .notEmpty().withMessage('Total invested amount is required')
        .isFloat({ min: 0 }).withMessage('Total invested must be a positive number'),
    body('currentValue')
        .notEmpty().withMessage('Current value is required')
        .isFloat({ min: 0 }).withMessage('Current value must be a positive number'),
    body('sipAmount')
        .optional()
        .isFloat({ min: 0 }).withMessage('SIP amount must be a positive number'),
    body('sipFrequency')
        .optional()
        .isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid SIP frequency'),
    body('quantity')
        .optional()
        .isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('averageBuyPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Average buy price must be a positive number')
];

const updateValueValidation = [
    body('currentValue')
        .notEmpty().withMessage('Current value is required')
        .isFloat({ min: 0 }).withMessage('Current value must be a positive number')
];

// Routes
router.get('/', protect, getInvestments);
router.get('/growth-data', protect, getGrowthData);
router.get('/:id', protect, getInvestment);
router.post('/', protect, investmentValidation, createInvestment);
router.put('/:id', protect, investmentValidation, updateInvestment);
router.put('/:id/update-value', protect, updateValueValidation, updateCurrentValue);
router.delete('/:id', protect, deleteInvestment);
router.delete('/history/:date', protect, deleteInvestmentHistory);

module.exports = router;
