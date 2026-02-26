const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, isActive, role } = req.query;

        // Build query
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (role) query.role = role;

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        // Get subscription info for each user
        const usersWithSubs = await Promise.all(
            users.map(async (user) => {
                const sub = await Subscription.findOne({ user: user._id });
                return {
                    ...user.toObject(),
                    subscription: sub ? {
                        plan: sub.plan,
                        status: sub.status,
                        endDate: sub.endDate
                    } : null
                };
            })
        );

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users: usersWithSubs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Admin
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Get user stats
        const subscription = await Subscription.findOne({ user: user._id });
        const transactionCount = await Transaction.countDocuments({ user: user._id });
        const paymentCount = await Payment.countDocuments({ user: user._id, status: 'paid' });

        res.json({
            success: true,
            data: {
                user,
                subscription,
                stats: {
                    transactionCount,
                    paymentCount
                }
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Admin
const toggleUserBlock = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Prevent blocking admin users
        if (user.role === 'admin') {
            return res.status(400).json({ 
                success: false,
                message: 'Cannot block admin users' 
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`,
            data: {
                userId: user._id,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Toggle user block error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
    try {
        // User statistics
        const totalUsers = await User.countDocuments({ role: 'user' });
        const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
        const newUsersThisMonth = await User.countDocuments({
            role: 'user',
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        });

        // Subscription statistics
        const totalSubscriptions = await Subscription.countDocuments();
        const proSubscriptions = await Subscription.countDocuments({ plan: 'pro' });
        const activeProSubscriptions = await Subscription.countDocuments({ 
            plan: 'pro', 
            status: 'active' 
        });

        // Revenue statistics
        const revenueStats = await Payment.aggregate([
            { $match: { status: 'paid' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    totalTransactions: { $sum: 1 }
                }
            }
        ]);

        const totalRevenue = revenueStats[0]?.totalRevenue || 0;
        const totalPayments = revenueStats[0]?.totalTransactions || 0;

        // Monthly revenue for current year
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = await Payment.aggregate([
            {
                $match: {
                    status: 'paid',
                    createdAt: {
                        $gte: new Date(currentYear, 0, 1),
                        $lte: new Date(currentYear, 11, 31)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Recent activity
        const recentUsers = await User.find({ role: 'user' })
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentPayments = await Payment.find({ status: 'paid' })
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    blocked: totalUsers - activeUsers,
                    newThisMonth: newUsersThisMonth
                },
                subscriptions: {
                    total: totalSubscriptions,
                    pro: proSubscriptions,
                    activePro: activeProSubscriptions,
                    free: totalSubscriptions - proSubscriptions,
                    proPercentage: totalSubscriptions > 0 
                        ? ((proSubscriptions / totalSubscriptions) * 100).toFixed(2)
                        : 0
                },
                revenue: {
                    total: totalRevenue,
                    totalPayments,
                    monthlyRevenue,
                    averageOrderValue: totalPayments > 0 
                        ? (totalRevenue / totalPayments).toFixed(2)
                        : 0
                },
                recentActivity: {
                    users: recentUsers,
                    payments: recentPayments
                }
            }
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get all subscriptions
// @route   GET /api/admin/subscriptions
// @access  Admin
const getSubscriptions = async (req, res) => {
    try {
        const { page = 1, limit = 20, plan, status } = req.query;

        // Build query
        const query = {};
        if (plan) query.plan = plan;
        if (status) query.status = status;

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const subscriptions = await Subscription.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Subscription.countDocuments(query);

        res.json({
            success: true,
            data: {
                subscriptions,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Admin
const getPayments = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, startDate, endDate } = req.query;

        // Build query
        const query = {};
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const payments = await Payment.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Payment.countDocuments(query);

        res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

module.exports = {
    getUsers,
    getUser,
    toggleUserBlock,
    getStats,
    getSubscriptions,
    getPayments
};
