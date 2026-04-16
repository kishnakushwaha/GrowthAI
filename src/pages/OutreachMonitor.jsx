import React, { useState, useEffect } from 'react';
import { 
  Activity, Clock, CheckCircle, AlertCircle, Play, RefreshCw, MessageSquare, 
  Briefcase, Send, Reply, TrendingUp, AlertTriangle, BarChart3, Zap, XCircle
} from 'lucide-react';
import API from '../config';

const OutreachMonitor = () => {
    const [token] = useState(() => sessionStorage.getItem('adminToken') || '');
    const [queue, setQueue] = useState([]);
    const [perf, setPerf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        fetchAll();
    }, [token]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [queueRes, perfRes] = await Promise.all([
                fetch(`${API}/api/sequences/queue`, { headers }),
                fetch(`${API}/api/sequences/performance`, { headers })
            ]);
            setQueue(await queueRes.json() || []);
            setPerf(await perfRes.json());
        } catch (err) {
            console.error('Failed to fetch data', err);
        }
        setLoading(false);
    };

    const triggerScheduler = async () => {
        setProcessing(true);
        try {
            const res = await fetch(`${API}/api/sequences/run`, { method: 'POST', headers });
            const data = await res.json();
            if (data.success) {
                setTimeout(fetchAll, 5000);
            }
        } catch (err) { console.error(err); }
        setProcessing(false);
    };

    if (loading) return (
        <div className="admin-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', opacity: 0.6 }}>
                <Activity size={48} className="spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
                <p>Loading Outreach Intelligence...</p>
            </div>
        </div>
    );

    const o = perf?.overview || {};
    const maxDaily = Math.max(...(perf?.dailyVolume || []).map(d => d.count), 1);

    return (
        <div className="admin-page">
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1><Activity size={28} color="var(--primary)" /> Outreach <span className="text-gradient">Performance</span></h1>
                    <p className="text-muted">Real-time analytics for your automated outreach pipeline.</p>
                </div>
                <button className="btn btn-primary" onClick={triggerScheduler} disabled={processing} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={18} className={processing ? 'spin' : ''} /> {processing ? 'Processing...' : 'Run Scheduler Now'}
                </button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center' }}>
                    <Send size={22} color="#6366f1" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{o.total_sent || 0}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Messages Sent</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center' }}>
                    <Clock size={22} color="#f59e0b" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{o.total_pending || 0}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Pending</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center' }}>
                    <Reply size={22} color="#22c55e" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{o.replied || 0}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Replies Received</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center' }}>
                    <TrendingUp size={22} color="#0ea5e9" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0ea5e9' }}>{o.reply_rate || 0}%</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Reply Rate</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center' }}>
                    <Zap size={22} color="#a855f7" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{o.active_sequences || 0}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Active Sequences</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center' }}>
                    <XCircle size={22} color="#ef4444" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: o.total_failed > 0 ? '#ef4444' : 'inherit' }}>{o.total_failed || 0}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Failed</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                {[
                    { id: 'overview', label: 'Daily Volume', icon: <BarChart3 size={16} /> },
                    { id: 'campaigns', label: 'Campaign Stats', icon: <Briefcase size={16} /> },
                    { id: 'queue', label: `Queue (${queue.length})`, icon: <Clock size={16} /> },
                    { id: 'health', label: 'AI Health', icon: <AlertTriangle size={16} /> }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: activeTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                            fontWeight: activeTab === tab.id ? '600' : '400',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>📊 Daily Send Volume (Last 7 Days)</h3>
                    {(perf?.dailyVolume || []).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                            <BarChart3 size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                            <p>No sends in the last 7 days. Run the scheduler to start!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px', padding: '1rem 0' }}>
                            {(perf?.dailyVolume || []).map((d, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{d.count}</span>
                                    <div style={{
                                        width: '100%', maxWidth: '60px',
                                        height: `${(d.count / maxDaily) * 160}px`,
                                        background: 'linear-gradient(to top, var(--primary), #8b5cf6)',
                                        borderRadius: '6px 6px 0 0',
                                        minHeight: '8px',
                                        transition: 'height 0.5s ease'
                                    }} />
                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{d.day}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'campaigns' && (
                <div className="glass-panel leads-table-wrapper" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>🎯 Campaign Breakdown</h3>
                    {(perf?.campaignBreakdown || []).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                            <Briefcase size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                            <p>No campaigns created yet.</p>
                        </div>
                    ) : (
                        <table className="leads-table">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Total Enrolled</th>
                                    <th>Active</th>
                                    <th>Replied</th>
                                    <th>Completed</th>
                                    <th>Reply Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(perf?.campaignBreakdown || []).map((c, i) => (
                                    <tr key={i}>
                                        <td className="name-cell"><span className="lead-name">{c.name}</span></td>
                                        <td>{c.total}</td>
                                        <td><span style={{ color: '#22c55e' }}>{c.active || 0}</span></td>
                                        <td><span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{c.replied || 0}</span></td>
                                        <td>{c.completed || 0}</td>
                                        <td>
                                            <span style={{ 
                                                fontWeight: 'bold',
                                                color: c.total > 0 && (c.replied / c.total * 100) >= 5 ? '#22c55e' : '#f59e0b'
                                            }}>
                                                {c.total > 0 ? ((c.replied || 0) / c.total * 100).toFixed(1) : 0}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === 'queue' && (
                <div className="glass-panel leads-table-wrapper" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h3>⏳ Upcoming Dispatch Queue</h3>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>{queue.length} pending</div>
                    </div>
                    {queue.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                            <CheckCircle size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                            <p>All clear! No pending tasks.</p>
                        </div>
                    ) : (
                        <table className="leads-table">
                            <thead>
                                <tr>
                                    <th>Business</th>
                                    <th>Campaign</th>
                                    <th>Message Preview</th>
                                    <th>Scheduled</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queue.map(task => (
                                    <tr key={task.id}>
                                        <td className="name-cell">
                                            <span className="lead-name">{task.businesses?.place_name}</span>
                                            <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block' }}>{task.businesses?.phone}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Briefcase size={14} className="text-muted" />
                                                <span style={{ fontSize: '0.9rem' }}>{task.campaigns?.name || 'Manual'}</span>
                                            </div>
                                        </td>
                                        <td style={{ width: '40%' }}>
                                            <div style={{ 
                                                fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', 
                                                background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px',
                                                borderLeft: '2px solid var(--primary)', whiteSpace: 'normal', lineHeight: '1.4'
                                            }}>
                                                <MessageSquare size={12} style={{ marginBottom: '4px', opacity: 0.5 }} /> {task.message_body}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                                <Clock size={14} className="text-muted" />
                                                {new Date(task.scheduled_for).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ 
                                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                                                background: task.status === 'pending' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                                color: task.status === 'pending' ? '#facc15' : '#4ade80'
                                            }}>
                                                {task.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === 'health' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>🤖 AI Engine Health</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                            <div style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: '600' }}>Gemini Model</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px' }}>gemini-1.5-flash ✅</div>
                        </div>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                            <div style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: '600' }}>Scheduler</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px' }}>9:00 AM + 3:00 PM IST</div>
                        </div>
                    </div>

                    <h4 style={{ marginBottom: '0.5rem' }}>Recent AI Failures</h4>
                    {(perf?.recentFailures || []).length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                            <CheckCircle size={32} style={{ margin: '0 auto 0.5rem', display: 'block', color: '#22c55e' }} />
                            <p>No failures — AI engine running smooth! 🟢</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(perf?.recentFailures || []).map((f, i) => (
                                <div key={i} style={{ 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '6px',
                                    borderLeft: '2px solid #ef4444', fontSize: '0.85rem'
                                }}>
                                    <span><AlertCircle size={14} style={{ marginRight: '6px' }} />{f.reason}</span>
                                    <span className="text-muted">{new Date(f.created_at).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OutreachMonitor;
