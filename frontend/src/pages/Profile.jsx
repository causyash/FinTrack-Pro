import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Phone, Globe, Shield, Save, Key, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        currency: user?.currency || 'INR'
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await authAPI.updateProfile(formData);
            updateUser({ ...user, ...formData });
            setMessage('Profile updated successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await authAPI.changePassword(passwordData);
            setMessage('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = 'Profile — FinTrack Pro';
    }, []);

    return (
        <Layout>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Account Settings</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage your identity and preferences</p>
            </div>

            {message && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="alert alert-success" style={{ borderRadius: '1rem', marginBottom: '2rem' }}>{message}</motion.div>}
            {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="alert alert-error" style={{ borderRadius: '1rem', marginBottom: '2rem' }}>{error}</motion.div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {/* Profile Information */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card">
                    <div className="card-title">
                        <User size={20} color="var(--primary)" />
                        Personal Details
                    </div>
                    <form onSubmit={handleProfileUpdate}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div className="input-group">
                                <User className="input-icon" size={20} />
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-group">
                                <Shield className="input-icon" size={20} />
                                <input
                                    type="email"
                                    className="form-input"
                                    style={{ opacity: 0.6 }}
                                    value={user?.email}
                                    disabled
                                />
                            </div>
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Email cannot be changed</small>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <div className="input-group">
                                <Phone className="input-icon" size={20} />
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Base Currency</label>
                            <div className="input-group">
                                <Globe className="input-icon" size={20} />
                                <select
                                    className="form-select"
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                >
                                    <option value="INR">Indian Rupee (₹)</option>
                                    <option value="USD">US Dollar ($)</option>
                                    <option value="EUR">Euro (€)</option>
                                    <option value="GBP">British Pound (£)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', height: '3.5rem', gap: '0.75rem' }}
                            disabled={loading}
                        >
                            <Save size={18} />
                            {loading ? 'Propagating Changes...' : 'Synchronize Profile'}
                        </button>
                    </form>
                </motion.div>

                {/* Security Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card">
                        <div className="card-title">
                            <Key size={20} color="var(--warning)" />
                            Security Update
                        </div>
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    required
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                    minLength={6}
                                    placeholder="Enter new password"
                                />
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Minimum 6 characters</small>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-outline"
                                style={{ width: '100%', height: '3.5rem' }}
                                disabled={loading}
                            >
                                Update Security Key
                            </button>
                        </form>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card"
                        style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))' }}
                    >
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Wallet color="white" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800 }}>Pro Subscription</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>You are currently on the Free plan</div>
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>Upgrade to Pro</button>
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
