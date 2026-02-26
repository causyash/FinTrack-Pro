const { validationResult } = require('express-validator');
const Goal = require('../models/Goal');

// @desc    Get all goals for user
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res) => {
    try {
        const { status, category, page = 1, limit = 20 } = req.query;

        // Build query
        const query = { user: req.user._id };
        
        if (status === 'completed') query.isCompleted = true;
        if (status === 'active') query.isCompleted = false;
        if (category) query.category = category;

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const goals = await Goal.find(query)
            .sort({ isCompleted: 1, targetDate: 1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Goal.countDocuments(query);

        // Calculate summary
        const summary = await Goal.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: null,
                    totalGoals: { $sum: 1 },
                    completedGoals: {
                        $sum: { $cond: ['$isCompleted', 1, 0] }
                    },
                    totalTargetAmount: { $sum: '$targetAmount' },
                    totalCurrentAmount: { $sum: '$currentAmount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                goals,
                summary: summary[0] || {
                    totalGoals: 0,
                    completedGoals: 0,
                    totalTargetAmount: 0,
                    totalCurrentAmount: 0
                },
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get single goal
// @route   GET /api/goals/:id
// @access  Private
const getGoal = async (req, res) => {
    try {
        const goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!goal) {
            return res.status(404).json({ 
                success: false,
                message: 'Goal not found' 
            });
        }

        res.json({
            success: true,
            data: goal
        });
    } catch (error) {
        console.error('Get goal error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Create new goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const {
            title,
            description,
            targetAmount,
            currentAmount,
            category,
            targetDate,
            priority,
            icon,
            color
        } = req.body;

        const goal = await Goal.create({
            user: req.user._id,
            title,
            description,
            targetAmount,
            currentAmount: currentAmount || 0,
            category,
            targetDate,
            priority,
            icon,
            color
        });

        res.status(201).json({
            success: true,
            message: 'Goal created successfully',
            data: goal
        });
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        let goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!goal) {
            return res.status(404).json({ 
                success: false,
                message: 'Goal not found' 
            });
        }

        // Update fields
        const updateFields = [
            'title', 'description', 'targetAmount', 'currentAmount',
            'category', 'targetDate', 'priority', 'icon', 'color'
        ];
        
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                goal[field] = req.body[field];
            }
        });

        await goal.save();

        res.json({
            success: true,
            message: 'Goal updated successfully',
            data: goal
        });
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!goal) {
            return res.status(404).json({ 
                success: false,
                message: 'Goal not found' 
            });
        }

        await goal.deleteOne();

        res.json({
            success: true,
            message: 'Goal deleted successfully'
        });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Add contribution to goal
// @route   POST /api/goals/:id/contribute
// @access  Private
const addContribution = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Valid contribution amount is required' 
            });
        }

        let goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!goal) {
            return res.status(404).json({ 
                success: false,
                message: 'Goal not found' 
            });
        }

        if (goal.isCompleted) {
            return res.status(400).json({ 
                success: false,
                message: 'This goal has already been completed' 
            });
        }

        goal.currentAmount += Number(amount);
        await goal.save();

        res.json({
            success: true,
            message: 'Contribution added successfully',
            data: goal
        });
    } catch (error) {
        console.error('Add contribution error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get goal statistics
// @route   GET /api/goals/stats/overview
// @access  Private
const getGoalStats = async (req, res) => {
    try {
        const stats = await Goal.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: null,
                    totalGoals: { $sum: 1 },
                    completedGoals: {
                        $sum: { $cond: ['$isCompleted', 1, 0] }
                    },
                    activeGoals: {
                        $sum: { $cond: ['$isCompleted', 0, 1] }
                    },
                    totalTargetAmount: { $sum: '$targetAmount' },
                    totalCurrentAmount: { $sum: '$currentAmount' },
                    avgProgress: { $avg: '$progressPercentage' }
                }
            }
        ]);

        // Get upcoming goals (not completed, sorted by target date)
        const upcomingGoals = await Goal.find({
            user: req.user._id,
            isCompleted: false,
            targetDate: { $gte: new Date() }
        })
        .sort({ targetDate: 1 })
        .limit(5);

        // Get goals by category
        const goalsByCategory = await Goal.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalTarget: { $sum: '$targetAmount' },
                    totalCurrent: { $sum: '$currentAmount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0] || {
                    totalGoals: 0,
                    completedGoals: 0,
                    activeGoals: 0,
                    totalTargetAmount: 0,
                    totalCurrentAmount: 0,
                    avgProgress: 0
                },
                upcomingGoals,
                goalsByCategory
            }
        });
    } catch (error) {
        console.error('Get goal stats error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

module.exports = {
    getGoals,
    getGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    getGoalStats
};
