const express = require('express');
const { body } = require('express-validator');
const {
    createOrder,
    verifyPayment,
    handleWebhook,
    getPaymentHistory,
    getPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createOrderValidation = [
    body('plan')
        .notEmpty().withMessage('Plan is required')
        .isIn(['pro']).withMessage('Invalid plan'),
    body('billingCycle')
        .notEmpty().withMessage('Billing cycle is required')
        .isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle')
];

const verifyPaymentValidation = [
    body('razorpay_order_id')
        .notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id')
        .notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature')
        .notEmpty().withMessage('Signature is required')
];

// Routes
router.post('/create-order', protect, createOrderValidation, createOrder);
router.post('/verify', protect, verifyPaymentValidation, verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/history', protect, getPaymentHistory);
router.get('/:id', protect, getPayment);

module.exports = router;
