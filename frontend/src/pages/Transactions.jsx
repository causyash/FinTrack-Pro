import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { transactionAPI, categoryAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
    Plus,
    Search,
    Filter,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
    TrendingDown,
    TrendingUp,
    Wallet,
    X,
    AlertCircle,
    ChevronDown,
    RefreshCw,
    Calendar,
    CreditCard,
    ArrowLeftRight,
    Download,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 10;

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [filter, setFilter] = useState({ type: '', startDate: '', endDate: '', category: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        document.title = 'Transactions — FinTrack Pro';
    }, []);

    useEffect(() => {
        fetchTransactions();
        fetchCategories();
    }, [filter]);

    // Filter transactions based on search query
    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions;
        const query = searchQuery.toLowerCase();
        return transactions.filter(tx => 
            tx.description?.toLowerCase().includes(query) ||
            tx.category?.name?.toLowerCase().includes(query) ||
            tx.amount?.toString().includes(query)
        );
    }, [transactions, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredTransactions, currentPage]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await transactionAPI.getAll(filter);
            setTransactions(response.data.data.transactions);
            setSummary(response.data.data.summary);
            setCurrentPage(1); // Reset to first page on filter change
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    const clearFilters = () => {
        setFilter({ type: '', startDate: '', endDate: '', category: '' });
        setSearchQuery('');
        setCurrentPage(1);
    };

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getAll();
            const data = response.data.data || [];
            if (data.length === 0) {
                const defaults = [
                    { name: 'Salary', type: 'income', icon: '💰', color: '#10B981' },
                    { name: 'Freelance', type: 'income', icon: '💻', color: '#3B82F6' },
                    { name: 'Investments', type: 'income', icon: '📈', color: '#8B5CF6' },
                    { name: 'Gift', type: 'income', icon: '🎁', color: '#EC4899' },
                    { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#EF4444' },
                    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#F59E0B' },
                    { name: 'Transportation', type: 'expense', icon: '🚗', color: '#3B82F6' },
                    { name: 'Bills & Utilities', type: 'expense', icon: '🔌', color: '#6366F1' },
                    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8B5CF6' },
                    { name: 'Health', type: 'expense', icon: '🏥', color: '#10B981' },
                    { name: 'Travel', type: 'expense', icon: '✈️', color: '#06B6D4' },
                    { name: 'Education', type: 'expense', icon: '📚', color: '#6366F1' }
                ];
                await Promise.allSettled(defaults.map(cat => categoryAPI.create(cat)));
                const seeded = await categoryAPI.getAll();
                setCategories(seeded.data.data || []);
            } else {
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;

        try {
            await transactionAPI.delete(id);
            fetchTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.amount || !formData.category) {
            setFormError('Please fill in all required fields');
            return;
        }
        setSubmitting(true);
        try {
            await transactionAPI.create(formData);
            setIsModalOpen(false);
            setFormData({
                type: 'expense',
                amount: '',
                category: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
            fetchTransactions();
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error creating transaction');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-dark)',
                    zIndex: 100,
                    color: 'var(--primary)',
                    fontSize: '1.25rem',
                    fontWeight: 600
                }}>
                    Analyzing your records...
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '2.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 800 }}>Transactions</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Detailed log of your financial history</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ whiteSpace: 'nowrap' }}>
                    <Plus size={20} />
                    <span>Add Transaction</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <motion.div 
                    className="card stat-card" 
                    style={{ borderLeft: '4px solid var(--success)', padding: '1.5rem' }}
                    whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.2)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ArrowDownRight size={14} />
                                Total Income
                            </div>
                            <div className="stat-value positive" style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>
                                {formatCurrency(summary.totalIncome || 0)}
                            </div>
                        </div>
                        <div style={{ 
                            padding: '0.75rem', 
                            borderRadius: '0.75rem', 
                            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                            color: 'var(--success)'
                        }}>
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </motion.div>
                
                <motion.div 
                    className="card stat-card" 
                    style={{ borderLeft: '4px solid var(--danger)', padding: '1.5rem' }}
                    whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(239, 68, 68, 0.2)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ArrowUpRight size={14} />
                                Total Expense
                            </div>
                            <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.5rem', color: 'var(--danger)' }}>
                                {formatCurrency(summary.totalExpense || 0)}
                            </div>
                        </div>
                        <div style={{ 
                            padding: '0.75rem', 
                            borderRadius: '0.75rem', 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                            color: 'var(--danger)'
                        }}>
                            <TrendingDown size={24} />
                        </div>
                    </div>
                </motion.div>
                
                <motion.div 
                    className="card stat-card" 
                    style={{ borderLeft: '4px solid var(--primary)', padding: '1.5rem' }}
                    whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.2)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Wallet size={14} />
                                Net Balance
                            </div>
                            <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>
                                {formatCurrency(summary.balance || 0)}
                            </div>
                        </div>
                        <div style={{ 
                            padding: '0.75rem', 
                            borderRadius: '0.75rem', 
                            backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                            color: 'var(--primary)'
                        }}>
                            <Wallet size={24} />
                        </div>
                    </div>
                </motion.div>
                
                <motion.div 
                    className="card stat-card" 
                    style={{ borderLeft: '4px solid var(--secondary)', padding: '1.5rem' }}
                    whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.2)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ArrowLeftRight size={14} />
                                Transactions
                            </div>
                            <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.5rem', color: 'var(--secondary)' }}>
                                {filteredTransactions.length}
                            </div>
                        </div>
                        <div style={{ 
                            padding: '0.75rem', 
                            borderRadius: '0.75rem', 
                            backgroundColor: 'rgba(168, 85, 247, 0.1)', 
                            color: 'var(--secondary)'
                        }}>
                            <CreditCard size={24} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Controls Bar */}
            <motion.div 
                className="card" 
                style={{ marginBottom: '1.5rem', padding: '1.25rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="form-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ 
                                paddingLeft: '2.75rem', 
                                background: 'var(--bg-lighter)',
                                border: '2px solid var(--glass-border)'
                            }}
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="form-group" style={{ margin: 0, minWidth: '140px' }}>
                        <select
                            className="form-select"
                            value={filter.type}
                            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                            style={{ background: 'var(--bg-lighter)' }}
                        >
                            <option value="">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className="form-group" style={{ margin: 0, minWidth: '160px' }}>
                        <select
                            className="form-select"
                            value={filter.category}
                            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                            style={{ background: 'var(--bg-lighter)' }}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range Toggle */}
                    <button
                        className="btn btn-outline"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Calendar size={18} />
                        <span>Dates</span>
                        <ChevronDown size={16} style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                    </button>

                    {/* Refresh */}
                    <motion.button
                        className="btn btn-outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ padding: '0.75rem' }}
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </motion.button>

                    {/* Clear Filters */}
                    {(filter.type || filter.category || filter.startDate || filter.endDate || searchQuery) && (
                        <motion.button
                            className="btn btn-outline"
                            onClick={clearFilters}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                        >
                            <X size={18} />
                        </motion.button>
                    )}
                </div>

                {/* Date Range Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}
                        >
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>From:</span>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filter.startDate}
                                    onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                                    style={{ width: 'auto', background: 'var(--bg-lighter)' }}
                                />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>To:</span>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filter.endDate}
                                    onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                                    style={{ width: 'auto', background: 'var(--bg-lighter)' }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Results Count */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
                </p>
                {searchQuery && (
                    <p style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
                        Search results for &quot;{searchQuery}&quot;
                    </p>
                )}
            </div>

            {/* Transactions List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map((tx, index) => (
                                    <tr key={tx._id}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatDate(tx.date)}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    backgroundColor: tx.category?.color + '20' || 'rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1rem'
                                                }}>
                                                    {tx.category?.icon || '📦'}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{tx.category?.name}</span>
                                            </div>
                                        </td>
                                        <td>{tx.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description</span>}</td>
                                        <td>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                                {tx.paymentMethod || 'Cash'}
                                            </span>
                                        </td>
                                        <td style={{
                                            fontWeight: 800,
                                            fontSize: '1rem',
                                            color: tx.type === 'income' ? 'var(--success)' : 'var(--text-main)'
                                        }}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDelete(tx._id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    padding: '0.5rem',
                                                    borderRadius: '0.5rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <AlertCircle size={48} opacity={0.2} />
                                            <p>{searchQuery ? 'No transactions match your search' : 'No transactions found'}</p>
                                            {(filter.type || filter.category || searchQuery) && (
                                                <button 
                                                    className="btn btn-outline" 
                                                    onClick={clearFilters}
                                                    style={{ marginTop: '0.5rem' }}
                                                >
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        marginTop: '1.5rem',
                        padding: '1rem'
                    }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{ padding: '0.5rem' }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    className="btn"
                                    onClick={() => setCurrentPage(page)}
                                    style={{ 
                                        padding: '0.5rem 0.75rem',
                                        minWidth: '40px',
                                        background: currentPage === page ? 'var(--primary)' : 'transparent',
                                        color: currentPage === page ? 'white' : 'var(--text-main)'
                                    }}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        
                        <button
                            className="btn btn-outline"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{ padding: '0.5rem' }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Add Transaction Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{
                                position: 'fixed',
                                top: '10%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '90%',
                                maxWidth: '500px',
                                background: 'var(--bg-card)',
                                borderRadius: '1.5rem',
                                padding: '2rem',
                                zIndex: 1001,
                                boxShadow: 'var(--shadow-lg)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>New Transaction</h2>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {formError && (
                                <div className="alert alert-error" style={{ marginBottom: '1.5rem', borderRadius: '0.75rem' }}>{formError}</div>
                            )}

                            <form onSubmit={handleFormSubmit}>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-lighter)', padding: '0.25rem', borderRadius: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'expense' })}
                                        style={{
                                            flex: 1,
                                            border: 'none',
                                            padding: '0.75rem',
                                            borderRadius: '0.6rem',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            background: formData.type === 'expense' ? 'var(--danger)' : 'transparent',
                                            color: formData.type === 'expense' ? 'white' : 'var(--text-muted)',
                                            transition: 'all 0.2s'
                                        }}
                                    >Expense</button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'income' })}
                                        style={{
                                            flex: 1,
                                            border: 'none',
                                            padding: '0.75rem',
                                            borderRadius: '0.6rem',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            background: formData.type === 'income' ? 'var(--success)' : 'transparent',
                                            color: formData.type === 'income' ? 'white' : 'var(--text-muted)',
                                            transition: 'all 0.2s'
                                        }}
                                    >Income</button>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Amount</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        autoFocus
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', height: '4rem' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-input"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.filter(c => c.type === formData.type).map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label className="form-label">Description (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="What was this for?"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ width: '100%', height: '3.5rem' }}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Recording...' : 'Record Transaction'}
                                </button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .animate-spin {
                animation: spin 1s linear infinite;
              }
            `}} />
        </Layout>
    );
};

export default Transactions;
