import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle, Send, Settings, FileText, Users, Eye, MousePointer, AlertCircle,
  Loader2, ChevronDown, ChevronUp, Edit3, Plus, X, Check, Smartphone, Activity, WifiOff, CheckCircle2
} from 'lucide-react';
import { WA_API } from '../config';
import './WhatsAppOutreach.css';

const TEMPLATES_STORAGE_KEY = 'growthai_whatsapp_templates';

// Default templates if none exist
const DEFAULT_TEMPLATES = [
  {
    id: 'tpl_wa_1',
    name: 'Agency Introduction',
    body: 'Hi *[[contact_name]]*,\n\nI noticed *[[business_name]]* while looking at businesses in [[city]]. We specialize in helping local businesses like yours get more customers through targeted Meta & Google Ads.\n\nWould you be open to a quick 5-min chat this week to see if we can help you grow?'
  },
  {
    id: 'tpl_wa_2',
    name: 'Missing Website Pitch',
    body: 'Hello!\n\nI was looking for *[[business_name]]* in [[city]] but couldn\'t find a website. In today\'s digital world, having a professional website is crucial for getting new customers.\n\nWe build highly converting websites starting at affordable rates. Let me know if you\'d like to see some of our recent work!'
  }
];

const WhatsAppOutreach = () => {
  // State
  const [activeTab, setActiveTab] = useState('compose');
  const [templates, setTemplates] = useState([]);
  
  // Connect Status State
  const [engineConnected, setEngineConnected] = useState(false);
  const [engineQr, setEngineQr] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  
  // Stats & Logs
  const [waStats, setWaStats] = useState({ sent: 0, active: 0, success: 0, failed: 0 });
  const [waLogs, setWaLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Poll Engine Status
  useEffect(() => {
    let interval;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${WA_API}/api/wa/status`);
        const data = await res.json();
        setEngineConnected(data.connected);
        setEngineQr(data.qr);
      } catch (err) {
        setEngineConnected(false);
      }
    };
    
    const fetchStats = async () => {
      try {
        const res = await fetch(`${WA_API}/api/wa/stats`, { 
          headers: { 'Authorization': `Bearer admin` } 
        });
        const data = await res.json();
        setWaStats(data);
      } catch (err) {}
    };
    
    fetchStatus();
    fetchStats();
    interval = setInterval(() => {
      fetchStatus();
      fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`${WA_API}/api/wa/logs`, { 
        headers: { 'Authorization': `Bearer admin` } 
      });
      const data = await res.json();
      setWaLogs(data.logs || []);
    } catch (err) {}
    setLogsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'activity') fetchLogs();
  }, [activeTab]);

  // Compose form
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [composePhone, setComposePhone] = useState('');
  const [composeToName, setComposeToName] = useState('');
  const [composeBusiness, setComposeBusiness] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeVars, setComposeVars] = useState({});
  const [rawTemplate, setRawTemplate] = useState({ body: '' });

  // Template editor
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (stored) {
      try {
        let parsed = JSON.parse(stored);
        // Migration: Conver to [[ ]] syntax
        let migrated = false;
        parsed = parsed.map(t => {
          if (t.body && (t.body.includes('{{') || t.body.includes('Delhi'))) {
            migrated = true;
            return { 
              ...t, 
              body: t.body
                .replace(/{{contact_name}}/g, '[[contact_name]]')
                .replace(/{{business_name}}/g, '[[business_name]]')
                .replace(/{{city}}/g, '[[city]]')
                .replace('businesses in Delhi', 'businesses in [[city]]')
            };
          }
          return t;
        });
        
        setTemplates(parsed);
        if (migrated) {
          localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {
        setTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
    }
  }, []);

  useEffect(() => {
    const handlePopulateFromURL = () => {
      const hash = window.location.hash;
      if (hash.includes('whatsapp?')) {
        const queryParams = new URLSearchParams(hash.split('?')[1]);
        const phone = queryParams.get('phone');
        const business = queryParams.get('business');
        
        if (phone) {
          let cleanPhone = phone.replace(/[\s-()]/g, '');
          if (cleanPhone.startsWith('0')) {
            cleanPhone = '91' + cleanPhone.substring(1);
          } else if (!cleanPhone.startsWith('+') && cleanPhone.length === 10) {
             cleanPhone = '91' + cleanPhone;
          } else {
             cleanPhone = cleanPhone.replace(/[^0-9+]/g, '');
          }
          setComposePhone(cleanPhone);
        }

        if (business) {
          setComposeBusiness(business);
          setComposeVars(prev => ({ ...prev, business_name: business }));
        }

        const city = queryParams.get('city');
        if (city) {
          setComposeVars(prev => ({ ...prev, city: city }));
        }
        
        // Initial render with all vars
        const initialVars = {
           contact_name: extractFormalName(business) || 'Team',
           business_name: business || '',
           city: city || 'your city'
        };
        
        // Find the first template body to initialize correctly
        const initialTpl = templates.length > 0 ? templates[0] : DEFAULT_TEMPLATES[0];
        if (initialTpl && initialTpl.body) {
           let bdy = initialTpl.body;
           for (const [k, v] of Object.entries(initialVars)) {
              bdy = bdy.replace(new RegExp(`\\[\\[${k}\\]\\]`, 'gi'), v);
           }
           setComposeBody(bdy);
           setRawTemplate(initialTpl);
           setSelectedTemplate(initialTpl.id);
        }
        
        window.history.replaceState(null, '', window.location.pathname + '#whatsapp');
      }
    };
    
    handlePopulateFromURL();
    window.addEventListener('hashchange', handlePopulateFromURL);
    return () => window.removeEventListener('hashchange', handlePopulateFromURL);
  }, [rawTemplate]);

  const saveTemplates = (newTpls) => {
    setTemplates(newTpls);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTpls));
  };

  const extractFormalName = (bizName) => {
    if (!bizName) return '';
    // Reverted to full name as requested, just cleaning whitespace
    return bizName.trim();
  };

  const getAutoVars = (name, business, city) => ({
    contact_name: name || extractFormalName(business) || 'Team',
    business_name: business || '',
    city: city || 'your city'
  });

  const rerenderFromTemplate = (newVars) => {
    if (rawTemplate.body) {
      let bdy = rawTemplate.body;
      // Merge current state to ensure no partial renders
      const vars = {
        contact_name: newVars.contact_name !== undefined ? newVars.contact_name : composeToName,
        business_name: newVars.business_name !== undefined ? newVars.business_name : composeBusiness,
        city: newVars.city !== undefined ? newVars.city : (composeVars.city || 'your city'),
        ...newVars // Catch any other custom variables
      };
      
      for (const [k, v] of Object.entries(vars)) {
        if (v !== undefined) {
          bdy = bdy.replace(new RegExp(`\\[\\[${k}\\]\\]`, 'gi'), v);
        }
      }
      setComposeBody(bdy);
    }
  };

  const handleNameChange = (val) => {
    setComposeToName(val);
    setComposeVars(prev => {
      const updated = { ...prev, contact_name: val };
      rerenderFromTemplate(updated);
      return updated;
    });
  };

  const handleBusinessChange = (val) => {
    setComposeBusiness(val);
    setComposeVars(prev => {
      const updated = { ...prev, business_name: val };
      rerenderFromTemplate(updated);
      return updated;
    });
  };

  const applyTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setRawTemplate({ body: tpl.body });
    
    // Extract variables using [[ ]] syntax
    const vars = {};
    const matches = (tpl.body).match(/\[\[(\w+)\]\]/g) || [];
    matches.forEach(m => { 
      vars[m.replace(/[\[\]]/g, '')] = ''; 
    });

    // Auto-fill from current input fields
    const autoVars = getAutoVars(composeToName, composeBusiness, composeVars.city);
    for (const key of Object.keys(vars)) {
      if (autoVars[key]) vars[key] = autoVars[key];
    }
    
    setComposeVars(vars);
    
    // Initial render of the body
    let bdy = tpl.body;
    for (const [key, value] of Object.entries(vars)) {
      if (value) {
        bdy = bdy.replace(new RegExp(`\\[\\[${key}\\]\\]`, 'gi'), value);
      }
    }
    setComposeBody(bdy);
  };

  const handleVarChange = (key, value) => {
    const newVars = { ...composeVars, [key]: value };
    setComposeVars(newVars);
    rerenderFromTemplate(newVars);
  };

  // Open WhatsApp API Link
  const handleSend = async () => {
    if (!composePhone || !composeBody) {
      alert("Please ensure phone number and message exist.");
      return;
    }
    
    // If engine runs, send silently via API instead of opening new tab!
    if (engineConnected) {
      setSending(true);
      setSendResult(null);
      try {
        const res = await fetch(`${WA_API}/api/wa/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: composePhone, message: composeBody })
        });
        const data = await res.json();
        
        if (data.success) {
          setSendResult({ type: 'success', text: 'Sent natively via API!' });
          // Clear after a second
          setTimeout(() => setSendResult(null), 3000);
        } else {
          setSendResult({ type: 'error', text: data.error || 'API Failed to connect.' });
        }
      } catch (e) {
        setSendResult({ type: 'error', text: 'Backend engine offline.' });
      }
      setSending(false);
    } else {
      // Fallback to manual deep-link
      const cleanNumber = composePhone.replace(/[^0-9+]/g, '');
      const encodedMessage = encodeURIComponent(composeBody);
      const url = `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMessage}`;
      window.open(url, '_blank');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect the WhatsApp engine? You will need to re-scan the QR code to link your device again.")) return;
    
    // Optimistically update UI
    setEngineConnected(false);
    
    try {
      await fetch(`${WA_API}/api/wa/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error("Disconnect API failed:", e);
    }
  };

  const handleSaveEdit = () => {
    if (!editingTemplate.name || !editingTemplate.body) return;
    const updated = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
    saveTemplates(updated);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id) => {
    if (window.confirm("Delete this template?")) {
      const updated = templates.filter(t => t.id !== id);
      saveTemplates(updated);
      if (selectedTemplate?.id === id) setSelectedTemplate(null);
    }
  };

  const handleSaveNew = () => {
    if (!newTemplate.name || !newTemplate.body) return;
    const tpl = { id: `tpl_wa_${Date.now()}`, ...newTemplate };
    saveTemplates([...templates, tpl]);
    setNewTemplate(null);
  };

  return (
    <div className="leads-container">
      {/* 1. Header — Matching Email Outreach */}
      <div className="leads-header">
        <div>
          <h1>WhatsApp <span className="text-wa-gradient">Outreach</span></h1>
          <p className="text-muted">Direct high-conversion messaging with fully automated API engine</p>
        </div>
        <div className="leads-header-actions">
          {engineConnected ? (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className="smtp-connected-badge" style={{ margin: 0, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                <Activity size={14} className="pulse-icon" /> Engine Online
              </div>
              <button className="btn btn-secondary logout-btn" onClick={handleDisconnect} title="Disconnect WhatsApp">
                <WifiOff size={16} /> Disconnect
              </button>
            </div>
          ) : (
            <div className="badge warning" style={{ padding: '8px 16px', borderRadius: '10px' }}>
              <AlertCircle size={16} /> Engine Offline (Manual Mode)
            </div>
          )}
        </div>
      </div>

      {/* 2. QR Code Scanner (Conditional) */}
      {engineQr && !engineConnected && (
        <div className="scrape-panel glass-panel" style={{ border: '1px dashed #25D366', marginBottom: '2rem' }}>
           <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(engineQr)}`} alt="Scan WhatsApp QR" style={{ borderRadius: '12px', border: '4px solid white', background: 'white' }} />
             <div>
               <h3 style={{ color: '#25D366' }}><Smartphone size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Activate Automation Engine</h3>
               <p className="text-muted" style={{ maxWidth: '600px', fontSize: '0.9rem', marginTop: '8px' }}>
                 Open WhatsApp on your phone → Settings → Linked Devices → Scan QR Code. 
                 This unlocks **100% automated follow-ups** and background sending.
               </p>
             </div>
           </div>
        </div>
      )}

      {/* 3. Stats Grid — Matching Email Outreach */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <Send size={24} color="var(--primary)" />
          <div>
            <span className="stat-number">{waStats.sent}</span>
            <span className="stat-label text-muted">WhatsApp Sent</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <Activity size={24} color="var(--accent)" />
          <div>
            <span className="stat-number">{waStats.active}</span>
            <span className="stat-label text-muted">Active Sequences</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <CheckCircle2 size={24} color="#22c55e" />
          <div>
            <span className="stat-number">{waStats.success}</span>
            <span className="stat-label text-muted">Delivered</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <AlertCircle size={24} color="#ef4444" />
          <div>
            <span className="stat-number">{waStats.failed}</span>
            <span className="stat-label text-muted">Failed</span>
          </div>
        </div>
      </div>

      {/* 4. Tabs — Matching Email Outreach */}
      <div className="email-tabs">
        <button className={`email-tab ${activeTab === 'compose' ? 'active' : ''}`} onClick={() => setActiveTab('compose')}>
          <MessageCircle size={16} /> Compose
        </button>
        <button className={`email-tab ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
          <FileText size={16} /> Templates
        </button>
        <button className={`email-tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
          <Activity size={16} /> Activity Log
        </button>
      </div>

      {/* 5. Content Panels */}
      <div className="wa-content-area">
        
        {/* ---- COMPOSE TAB ---- */}
        {activeTab === 'compose' && (
          <div className="email-compose glass-panel">
            <h3>💬 New WhatsApp Message</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              Fill recipient details, then pick a template — variables will auto-fill instantly!
            </p>

            <div className="compose-fields" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Recipient Info:</label>
              <div className="compose-row">
                <input type="text" className="admin-input" placeholder="WhatsApp Phone *" value={composePhone} onChange={e => setComposePhone(e.target.value)} />
                <input type="text" className="admin-input" placeholder="Contact Name" value={composeToName} onChange={e => handleNameChange(e.target.value)} />
                <input type="text" className="admin-input" placeholder="Business Name" value={composeBusiness} onChange={e => handleBusinessChange(e.target.value)} />
              </div>
            </div>

            <div className="template-selector">
              <label>Select Template:</label>
              <div className="template-chips">
                <button className={`template-chip ${!selectedTemplate ? 'active' : ''}`} onClick={() => { setSelectedTemplate(null); setComposeBody(''); setComposeVars({}); setRawTemplate({ body: '' }); }}>
                  Manual Message
                </button>
                {templates.map(t => (
                  <button key={t.id} className={`template-chip ${selectedTemplate?.id === t.id ? 'active' : ''}`} onClick={() => applyTemplate(t)}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {Object.keys(composeVars).length > 0 && (
              <div className="var-inputs">
                <label>Dynamic Variables:</label>
                <div className="var-grid">
                  {Object.keys(composeVars).map(key => (
                    <div key={key} className="var-field">
                      <span className="var-label">{`[[${key}]]`}</span>
                      <input type="text" className="admin-input" value={composeVars[key]} onChange={e => handleVarChange(key, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="compose-fields" style={{ marginTop: '1rem' }}>
              <textarea className="admin-input compose-body" placeholder="Type your WhatsApp message here..." rows={10} value={composeBody} onChange={e => setComposeBody(e.target.value)} />
            </div>

            {sendResult && (
              <div className={`send-result ${sendResult.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
                {sendResult.text}
              </div>
            )}

            <button className="btn btn-primary" onClick={handleSend} disabled={sending || !composePhone} style={{ marginTop: '1.5rem', width: '220px' }}>
              {sending ? <><Loader2 size={18} className="spin" /> Sending...</> : <><Send size={18} /> {engineConnected ? 'Send Automatically' : 'Open WhatsApp Web'}</>}
            </button>
          </div>
        )}

        {/* ---- TEMPLATES TAB ---- */}
        {activeTab === 'templates' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>📝 WhatsApp Templates</h3>
              <button className="btn btn-primary" onClick={() => setNewTemplate({ name: '', body: '' })}>
                <Plus size={16} /> New Template
              </button>
            </div>

            {newTemplate && (
              <div className="template-editor" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <input type="text" className="admin-input" placeholder="Template Name" value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} />
                <textarea className="admin-input" rows={6} placeholder="Message (use [[variables]])" value={newTemplate.body} onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })} style={{ marginTop: '0.75rem' }} />
                <div className="template-actions" style={{ marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={handleSaveNew}><Check size={16} /> Create</button>
                  <button className="btn btn-secondary" onClick={() => setNewTemplate(null)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="wa-templates-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {templates.map(tpl => (
                <div key={tpl.id} className="template-card">
                  <div className="template-card-header">
                    <h4>{tpl.name}</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => setEditingTemplate({ ...tpl })}><Edit3 size={14} /></button>
                      <button className="icon-btn danger" onClick={() => handleDeleteTemplate(tpl.id)}><X size={14} /></button>
                    </div>
                  </div>
                  {editingTemplate?.id === tpl.id ? (
                    <div className="template-editor" style={{ marginTop: '1rem' }}>
                      <input type="text" className="admin-input" value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} />
                      <textarea className="admin-input" rows={4} value={editingTemplate.body} onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} style={{ marginTop: '0.5rem' }} />
                      <div className="template-actions" style={{ marginTop: '0.75rem' }}>
                        <button className="btn btn-primary" onClick={() => {
                           const updated = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
                           saveTemplates(updated);
                           setEditingTemplate(null);
                        }}><Check size={14} /> Save</button>
                        <button className="btn btn-secondary" onClick={() => setEditingTemplate(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <pre className="template-preview" style={{ maxHeight: '120px' }}>{tpl.body}</pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- ACTIVITY LOG TAB ---- */}
        {activeTab === 'activity' && (
          <div className="leads-table-wrapper glass-panel">
            <div className="wa-panel-header" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>📈 Automation History</h3>
              <button className="btn btn-secondary" onClick={fetchLogs}>
                <Loader2 size={16} className={logsLoading ? 'spin' : ''} /> Refresh
              </button>
            </div>
            <table className="leads-table">
              <thead>
                <tr>
                  <th>RECIPIENT</th>
                  <th>OUTREACH TYPE</th>
                  <th>MESSAGE PREVIEW</th>
                  <th>STATUS</th>
                  <th>SENT AT</th>
                </tr>
              </thead>
              <tbody>
                {waLogs.length === 0 && !logsLoading && (
                  <tr><td colSpan="5" className="text-center py-5">No logs found yet.</td></tr>
                )}
                {waLogs.map(log => (
                  <tr key={log.id}>
                    <td className="name-cell">
                      <span className="lead-name">{log.biz_name || 'Individual'}</span>
                      <span className="lead-industry text-muted">{log.phone}</span>
                    </td>
                    <td>
                      <span className={`email-status-badge ${log.type === 'automation' ? 'status-sending' : 'status-sent'}`}>
                        {log.type === 'automation' ? `Step ${log.step} Seq` : 'Manual Out'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.message}</td>
                    <td>
                      <span className={`email-status-badge ${log.status === 'sent' ? 'status-sent' : 'status-failed'}`}>
                        {log.status === 'sent' ? 'Delivered' : 'Failed'}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default WhatsAppOutreach;
