import React, { useState, useEffect, useCallback } from 'react';
import {
  Target, Users, Plus, Search, Filter, Download, Upload, ChevronRight,
  ArrowRight, Phone, Mail, Globe, MapPin, Star, Calendar, Clock,
  Edit3, Trash2, X, Check, Loader2, MessageSquare, BarChart3,
  AlertCircle, TrendingUp, DollarSign, Activity, Eye
} from 'lucide-react';
import './CrmPipeline.css';

import API from '../config';

const STAGES = [
  { id: 'new', label: 'New Lead', color: '#6366f1', icon: '🆕' },
  { id: 'contacted', label: 'Contacted', color: '#f59e0b', icon: '📞' },
  { id: 'audit_sent', label: 'Audit Sent', color: '#8b5cf6', icon: '📋' },
  { id: 'call_scheduled', label: 'Call Booked', color: '#0ea5e9', icon: '📅' },
  { id: 'proposal_sent', label: 'Proposal', color: '#ec4899', icon: '📄' },
  { id: 'won', label: 'Won ✅', color: '#22c55e', icon: '🏆' },
  { id: 'lost', label: 'Lost', color: '#ef4444', icon: '❌' }
];

const PRIORITIES = [
  { id: 'high', label: 'High', color: '#ef4444' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'low', label: 'Low', color: '#6b7280' }
];

const ACTIVITY_TYPES = [
  { id: 'call', label: 'Phone Call', icon: '📞' },
  { id: 'email', label: 'Email Sent', icon: '📧' },
  { id: 'meeting', label: 'Meeting', icon: '🤝' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'note', label: 'Note', icon: '📝' },
  { id: 'followup', label: 'Follow-up', icon: '🔄' }
];

