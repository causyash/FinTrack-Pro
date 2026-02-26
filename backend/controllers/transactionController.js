const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
    try {
        const { 
            type, 
            category, 
            startDate, 
            endDate, 
            minAmount, 
            maxAmount,
            page = 1, 
            limit = 20 
        } = req.query;

        // Build query
        const query = { user: req.user._id };

        if (type) query.type = type;
        if (category) query.category = category;
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = Number(minAmount);
            if (maxAmount) query.amount.$lte = Number(maxAmount);
        }
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const transactions = await Transaction.find(query)
            .populate('category', 'name icon color type')
            .sort({ date: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Transaction.countDocuments(query);

        // Calculate totals
        const incomeTotal = await Transaction.aggregate([
            { $match: { user: req.user._id, type: 'income' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const expenseTotal = await Transaction.aggregate([
            { $match: { user: req.user._id, type: 'expense' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: {
                transactions,
                summary: {
                    totalIncome: incomeTotal[0]?.total || 0,
                    totalExpense: expenseTotal[0]?.total || 0,
                    balance: (incomeTotal[0]?.total || 0) - (expenseTotal[0]?.total || 0)
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
        console.error('Get transactions error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate('category', 'name icon color');

        if (!transaction) {
            return res.status(404).json({ 
                success: false,
                message: 'Transaction not found' 
            });
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { 
            type, 
            amount, 
            category, 
            description, 
            date, 
            isRecurring, 
            recurringFrequency,
            recurringEndDate,
            paymentMethod,
            tags 
        } = req.body;

        // Verify category exists and belongs to user
        const categoryExists = await Category.findOne({
            _id: category,
            user: req.user._id
        });

        if (!categoryExists) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid category' 
            });
        }

        const transaction = await Transaction.create({
            user: req.user._id,
            type,
            amount,
            category,
            description,
            date: date || Date.now(),
            isRecurring: isRecurring || false,
            recurringFrequency,
            recurringEndDate,
            paymentMethod,
            tags
        });

        await transaction.populate('category', 'name icon color');

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: transaction
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        let transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({ 
                success: false,
                message: 'Transaction not found' 
            });
        }

        const { category } = req.body;

        // If category is being updated, verify it exists
        if (category) {
            const categoryExists = await Category.findOne({
                _id: category,
                user: req.user._id
            });

            if (!categoryExists) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid category' 
                });
            }
        }

        // Update fields
        const updateFields = ['type', 'amount', 'category', 'description', 'date', 
                             'isRecurring', 'recurringFrequency', 'recurringEndDate', 
                             'paymentMethod', 'tags'];
        
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                transaction[field] = req.body[field];
            }
        });

        await transaction.save();
        await transaction.populate('category', 'name icon color');

        res.json({
            success: true,
            message: 'Transaction updated successfully',
            data: transaction
        });
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({ 
                success: false,
                message: 'Transaction not found' 
            });
        }

        await transaction.deleteOne();

        res.json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// @desc    Get monthly summary
// @route   GET /api/transactions/summary/monthly
// @access  Private
const getMonthlySummary = async (req, res) => {
    try {
        const { year, month } = req.query;
        
        const targetYear = year ? Number(year) : new Date().getFullYear();
        const targetMonth = month ? Number(month) - 1 : new Date().getMonth();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        const summary = await Transaction.aggregate([
            {
                $match: {
                    user: req.user._id,
                    date: { $gte: startDate, $lte: endDate }
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

        const income = summary.find(s => s._id === 'income')?.total || 0;
        const expense = summary.find(s => s._id === 'expense')?.total || 0;

        // Get category breakdown
        const categoryBreakdown = await Transaction.aggregate([
            {
                $match: {
                    user: req.user._id,
                    date: { $gte: startDate, $lte: endDate },
                    type: 'expense'
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
                    category: '$categoryInfo.name',
                    total: 1,
                    color: '$categoryInfo.color'
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                month: targetMonth + 1,
                year: targetYear,
                income,
                expense,
                balance: income - expense,
                categoryBreakdown
            }
        });
    } catch (error) {
        console.error('Get monthly summary error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

module.exports = {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlySummary
};
