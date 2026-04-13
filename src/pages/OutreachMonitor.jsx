import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, AlertCircle, Play, RefreshCw, MessageSquare, Briefcase } from 'lucide-react';
import API from '../config';

const OutreachMonitor = () => {
    const [token] = useState(() => sessionStorage.getItem('adminToken') || '');
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchQueue();
    }, [token]);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/sequences/queue`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setQueue(data || []);
        } catch (err) {
            console.error('Failed to fetch queue', err);
        }
        setLoading(false);
    };

    const triggerScheduler = async () => {
        setProcessing(true);
        try {
            const res = await fetch(`${API}/api/sequences/run`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                alert('Sequence engine triggered! Check back in 10s.');
                setTimeout(fetchQueue, 5000);
            }
        } catch (err) {
            alert('Trigger failed: ' + err.message);
        }
        setProcessing(false);
    };

    return (
        <div className="admin-page">
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1><Activity size={28} color="var(--primary)" /> Outreach <span className="text-gradient">Monitor</span></h1>
                    <p className="text-muted">Real-time status of your automated sequences and upcoming drip tasks.</p>
                </div>
                <button className="btn-primary" onClick={triggerScheduler} disabled={processing}>
                    <RefreshCw size={18} className={processing ? 'spin' : ''} /> {processing ? 'Processing...' : 'Run Scheduler Now'}
                </button>
            </div>

            <div className="admin-card glass-panel leads-table-wrapper">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Upcoming Dispatch Queue</h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Showing {queue.length} pending tasks
                    </div>
                </div>

                {loading ? (
                    <div className="text-center" style={{ padding: '4rem' }}>Loading Queue Intelligence...</div>
                ) : queue.length === 0 ? (
                    <div className="text-center" style={{ padding: '4rem', opacity: 0.5 }}>
                        <CheckCircle size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                        <p>All clear! No pending tasks in the current queue.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="leads-table">
                            <thead>
                                <tr>
                                    <th>Recipient Business</th>
                                    <th>Campaign</th>
                                    <th>Message Preview</th>
                                    <th>Scheduled For</th>
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
                                                fontSize: '0.8rem', 
                                                color: 'rgba(255,255,255,0.8)', 
                                                background: 'rgba(0,0,0,0.2)', 
                                                padding: '8px', 
                                                borderRadius: '6px',
                                                borderLeft: '2px solid var(--primary)',
                                                whiteSpace: 'normal',
                                                lineHeight: '1.4'
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
                                            <span className="hot-badge" style={{ 
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
                    </div>
                )}
            </div>
            
            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="admin-card glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Active Sequences</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{queue.length} <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>Drips Active</span></div>
                </div>
                <div className="admin-card glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>AI Personalization</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Active <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Gemini v1.5</span></div>
                </div>
                <div className="admin-card glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Intelligence Score</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>98% <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Human Fluidity</span></div>
                </div>
            </div>
        </div>
    );
};

export default OutreachMonitor;