const CrmPipeline = () => {
  const [token] = useState(() => sessionStorage.getItem('adminToken') || '');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban'); // kanban | list | analytics
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Modals
  const [showAddLead, setShowAddLead] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [detailLead, setDetailLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // New lead form
  const [newLead, setNewLead] = useState({
    business_name: '', contact_name: '', email: '', phone: '',
    website: '', address: '', industry: '', priority: 'medium',
    deal_value: 0, notes: '', next_followup: ''
  });

  // New activity
  const [newActivity, setNewActivity] = useState({ type: 'note', title: '', description: '' });

  // Importing
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStage) params.append('stage', filterStage);
      if (filterPriority) params.append('priority', filterPriority);

      const res = await fetch(`${API}/api/crm/leads?${params}`, { headers });
      const data = await res.json();
      setLeads(data.leads || []);
      setStats(data.stats || {});
    } catch (err) {
      console.error('Failed to fetch CRM leads', err);
    }
    setLoading(false);
  }, [token, search, filterStage, filterPriority]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API}/api/crm/analytics`, { headers });
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  // Create lead
  const handleCreateLead = async () => {
    if (!newLead.business_name) return;
    try {
      await fetch(`${API}/api/crm/leads`, {
        method: 'POST', headers, body: JSON.stringify(newLead)
      });
      setShowAddLead(false);
      setNewLead({
        business_name: '', contact_name: '', email: '', phone: '',
        website: '', address: '', industry: '', priority: 'medium',
        deal_value: 0, notes: '', next_followup: ''
      });
      fetchLeads();
    } catch (err) { console.error('Create lead failed', err); }
  };

  // Update lead stage (kanban drag)
  const moveToStage = async (leadId, newStage) => {
    try {
      await fetch(`${API}/api/crm/leads/${leadId}/stage`, {
        method: 'PATCH', headers, body: JSON.stringify({ stage: newStage })
      });
      fetchLeads();
    } catch (err) { console.error('Stage update failed', err); }
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editLead) return;
    try {
      await fetch(`${API}/api/crm/leads/${editLead.id}`, {
        method: 'PUT', headers, body: JSON.stringify(editLead)
      });
      setEditLead(null);
      fetchLeads();
    } catch (err) { console.error('Update failed', err); }
  };

  // Delete lead
  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await fetch(`${API}/api/crm/leads/${id}`, { method: 'DELETE', headers });
      setDetailLead(null);
      fetchLeads();
    } catch (err) { console.error('Delete failed', err); }
  };

  // View lead detail + activities
  const openDetail = async (lead) => {
    setDetailLead(lead);
    try {
      const res = await fetch(`${API}/api/crm/leads/${lead.id}/activities`, { headers });
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err) { console.error('Fetch activities failed', err); }
  };

  // Add activity
  const handleAddActivity = async () => {
    if (!newActivity.title || !detailLead) return;
    try {
      await fetch(`${API}/api/crm/leads/${detailLead.id}/activities`, {
        method: 'POST', headers, body: JSON.stringify(newActivity)
      });
      setNewActivity({ type: 'note', title: '', description: '' });
      openDetail(detailLead);
    } catch (err) { console.error('Add activity failed', err); }
  };

  // Import from scraper
  const handleImport = async () => {
    setImporting(true);
    setImportResult('');
    try {
      const res = await fetch(`${API}/api/crm/import`, { method: 'POST', headers });
      const data = await res.json();
      setImportResult(data.message || `${data.imported} leads imported`);
      fetchLeads();
    } catch (err) { setImportResult('Import failed: ' + err.message); }
    setImporting(false);
  };

  // Export CSV
  const exportCSV = () => {
    const csvHeaders = ['Business Name', 'Contact', 'Email', 'Phone', 'Stage', 'Priority', 'Deal Value', 'Industry', 'Notes'];
    const csvRows = leads.map(l => [
      l.business_name, l.contact_name, l.email, l.phone,
      l.stage, l.priority, l.deal_value, l.industry, l.notes
    ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));

    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `crm_pipeline_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Group leads by stage for kanban
  const groupedLeads = {};
  STAGES.forEach(s => { groupedLeads[s.id] = leads.filter(l => l.stage === s.id); });

  if (loading && leads.length === 0) {
    return <div className="email-loading"><Loader2 size={32} className="spin" /> Loading CRM Pipeline...</div>;
  }

  return (
    <div className="leads-container crm-container">
      {/* Header */}
      <div className="leads-header">
        <div>
          <h1>Sales <span className="text-gradient">Pipeline</span></h1>
          <p className="text-muted">Track leads from discovery to deal closed</p>
        </div>
        <div className="leads-header-actions">
          <button className="btn btn-secondary" onClick={handleImport} disabled={importing}>
            <Upload size={16} /> {importing ? 'Importing...' : 'Import from Scraper'}
          </button>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddLead(true)}>
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {importResult && (
        <div className="send-result success" style={{ marginBottom: '1rem' }}>
          ✅ {importResult}
        </div>
      )}

      {/* Stats Bar */}
      <div className="crm-stats-bar">
        <div className="crm-stat">
          <Users size={18} color="var(--primary)" />
          <span className="crm-stat-num">{stats.total || 0}</span>
          <span className="crm-stat-label">Total</span>
        </div>
        <div className="crm-stat">
          <TrendingUp size={18} color="#22c55e" />
          <span className="crm-stat-num">₹{((stats.pipeline_value || 0) / 1000).toFixed(0)}K</span>
          <span className="crm-stat-label">Pipeline</span>
        </div>
        <div className="crm-stat">
          <DollarSign size={18} color="#f59e0b" />
          <span className="crm-stat-num">₹{((stats.total_revenue || 0) / 1000).toFixed(0)}K</span>
          <span className="crm-stat-label">Revenue</span>
        </div>
        <div className="crm-stat">
          <Target size={18} color="#22c55e" />
          <span className="crm-stat-num">{stats.won_count || 0}</span>
          <span className="crm-stat-label">Won</span>
        </div>
        <div className="crm-stat">
          <AlertCircle size={18} color="#ef4444" />
          <span className="crm-stat-num">{stats.overdue_followups || 0}</span>
          <span className="crm-stat-label">Overdue</span>
        </div>
      </div>

      {/* View Toggle + Search */}
      <div className="crm-toolbar">
        <div className="crm-view-toggle">
          <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}>
            <Target size={14} /> Kanban
          </button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            <Users size={14} /> List
          </button>
          <button className={view === 'analytics' ? 'active' : ''} onClick={() => { setView('analytics'); fetchAnalytics(); }}>
            <BarChart3 size={14} /> Analytics
          </button>
        </div>
        <div className="crm-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="crm-select" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option value="">All Stages</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
          </select>
          <select className="crm-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priority</option>
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div className="kanban-board">
          {STAGES.filter(s => s.id !== 'lost').map(stage => (
            <div key={stage.id} className="kanban-column">
              <div className="kanban-column-header" style={{ borderTopColor: stage.color }}>
                <span>{stage.icon} {stage.label}</span>
                <span className="kanban-count" style={{ background: stage.color + '20', color: stage.color }}>
                  {groupedLeads[stage.id]?.length || 0}
                </span>
              </div>
              <div className="kanban-cards">
                {(groupedLeads[stage.id] || []).map(lead => (
                  <div key={lead.id} className="kanban-card" onClick={() => openDetail(lead)}>
                    <div className="kanban-card-header">
                      <span className="kanban-card-name">{lead.business_name}</span>
                      <span className={`priority-dot priority-${lead.priority}`} title={lead.priority}></span>
                    </div>
                    {lead.contact_name && <div className="kanban-card-contact">{lead.contact_name}</div>}
                    <div className="kanban-card-meta">
                      {lead.phone && <span><Phone size={11} /> {lead.phone}</span>}
                      {lead.industry && <span className="kanban-tag">{lead.industry}</span>}
                    </div>
                    {lead.deal_value > 0 && (
                      <div className="kanban-card-value">₹{lead.deal_value.toLocaleString()}</div>
                    )}
                    {lead.next_followup && (
                      <div className={`kanban-card-followup ${new Date(lead.next_followup) < new Date() ? 'overdue' : ''}`}>
                        <Calendar size={11} /> {new Date(lead.next_followup).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    )}
                    {/* Stage move buttons */}
                    <div className="kanban-card-actions">
                      {STAGES.filter(s => s.id !== lead.stage && s.id !== 'lost').map(s => (
                        <button key={s.id} className="stage-move-btn" title={`Move to ${s.label}`}
                          style={{ borderColor: s.color + '40' }}
                          onClick={(e) => { e.stopPropagation(); moveToStage(lead.id, s.id); }}>
                          {s.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {(groupedLeads[stage.id] || []).length === 0 && (
                  <div className="kanban-empty">No leads</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="leads-table-wrapper glass-panel">
          {leads.length === 0 ? (
            <div className="table-empty">
              <Users size={48} color="var(--text-muted)" />
              <p>No leads in pipeline. Add manually or import from scraper!</p>
            </div>
          ) : (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Contact</th>
                  <th>Stage</th>
                  <th>Priority</th>
                  <th>Deal Value</th>
                  <th>Follow-up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} onClick={() => openDetail(lead)} style={{ cursor: 'pointer' }}>
                    <td className="name-cell">
                      <span className="lead-name">{lead.business_name}</span>
                      {lead.industry && <span className="lead-industry text-muted">{lead.industry}</span>}
                    </td>
                    <td>
                      <div>{lead.contact_name || '—'}</div>
                      {lead.email && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{lead.email}</div>}
                    </td>
                    <td>
                      <span className="stage-badge" style={{ background: STAGES.find(s => s.id === lead.stage)?.color + '15', color: STAGES.find(s => s.id === lead.stage)?.color }}>
                        {STAGES.find(s => s.id === lead.stage)?.icon} {STAGES.find(s => s.id === lead.stage)?.label}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${lead.priority}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {lead.deal_value > 0 ? `₹${lead.deal_value.toLocaleString()}` : '—'}
                    </td>
                    <td>
                      {lead.next_followup ? (
                        <span className={new Date(lead.next_followup) < new Date() ? 'text-danger' : 'text-muted'} style={{ fontSize: '0.8rem' }}>
                          {new Date(lead.next_followup) < new Date() ? '⚠️ ' : ''}
                          {new Date(lead.next_followup).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setEditLead({ ...lead }); }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-icon btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {view === 'analytics' && analytics && (
        <div className="crm-analytics">
          <div className="analytics-grid">
            <div className="glass-panel analytics-card">
              <h4>📊 Pipeline Stages</h4>
              <div className="analytics-bars">
                {(analytics.conversionByStage || []).map(s => {
                  const stage = STAGES.find(st => st.id === s.stage);
                  const maxCount = Math.max(...(analytics.conversionByStage || []).map(x => x.count), 1);
                  return (
                    <div key={s.stage} className="analytics-bar-row">
                      <span className="bar-label">{stage?.icon} {stage?.label || s.stage}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(s.count / maxCount) * 100}%`, background: stage?.color }}></div>
                      </div>
                      <span className="bar-value">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel analytics-card">
              <h4>🏭 By Industry</h4>
              <div className="analytics-bars">
                {(analytics.byIndustry || []).map(i => (
                  <div key={i.industry} className="analytics-bar-row">
                    <span className="bar-label">{i.industry}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(i.count / Math.max(...(analytics.byIndustry || []).map(x => x.count), 1)) * 100}%`, background: '#6366f1' }}></div>
                    </div>
                    <span className="bar-value">{i.count} ({i.won} won)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel analytics-card">
              <h4>📡 Lead Sources</h4>
              <div className="source-chips">
                {(analytics.bySource || []).map(s => (
                  <div key={s.source} className="source-chip">
                    <span className="source-name">{s.source || 'Unknown'}</span>
                    <span className="source-count">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel analytics-card">
              <h4>⚠️ Overdue Follow-ups</h4>
              {(analytics.overdueLeads || []).length === 0 ? (
                <p className="text-muted">No overdue follow-ups! 🎉</p>
              ) : (
                <div className="overdue-list">
                  {(analytics.overdueLeads || []).map(l => (
                    <div key={l.id} className="overdue-item" onClick={() => openDetail(l)}>
                      <span>{l.business_name}</span>
                      <span className="text-danger" style={{ fontSize: '0.75rem' }}>
                        {new Date(l.next_followup).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
            <h4>🕐 Recent Activity</h4>
            <div className="activity-timeline">
              {(analytics.recentActivities || []).map(a => (
                <div key={a.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <strong>{a.business_name}</strong> — {a.title}
                    {a.description && <p className="text-muted" style={{ fontSize: '0.75rem', margin: '2px 0 0' }}>{a.description}</p>}
                  </div>
                  <span className="timeline-time text-muted">
                    {new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddLead && (
        <div className="modal-overlay" onClick={() => setShowAddLead(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Add New Lead</h3>
              <button onClick={() => setShowAddLead(false)}><X size={20} color="var(--text-muted)" /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Business Name *</label>
                  <input className="admin-input" value={newLead.business_name} onChange={e => setNewLead({ ...newLead, business_name: e.target.value })} placeholder="e.g. Singh Academy" />
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input className="admin-input" value={newLead.contact_name} onChange={e => setNewLead({ ...newLead, contact_name: e.target.value })} placeholder="e.g. Raj Singh" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="admin-input" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="admin-input" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input className="admin-input" value={newLead.website} onChange={e => setNewLead({ ...newLead, website: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <input className="admin-input" value={newLead.industry} onChange={e => setNewLead({ ...newLead, industry: e.target.value })} placeholder="e.g. Coaching" />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="admin-input" value={newLead.priority} onChange={e => setNewLead({ ...newLead, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Deal Value (₹)</label>
                  <input type="number" className="admin-input" value={newLead.deal_value} onChange={e => setNewLead({ ...newLead, deal_value: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <textarea className="admin-input" rows={3} value={newLead.notes} onChange={e => setNewLead({ ...newLead, notes: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Next Follow-up</label>
                  <input type="date" className="admin-input" value={newLead.next_followup} onChange={e => setNewLead({ ...newLead, next_followup: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddLead(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateLead} disabled={!newLead.business_name}>
                <Plus size={16} /> Add to Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LEAD MODAL */}
      {editLead && (
        <div className="modal-overlay" onClick={() => setEditLead(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Lead</h3>
              <button onClick={() => setEditLead(null)}><X size={20} color="var(--text-muted)" /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Business Name *</label>
                  <input className="admin-input" value={editLead.business_name} onChange={e => setEditLead({ ...editLead, business_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input className="admin-input" value={editLead.contact_name} onChange={e => setEditLead({ ...editLead, contact_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="admin-input" value={editLead.email} onChange={e => setEditLead({ ...editLead, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="admin-input" value={editLead.phone} onChange={e => setEditLead({ ...editLead, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Stage</label>
                  <select className="admin-input" value={editLead.stage} onChange={e => setEditLead({ ...editLead, stage: e.target.value })}>
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="admin-input" value={editLead.priority} onChange={e => setEditLead({ ...editLead, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Deal Value (₹)</label>
                  <input type="number" className="admin-input" value={editLead.deal_value} onChange={e => setEditLead({ ...editLead, deal_value: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label>Next Follow-up</label>
                  <input type="date" className="admin-input" value={editLead.next_followup || ''} onChange={e => setEditLead({ ...editLead, next_followup: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <textarea className="admin-input" rows={3} value={editLead.notes} onChange={e => setEditLead({ ...editLead, notes: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditLead(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}><Check size={16} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD DETAIL DRAWER */}
      {detailLead && (
        <div className="modal-overlay" onClick={() => setDetailLead(null)}>
          <div className="detail-drawer glass-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <h3>{detailLead.business_name}</h3>
                <span className="stage-badge" style={{ background: STAGES.find(s => s.id === detailLead.stage)?.color + '15', color: STAGES.find(s => s.id === detailLead.stage)?.color }}>
                  {STAGES.find(s => s.id === detailLead.stage)?.icon} {STAGES.find(s => s.id === detailLead.stage)?.label}
                </span>
              </div>
              <div className="detail-actions">
                <button className="btn btn-secondary" onClick={() => { setEditLead({ ...detailLead }); setDetailLead(null); }}>
                  <Edit3 size={14} /> Edit
                </button>
                <button onClick={() => setDetailLead(null)}><X size={20} color="var(--text-muted)" /></button>
              </div>
            </div>

            <div className="detail-info">
              {detailLead.contact_name && <div className="detail-row"><Users size={14} /> {detailLead.contact_name}</div>}
              {detailLead.email && <div className="detail-row"><Mail size={14} /> {detailLead.email}</div>}
              {detailLead.phone && <div className="detail-row"><Phone size={14} /> {detailLead.phone}</div>}
              {detailLead.website && <div className="detail-row"><Globe size={14} /> <a href={detailLead.website.startsWith('http') ? detailLead.website : `https://${detailLead.website}`} target="_blank" rel="noreferrer">{detailLead.website}</a></div>}
              {detailLead.address && <div className="detail-row"><MapPin size={14} /> {detailLead.address}</div>}
              {detailLead.deal_value > 0 && <div className="detail-row"><DollarSign size={14} /> ₹{detailLead.deal_value.toLocaleString()}</div>}
              {detailLead.notes && <div className="detail-notes">{detailLead.notes}</div>}
            </div>

            {/* Quick Stage Move */}
            <div className="detail-stage-bar">
              <label>Move to:</label>
              <div className="stage-buttons">
                {STAGES.filter(s => s.id !== detailLead.stage).map(s => (
                  <button key={s.id} className="stage-move-btn" style={{ borderColor: s.color + '40', color: s.color }}
                    onClick={() => { moveToStage(detailLead.id, s.id); setDetailLead({ ...detailLead, stage: s.id }); }}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Activity */}
            <div className="detail-activity-add">
              <h4>📝 Log Activity</h4>
              <div className="activity-type-chips">
                {ACTIVITY_TYPES.map(t => (
                  <button key={t.id} className={`template-chip ${newActivity.type === t.id ? 'active' : ''}`}
                    onClick={() => setNewActivity({ ...newActivity, type: t.id })}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <input className="admin-input" placeholder="Activity title (e.g., 'Called and discussed pricing')"
                value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} />
              <textarea className="admin-input" rows={2} placeholder="Details..."
                value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} />
              <button className="btn btn-primary" onClick={handleAddActivity} disabled={!newActivity.title}>
                <Plus size={14} /> Log Activity
              </button>
            </div>

            {/* Activity Timeline */}
            <div className="detail-timeline">
              <h4>🕐 Activity History</h4>
              {activities.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>No activities logged yet</p>
              ) : (
                activities.map(a => (
                  <div key={a.id} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <strong>{a.title}</strong>
                      {a.description && <p className="text-muted" style={{ fontSize: '0.75rem', margin: '2px 0 0' }}>{a.description}</p>}
                    </div>
                    <span className="timeline-time text-muted">
                      {new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmPipeline;
