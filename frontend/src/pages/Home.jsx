import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    ShieldCheck,
    PieChart,
    Target,
    Zap,
    ArrowRight,
    Star,
    CheckCircle2
} from 'lucide-react';

const Home = () => {
    const features = [
        {
            icon: <PieChart size={24} color="var(--primary)" />,
            title: "Smart Analytics",
            description: "Get deep insights into your spending patterns with AI-powered categorization and visual charts."
        },
        {
            icon: <TrendingUp size={24} color="var(--success)" />,
            title: "Investment Tracking",
            description: "Monitor your portfolio growth across stocks, mutual funds, crypto, and real estate in real-time."
        },
        {
            icon: <Target size={24} color="var(--secondary)" />,
            title: "Goal Management",
            description: "Set financial milestones and watch your progress as you build the future you deserve."
        },
        {
            icon: <ShieldCheck size={24} color="var(--warning)" />,
            title: "Bank-Grade Security",
            description: "Your data is encrypted and secure. We use industry-standard protocols to protect your wealth."
        }
    ];

    const testimonials = [
        {
            name: "Sarah Jenkins",
            role: "Small Business Owner",
            content: "FinTrack Pro completely transformed how I manage my business and personal finances. The insights are incredible.",
            rating: 5
        },
        {
            name: "David Chen",
            role: "Software Engineer",
            content: "The investment tracking feature is unparalleled. It's like having a personal wealth manager in my pocket.",
            rating: 5
        },
        {
            name: "Emily Rodriguez",
            role: "Freelancer",
            content: "Finally, a beautiful, intuitive app that actually makes tracking expenses enjoyable. Best financial tool out there.",
            rating: 5
        }
    ];

    useEffect(() => {
        document.title = 'FinTrack Pro — Home';
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-main)', overflowX: 'hidden' }}>
            {/* Navigation */}
            <nav style={{
                padding: '1.5rem 5%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(12px)',
                zIndex: 100
            }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '1.25rem',
                        color: 'white'
                    }}>F</div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
                        FinTrack<span style={{ color: 'var(--primary)' }}>Pro</span>
                    </span>
                </Link>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600, padding: '0.5rem 1rem' }}>Log In</Link>
                    <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '2rem' }}>Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                padding: '12rem 5% 8rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative'
            }}>
                {/* Background glow effects */}
                <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0) 70%)', zIndex: 0, pointerEvents: 'none' }} />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}
                >
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '2rem',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        marginBottom: '2rem'
                    }}>
                        <Zap size={16} fill="currentColor" /> FinTrack is now live
                    </div>
                    <h1 style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
                        Master your wealth.<br />
                        <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Design your future.
                        </span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        The ultimate financial command center. Track expenses, monitor investments, and achieve your goals in one beautiful, intuitive platform.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/register" className="btn btn-primary" style={{ height: '3.5rem', padding: '0 2rem', fontSize: '1.125rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Start for free <ArrowRight size={20} />
                        </Link>
                        <Link to="/login" className="btn btn-outline" style={{ height: '3.5rem', padding: '0 2rem', fontSize: '1.125rem', borderRadius: '2rem', display: 'flex', alignItems: 'center' }}>
                            View Demo
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '8rem 5%', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Everything you need to succeed</h2>
                        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)' }}>Powerful tools disguised as a beautiful, simple interface.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="card"
                                style={{ background: 'var(--bg-dark)', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1.5rem',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>{feature.title}</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section style={{ padding: '8rem 5%' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Loved by thousands</h2>
                        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)' }}>Join users who have taken control of their financial destiny.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                        {testimonials.map((test, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="card"
                                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)' }}
                            >
                                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                                    {[...Array(test.rating)].map((_, i) => (
                                        <Star key={i} size={16} fill="var(--warning)" color="var(--warning)" />
                                    ))}
                                </div>
                                <p style={{ fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '2rem', fontStyle: 'italic', lineHeight: 1.6 }}>"{test.content}"</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                        {test.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{test.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{test.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '6rem 5% 8rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{
                        maxWidth: '1000px',
                        margin: '0 auto',
                        background: 'linear-gradient(45deg, var(--primary), var(--secondary))',
                        borderRadius: '2rem',
                        padding: '4rem',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', opacity: 0.5 }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', color: 'white' }}>Ready to transform your finances?</h2>
                        <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>Join the exclusive community of smart investors and money managers today.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Link to="/register" className="btn" style={{ background: 'white', color: 'var(--primary)', height: '3.5rem', padding: '0 2.5rem', fontSize: '1.125rem', borderRadius: '2rem', fontWeight: 800, border: 'none' }}>
                                Create Free Account
                            </Link>
                        </div>
                        <ul style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem', listStyle: 'none', padding: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} /> No credit card required</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} /> 14-day Pro trial</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} /> Cancel anytime</li>
                        </ul>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '3rem 5%', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem', color: 'white' }}>F</div>
                    <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>FinTrack Pro</span>
                </div>
                <p>&copy; {new Date().getFullYear()} FinTrack Pro. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
