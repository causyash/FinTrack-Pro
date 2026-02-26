const express = require('express');
const {
    getUsers,
    getUser,
    toggleUserBlock,
    getStats,
    getSubscriptions,
    getPayments
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleAuth');

const router = express.Router();

// All routes require admin access
router.use(protect, adminOnly);

// User management routes
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id/block', toggleUserBlock);

// Dashboard stats
router.get('/stats', getStats);

// Subscription management
router.get('/subscriptions', getSubscriptions);

// Payment management
router.get('/payments', getPayments);

module.exports = router;
