import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, Send, Settings, FileText, Users, Eye, MousePointer, AlertCircle,
  Loader2, ChevronDown, ChevronUp, Edit3, Plus, X, Check, BarChart3
} from 'lucide-react';
import './EmailOutreach.css';

import API from '../config';

const EmailOutreach = () => {
  const [token] = useState(() => sessionStorage.getItem('adminToken') || '');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // State
  const [activeTab, setActiveTab] = useState('compose');
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [smtpEmail, setSmtpEmail] = useState('');
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignStats, setCampaignStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState({});
  const [loading, setLoading] = useState(true);

  // SMTP Config form
  const [configEmail, setConfigEmail] = useState('');
  const [configPassword, setConfigPassword] = useState('');
  const [configuring, setConfiguring] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configError, setConfigError] = useState('');

  // Compose form
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [composeTo, setComposeTo] = useState('');
  const [composeToName, setComposeToName] = useState('');
  const [composeBusiness, setComposeBusiness] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeVars, setComposeVars] = useState({});
  const [rawTemplate, setRawTemplate] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Template editor
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState(null);

  // Load data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, templatesRes, campaignsRes, logsRes] = await Promise.all([
        fetch(`${API}/api/email/status`, { headers }),
        fetch(`${API}/api/email/templates`, { headers }),
        fetch(`${API}/api/campaigns`, { headers }),
        fetch(`${API}/api/email/logs`, { headers })
      ]);
      const status = await statusRes.json();
      const tplData = await templatesRes.json();
      const campData = await campaignsRes.json();
      const logData = await logsRes.json();

      setSmtpConfigured(status.configured);
      setSmtpEmail(status.email || '');
      setTemplates(tplData.templates || []);
      setCampaigns(campData.campaigns || []);
      setCampaignStats(campData.stats || {});
      setLogs(logData.logs || []);
      setLogStats(logData.stats || {});
    } catch (err) {
      console.error('Failed to fetch email data', err);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Configure SMTP — now with proper error display
  const handleConfigureSmtp = async () => {
    if (!configEmail || !configPassword) return;
    setConfiguring(true);
    setConfigError('');
    try {
      const res = await fetch(`${API}/api/email/configure`, {
        method: 'POST', headers,
        body: JSON.stringify({ email: configEmail, password: configPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmtpConfigured(true);
        setSmtpEmail(data.email || configEmail);
        setShowConfig(false);
        setConfigError('');
      } else {
        setConfigError(data.error || 'Connection failed. Check your credentials.');
      }
    } catch (err) {
      setConfigError('Network error — make sure the backend server is running.');
    }
    setConfiguring(false);
  };

  // Auto-fill: compute variables from compose fields
  const getAutoVars = (name, business) => ({
    contact_name: name || '',
    business_name: business || '',
    city: 'Delhi',
    industry: '',
    audit_score: '',
    critical_count: '',
    audit_link: ''
  });

  // Re-render subject/body from raw template with current vars
  const rerenderFromTemplate = (newVars) => {
    if (rawTemplate.subject || rawTemplate.body) {
      let subj = rawTemplate.subject;
      let bdy = rawTemplate.body;
      for (const [k, v] of Object.entries(newVars)) {
        if (v) {
          subj = subj.replace(new RegExp(`{{${k}}}`, 'g'), v);
          bdy = bdy.replace(new RegExp(`{{${k}}}`, 'g'), v);
        }
      }
      setComposeSubject(subj);
      setComposeBody(bdy);
    }
  };

  // Handle compose field changes — auto-sync to variables AND update subject/body
  const handleNameChange = (val) => {
    setComposeToName(val);
    setComposeVars(prev => {
      const updated = { ...prev };
      if ('contact_name' in updated) updated.contact_name = val;
      rerenderFromTemplate(updated);
      return updated;
    });
  };

  const handleBusinessChange = (val) => {
    setComposeBusiness(val);
    setComposeVars(prev => {
      const updated = { ...prev };
      if ('business_name' in updated) updated.business_name = val;
      rerenderFromTemplate(updated);
      return updated;
    });
  };

  // Select template — store raw template, extract vars, auto-fill from compose fields

  const applyTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setRawTemplate({ subject: tpl.subject, body: tpl.body });
    // Extract variables
    const vars = {};
    const matches = (tpl.subject + ' ' + tpl.body).match(/{{(\w+)}}/g) || [];
    matches.forEach(m => { vars[m.replace(/[{}]/g, '')] = ''; });
    // Auto-fill from compose fields + defaults
    const autoVars = getAutoVars(composeToName, composeBusiness);
    for (const key of Object.keys(vars)) {
      if (autoVars[key]) vars[key] = autoVars[key];
    }
    setComposeVars(vars);
    // Set subject/body with vars replaced
    let subj = tpl.subject;
    let bdy = tpl.body;
    for (const [key, value] of Object.entries(vars)) {
      if (value) {
        subj = subj.replace(new RegExp(`{{${key}}}`, 'g'), value);
        bdy = bdy.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }
    setComposeSubject(subj);
    setComposeBody(bdy);
  };

  // When a variable changes, re-render subject/body from raw template
  const handleVarChange = (key, value) => {
    const newVars = { ...composeVars, [key]: value };
    setComposeVars(newVars);
    // Re-render from raw template
    if (rawTemplate.subject || rawTemplate.body) {
      let subj = rawTemplate.subject;
      let bdy = rawTemplate.body;
      for (const [k, v] of Object.entries(newVars)) {
        if (v) {
          subj = subj.replace(new RegExp(`{{${k}}}`, 'g'), v);
          bdy = bdy.replace(new RegExp(`{{${k}}}`, 'g'), v);
        }
      }
      setComposeSubject(subj);
      setComposeBody(bdy);
    }
  };

  // Send email
  const handleSend = async () => {
    if (!composeTo || !composeSubject || !composeBody) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`${API}/api/email/send`, {
        method: 'POST', headers,
        body: JSON.stringify({
          to: composeTo, toName: composeToName, businessName: composeBusiness,
          subject: composeSubject, body: composeBody
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSendResult({ type: 'success', message: `✅ Email sent to ${composeTo} from ${smtpEmail}!` });
        fetchData();
      } else {
        setSendResult({ type: 'error', message: data.error || 'Send failed' });
      }
    } catch (err) {
      setSendResult({ type: 'error', message: err.message });
    }
    setSending(false);
  };


  // Save template
  const saveTemplate = async (tpl) => {
    try {
      if (tpl.id) {
        await fetch(`${API}/api/email/templates/${tpl.id}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ name: tpl.name, subject: tpl.subject, body: tpl.body })
        });
      } else {
        await fetch(`${API}/api/email/templates`, {
          method: 'POST', headers,
          body: JSON.stringify({ name: tpl.name, subject: tpl.subject, body: tpl.body })
        });
      }
      setEditingTemplate(null);
      setNewTemplate(null);
      fetchData();
    } catch (err) {
      console.error('Save template failed', err);
    }
  };

  if (loading) {
    return <div className="email-loading"><Loader2 size={32} className="spin" /> Loading email system...</div>;
  }

  return (
    <div className="leads-container">
      <div className="leads-header">
        <div>
          <h1>Email <span className="text-gradient">Outreach</span></h1>
          <p className="text-muted">Send personalized emails to your leads with tracking</p>
        </div>
        <div className="leads-header-actions">
          <button className={`btn ${smtpConfigured ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setShowConfig(!showConfig)}>
            <Settings size={18} /> {smtpConfigured ? `✅ ${smtpEmail}` : '⚙️ Setup SMTP'}
          </button>
        </div>
      </div>

      {/* SMTP Setup Panel */}
      {showConfig && (
        <div className="scrape-panel glass-panel">
          <div className="scrape-panel-header">
            <h3>⚙️ Gmail SMTP Configuration</h3>
            <button onClick={() => setShowConfig(false)}><X size={20} color="var(--text-muted)" /></button>
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            Use a Gmail <strong>App Password</strong> (not your regular password).<br />
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
              → Click here to generate App Password
            </a> (requires 2-Step Verification enabled)
          </p>
          <div className="scrape-input-group">
            <input type="email" className="admin-input" placeholder="your.email@gmail.com" value={configEmail} onChange={e => setConfigEmail(e.target.value)} />
            <input type="password" className="admin-input" placeholder="App Password (16 chars, no spaces)" value={configPassword} onChange={e => setConfigPassword(e.target.value)} />
            <button className="btn btn-primary" onClick={handleConfigureSmtp} disabled={configuring}>
              {configuring ? <><Loader2 size={18} className="spin" /> Connecting...</> : <><Check size={18} /> Connect</>}
            </button>
          </div>
          {configError && (
            <div className="smtp-error">
              ❌ {configError}
            </div>
          )}
        </div>
      )}

      {/* Sending from indicator */}
      {smtpConfigured && (
        <div className="smtp-connected-badge">
          <Mail size={14} /> Sending from: <strong>{smtpEmail}</strong>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <Send size={24} color="var(--primary)" />
          <div><span className="stat-number">{logStats.total_sent || 0}</span><span className="stat-label text-muted">Emails Sent</span></div>
        </div>
        <div className="stat-card glass-panel">
          <Eye size={24} color="var(--accent)" />
          <div><span className="stat-number">{logStats.total_opened || 0}</span><span className="stat-label text-muted">Opened</span></div>
        </div>
        <div className="stat-card glass-panel">
          <MousePointer size={24} color="#22c55e" />
          <div><span className="stat-number">{logStats.total_clicked || 0}</span><span className="stat-label text-muted">Clicked</span></div>
        </div>
        <div className="stat-card glass-panel">
          <AlertCircle size={24} color="#ef4444" />
          <div><span className="stat-number">{logStats.total_failed || 0}</span><span className="stat-label text-muted">Failed</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="email-tabs">
        {[
          { id: 'compose', label: 'Compose', icon: <Mail size={16} /> },
          { id: 'templates', label: 'Templates', icon: <FileText size={16} /> },
          { id: 'activity', label: 'Activity Log', icon: <BarChart3 size={16} /> }
        ].map(tab => (
          <button key={tab.id} className={`email-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="email-compose glass-panel">
          {!smtpConfigured && (
            <div className="smtp-warning">
              <AlertCircle size={20} /> Configure your Gmail SMTP first using the button above before sending emails.
            </div>
          )}

          <h3>📧 Compose Email</h3>
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            Fill recipient info first, then select a template — variables will auto-fill!
          </p>

          {/* Recipient info FIRST */}
          <div className="compose-fields" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Recipient Info:</label>
            <div className="compose-row">
              <input type="email" className="admin-input" placeholder="Recipient email *" value={composeTo} onChange={e => setComposeTo(e.target.value)} />
              <input type="text" className="admin-input" placeholder="Recipient name" value={composeToName} onChange={e => handleNameChange(e.target.value)} />
              <input type="text" className="admin-input" placeholder="Business name" value={composeBusiness} onChange={e => handleBusinessChange(e.target.value)} />
            </div>
          </div>

          {/* Template selector */}
          <div className="template-selector">
            <label>Use Template:</label>
            <div className="template-chips">
              <button className={`template-chip ${!selectedTemplate ? 'active' : ''}`} onClick={() => { setSelectedTemplate(null); setComposeSubject(''); setComposeBody(''); setComposeVars({}); setRawTemplate({ subject: '', body: '' }); }}>
                Custom
              </button>
              {templates.map(t => (
                <button key={t.id} className={`template-chip ${selectedTemplate?.id === t.id ? 'active' : ''}`} onClick={() => applyTemplate(t)}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Variable Inputs — only show ones that need manual input */}
          {Object.keys(composeVars).length > 0 && (
            <div className="var-inputs">
              <label>Template Variables <span style={{ fontWeight: 400, fontSize: '0.7rem' }}>(edit any field — subject & body update live!)</span>:</label>
              <div className="var-grid">
                {Object.keys(composeVars).filter(key => key !== 'contact_name' && key !== 'business_name').map(key => {
                  return (
                    <div key={key} className="var-field">
                      <span className="var-label">{`{{${key}}}`}</span>
                      <input type="text" className="admin-input" placeholder={key.replace(/_/g, ' ')} value={composeVars[key]} onChange={e => handleVarChange(key, e.target.value)} />
                    </div>
                  );
                })}
              </div>
              {(composeToName || composeBusiness) && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#22c55e' }}>
                  ✅ Auto-filled: {composeToName && `contact_name="${composeToName}"`} {composeBusiness && `business_name="${composeBusiness}"`}
                </div>
              )}
            </div>
          )}

          <div className="compose-fields">
            <input type="text" className="admin-input" placeholder="Subject line" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} />
            <textarea className="admin-input compose-body" placeholder="Email body..." rows={12} value={composeBody} onChange={e => setComposeBody(e.target.value)} />
          </div>

          {sendResult && (
            <div className={`send-result ${sendResult.type}`}>
              {sendResult.message}
            </div>
          )}

          <button className="btn btn-primary" onClick={handleSend} disabled={sending || !smtpConfigured || !composeTo}>
            {sending ? <><Loader2 size={18} className="spin" /> Sending...</> : <><Send size={18} /> Send Email</>}
          </button>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>📝 Email Templates</h3>
            <button className="btn btn-primary" onClick={() => setNewTemplate({ name: '', subject: '', body: '' })}>
              <Plus size={16} /> New Template
            </button>
          </div>

          {/* New Template Form */}
          {newTemplate && (
            <div className="template-editor">
              <input type="text" className="admin-input" placeholder="Template name" value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} />
              <input type="text" className="admin-input" placeholder="Subject line (use {{variables}})" value={newTemplate.subject} onChange={e => setNewTemplate({ ...newTemplate, subject: e.target.value })} />
              <textarea className="admin-input" rows={8} placeholder="Email body (use {{variables}})" value={newTemplate.body} onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })} />
              <div className="template-actions">
                <button className="btn btn-primary" onClick={() => saveTemplate(newTemplate)}><Check size={16} /> Save</button>
                <button className="btn btn-secondary" onClick={() => setNewTemplate(null)}><X size={16} /> Cancel</button>
              </div>
            </div>
          )}

          {/* Template List */}
          {templates.map(tpl => (
            <div key={tpl.id} className="template-card">
              {editingTemplate?.id === tpl.id ? (
                <div className="template-editor">
                  <input type="text" className="admin-input" value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} />
                  <input type="text" className="admin-input" value={editingTemplate.subject} onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })} />
                  <textarea className="admin-input" rows={8} value={editingTemplate.body} onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} />
                  <div className="template-actions">
                    <button className="btn btn-primary" onClick={() => saveTemplate(editingTemplate)}><Check size={16} /> Save</button>
                    <button className="btn btn-secondary" onClick={() => setEditingTemplate(null)}><X size={16} /> Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="template-card-header">
                    <div>
                      <h4>{tpl.name}</h4>
                      <p className="text-muted" style={{ fontSize: '0.8rem' }}>Subject: {tpl.subject}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => setEditingTemplate({ ...tpl })}>
                      <Edit3 size={14} /> Edit
                    </button>
                  </div>
                  <pre className="template-preview">{tpl.body.substring(0, 200)}...</pre>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <div className="leads-table-wrapper glass-panel">
          {logs.length === 0 ? (
            <div className="table-empty">
              <Mail size={48} color="var(--text-muted)" />
              <p>No emails sent yet. Compose your first email above!</p>
            </div>
          ) : (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Opened</th>
                  <th>Clicked</th>
                  <th>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{smtpEmail || '—'}</td>
                    <td className="name-cell">
                      <span className="lead-name">{log.recipient_name || log.recipient_email}</span>
                      {log.business_name && <span className="lead-industry text-muted">{log.business_name}</span>}
                    </td>
                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.subject}</td>
                    <td>
                      <span className={`email-status-badge status-${log.status}`}>{log.status}</span>
                    </td>
                    <td>
                      {log.opened_at ? (
                        <span className="badge-pass">✅ {new Date(log.opened_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      {log.clicked_at ? (
                        <span className="badge-pass">✅ Clicked</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {log.sent_at ? new Date(log.sent_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailOutreach;
