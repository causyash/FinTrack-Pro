const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

// @desc    Get current user's subscription
// @route   GET /api/subscriptions/my-subscription
// @access  Private
const getMySubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ user: req.user._id });

        if (!subscription) {
            // Create free subscription if not exists
            const newSubscription = await Subscription.create({
                user: req.user._id,
                plan: 'free',
                status: 'active'
            });

            return res.json({
                success: true,
                data: newSubscription
            });
        }

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get subscription plans details
// @route   GET /api/subscriptions/plans
// @access  Public
const getPlans = async (req, res) => {
    try {
        const plans = [
            {
                id: 'free',
                name: 'Free',
                price: 0,
                currency: 'INR',
                billingCycle: null,
                description: 'Basic features for personal finance tracking',
                features: [
                    'Up to 100 transactions per month',
                    'Basic expense tracking',
                    'Up to 3 financial goals',
                    'Basic investment tracking',
                    'Standard charts and reports'
                ],
                limitations: [
                    'No advanced analytics',
                    'No data export',
                    'No priority support'
                ]
            },
            {
                id: 'pro_monthly',
                name: 'Pro Monthly',
                price: 199,
                currency: 'INR',
                billingCycle: 'monthly',
                description: 'Advanced features for serious investors',
                features: [
                    'Unlimited transactions',
                    'Advanced expense tracking with AI categorization',
                    'Unlimited financial goals',
                    'Advanced investment portfolio tracking',
                    'Advanced charts and analytics',
                    'Export data to Excel/PDF',
                    'Priority email support',
                    'Custom categories'
                ],
                popular: false
            },
            {
                id: 'pro_yearly',
                name: 'Pro Yearly',
                price: 1999,
                currency: 'INR',
                billingCycle: 'yearly',
                description: 'Best value for long-term users',
                features: [
                    'All Pro Monthly features',
                    '2 months free (Save ₹389)',
                    'Annual financial report',
                    'Priority chat support'
                ],
                popular: true,
                savings: '17%'
            }
        ];

        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Upgrade subscription (after payment verification)
// @route   POST /api/subscriptions/upgrade
// @access  Private
const upgradeSubscription = async (req, res) => {
    try {
        const { plan, billingCycle, paymentId } = req.body;

        if (!['pro_monthly', 'pro_yearly'].includes(plan)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid plan' 
            });
        }

        // Verify payment exists
        const payment = await Payment.findOne({
            _id: paymentId,
            user: req.user._id,
            status: 'paid'
        });

        if (!payment) {
            return res.status(400).json({ 
                success: false,
                message: 'Valid payment not found' 
            });
        }

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date();
        
        if (plan === 'pro_monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan === 'pro_yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Update or create subscription
        let subscription = await Subscription.findOne({ user: req.user._id });

        if (subscription) {
            subscription.plan = 'pro';
            subscription.status = 'active';
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.amount = payment.amount;
            subscription.currency = payment.currency;
            subscription.billingCycle = billingCycle;
            subscription.paymentId = paymentId;
            subscription.autoRenew = true;
            await subscription.save();
        } else {
            subscription = await Subscription.create({
                user: req.user._id,
                plan: 'pro',
                status: 'active',
                startDate,
                endDate,
                amount: payment.amount,
                currency: payment.currency,
                billingCycle,
                paymentId
            });
        }

        res.json({
            success: true,
            message: 'Subscription upgraded successfully',
            data: subscription
        });
    } catch (error) {
        console.error('Upgrade subscription error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
    try {
        const { reason } = req.body;

        const subscription = await Subscription.findOne({ user: req.user._id });

        if (!subscription || subscription.plan === 'free') {
            return res.status(400).json({ 
                success: false,
                message: 'No active paid subscription found' 
            });
        }

        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        subscription.cancellationReason = reason || 'User requested';
        subscription.autoRenew = false;
        await subscription.save();

        res.json({
            success: true,
            message: 'Subscription cancelled successfully. You will have access until the end of your billing period.',
            data: subscription
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Renew subscription (for admin or auto-renew)
// @route   POST /api/subscriptions/renew
// @access  Private
const renewSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ user: req.user._id });

        if (!subscription) {
            return res.status(404).json({ 
                success: false,
                message: 'Subscription not found' 
            });
        }

        // Calculate new end date
        const currentEndDate = subscription.endDate || new Date();
        const newEndDate = new Date(currentEndDate);
        
        if (subscription.billingCycle === 'monthly') {
            newEndDate.setMonth(newEndDate.getMonth() + 1);
        } else if (subscription.billingCycle === 'yearly') {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        }

        subscription.endDate = newEndDate;
        subscription.status = 'active';
        await subscription.save();

        res.json({
            success: true,
            message: 'Subscription renewed successfully',
            data: subscription
        });
    } catch (error) {
        console.error('Renew subscription error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Check feature access
// @route   GET /api/subscriptions/check-feature/:feature
// @access  Private
const checkFeatureAccess = async (req, res) => {
    try {
        const { feature } = req.params;
        
        const subscription = await Subscription.findOne({ user: req.user._id });

        if (!subscription) {
            return res.json({
                success: true,
                data: {
                    hasAccess: false,
                    feature,
                    plan: 'none'
                }
            });
        }

        const hasAccess = subscription.features[feature] === true && subscription.isActive();

        res.json({
            success: true,
            data: {
                hasAccess,
                feature,
                plan: subscription.plan,
                requiresUpgrade: !hasAccess && subscription.plan === 'free'
            }
        });
    } catch (error) {
        console.error('Check feature access error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

module.exports = {
    getMySubscription,
    getPlans,
    upgradeSubscription,
    cancelSubscription,
    renewSubscription,
    checkFeatureAccess
};
