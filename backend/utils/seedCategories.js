const Category = require('../models/Category');

const defaultCategories = [
    // Income
    { name: 'Salary', type: 'income', icon: '💰', color: '#10B981' },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#3B82F6' },
    { name: 'Investments', type: 'income', icon: '📈', color: '#8B5CF6' },
    { name: 'Gift', type: 'income', icon: '🎁', color: '#EC4899' },

    // Expenses
    { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#EF4444' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#F59E0B' },
    { name: 'Transportation', type: 'expense', icon: '🚗', color: '#3B82F6' },
    { name: 'Bills & Utilities', type: 'expense', icon: '🔌', color: '#6366F1' },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8B5CF6' },
    { name: 'Health', type: 'expense', icon: '🏥', color: '#10B981' },
    { name: 'Travel', type: 'expense', icon: '✈️', color: '#06B6D4' },
    { name: 'Education', type: 'expense', icon: '📚', color: '#6366F1' },

    // Investments
    { name: 'Stocks', type: 'investment', icon: '📊', color: '#3B82F6' },
    { name: 'Mutual Funds', type: 'investment', icon: '🏢', color: '#8B5CF6' },
    { name: 'Crypto', type: 'investment', icon: '🪙', color: '#F59E0B' },
    { name: 'Fixed Deposit', type: 'investment', icon: '🔐', color: '#10B981' }
];

const seedCategories = async (userId) => {
    try {
        const categories = defaultCategories.map(cat => ({
            ...cat,
            user: userId,
            isDefault: true
        }));

        await Category.insertMany(categories);
        console.log(`Default categories seeded for user: ${userId}`);
    } catch (error) {
        console.error('Error seeding categories:', error);
    }
};

module.exports = seedCategories;
