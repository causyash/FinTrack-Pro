const express = require('express');
const { body } = require('express-validator');
const {
    getMySubscription,
    getPlans,
    upgradeSubscription,
    cancelSubscription,
    renewSubscription,
    checkFeatureAccess
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const upgradeValidation = [
    body('plan')
        .notEmpty().withMessage('Plan is required')
        .isIn(['pro_monthly', 'pro_yearly']).withMessage('Invalid plan'),
    body('billingCycle')
        .notEmpty().withMessage('Billing cycle is required')
        .isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle'),
    body('paymentId')
        .notEmpty().withMessage('Payment ID is required')
        .isMongoId().withMessage('Invalid payment ID')
];

const cancelValidation = [
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
];

// Routes
router.get('/my-subscription', protect, getMySubscription);
router.get('/plans', getPlans);
router.get('/check-feature/:feature', protect, checkFeatureAccess);
router.post('/upgrade', protect, upgradeValidation, upgradeSubscription);
router.post('/cancel', protect, cancelValidation, cancelSubscription);
router.post('/renew', protect, renewSubscription);

module.exports = router;
