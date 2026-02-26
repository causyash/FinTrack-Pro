import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ArrowLeftRight,
    TrendingUp,
    Target,
    CreditCard,
    User,
    LogOut,
    Menu,
    X,
    ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
        { name: 'Investments', path: '/investments', icon: TrendingUp },
        { name: 'Goals', path: '/goals', icon: Target },
        { name: 'Subscription', path: '/subscription', icon: CreditCard },
        { name: 'Profile', path: '/profile', icon: User },
    ];

    if (isAdmin) {
        menuItems.push({ name: 'Admin Panel', path: '/admin', icon: ShieldCheck });
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-layout" style={{ display: 'flex' }}>
            {/* Sidebar - Desktop */}
            <aside className="sidebar">
                <Link to="/" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '1.25rem'
                    }}>F</div>
                    <span className="nav-text" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
                        FinTrack<span style={{ color: 'var(--primary)' }}>Pro</span>
                    </span>
                </Link>

                <nav style={{ flex: 1, padding: '0 1rem' }}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                    background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    marginBottom: '0.5rem',
                                    transition: 'all 0.2s',
                                    border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent'
                                }}
                            >
                                <Icon size={20} color={isActive ? 'var(--primary)' : 'currentColor'} />
                                <span className="nav-text" style={{ fontWeight: isActive ? 600 : 500 }}>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '1rem',
                        marginBottom: '1rem'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: 'white'
                        }}>
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="nav-text" style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: 'rgba(239, 68, 68, 0.05)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                    >
                        <LogOut size={18} />
                        <span className="nav-text">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                {/* Mobile Header */}
                <header style={{
                    display: 'none',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem'
                }} className="mobile-header">
                    <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 800, textDecoration: 'none', color: 'inherit' }}>FinTrackPro</Link>
                    <button onClick={() => setMobileMenuOpen(true)}>
                        <Menu />
                    </button>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {children}
                </motion.div>
            </main>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.95)',
                            zIndex: 100,
                            padding: '2rem'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                            <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'white' }}>
                                <X size={32} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'white', fontWeight: 600 }}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '1.5rem', textAlign: 'left', padding: 0 }}>
                                Logout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
        }
      `}} />
        </div>
    );
};

export default Layout;
