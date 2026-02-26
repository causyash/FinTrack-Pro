import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
    Users,
    ShieldAlert,
    CreditCard,
    Activity,
    UserCheck,
    UserX,
    TrendingUp,
    ArrowRight,
    BarChart4,
    LayoutDashboard,
    ShieldCheck,
    Search,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        document.title = 'Admin Panel — FinTrack Pro';
    }, []);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                adminAPI.getStats(),
                adminAPI.getUsers({ limit: 50 })
            ]);

            setStats(statsRes.data.data);
            setUsers(usersRes.data.data.users);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async (userId) => {
        try {
            await adminAPI.toggleUserBlock(userId);
            fetchAdminData();
        } catch (error) {
            console.error('Error toggling user block:', error);
        }
    };

    if (loading) {
        return <Layout><div className="loading" style={{ color: 'var(--primary)' }}><ShieldAlert className="animate-pulse" /> <span>Secure Admin Gateway...</span></div></Layout>;
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Admin Command Center</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Global system oversight and user management</p>
                </div>
                <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '0.9rem', border: '1px solid var(--glass-border)' }}>
                    {['overview', 'users', 'finance'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '0.6rem 1.25rem',
                                border: 'none',
                                borderRadius: '0.6rem',
                                background: activeTab === tab ? 'var(--primary)' : 'transparent',
                                cursor: 'pointer',
                                color: activeTab === tab ? 'white' : 'var(--text-muted)',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && stats && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                    >
                        {/* Stats Matrix */}
                        <div className="stats-grid" style={{ marginBottom: '3rem' }}>
                            <div className="card stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div className="stat-label">Total Population</div>
                                    <Users size={20} opacity={0.3} />
                                </div>
                                <div className="stat-value">{stats.users.total}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem' }}>
                                    <TrendingUp size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                    {stats.users.active} Active accounts
                                </div>
                            </div>
                            <div className="card stat-card" style={{ borderTop: '3px solid var(--secondary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div className="stat-label">Pro Subscribers</div>
                                    <ShieldCheck size={20} opacity={0.3} />
                                </div>
                                <div className="stat-value">{stats.subscriptions.pro}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    {stats.subscriptions.proPercentage}% Conversion rate
                                </div>
                            </div>
                            <div className="card stat-card" style={{ borderTop: '3px solid var(--success)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div className="stat-label">Net Sales Volume</div>
                                    <CreditCard size={20} opacity={0.3} />
                                </div>
                                <div className="stat-value">{formatCurrency(stats.revenue.total)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    Across {stats.revenue.totalPayments} transactions
                                </div>
                            </div>
                        </div>

                        {/* Sub-panels */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                            <div className="card" style={{ padding: 0 }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontWeight: 800 }}>New Onboarding</h3>
                                    <ArrowRight size={18} color="var(--primary)" />
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    {stats.recentActivity.users.map(user => (
                                        <div key={user._id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '0.75rem',
                                            marginBottom: '0.75rem'
                                        }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white' }}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>{user.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatDate(user.createdAt)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="card" style={{ padding: 0 }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontWeight: 800 }}>Global Revenue Flow</h3>
                                    <Activity size={18} color="var(--success)" />
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    {stats.recentActivity.payments.map(payment => (
                                        <div key={payment._id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '0.75rem',
                                            marginBottom: '0.75rem'
                                        }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <TrendingUp size={20} color="var(--success)" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800 }}>{formatCurrency(payment.amount)}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{payment.user?.name || 'Anonymous'}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatDate(payment.createdAt)}</div>
                                                <div style={{ fontSize: '0.5rem', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase' }}>SECURE</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="card" style={{ padding: 0 }}>
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontWeight: 800 }}>Inhabitant Registry</h3>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or UID..."
                                        className="form-input"
                                        style={{ paddingLeft: '2.5rem', borderRadius: '2rem', height: '2.5rem', minWidth: '300px' }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Identity</th>
                                            <th>Access Tier</th>
                                            <th>Status Code</th>
                                            <th>Registration</th>
                                            <th style={{ textAlign: 'right' }}>Directives</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user._id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-lighter)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>{user.name.charAt(0)}</div>
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>{user.name}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '0.35rem 0.75rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        backgroundColor: user.subscription?.plan === 'pro' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)',
                                                        color: user.subscription?.plan === 'pro' ? 'var(--primary)' : 'var(--text-muted)',
                                                        textTransform: 'uppercase',
                                                        border: user.subscription?.plan === 'pro' ? '1px solid var(--primary)' : '1px solid transparent'
                                                    }}>
                                                        {user.subscription?.plan || 'free'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.isActive ? 'var(--success)' : 'var(--danger)' }} />
                                                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.isActive ? 'ACTIVE' : 'LOCKED'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{formatDate(user.createdAt)}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        className="btn"
                                                        style={{
                                                            background: user.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                            color: user.isActive ? 'var(--danger)' : 'var(--success)',
                                                            padding: '0.5rem 1rem',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 800,
                                                            border: 'none',
                                                            borderRadius: '0.5rem'
                                                        }}
                                                        onClick={() => handleToggleBlock(user._id)}
                                                    >
                                                        {user.isActive ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><UserX size={14} /> RESTRICT</div> : <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><UserCheck size={14} /> RESTORE</div>}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'finance' && stats && (
                    <motion.div
                        key="finance"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="card"
                    >
                        <div className="card-title"><BarChart4 size={20} color="var(--primary)" /> Treasury Overview</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                            <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <div className="stat-label">Gross Revenue</div>
                                <div className="stat-value">{formatCurrency(stats.revenue.total)}</div>
                            </div>
                            <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <div className="stat-label">Processed Payments</div>
                                <div className="stat-value">{stats.revenue.totalPayments}</div>
                            </div>
                            <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <div className="stat-label">Unit Economic (Avg)</div>
                                <div className="stat-value">{formatCurrency(stats.revenue.averageOrderValue)}</div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.01)', borderRadius: '1rem', border: '1px dashed var(--glass-border)' }}>
                            <Activity size={48} color="var(--primary)" opacity={0.3} style={{ marginBottom: '1rem' }} />
                            <h4 style={{ margin: 0 }}>Advanced Analytics Coming Soon</h4>
                            <p style={{ color: 'var(--text-muted)' }}>Integrating real-time financial trajectory mapping and automated fraud detection vectors.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default AdminPanel;
