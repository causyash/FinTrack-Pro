const express = require('express');
const { body } = require('express-validator');
const {
    getGoals,
    getGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    getGoalStats
} = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const goalValidation = [
    body('title')
        .notEmpty().withMessage('Goal title is required')
        .trim()
        .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('targetAmount')
        .notEmpty().withMessage('Target amount is required')
        .isFloat({ min: 0 }).withMessage('Target amount must be a positive number'),
    body('currentAmount')
        .optional()
        .isFloat({ min: 0 }).withMessage('Current amount must be a positive number'),
    body('category')
        .optional()
        .isIn(['emergency_fund', 'vacation', 'education', 'home', 'vehicle', 'retirement', 'wedding', 'other'])
        .withMessage('Invalid category'),
    body('targetDate')
        .notEmpty().withMessage('Target date is required')
        .isISO8601().withMessage('Invalid date format'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high')
];

const contributionValidation = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
];

// Routes
router.get('/', protect, getGoals);
router.get('/stats/overview', protect, getGoalStats);
router.get('/:id', protect, getGoal);
router.post('/', protect, goalValidation, createGoal);
router.put('/:id', protect, goalValidation, updateGoal);
router.delete('/:id', protect, deleteGoal);
router.post('/:id/contribute', protect, contributionValidation, addContribution);

module.exports = router;
