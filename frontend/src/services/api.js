import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://fintrack-pro-api.onrender.com/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.put('/auth/change-password', data)
};

// Category APIs
export const categoryAPI = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data)
};

// Transaction APIs
export const transactionAPI = {
    getAll: (params) => api.get('/transactions', { params }),
    getOne: (id) => api.get(`/transactions/${id}`),
    create: (data) => api.post('/transactions', data),
    update: (id, data) => api.put(`/transactions/${id}`, data),
    delete: (id) => api.delete(`/transactions/${id}`),
    getMonthlySummary: (params) => api.get('/transactions/summary/monthly', { params })
};

// Investment APIs
export const investmentAPI = {
    getAll: (params) => api.get('/investments', { params }),
    getOne: (id) => api.get(`/investments/${id}`),
    create: (data) => api.post('/investments', data),
    update: (id, data) => api.put(`/investments/${id}`, data),
    delete: (id) => api.delete(`/investments/${id}`),
    updateValue: (id, data) => api.put(`/investments/${id}/update-value`, data),
    getGrowthData: () => api.get('/investments/growth-data'),
    deleteHistory: (date) => api.delete(`/investments/history/${date}`)
};

// Goal APIs
export const goalAPI = {
    getAll: (params) => api.get('/goals', { params }),
    getOne: (id) => api.get(`/goals/${id}`),
    create: (data) => api.post('/goals', data),
    update: (id, data) => api.put(`/goals/${id}`, data),
    delete: (id) => api.delete(`/goals/${id}`),
    addContribution: (id, data) => api.post(`/goals/${id}/contribute`, data),
    getStats: () => api.get('/goals/stats/overview')
};

// Subscription APIs
export const subscriptionAPI = {
    getMySubscription: () => api.get('/subscriptions/my-subscription'),
    getPlans: () => api.get('/subscriptions/plans'),
    upgrade: (data) => api.post('/subscriptions/upgrade', data),
    cancel: (data) => api.post('/subscriptions/cancel', data),
    checkFeature: (feature) => api.get(`/subscriptions/check-feature/${feature}`)
};

// Payment APIs
export const paymentAPI = {
    createOrder: (data) => api.post('/payments/create-order', data),
    verify: (data) => api.post('/payments/verify', data),
    getHistory: () => api.get('/payments/history')
};

// Dashboard APIs
export const dashboardAPI = {
    getDashboard: () => api.get('/dashboard'),
    getExpenseChart: (params) => api.get('/dashboard/charts/expenses', { params }),
    getIncomeExpenseChart: (params) => api.get('/dashboard/charts/income-expense', { params }),
    getCategoryChart: (params) => api.get('/dashboard/charts/categories', { params }),
    getInvestmentGrowthChart: (params) => api.get('/dashboard/charts/investment-growth', { params })
};

// Admin APIs
export const adminAPI = {
    getUsers: (params) => api.get('/admin/users', { params }),
    getUser: (id) => api.get(`/admin/users/${id}`),
    toggleUserBlock: (id) => api.put(`/admin/users/${id}/block`),
    getStats: () => api.get('/admin/stats'),
    getSubscriptions: (params) => api.get('/admin/subscriptions', { params }),
    getPayments: (params) => api.get('/admin/payments', { params })
};

export default api;
