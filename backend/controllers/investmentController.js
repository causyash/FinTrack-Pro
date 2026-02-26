const { validationResult } = require('express-validator');
const Investment = require('../models/Investment');
const InvestmentHistory = require('../models/InvestmentHistory');

// Helper function to record daily investment snapshot
const recordDailySnapshot = async (userId, mode = 'update') => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get current portfolio summary
        const summary = await Investment.aggregate([
            { $match: { user: userId, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalInvested: { $sum: '$totalInvested' },
                    currentValue: { $sum: '$currentValue' },
                    totalProfitLoss: { $sum: '$profitLoss' }
                }
            }
        ]);

        const totalInvested = summary[0]?.totalInvested || 0;
        const currentValue = summary[0]?.currentValue || 0;
        const profitLoss = summary[0]?.totalProfitLoss || 0;
        const profitLossPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

        // Check if entry exists for today
        const existingEntry = await InvestmentHistory.findOne({ user: userId, date: today });

        if (mode === 'append' && existingEntry) {
            // Create a new entry for tomorrow (append mode)
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            await InvestmentHistory.create({
                user: userId,
                date: tomorrow,
                totalInvested,
                currentValue,
                profitLoss,
                profitLossPercentage,
                entryCount: existingEntry.entryCount + 1,
                isDeletable: false,
                entryType: 'append'
            });
        } else {
            // Update mode - update today's record or create if doesn't exist
            await InvestmentHistory.findOneAndUpdate(
                { user: userId, date: today },
                {
                    totalInvested,
                    currentValue,
                    profitLoss,
                    profitLossPercentage,
                    $inc: { entryCount: existingEntry ? 0 : 1 },
                    isDeletable: true,
                    entryType: existingEntry ? 'update' : 'initial'
                },
                { upsert: true, new: true }
            );
        }

        return true;
    } catch (error) {
        console.error('Record daily snapshot error:', error);
        return false;
    }
};

