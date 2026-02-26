const Subscription = require('../models/Subscription');

// Check if user has Pro subscription
const requirePro = async (req, res, next) => {
    try {
        const subscription = await Subscription.findOne({ user: req.user._id });

        if (!subscription) {
            return res.status(403).json({ 
                message: 'Subscription not found',
                code: 'NO_SUBSCRIPTION'
            });
        }

        if (subscription.plan !== 'pro' || !subscription.isActive()) {
            return res.status(403).json({ 
                message: 'This feature requires a Pro subscription',
                code: 'PRO_REQUIRED',
                currentPlan: subscription.plan
            });
        }

        req.subscription = subscription;
        next();
    } catch (error) {
        console.error('Subscription check error:', error);
        res.status(500).json({ message: 'Error checking subscription' });
    }
};

// Check specific feature access
const requireFeature = (featureName) => {
    return async (req, res, next) => {
        try {
            const subscription = await Subscription.findOne({ user: req.user._id });

            if (!subscription) {
                return res.status(403).json({ 
                    message: 'Subscription not found',
                    code: 'NO_SUBSCRIPTION'
                });
            }

            // Check if feature is available
            if (!subscription.features[featureName]) {
                return res.status(403).json({ 
                    message: `This feature requires a Pro subscription`,
                    code: 'FEATURE_NOT_AVAILABLE',
                    feature: featureName
                });
            }

            req.subscription = subscription;
            next();
        } catch (error) {
            console.error('Feature check error:', error);
            res.status(500).json({ message: 'Error checking feature access' });
        }
    };
};

// Attach subscription to request (doesn't block)
const attachSubscription = async (req, res, next) => {
    try {
        const subscription = await Subscription.findOne({ user: req.user._id });
        req.subscription = subscription;
        next();
    } catch (error) {
        req.subscription = null;
        next();
    }
};

module.exports = { requirePro, requireFeature, attachSubscription };
