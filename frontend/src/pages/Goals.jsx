import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { goalAPI } from '../services/api';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';
import {
    Target,
    Plus,
    ChevronRight,
    Calendar,
    TrendingUp,
    CheckCircle2,
    Clock,
    X,
    CreditCard,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
    useEffect(() => {
        document.title = 'Goals — FinTrack Pro';
    }, []);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [contributeAmount, setContributeAmount] = useState('');
    const [createFormData, setCreateFormData] = useState({
        title: '',
        targetAmount: '',
        targetDate: '',
        category: 'emergency_fund',
        icon: '🏥',
        color: '#6366f1'
    });

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const [goalsRes, statsRes] = await Promise.all([
                goalAPI.getAll(),
                goalAPI.getStats()
            ]);

            setGoals(goalsRes.data.data.goals);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        if (!contributeAmount || isNaN(contributeAmount) || contributeAmount <= 0) return;

        try {
            await goalAPI.addContribution(selectedGoal._id, { amount: Number(contributeAmount) });
            setIsContributeModalOpen(false);
            setContributeAmount('');
            fetchGoals();
        } catch (error) {
            console.error('Error adding contribution:', error);
        }
    };

    const handleCreateGoal = async (e) => {
        e.preventDefault();
        try {
            await goalAPI.create(createFormData);
            setIsCreateModalOpen(false);
            setCreateFormData({
                title: '',
                targetAmount: '',
                targetDate: '',
                category: 'emergency_fund',
                icon: '🏥',
                color: '#6366f1'
            });
            fetchGoals();
        } catch (error) {
            console.error('Error creating goal:', error);
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
                    Visualizing your aspirations...
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Financial Goals</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Visualize and track your future milestones</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={20} />
                    <span>Create New Goal</span>
                </button>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
                <div className="card stat-card">
                    <div className="stat-label">Total Saving Goals</div>
                    <div className="stat-value">{stats.overview?.totalGoals || 0}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Milestones Reached</div>
                    <div className="stat-value positive" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={24} />
                        {stats.overview?.completedGoals || 0}
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Total Progress</div>
                    <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={24} color="var(--primary)" />
                        {formatPercentage(stats.overview?.avgProgress || 0)}
                    </div>
                </div>
            </div>

            {/* Goals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                {goals.length > 0 ? (
                    goals.map(goal => (
                        <motion.div
                            key={goal._id}
                            className="card"
                            style={{ position: 'relative', overflow: 'hidden' }}
                            whileHover={{ y: -5 }}
                        >
                            {goal.isCompleted && (
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    backgroundColor: 'var(--success)',
                                    color: 'white',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Target Met
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '16px',
                                    backgroundColor: (goal.color || '#6366f1') + '15',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.75rem'
                                }}>
                                    {goal.icon}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{goal.title}</h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                                        {goal.category.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                        Completion Rate
                                    </span>
                                    <span style={{ fontWeight: 800, fontSize: '1.125rem', color: goal.isCompleted ? 'var(--success)' : 'var(--primary)' }}>
                                        {formatPercentage(goal.progressPercentage)}
                                    </span>
                                </div>
                                <div style={{
                                    height: '10px',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderRadius: '5px',
                                    overflow: 'hidden'
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                                        transition={{ duration: 1 }}
                                        style={{
                                            height: '100%',
                                            background: goal.isCompleted
                                                ? 'var(--success)'
                                                : `linear-gradient(90deg, ${goal.color || '#6366f1'}, var(--secondary))`,
                                            borderRadius: '5px'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Saved Amount</div>
                                    <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{formatCurrency(goal.currentAmount)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Goal Target</div>
                                    <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{formatCurrency(goal.targetAmount)}</div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '1.5rem',
                                paddingTop: '1.25rem',
                                borderTop: '1px solid var(--glass-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                    <Calendar size={14} />
                                    <span>{formatDate(goal.targetDate)}</span>
                                </div>
                                {!goal.isCompleted && (
                                    <button
                                        className="btn btn-outline"
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', gap: '0.5rem' }}
                                        onClick={() => {
                                            setSelectedGoal(goal);
                                            setIsContributeModalOpen(true);
                                        }}
                                    >
                                        <Plus size={14} />
                                        Contribute
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', background: 'var(--bg-card)', borderRadius: '2rem', border: '1px dashed var(--glass-border)' }}>
                        <Target size={64} opacity={0.1} style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>A Journey of a Thousand Miles...</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}> starts with a single goal. Create your first financial milestone to begin tracking your future today.</p>
                        <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => setIsCreateModalOpen(true)}>Create Your First Goal</button>
                    </div>
                )}
            </div>

            {/* Contribution Modal */}
            <AnimatePresence>
                {isContributeModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsContributeModalOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            style={{
                                position: 'fixed',
                                top: '20%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '90%',
                                maxWidth: '400px',
                                background: 'var(--bg-dark)',
                                borderRadius: '1.5rem',
                                padding: '2rem',
                                zIndex: 1001,
                                border: '1px solid var(--glass-border)',
                                boxShadow: 'var(--shadow-lg)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Add Funds</h2>
                                <button onClick={() => setIsContributeModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X /></button>
                            </div>
                            <form onSubmit={handleContribute}>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>Contributing to: <strong>{selectedGoal?.title}</strong></p>
                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, fontSize: '1.5rem', opacity: 0.5 }}>₹</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Amount"
                                            value={contributeAmount}
                                            onChange={(e) => setContributeAmount(e.target.value)}
                                            style={{ paddingLeft: '2.5rem', height: '4rem', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center' }}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '3.5rem' }}>Confirm Contribution</button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Create Goal Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                position: 'fixed',
                                top: '10%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '90%',
                                maxWidth: '500px',
                                background: 'var(--bg-dark)',
                                borderRadius: '1.5rem',
                                padding: '2.5rem',
                                zIndex: 1001,
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Set a Milestone</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X /></button>
                            </div>

                            <form onSubmit={handleCreateGoal}>
                                <div className="form-group">
                                    <label className="form-label">Goal Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. New Electric Car"
                                        value={createFormData.title}
                                        onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Target Amount (₹)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="20,00,000"
                                            value={createFormData.targetAmount}
                                            onChange={(e) => setCreateFormData({ ...createFormData, targetAmount: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Target Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={createFormData.targetDate}
                                            onChange={(e) => setCreateFormData({ ...createFormData, targetDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-input"
                                            value={createFormData.category}
                                            onChange={(e) => setCreateFormData({ ...createFormData, category: e.target.value })}
                                        >
                                            <option value="emergency_fund">Emergency Fund</option>
                                            <option value="travel">Travel</option>
                                            <option value="electronics">Electronics</option>
                                            <option value="education">Education</option>
                                            <option value="house">Real Estate</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Icon</label>
                                        <select
                                            className="form-input"
                                            value={createFormData.icon}
                                            onChange={(e) => setCreateFormData({ ...createFormData, icon: e.target.value })}
                                        >
                                            <option value="🏥">🏥 Medical</option>
                                            <option value="✈️">✈️ Travel</option>
                                            <option value="🚗">🚗 Transport</option>
                                            <option value="🏠">🏠 House</option>
                                            <option value="🎓">🎓 Education</option>
                                            <option value="💻">💻 Work</option>
                                            <option value="🌟">🌟 Life</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '3.5rem' }}>Create Goal</button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default Goals;
