import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { subscriptionAPI, paymentAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
    Check,
    CreditCard,
    Crown,
    History,
    Zap,
    AlertCircle,
    Clock,
    ShieldCheck,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Subscription = () => {
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [plans, setPlans] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    useEffect(() => {
        document.title = 'Subscription — FinTrack Pro';
    }, []);

    // Load Razorpay script dynamically
    useEffect(() => {
        fetchSubscriptionData();
        
        const loadRazorpayScript = () => {
            return new Promise((resolve) => {
                if (window.Razorpay) {
                    setRazorpayLoaded(true);
                    resolve(true);
                    return;
                }
                
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.async = true;
                script.onload = () => {
                    setRazorpayLoaded(true);
                    resolve(true);
                };
                script.onerror = () => {
                    console.error('Failed to load Razorpay script');
                    resolve(false);
                };
                document.body.appendChild(script);
            });
        };
        
        loadRazorpayScript();
    }, []);

    const fetchSubscriptionData = async () => {
        try {
            const [subRes, plansRes, historyRes] = await Promise.all([
                subscriptionAPI.getMySubscription(),
                subscriptionAPI.getPlans(),
                paymentAPI.getHistory()
            ]);

            setCurrentSubscription(subRes.data.data);
            setPlans(plansRes.data.data);
            setPaymentHistory(historyRes.data.data.payments);
        } catch (error) {
            console.error('Error fetching subscription data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (plan) => {
        if (!razorpayLoaded || !window.Razorpay) {
            alert('Payment system is still loading. Please wait a moment and try again.');
            return;
        }
        
        setProcessing(true);
        try {
            console.log('Creating order for plan:', plan);
            // Create order
            const orderRes = await paymentAPI.createOrder({
                plan: 'pro',
                billingCycle: plan.billingCycle
            });
            
            console.log('Order response:', orderRes.data);

            const { orderId, amount, keyId } = orderRes.data.data;
            
            if (!orderId || !keyId) {
                throw new Error('Invalid order data received from server');
            }

            const options = {
                key: keyId,
                amount: amount,
                currency: 'INR',
                name: 'FinTrack Pro',
                description: `${plan.name} Subscription`,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        await paymentAPI.verify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        await subscriptionAPI.upgrade({
                            plan: plan.id,
                            billingCycle: plan.billingCycle,
                            paymentId: orderRes.data.data.paymentId
                        });

                        alert('Payment successful! Your Pro subscription is now active.');
                        fetchSubscriptionData();
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        alert('Payment verification failed. Please contact support if amount was deducted.');
                    }
                },
                prefill: {
                    name: currentSubscription?.user?.name || '',
                    email: currentSubscription?.user?.email || '',
                    contact: currentSubscription?.user?.phone || ''
                },
                theme: {
                    color: '#6366f1'
                },
                // Enable UPI for Google Pay, PhonePe, Paytm
                config: {
                    display: {
                        blocks: {
                            upi: {
                                name: 'Pay via UPI (Google Pay, PhonePe)',
                                instruments: [
                                    { method: 'upi' }
                                ]
                            },
                            cards: {
                                name: 'Credit/Debit Card',
                                instruments: [
                                    { method: 'card' }
                                ]
                            }
                        },
                        sequence: ['block.upi', 'block.cards'],
                        preferences: {
                            show_default_blocks: true
                        }
                    }
                },
                modal: {
                    ondismiss: function() {
                        setProcessing(false);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Upgrade error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Failed to initiate payment: ${errorMessage}`);
        } finally {
            setProcessing(false);
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
                    <Clock className="animate-pulse" size={48} />
                    <span>Syncing your benefits...</span>
                </div>
            </Layout>
        );
    }

    const isPro = currentSubscription?.plan === 'pro';

    return (
        <Layout>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Premium Services</h1>
                <p style={{ color: 'var(--text-muted)' }}>Unlock the full potential of your financial journey</p>
            </div>

            {/* Status Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{
                    marginBottom: '3rem',
                    background: isPro
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))'
                        : 'var(--bg-card)',
                    border: isPro ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--glass-border)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: isPro ? 'var(--primary)' : 'var(--bg-lighter)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isPro ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none'
                        }}>
                            {isPro ? <Crown size={32} color="white" /> : <Zap size={32} color="var(--text-muted)" />}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                                    {isPro ? 'Pro Member' : 'Standard Member'}
                                </h3>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    backgroundColor: currentSubscription?.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: currentSubscription?.status === 'active' ? 'var(--success)' : 'var(--danger)',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {currentSubscription?.status}
                                </span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {isPro
                                    ? `Your pro benefits are active until ${formatDate(currentSubscription.endDate)}`
                                    : 'You are using the limited free version of FinTrack Pro'}
                            </p>
                        </div>
                    </div>
                    {isPro && (
                        <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                            Dismiss Pro
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Pricing Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                {plans.map((plan, i) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="card"
                        style={{
                            padding: '2.5rem',
                            border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                            background: plan.popular ? 'rgba(99, 102, 241, 0.03)' : 'var(--bg-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative'
                        }}
                    >
                        {plan.popular && (
                            <div style={{
                                position: 'absolute',
                                top: '-14px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                padding: '0.35rem 1rem',
                                borderRadius: '1rem',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Best Value
                            </div>
                        )}

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: plan.popular ? 'var(--primary)' : 'var(--text-main)' }}>{plan.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 900 }}>
                                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                                </span>
                                {plan.price > 0 && (
                                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '1.125rem' }}>/{plan.billingCycle}</span>
                                )}
                            </div>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', minHeight: '3rem' }}>{plan.description}</p>
                        </div>

                        <div style={{ flex: 1, marginBottom: '2.5rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>Key Privileges</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '1rem',
                                        fontSize: '0.925rem'
                                    }}>
                                        <div style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', padding: '0.2rem' }}>
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {plan.id !== 'free' && currentSubscription?.plan !== 'pro' ? (
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', height: '3.5rem', fontWeight: 800, fontSize: '1.125rem' }}
                                onClick={() => handleUpgrade(plan)}
                                disabled={processing}
                            >
                                {processing ? 'Initiating...' : 'Get Pro Access'}
                            </button>
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '3.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.75rem',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-muted)',
                                fontWeight: 700,
                                gap: '0.5rem'
                            }}>
                                {plan.id === currentSubscription?.plan ? (
                                    <>
                                        <ShieldCheck size={18} />
                                        Current Active Plan
                                    </>
                                ) : (
                                    'Unavailable'
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Audit Log */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <History size={20} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Billing History</h3>
                </div>
                {paymentHistory.length > 0 ? (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Transaction Date</th>
                                    <th>Plan Tier</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Reference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentHistory.map(payment => (
                                    <tr key={payment._id}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{formatDate(payment.createdAt)}</td>
                                        <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{payment.plan}</td>
                                        <td style={{ fontWeight: 800 }}>{formatCurrency(payment.amount)}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.35rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                backgroundColor: payment.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: payment.status === 'paid' ? 'var(--success)' : 'var(--danger)',
                                                textTransform: 'uppercase'
                                            }}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                            {payment.razorpayPaymentId || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <AlertCircle size={48} opacity={0.1} style={{ marginBottom: '1rem' }} />
                        <p>No billing records found in your vault</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Subscription;
