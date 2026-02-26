const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const Goal = require('../models/Goal');

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        // Get current month transactions summary
        const monthlyTransactions = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const monthlyIncome = monthlyTransactions.find(t => t._id === 'income')?.total || 0;
        const monthlyExpense = monthlyTransactions.find(t => t._id === 'expense')?.total || 0;

        // Get all-time totals
        const allTimeTransactions = await Transaction.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const totalIncome = allTimeTransactions.find(t => t._id === 'income')?.total || 0;
        const totalExpense = allTimeTransactions.find(t => t._id === 'expense')?.total || 0;

        // Get investment summary
        const investmentSummary = await Investment.aggregate([
            { $match: { user: userId, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalInvested: { $sum: '$totalInvested' },
                    currentValue: { $sum: '$currentValue' },
                    profitLoss: { $sum: '$profitLoss' }
                }
            }
        ]);

        const investments = investmentSummary[0] || {
            totalInvested: 0,
            currentValue: 0,
            profitLoss: 0
        };

        // Get goals summary
        const goalsSummary = await Goal.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: null,
                    totalGoals: { $sum: 1 },
                    completedGoals: {
                        $sum: { $cond: ['$isCompleted', 1, 0] }
                    },
                    totalTarget: { $sum: '$targetAmount' },
                    totalCurrent: { $sum: '$currentAmount' }
                }
            }
        ]);

        const goals = goalsSummary[0] || {
            totalGoals: 0,
            completedGoals: 0,
            totalTarget: 0,
            totalCurrent: 0
        };

        // Calculate net worth
        const netWorth = (totalIncome - totalExpense) + investments.currentValue;

        // Get recent transactions
        const recentTransactions = await Transaction.find({ user: userId })
            .populate('category', 'name icon color')
            .sort({ date: -1 })
            .limit(5);

        // Get upcoming goals
        const upcomingGoals = await Goal.find({
            user: userId,
            isCompleted: false,
            targetDate: { $gte: now }
        })
        .sort({ targetDate: 1 })
        .limit(3);

        res.json({
            success: true,
            data: {
                summary: {
                    monthlyIncome,
                    monthlyExpense,
                    monthlyBalance: monthlyIncome - monthlyExpense,
                    totalIncome,
                    totalExpense,
                    netWorth,
                    totalInvested: investments.totalInvested,
                    currentPortfolioValue: investments.currentValue,
                    investmentReturns: investments.profitLoss,
                    investmentReturnPercentage: investments.totalInvested > 0
                        ? ((investments.profitLoss / investments.totalInvested) * 100).toFixed(2)
                        : 0
                },
                goals: {
                    total: goals.totalGoals,
                    completed: goals.completedGoals,
                    inProgress: goals.totalGoals - goals.completedGoals,
                    totalSavings: goals.totalCurrent,
                    totalTarget: goals.totalTarget,
                    overallProgress: goals.totalTarget > 0
                        ? ((goals.totalCurrent / goals.totalTarget) * 100).toFixed(2)
                        : 0
                },
                recentTransactions,
                upcomingGoals
            }
        });
    } catch (error) {
        console.error('Get dashboard data error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get monthly expense chart data
// @route   GET /api/dashboard/charts/expenses
// @access  Private
const getExpenseChartData = async (req, res) => {
    try {
        const { months = 6 } = req.query;
        const userId = req.user._id;
        const now = new Date();
        const data = [];

        for (let i = Number(months) - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth();
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);

            const result = await Transaction.aggregate([
                {
                    $match: {
                        user: userId,
                        type: 'expense',
                        date: { $gte: startOfMonth, $lte: endOfMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);

            data.push({
                month: date.toLocaleString('default', { month: 'short' }),
                year: year.toString().slice(-2),
                amount: result[0]?.total || 0
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get expense chart data error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get income vs expense chart data
// @route   GET /api/dashboard/charts/income-expense
// @access  Private
const getIncomeExpenseChartData = async (req, res) => {
    try {
        const { months = 6 } = req.query;
        const userId = req.user._id;
        const now = new Date();
        const data = [];

        for (let i = Number(months) - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth();
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);

            const result = await Transaction.aggregate([
                {
                    $match: {
                        user: userId,
                        date: { $gte: startOfMonth, $lte: endOfMonth }
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' }
                    }
                }
            ]);

            data.push({
                month: date.toLocaleString('default', { month: 'short' }),
                year: year.toString().slice(-2),
                income: result.find(r => r._id === 'income')?.total || 0,
                expense: result.find(r => r._id === 'expense')?.total || 0
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get income expense chart data error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get category breakdown (pie chart)
// @route   GET /api/dashboard/charts/categories
// @access  Private
const getCategoryChartData = async (req, res) => {
    try {
        const { type = 'expense', months = 3 } = req.query;
        const userId = req.user._id;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - Number(months) + 1, 1);

        const data = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type,
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $unwind: '$categoryInfo'
            },
            {
                $project: {
                    name: '$categoryInfo.name',
                    amount: '$total',
                    color: '$categoryInfo.color',
                    percentage: {
                        $multiply: [
                            { $divide: ['$total', { $sum: '$total' }] },
                            100
                        ]
                    }
                }
            },
            { $sort: { amount: -1 } }
        ]);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get category chart data error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get investment growth chart data
// @route   GET /api/dashboard/charts/investment-growth
// @access  Private
const getInvestmentGrowthChartData = async (req, res) => {
    try {
        const { months = 12 } = req.query;
        const userId = req.user._id;

        // Get current portfolio value
        const currentData = await Investment.aggregate([
            { $match: { user: userId, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalInvested: { $sum: '$totalInvested' },
                    currentValue: { $sum: '$currentValue' }
                }
            }
        ]);

        const now = new Date();
        const data = [];
        const baseInvested = currentData[0]?.totalInvested || 0;
        const baseValue = currentData[0]?.currentValue || 0;

        for (let i = Number(months) - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            
            // Simulate historical data with some variance
            const progressFactor = (Number(months) - i) / Number(months);
            const randomFactor = 0.95 + Math.random() * 0.1;
            
            data.push({
                month: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear().toString().slice(-2),
                invested: Math.round(baseInvested * progressFactor),
                value: Math.round(baseValue * progressFactor * randomFactor)
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get investment growth chart data error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

module.exports = {
    getDashboardData,
    getExpenseChartData,
    getIncomeExpenseChartData,
    getCategoryChartData,
    getInvestmentGrowthChartData
};
