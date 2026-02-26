const express = require('express');
const {
    getDashboardData,
    getExpenseChartData,
    getIncomeExpenseChartData,
    getCategoryChartData,
    getInvestmentGrowthChartData
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Routes
router.get('/', protect, getDashboardData);
router.get('/charts/expenses', protect, getExpenseChartData);
router.get('/charts/income-expense', protect, getIncomeExpenseChartData);
router.get('/charts/categories', protect, getCategoryChartData);
router.get('/charts/investment-growth', protect, getInvestmentGrowthChartData);

module.exports = router;