// @desc    Get all investments for user
// @route   GET /api/investments
// @access  Private
const getInvestments = async (req, res) => {
    try {
        const { type, isActive, page = 1, limit = 20 } = req.query;

        // Build query
        const query = { user: req.user._id };
        if (type) query.type = type;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const investments = await Investment.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Investment.countDocuments(query);

        // Calculate portfolio summary
        const summary = await Investment.aggregate([
            { $match: { user: req.user._id, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalInvested: { $sum: '$totalInvested' },
                    currentValue: { $sum: '$currentValue' },
                    totalProfitLoss: { $sum: '$profitLoss' }
                }
            }
        ]);

        // Get breakdown by type
        const typeBreakdown = await Investment.aggregate([
            { $match: { user: req.user._id, isActive: true } },
            {
                $group: {
                    _id: '$type',
                    totalInvested: { $sum: '$totalInvested' },
                    currentValue: { $sum: '$currentValue' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const portfolioSummary = summary[0] || {
            totalInvested: 0,
            currentValue: 0,
            totalProfitLoss: 0
        };

        // Get total investment count for free plan limit
        const totalInvestments = await Investment.countDocuments({ user: req.user._id });
        const FREE_PLAN_LIMIT = 100;

        res.json({
            success: true,
            data: {
                investments,
                summary: {
                    ...portfolioSummary,
                    overallReturn: portfolioSummary.totalInvested > 0 
                        ? ((portfolioSummary.totalProfitLoss / portfolioSummary.totalInvested) * 100).toFixed(2)
                        : 0
                },
                typeBreakdown,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                },
                planLimits: {
                    currentCount: totalInvestments,
                    limit: FREE_PLAN_LIMIT,
                    remaining: Math.max(0, FREE_PLAN_LIMIT - totalInvestments),
                    // limitReached is true only when exceeding 100 (101+)
                    // At exactly 100, user can still view graph but cannot add more
                    limitReached: totalInvestments > FREE_PLAN_LIMIT,
                    canAddMore: totalInvestments < FREE_PLAN_LIMIT
                }
            }
        });
    } catch (error) {
        console.error('Get investments error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get single investment
// @route   GET /api/investments/:id
// @access  Private
const getInvestment = async (req, res) => {
    try {
        const investment = await Investment.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!investment) {
            return res.status(404).json({ 
                success: false,
                message: 'Investment not found' 
            });
        }

        res.json({
            success: true,
            data: investment
        });
    } catch (error) {
        console.error('Get investment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Create new investment
// @route   POST /api/investments
// @access  Private
const createInvestment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        // Check if user has exceeded free plan limit (100 investments)
        // User can have up to 100, but not more
        const investmentCount = await Investment.countDocuments({ user: req.user._id });
        const FREE_PLAN_LIMIT = 100;
        
        if (investmentCount >= FREE_PLAN_LIMIT) {
            return res.status(403).json({
                success: false,
                message: 'Free plan limit reached',
                error: `You have reached the maximum of ${FREE_PLAN_LIMIT} investments on the free plan. Please upgrade to Pro to add more investments.`,
                limitReached: true,
                currentCount: investmentCount,
                limit: FREE_PLAN_LIMIT
            });
        }

        const {
            type,
            name,
            symbol,
            sipAmount,
            sipFrequency,
            sipStartDate,
            sipEndDate,
            totalInvested,
            currentValue,
            quantity,
            averageBuyPrice,
            sector,
            notes
        } = req.body;

        const investment = await Investment.create({
            user: req.user._id,
            type,
            name,
            symbol: symbol?.toUpperCase(),
            sipAmount,
            sipFrequency,
            sipStartDate,
            sipEndDate,
            totalInvested,
            currentValue,
            quantity,
            averageBuyPrice,
            sector,
            notes
        });

        res.status(201).json({
            success: true,
            message: 'Investment created successfully',
            data: investment
        });
    } catch (error) {
        console.error('Create investment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Update investment
// @route   PUT /api/investments/:id
// @access  Private
const updateInvestment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        let investment = await Investment.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!investment) {
            return res.status(404).json({ 
                success: false,
                message: 'Investment not found' 
            });
        }

        // Update fields
        const updateFields = [
            'type', 'name', 'symbol', 'sipAmount', 'sipFrequency',
            'sipStartDate', 'sipEndDate', 'totalInvested', 'currentValue',
            'quantity', 'averageBuyPrice', 'sector', 'notes', 'isActive'
        ];
        
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                investment[field] = req.body[field];
            }
        });

        // Convert symbol to uppercase if provided
        if (req.body.symbol) {
            investment.symbol = req.body.symbol.toUpperCase();
        }

        await investment.save();

        // Record daily snapshot if values changed
        if (req.body.currentValue !== undefined || req.body.totalInvested !== undefined) {
            const mode = req.body.mode || 'update'; // 'update' or 'append'
            await recordDailySnapshot(req.user._id, mode);
        }

        res.json({
            success: true,
            message: 'Investment updated successfully',
            data: investment
        });
    } catch (error) {
        console.error('Update investment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Delete investment
// @route   DELETE /api/investments/:id
// @access  Private
const deleteInvestment = async (req, res) => {
    try {
        const investment = await Investment.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!investment) {
            return res.status(404).json({ 
                success: false,
                message: 'Investment not found' 
            });
        }

        await investment.deleteOne();

        // Update today's history entry to reflect the deletion
        await recordDailySnapshot(req.user._id, 'update');

        res.json({
            success: true,
            message: 'Investment deleted successfully'
        });
    } catch (error) {
        console.error('Delete investment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Delete investment history entry
// @route   DELETE /api/investments/history/:date
// @access  Private
const deleteInvestmentHistory = async (req, res) => {
    try {
        const { date } = req.params;
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // Find the history entry
        const historyEntry = await InvestmentHistory.findOne({
            user: req.user._id,
            date: targetDate
        });

        if (!historyEntry) {
            return res.status(404).json({
                success: false,
                message: 'History entry not found'
            });
        }

        // Only allow deletion if entry is deletable
        if (!historyEntry.isDeletable) {
            return res.status(403).json({
                success: false,
                message: 'This entry cannot be deleted',
                error: 'Entries created via "Append" mode are permanent and cannot be deleted.'
            });
        }

        await InvestmentHistory.deleteOne({
            user: req.user._id,
            date: targetDate
        });

        res.json({
            success: true,
            message: 'History entry deleted successfully'
        });
    } catch (error) {
        console.error('Delete history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update investment current value
// @route   PUT /api/investments/:id/update-value
// @access  Private
const updateCurrentValue = async (req, res) => {
    try {
        const { currentValue } = req.body;

        if (!currentValue || currentValue < 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Valid current value is required' 
            });
        }

        let investment = await Investment.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!investment) {
            return res.status(404).json({ 
                success: false,
                message: 'Investment not found' 
            });
        }

        investment.currentValue = currentValue;
        await investment.save();

        // Record daily snapshot
        await recordDailySnapshot(req.user._id);

        res.json({
            success: true,
            message: 'Investment value updated successfully',
            data: investment
        });
    } catch (error) {
        console.error('Update investment value error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get investment growth chart data
// @route   GET /api/investments/growth-data
// @access  Private
const getGrowthData = async (req, res) => {
    try {
        // Check if user has exceeded free plan investment limit
        const investmentCount = await Investment.countDocuments({ user: req.user._id });
        const FREE_PLAN_LIMIT = 100;
        
        // Graph is available for users with 100 or fewer investments
        // Only hide when user exceeds 100 (has 101+)
        if (investmentCount > FREE_PLAN_LIMIT) {
            return res.status(403).json({
                success: false,
                message: 'Free plan limit exceeded',
                error: 'Graph data is only available for free users with 100 or fewer investments. Please upgrade to Pro to continue tracking.',
                limitReached: true,
                currentCount: investmentCount,
                limit: FREE_PLAN_LIMIT
            });
        }
        
        // Get user's investment history (no day limit for free users under 100 entries)
        const history = await InvestmentHistory.find({ 
            user: req.user._id 
        })
        .sort({ date: 1 });

        // If no history yet, create initial data point from current investments
        if (history.length === 0) {
            // Get current portfolio summary for initial data point
            const currentData = await Investment.aggregate([
                { $match: { user: req.user._id, isActive: true } },
                {
                    $group: {
                        _id: null,
                        totalInvested: { $sum: '$totalInvested' },
                        currentValue: { $sum: '$currentValue' },
                        totalProfitLoss: { $sum: '$profitLoss' }
                    }
                }
            ]);

            if (currentData[0] && currentData[0].totalInvested > 0) {
                const today = new Date();
                const profitLoss = currentData[0].currentValue - currentData[0].totalInvested;
                const profitLossPercentage = currentData[0].totalInvested > 0 
                    ? (profitLoss / currentData[0].totalInvested) * 100 
                    : 0;

                const initialData = [{
                    date: today.toISOString().split('T')[0],
                    day: 'Today',
                    invested: currentData[0].totalInvested,
                    value: currentData[0].currentValue,
                    profitLoss: profitLoss,
                    profitLossPercentage: profitLossPercentage
                }];

                return res.json({
                    success: true,
                    data: initialData,
                    daysRecorded: 1,
                    message: 'Initial investment data point created. Update daily to track growth!'
                });
            }

            return res.json({
                success: true,
                data: [],
                daysRecorded: 0,
                message: 'Start tracking your investments to see your growth chart!'
            });
        }

        // Format data for chart
        const data = history.map(record => ({
            date: record.date.toISOString().split('T')[0],
            day: record.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            invested: record.totalInvested,
            value: record.currentValue,
            profitLoss: record.profitLoss,
            profitLossPercentage: record.profitLossPercentage,
            entryCount: record.entryCount,
            isDeletable: record.isDeletable,
            entryType: record.entryType
        }));

        // Get current portfolio for comparison
        const currentData = await Investment.aggregate([
            { $match: { user: req.user._id, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalInvested: { $sum: '$totalInvested' },
                    currentValue: { $sum: '$currentValue' }
                }
            }
        ]);

        // Add today's current value if not already recorded today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastRecord = history[history.length - 1];
        
        if (lastRecord && lastRecord.date.getTime() !== today.getTime() && currentData[0]) {
            data.push({
                date: new Date().toISOString().split('T')[0],
                day: 'Today',
                invested: currentData[0].totalInvested,
                value: currentData[0].currentValue,
                profitLoss: currentData[0].currentValue - currentData[0].totalInvested,
                profitLossPercentage: currentData[0].totalInvested > 0 
                    ? ((currentData[0].currentValue - currentData[0].totalInvested) / currentData[0].totalInvested) * 100 
                    : 0
            });
        }

        res.json({
            success: true,
            data,
            daysRecorded: history.length,
            daysRemaining: Math.max(0, 100 - history.length)
        });
    } catch (error) {
        console.error('Get growth data error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

module.exports = {
    getInvestments,
    getInvestment,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    updateCurrentValue,
    getGrowthData,
    deleteInvestmentHistory
};
