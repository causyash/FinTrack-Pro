import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Layout from '../components/Layout';
import { investmentAPI } from '../services/api';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import {
    TrendingUp,
    TrendingDown,
    Plus,
    BarChart3,
    PieChart as PieChartIcon,
    DollarSign,
    Activity,
    X,
    PlusCircle,
    Briefcase,
    Edit3,
    RefreshCw,
    History,
    Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Investments = () => {
    const [investments, setInvestments] = useState([]);
    const [summary, setSummary] = useState({});
    const [growthData, setGrowthData] = useState([]);
    const [growthStats, setGrowthStats] = useState({ daysRecorded: 0, daysRemaining: 100 });
    const [planLimits, setPlanLimits] = useState({ currentCount: 0, limit: 100, remaining: 100, limitReached: false, canAddMore: true });
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState(null);
    const [updateHistory, setUpdateHistory] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        type: 'stock',
        totalInvested: '',
        currentValue: '',
        notes: ''
    });
    const [updateFormData, setUpdateFormData] = useState({
        currentValue: '',
        totalInvested: '',
        notes: '',
        mode: 'update' // 'update' or 'append'
    });

    useEffect(() => {
        document.title = 'Investments — FinTrack Pro';
    }, []);

    useEffect(() => {
        fetchInvestments();
    }, []);

    const fetchInvestments = async () => {
        try {
            // Fetch investments first
            const investmentsRes = await investmentAPI.getAll();
            setInvestments(investmentsRes.data.data.investments);
            setSummary(investmentsRes.data.data.summary);
            const limits = investmentsRes.data.data.planLimits || { currentCount: 0, limit: 100, remaining: 100, limitReached: false, canAddMore: true };
            // Ensure canAddMore is explicitly set
            if (limits.canAddMore === undefined) {
                limits.canAddMore = limits.currentCount < limits.limit;
            }
            console.log('Plan limits:', limits);
            setPlanLimits(limits);

            // Then fetch growth data separately to handle errors
            try {
                const growthRes = await investmentAPI.getGrowthData();
                console.log('Growth data response:', growthRes.data);
                const growthDataArray = growthRes.data.data || [];
                console.log('Growth data array:', growthDataArray);
                console.log('Investments length:', investmentsRes.data.data.investments.length);
                
                // Only set growth data if there are current investments and meaningful data
                if (investmentsRes.data.data.investments.length > 0 && 
                    growthDataArray.some(data => data.value > 0 || data.invested > 0)) {
                    setGrowthData(growthDataArray);
                } else {
                    setGrowthData([]);
                }
                
                setGrowthStats({
                    daysRecorded: growthRes.data.daysRecorded || 0,
                    daysRemaining: growthRes.data.daysRemaining || 100
                });
            } catch (growthError) {
                // If growth data fails (e.g., limit exceeded), still show investments
                console.error('Error fetching growth data:', growthError);
                if (growthError.response?.data?.limitReached) {
                    setPlanLimits(prev => ({ ...prev, limitReached: true }));
                }
                setGrowthData([]);
            }
        } catch (error) {
            console.error('Error fetching investments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInvestment = async (e) => {
        e.preventDefault();
        try {
            // Convert string values to numbers before sending
            const investmentData = {
                ...formData,
                totalInvested: Number(formData.totalInvested) || 0,
                currentValue: Number(formData.currentValue) || 0
            };
            
            await investmentAPI.create(investmentData);
            setIsAddModalOpen(false);
            setFormData({
                name: '',
                symbol: '',
                type: 'stock',
                totalInvested: '',
                currentValue: '',
                notes: ''
            });
            fetchInvestments();
        } catch (error) {
            console.error('Error adding investment:', error);
            if (error.response?.data?.limitReached) {
                alert(error.response.data.error);
                setPlanLimits(prev => ({ ...prev, limitReached: true }));
            } else {
                const errorMessage = error.response?.data?.errors?.[0]?.msg 
                    || error.response?.data?.message 
                    || 'Failed to add investment. Please check your inputs and try again.';
                alert(errorMessage);
            }
        }
    };

    const openUpdateModal = (investment) => {
        setSelectedInvestment(investment);
        setUpdateFormData({
            currentValue: investment.currentValue || '',
            totalInvested: investment.totalInvested || '',
            notes: investment.notes || '',
            mode: 'update' // default to update mode
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateInvestment = async (e) => {
        e.preventDefault();
        if (!selectedInvestment) return;

        try {
            // Include required fields for validation along with updated values
            const updateData = {
                type: selectedInvestment.type,
                name: selectedInvestment.name,
                symbol: selectedInvestment.symbol,
                currentValue: Number(updateFormData.currentValue) || 0,
                totalInvested: Number(updateFormData.totalInvested) || 0,
                notes: updateFormData.notes,
                mode: updateFormData.mode // 'update' or 'append'
            };

            await investmentAPI.update(selectedInvestment._id, updateData);
            
            // Add to history
            const historyEntry = {
                id: selectedInvestment._id,
                name: selectedInvestment.name,
                date: new Date().toISOString(),
                previousValue: selectedInvestment.currentValue,
                newValue: updateData.currentValue,
                previousInvested: selectedInvestment.totalInvested,
                newInvested: updateData.totalInvested
            };
            setUpdateHistory(prev => [historyEntry, ...prev].slice(0, 50)); // Keep last 50 updates

            setIsEditModalOpen(false);
            setSelectedInvestment(null);
            fetchInvestments();
        } catch (error) {
            console.error('Error updating investment:', error);
            const errorMessage = error.response?.data?.errors?.[0]?.msg 
                || error.response?.data?.message 
                || 'Failed to update investment. Please try again.';
            alert(errorMessage);
        }
    };

    const handleDeleteInvestment = async (id) => {
        if (!window.confirm('Are you sure you want to delete this investment?')) return;
        
        try {
            await investmentAPI.delete(id);
            // Clear growth data when investment is deleted to prevent showing stale data
            setGrowthData([]);
            fetchInvestments();
        } catch (error) {
            console.error('Error deleting investment:', error);
            alert('Failed to delete investment.');
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
                    fontWeight: 600,
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <Activity className="animate-pulse" size={48} />
                    <span>Analyzing portfolio performance...</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Investment Portfolio</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {!planLimits.canAddMore 
                            ? `Free plan limit reached: ${planLimits.currentCount}/${planLimits.limit} investments - Upgrade to add more`
                            : `Free plan: ${planLimits.currentCount}/${planLimits.limit} investments used`
                        }
                    </p>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={!planLimits.canAddMore}
                    style={!planLimits.canAddMore ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                    <PlusCircle size={20} />
                    <span>Add Investment</span>
                </button>
            </div>

            {/* Portfolio Summary */}
            <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
                <div className="card stat-card">
                    <div className="stat-label">Initial Investment</div>
                    <div className="stat-value">{formatCurrency(summary.totalInvested || 0)}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Portfolio Value</div>
                    <div className="stat-value" style={{ color: 'var(--primary)' }}>{formatCurrency(summary.currentValue || 0)}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Total Gains</div>
                    <div className={`stat-value ${summary.totalProfitLoss >= 0 ? 'positive' : 'negative'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {summary.totalProfitLoss >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                        {formatCurrency(summary.totalProfitLoss || 0)}
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">ROI (%)</div>
                    <div className={`stat-value ${summary.overallReturn >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercentage(summary.overallReturn || 0)}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Growth Chart */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div className="card-title" style={{ margin: 0 }}>
                            <BarChart3 size={20} color="var(--primary)" />
                            Growth Trajectory
                        </div>
                        {growthData.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--text-muted)',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '1rem'
                                }}>
                                    {growthData.length} days tracked
                                </div>
                                {growthData[growthData.length - 1]?.entryCount && (
                                    <div style={{ 
                                        fontSize: '0.75rem', 
                                        color: growthData[growthData.length - 1]?.isDeletable ? 'var(--success)' : 'var(--warning)',
                                        background: growthData[growthData.length - 1]?.isDeletable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        Entry #{growthData[growthData.length - 1]?.entryCount}
                                        {growthData[growthData.length - 1]?.isDeletable ? '• Deletable' : '• Locked'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {planLimits.limitReached ? (
                        <div style={{ 
                            height: '350px', 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            textAlign: 'center',
                            padding: '2rem'
                        }}>
                            <TrendingUp size={64} opacity={0.2} style={{ marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Free Plan Limit Reached</h3>
                            <p style={{ maxWidth: '400px', marginBottom: '1.5rem' }}>
                                You have exceeded 100 investments. Graph tracking is only available for free users with 100 or fewer investments.
                            </p>
                            <button className="btn btn-primary">
                                Upgrade to Pro
                            </button>
                        </div>
                    ) : investments.length === 0 ? (
                        <div style={{ 
                            height: '350px', 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            textAlign: 'center',
                            padding: '2rem'
                        }}>
                            <TrendingUp size={64} opacity={0.2} style={{ marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Start Your Investment Journey</h3>
                            <p style={{ maxWidth: '400px', marginBottom: '1.5rem' }}>
                                Add your first investment to start tracking your portfolio growth.
                            </p>
                            <div style={{ 
                                display: 'flex', 
                                gap: '0.5rem', 
                                alignItems: 'center',
                                padding: '0.75rem 1rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: '0.75rem',
                                fontSize: '0.875rem'
                            }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{planLimits.remaining} investments</span>
                                <span>remaining on free plan</span>
                            </div>
                        </div>
                    ) : investments.length > 0 && growthData.length > 0 && growthData.some(data => data.value > 0 || data.invested > 0) ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                    tickFormatter={(value) => `₹${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '1rem' }}
                                    itemStyle={{ fontWeight: 700 }}
                                    formatter={(value, name, props) => {
                                        const data = props?.payload;
                                        return [
                                            formatCurrency(value),
                                            name,
                                            data?.entryCount ? `Entry #${data.entryCount} ${data.isDeletable ? '(Deletable)' : '(Locked)'}` : ''
                                        ];
                                    }}
                                    labelFormatter={(label, payload) => {
                                        const data = payload?.[0]?.payload;
                                        return `${label}${data?.entryType ? ` • ${data.entryType.charAt(0).toUpperCase() + data.entryType.slice(1)}` : ''}`;
                                    }}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="Portfolio Value" />
                                <Area type="monotone" dataKey="invested" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="5 5" fill="transparent" name="Total Invested" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ 
                            height: '350px', 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            textAlign: 'center',
                            padding: '2rem'
                        }}>
                            <TrendingUp size={64} opacity={0.2} style={{ marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>No Investment Data Available</h3>
                            <p style={{ maxWidth: '400px', marginBottom: '1.5rem' }}>
                                {investments.length === 0 
                                    ? 'Add your first investment to start tracking your portfolio growth.'
                                    : 'Update your investment values daily to see growth trajectory data.'
                                }
                            </p>
                            {investments.length === 0 && (
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '0.5rem', 
                                    alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.875rem'
                                }}>
                                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{planLimits.remaining} investments</span>
                                    <span>remaining on free plan</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Asset Allocation - Dynamic based on user investments */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div className="card-title">
                        <PieChartIcon size={20} color="var(--secondary)" />
                        Asset Allocation
                    </div>
                    <div style={{ height: '350px', display: 'flex', flexDirection: 'column', justifyContent: investments.length > 0 ? 'flex-start' : 'center', gap: '1.5rem', overflowY: 'auto' }}>
                        {investments.length > 0 ? (
                            // Calculate allocation from actual investments
                            (() => {
                                const totalValue = investments.reduce((sum, inv) => {
                                    return sum + (Number(inv.totalInvested) || 0);
                                }, 0) || 1;
                                const allocation = investments.reduce((acc, inv) => {
                                    const type = inv.type || 'other';
                                    acc[type] = (acc[type] || 0) + (Number(inv.totalInvested) || 0);
                                    return acc;
                                }, {});
                                
                                const colors = ['var(--primary)', 'var(--secondary)', 'var(--success)', 'var(--warning)', 'var(--accent)', 'var(--info)'];
                                
                                return Object.entries(allocation)
                                    .sort(([,a], [,b]) => b - a)
                                    .map(([type, value], i) => {
                                        const percentage = ((value / totalValue) * 100).toFixed(1);
                                        const displayType = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                        return (
                                            <div key={type}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                                    <span style={{ fontWeight: 600 }}>{displayType}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{percentage}%</span>
                                                </div>
                                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 0.8, delay: i * 0.1 }}
                                                        style={{ height: '100%', background: colors[i % colors.length] }}
                                                    />
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                    {formatCurrency(value)}
                                                </div>
                                            </div>
                                        );
                                    });
                            })()
                        ) : (
                            // Empty state for new users
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                <PieChartIcon size={64} opacity={0.1} style={{ marginBottom: '1rem' }} />
                                <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No Assets Yet</p>
                                <p style={{ fontSize: '0.875rem' }}>Add your first investment to see allocation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Investments Table */}
            <div className="card" style={{ padding: 0 }}>
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Asset Detail</th>
                                <th>Category</th>
                                <th>Investment</th>
                                <th>Current Value</th>
                                <th>P/L</th>
                                <th>Performance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {investments.length > 0 ? (
                                investments.map(inv => (
                                    <tr key={inv._id}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{inv.name}</div>
                                            {inv.symbol && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{inv.symbol}</div>}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.35rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                color: 'var(--primary)',
                                                textTransform: 'uppercase',
                                                border: '1px solid rgba(99, 102, 241, 0.2)'
                                            }}>
                                                {inv.type}
                                            </span>
                                        </td>
                                        <td>{formatCurrency(inv.totalInvested)}</td>
                                        <td>{formatCurrency(inv.currentValue)}</td>
                                        <td style={{ color: inv.profitLoss >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 800 }}>
                                            {inv.profitLoss >= 0 ? '+' : ''}{formatCurrency(inv.profitLoss)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: inv.profitLossPercentage >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 800 }}>
                                                {inv.profitLossPercentage >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {formatPercentage(inv.profitLossPercentage)}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => openUpdateModal(inv)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        borderRadius: '0.5rem',
                                                        border: 'none',
                                                        background: 'rgba(99, 102, 241, 0.1)',
                                                        color: 'var(--primary)',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Update Values"
                                                >
                                                    <RefreshCw size={16} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleDeleteInvestment(inv._id)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        borderRadius: '0.5rem',
                                                        border: 'none',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: 'var(--danger)',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Delete"
                                                >
                                                    <X size={16} />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                                        <Briefcase size={64} opacity={0.1} style={{ marginBottom: '1.5rem' }} />
                                        <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Empty Portfolio</p>
                                        <p>Click 'Add Investment' above to start tracking your assets.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Investment Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000 }} />
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'fixed', top: '5%', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '600px', background: 'var(--bg-dark)', borderRadius: '1.5rem', padding: '2.5rem', zIndex: 1001, border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>New Asset Entry</h2>
                                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X /></button>
                            </div>
                            <form onSubmit={handleAddInvestment}>
                                <div className="form-group">
                                    <label className="form-label">Asset Name</label>
                                    <input type="text" className="form-input" placeholder="e.g. Apple Inc. Stocks" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Symbol (Optional)</label>
                                        <input type="text" className="form-input" placeholder="AAPL" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select className="form-select" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                            <option value="stock">Stocks</option>
                                            <option value="mutual_fund">Mutual Funds</option>
                                            <option value="sip">SIP</option>
                                            <option value="fd">Fixed Deposit</option>
                                            <option value="bond">Bonds</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Amount Invested (₹)</label>
                                        <input type="number" className="form-input" placeholder="0.00" value={formData.totalInvested} onChange={(e) => setFormData({ ...formData, totalInvested: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Current Value (₹)</label>
                                        <input type="number" className="form-input" placeholder="0.00" value={formData.currentValue} onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })} required />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '4rem', fontSize: '1.125rem' }}>Secure Entry</button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Update Investment Modal */}
            <AnimatePresence>
                {isEditModalOpen && selectedInvestment && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsEditModalOpen(false)} 
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000 }} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: 50 }}
                            style={{ 
                                position: 'fixed', 
                                top: '10%', 
                                left: '50%', 
                                transform: 'translateX(-50%)', 
                                width: '90%', 
                                maxWidth: '500px', 
                                background: 'var(--bg-dark)', 
                                borderRadius: '1.5rem', 
                                padding: '2rem', 
                                zIndex: 1001, 
                                border: '1px solid var(--glass-border)',
                                maxHeight: '80vh',
                                overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Update Investment</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{selectedInvestment.name}</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Current Stats */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '1rem', 
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '1rem'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current P/L</div>
                                    <div style={{ 
                                        fontSize: '1.25rem', 
                                        fontWeight: 700,
                                        color: selectedInvestment.profitLoss >= 0 ? 'var(--success)' : 'var(--danger)'
                                    }}>
                                        {selectedInvestment.profitLoss >= 0 ? '+' : ''}{formatCurrency(selectedInvestment.profitLoss)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Return %</div>
                                    <div style={{ 
                                        fontSize: '1.25rem', 
                                        fontWeight: 700,
                                        color: selectedInvestment.profitLossPercentage >= 0 ? 'var(--success)' : 'var(--danger)'
                                    }}>
                                        {formatPercentage(selectedInvestment.profitLossPercentage)}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateInvestment}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <DollarSign size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                            Principal Amount (₹)
                                        </label>
                                        <input 
                                            type="number" 
                                            className="form-input" 
                                            placeholder="0.00" 
                                            value={updateFormData.totalInvested} 
                                            onChange={(e) => setUpdateFormData({ ...updateFormData, totalInvested: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <TrendingUp size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                            Current Value (₹)
                                        </label>
                                        <input 
                                            type="number" 
                                            className="form-input" 
                                            placeholder="0.00" 
                                            value={updateFormData.currentValue} 
                                            onChange={(e) => setUpdateFormData({ ...updateFormData, currentValue: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">
                                        <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                        Update Notes (Optional)
                                    </label>
                                    <textarea 
                                        className="form-input" 
                                        rows="2"
                                        placeholder="e.g., Market rally, quarterly earnings..."
                                        value={updateFormData.notes} 
                                        onChange={(e) => setUpdateFormData({ ...updateFormData, notes: e.target.value })} 
                                        style={{ resize: 'none' }}
                                    />
                                </div>

                                {/* Update Mode Toggle */}
                                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
                                    <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                                        Graph Entry Mode
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setUpdateFormData({ ...updateFormData, mode: 'update' })}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                border: '2px solid ' + (updateFormData.mode === 'update' ? 'var(--primary)' : 'transparent'),
                                                background: updateFormData.mode === 'update' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                                                color: 'var(--text-main)',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                fontWeight: updateFormData.mode === 'update' ? 600 : 400
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Update Existing</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Entry count stays same • Can be deleted
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUpdateFormData({ ...updateFormData, mode: 'append' })}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                border: '2px solid ' + (updateFormData.mode === 'append' ? 'var(--success)' : 'transparent'),
                                                background: updateFormData.mode === 'append' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                                color: 'var(--text-main)',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                fontWeight: updateFormData.mode === 'append' ? 600 : 400
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Append New</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Entry count +1 • Cannot be deleted
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline" 
                                        style={{ flex: 1, height: '3rem' }}
                                        onClick={() => setIsEditModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary" 
                                        style={{ flex: 2, height: '3rem' }}
                                    >
                                        <RefreshCw size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
                                        Update Values
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
              @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
              .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}} />
        </Layout>
    );
};

export default Investments;
