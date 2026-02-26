import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    PieChart as PieChartIcon,
    Activity,
    Calendar,
    Zap,
    ArrowLeftRight,
    ChevronDown,
    RefreshCw,
    Target,
    CreditCard
} from 'lucide-react';
import Layout from '../components/Layout';
import { dashboardAPI } from '../services/api';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const DATE_RANGES = [
    { label: 'Last 7 Days', value: '7days', days: 7 },
    { label: 'Last 30 Days', value: '30days', days: 30 },
    { label: 'Last 3 Months', value: '3months', days: 90 },
    { label: 'Last 6 Months', value: '6months', days: 180 },
    { label: 'Last 1 Year', value: '1year', days: 365 }
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [expenseChartData, setExpenseChartData] = useState([]);
    const [categoryChartData, setCategoryChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(DATE_RANGES[1]); // Default to 30 days
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        document.title = 'Dashboard — FinTrack Pro';
    }, []);

    const fetchDashboardData = useCallback(async (range = dateRange) => {
        setLoading(true);
        try {
            const months = Math.ceil(range.days / 30);
            const [dashboardRes, expenseRes, categoryRes] = await Promise.all([
                dashboardAPI.getDashboard({ days: range.days }),
                dashboardAPI.getExpenseChart({ months: Math.max(months, 3) }),
                dashboardAPI.getCategoryChart({ type: 'expense', months: Math.max(months, 3) })
            ]);

            setDashboardData(dashboardRes.data.data);
            setExpenseChartData(expenseRes.data.data);
            setCategoryChartData(categoryRes.data.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleDateRangeChange = (range) => {
        setDateRange(range);
        setShowDateDropdown(false);
        fetchDashboardData(range);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    if (loading) {
        return (
            <Layout>
                <div className="loading" style={{ color: 'var(--primary)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Zap className="animate-pulse" size={48} style={{ marginBottom: '1rem' }} />
                        <p>Curating your financial insights...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const { summary, goals, recentTransactions } = dashboardData || {};
    const hotspotsTotal = categoryChartData.reduce((acc, c) => acc + (c.amount || 0), 0) || 1;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--glass-border)',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</p>
                    <p style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Layout>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
                        Financial Overview
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>
                        Welcome back! Here's what's happening {dateRange.label.toLowerCase()}.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Refresh Button */}
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
                    
                    {/* Date Range Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button 
                            className="btn btn-outline"
                            onClick={() => setShowDateDropdown(!showDateDropdown)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '150px', justifyContent: 'space-between' }}
                        >
                            <Calendar size={18} />
                            <span>{dateRange.label}</span>
                            <ChevronDown size={16} style={{ transform: showDateDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                        </button>
                        
                        <AnimatePresence>
                            {showDateDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '0.5rem',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.75rem',
                                        padding: '0.5rem',
                                        minWidth: '180px',
                                        zIndex: 100,
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                >
                                    {DATE_RANGES.map((range) => (
                                        <button
                                            key={range.value}
                                            onClick={() => handleDateRangeChange(range)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                textAlign: 'left',
                                                background: dateRange.value === range.value ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                color: dateRange.value === range.value ? 'var(--primary)' : 'var(--text-main)',
                                                fontWeight: dateRange.value === range.value ? 600 : 400,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (dateRange.value !== range.value) {
                                                    e.target.style.background = 'rgba(255,255,255,0.05)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (dateRange.value !== range.value) {
                                                    e.target.style.background = 'transparent';
                                                }
                                            }}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div>
                {/* Stats Grid */}
                <div className="stats-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    {/* Net Worth Card */}
                    <motion.div 
                        whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.2)' }} 
                        className="card stat-card"
                        style={{ borderLeft: '4px solid var(--primary)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Wallet size={14} />
                                    Net Worth
                                </div>
                                <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>
                                    {formatCurrency(summary?.netWorth || 0)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Total assets - liabilities
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

                    {/* Income Card */}
                    <motion.div 
                        whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.2)' }} 
                        className="card stat-card"
                        style={{ borderLeft: '4px solid var(--success)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ArrowDownRight size={14} />
                                    Income
                                </div>
                                <div className="stat-value positive" style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>
                                    {formatCurrency(summary?.monthlyIncome || 0)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                                    +12% from last period
                                </div>
                            </div>
                            <div style={{ 
                                padding: '0.75rem', 
                                borderRadius: '0.75rem', 
                                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                                color: 'var(--success)'
                            }}>
                                <ArrowUpRight size={24} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Expenses Card */}
                    <motion.div 
                        whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(239, 68, 68, 0.2)' }} 
                        className="card stat-card"
                        style={{ borderLeft: '4px solid var(--danger)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ArrowUpRight size={14} />
                                    Expenses
                                </div>
                                <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.5rem', color: 'var(--danger)' }}>
                                    {formatCurrency(summary?.monthlyExpense || 0)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                                    -5% from last period
                                </div>
                            </div>
                            <div style={{ 
                                padding: '0.75rem', 
                                borderRadius: '0.75rem', 
                                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                color: 'var(--danger)'
                            }}>
                                <CreditCard size={24} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Savings Card */}
                    <motion.div 
                        whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.2)' }} 
                        className="card stat-card"
                        style={{ borderLeft: '4px solid var(--secondary)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Target size={14} />
                                    Savings Rate
                                </div>
                                <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.5rem', color: 'var(--secondary)' }}>
                                    {formatPercentage(summary?.monthlyIncome > 0 ? (summary?.monthlyBalance / summary?.monthlyIncome) * 100 : 0)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Of total income
                                </div>
                            </div>
                            <div style={{ 
                                padding: '0.75rem', 
                                borderRadius: '0.75rem', 
                                backgroundColor: 'rgba(168, 85, 247, 0.1)', 
                                color: 'var(--secondary)'
                            }}>
                                <Activity size={24} />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Charts Row */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                    gap: '1.5rem', 
                    marginBottom: '2rem' 
                }}>
                {/* Expense Chart */}
                <motion.div 
                    className="card"
                    whileHover={{ boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                    style={{ padding: '1.5rem' }}
                >
                    <div className="card-title" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                                padding: '0.5rem', 
                                borderRadius: '0.5rem', 
                                background: 'rgba(99, 102, 241, 0.1)' 
                            }}>
                                <TrendingUp size={20} color="var(--primary)" />
                            </div>
                            <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Expense Trends</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {dateRange.label}
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={expenseChartData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                tickFormatter={(value) => `₹${value >= 1000 ? (value/1000) + 'k' : value}`}
                            />
                            <Tooltip 
                                content={<CustomTooltip />}
                                cursor={{ stroke: 'rgba(99, 102, 241, 0.3)', strokeWidth: 2 }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="amount" 
                                stroke="var(--primary)" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorAmount)" 
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Category Breakdown */}
                <motion.div 
                    className="card"
                    whileHover={{ boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                    style={{ padding: '1.5rem' }}
                >
                    <div className="card-title" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                                padding: '0.5rem', 
                                borderRadius: '0.5rem', 
                                background: 'rgba(168, 85, 247, 0.1)' 
                            }}>
                                <PieChartIcon size={20} color="var(--secondary)" />
                            </div>
                            <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Spending by Category</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={categoryChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="amount"
                                nameKey="name"
                                stroke="none"
                                animationBegin={0}
                                animationDuration={1000}
                            >
                                {categoryChartData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]}
                                        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '0.75rem', 
                        marginTop: '1rem',
                        justifyContent: 'center'
                    }}>
                        {categoryChartData.slice(0, 4).map((entry, index) => (
                            <div key={entry.name} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                fontSize: '0.75rem'
                            }}>
                                <div style={{ 
                                    width: '8px', 
                                    height: '8px', 
                                    borderRadius: '50%', 
                                    background: COLORS[index % COLORS.length] 
                                }} />
                                <span style={{ color: 'var(--text-muted)' }}>{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
                </div>

                {/* Goals & Recent Transactions */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '1.5rem' 
                }}>
                {/* Goals Progress */}
                <motion.div 
                    className="card"
                    whileHover={{ boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                    style={{ padding: '1.5rem' }}
                >
                    <div className="card-title" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                                padding: '0.5rem', 
                                borderRadius: '0.5rem', 
                                background: 'rgba(16, 185, 129, 0.1)' 
                            }}>
                                <Target size={20} color="var(--success)" />
                            </div>
                            <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Goals Progress</span>
                        </div>
                        <span style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--success)', 
                            fontWeight: 700,
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem'
                        }}>
                            {formatPercentage(goals?.overallProgress || 0)}
                        </span>
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                            height: '12px',
                            backgroundColor: 'var(--bg-lighter)',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(goals?.overallProgress || 0, 100)}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                style={{
                                    height: '100%',
                                    background: 'linear-gradient(90deg, var(--success), var(--primary))',
                                    borderRadius: '10px',
                                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                                }}
                            />
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div style={{ 
                            padding: '1rem', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: '0.75rem', 
                            textAlign: 'center',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                                {goals?.completed || 0}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Completed
                            </div>
                        </div>
                        <div style={{ 
                            padding: '1rem', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: '0.75rem', 
                            textAlign: 'center',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                                {goals?.inProgress || 0}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Active
                            </div>
                        </div>
                        <div style={{ 
                            padding: '1rem', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: '0.75rem', 
                            textAlign: 'center',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)' }}>
                                {goals?.total || 0}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Total
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Recent Transactions */}
                <motion.div 
                    className="card"
                    whileHover={{ boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                    style={{ padding: '1.5rem' }}
                >
                    <div className="card-title" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                                padding: '0.5rem', 
                                borderRadius: '0.5rem', 
                                background: 'rgba(245, 158, 11, 0.1)' 
                            }}>
                                <ArrowLeftRight size={20} color="var(--warning)" />
                            </div>
                            <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recent Activity</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {recentTransactions?.length || 0} transactions
                        </span>
                    </div>
                    
                    {recentTransactions?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentTransactions.slice(0, 5).map((tx, index) => (
                                <motion.div 
                                    key={tx._id} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.875rem 1rem',
                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                        borderRadius: '0.75rem',
                                        border: '1px solid var(--glass-border)',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    whileHover={{ 
                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                        borderColor: 'var(--primary)'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            backgroundColor: tx.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {tx.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                                                {tx.category?.name || 'Uncategorized'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        color: tx.type === 'income' ? 'var(--success)' : 'var(--text-main)'
                                    }}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            height: '180px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)'
                        }}>
                            <Activity size={40} opacity={0.2} style={{ marginBottom: '0.75rem' }} />
                            <p style={{ fontSize: '0.9375rem' }}>No recent activity</p>
                            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Your transactions will appear here</p>
                        </div>
                    )}
                </motion.div>
                </div>
              </div>

              {/* Floating Right Rail - Desktop */}
              <aside
                className="dashboard-right-rail-float"
                style={{
                  position: 'fixed',
                  right: '24px',
                  top: '120px',
                  width: '360px',
                  zIndex: 90,
                  maxHeight: 'calc(100vh - 140px)',
                  overflowY: 'auto',
                  display: 'block'
                }}
              >
                {/* Quick Actions */}
                <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div className="card-title">Quick Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn btn-outline"
                      onClick={() => navigate('/transactions')}
                      style={{ justifyContent: 'flex-start', gap: '0.75rem' }}
                    >
                      <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(245, 158, 11, 0.1)' }}>
                        <ArrowLeftRight size={18} color="var(--warning)" />
                      </div>
                      Add Transaction
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn btn-outline"
                      onClick={() => navigate('/investments')}
                      style={{ justifyContent: 'flex-start', gap: '0.75rem' }}
                    >
                      <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(99, 102, 241, 0.1)' }}>
                        <TrendingUp size={18} color="var(--primary)" />
                      </div>
                      Add Investment
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn btn-outline"
                      onClick={() => navigate('/goals')}
                      style={{ justifyContent: 'flex-start', gap: '0.75rem' }}
                    >
                      <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <Target size={18} color="var(--success)" />
                      </div>
                      Create Goal
                    </motion.button>
                  </div>
                </div>

                {/* Spending Hotspots */}
                <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div className="card-title">Spending Hotspots</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {categoryChartData.slice(0, 4).map((cat, i) => {
                      const pct = Math.round(((cat.amount || 0) / hotspotsTotal) * 100);
                      return (
                        <div key={cat.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600 }}>{cat.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              style={{ height: '100%', background: COLORS[i % COLORS.length] }}
                            />
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {formatCurrency(cat.amount || 0)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            {/* Responsive rules moved to App.css */}
        </Layout>
    );
};

export default Dashboard;
