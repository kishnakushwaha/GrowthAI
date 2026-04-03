import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle, Send, Settings, FileText, Users, Eye, MousePointer, AlertCircle,
  Loader2, ChevronDown, ChevronUp, Edit3, Plus, X, Check, Smartphone, Activity
} from 'lucide-react';
import { WA_API } from '../config';
import './WhatsAppOutreach.css';

const TEMPLATES_STORAGE_KEY = 'growthai_whatsapp_templates';

// Default templates if none exist
const DEFAULT_TEMPLATES = [
  {
    id: 'tpl_wa_1',
    name: 'Agency Introduction',
    body: 'Hi {{contact_name}},\n\nI noticed {{business_name}} while looking at businesses in Delhi. We specialize in helping local businesses like yours get more customers through targeted Meta & Google Ads.\n\nWould you be open to a quick 5-min chat this week to see if we can help you grow?'
  },
  {
    id: 'tpl_wa_2',
    name: 'Missing Website Pitch',
    body: 'Hello!\n\nI was looking for {{business_name}} online but couldn\'t find a website. In today\'s digital world, having a professional website is crucial for getting new customers.\n\nWe build highly converting websites starting at affordable rates. Let me know if you\'d like to see some of our recent work!'
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
    
    fetchStatus();
    interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

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
        setTemplates(JSON.parse(stored));
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
          if (rawTemplate.body) {
            setComposeBody(rawTemplate.body.replace(/{{business_name}}/g, business));
          }
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

  const extractFirstName = (bizName) => {
    if (!bizName) return '';
    const parts = bizName.split(/[\s'|,-]+/);
    const firstWord = parts[0];
    const generics = ['the', 'sri', 'shree', 'jai', 'dr', 'mr', 'mrs', 'new', 'best', 'top', 'super', 'a', 'an'];
    if (generics.includes(firstWord.toLowerCase()) || firstWord.length <= 2) {
      return `Team at ${bizName}`;
    }
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  };

  const getAutoVars = (name, business) => ({
    contact_name: name || extractFirstName(business) || 'Team',
    business_name: business || ''
  });

  const rerenderFromTemplate = (newVars) => {
    if (rawTemplate.body) {
      let bdy = rawTemplate.body;
      for (const [k, v] of Object.entries(newVars)) {
        if (v) {
          bdy = bdy.replace(new RegExp(`{{${k}}}`, 'g'), v);
        }
      }
      setComposeBody(bdy);
    }
  };

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

  const applyTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setRawTemplate({ body: tpl.body });
    const vars = {};
    const matches = (tpl.body).match(/{{(\w+)}}/g) || [];
    matches.forEach(m => { vars[m.replace(/[{}]/g, '')] = ''; });
    const autoVars = getAutoVars(composeToName, composeBusiness);
    for (const key of Object.keys(vars)) {
      if (autoVars[key]) vars[key] = autoVars[key];
    }
    setComposeVars(vars);
    let bdy = tpl.body;
    for (const [key, value] of Object.entries(vars)) {
      if (value) {
        bdy = bdy.replace(new RegExp(`{{${key}}}`, 'g'), value);
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
    <div className="wa-outreach-container">
      <div className="wa-header">
        <div>
          <h1>WhatsApp <span className="text-wa-gradient">Outreach</span></h1>
          <p className="text-muted">Direct high-conversion messaging with fully automated API engine</p>
        </div>
        
        <div className="wa-connection-shield">
          {engineConnected ? (
            <div className="badge success">
              <Activity size={14} className="pulse-icon" /> Engine Connected
            </div>
          ) : engineQr ? (
            <div className="badge warning">
              <AlertCircle size={14} /> Engine Disconnected (Manual Fallback)
            </div>
          ) : (
            <div className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <Loader2 size={14} className="spin-icon" /> Engine Connecting...
            </div>
          )}
        </div>
      </div>

      {engineQr && !engineConnected && (
        <div className="qr-container glass-panel" style={{ display: 'flex', gap: '2rem', padding: '1.5rem', alignItems: 'center', marginBottom: '1rem', border: '1px dashed #25D366' }}>
           <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(engineQr)}`} alt="Scan WhatsApp QR" style={{ borderRadius: '8px', border: '4px solid white' }} />
           <div>
             <h3><Activity size={18} style={{ color: '#25D366', verticalAlign: 'middle', marginRight: '6px' }} /> Activate Automation Engine</h3>
             <p className="text-muted" style={{ maxWidth: '500px', fontSize: '0.9rem', lineHeight: 1.5 }}>
               Your dedicated background engine is currently asleep. Open WhatsApp on your phone, go to Linked Devices, and scan this QR code to unlock fully silent background batch sending.
             </p>
           </div>
        </div>
      )}

      <div className="wa-content">
        <div className="wa-sidebar glass-panel">
          
          <div className="wa-tabs">
            <button 
              className={`wa-tab ${activeTab === 'compose' ? 'active' : ''}`}
              onClick={() => setActiveTab('compose')}
            >
              <MessageCircle size={18} /> Compose
            </button>
            <button 
              className={`wa-tab ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              <FileText size={18} /> Templates
            </button>
          </div>
          
          <div className="wa-templates-panel">
            <h3>Quick Templates</h3>
            <div className="wa-template-list">
              {templates.length === 0 && <p className="text-muted small">No templates found.</p>}
              {templates.map(t => (
                <div 
                  key={t.id} 
                  className={`wa-template-item ${selectedTemplate?.id === t.id ? 'active' : ''}`}
                  onClick={() => {
                    applyTemplate(t);
                    setActiveTab('compose');
                  }}
                >
                  <div className="wa-tpl-icon"><FileText size={14} /></div>
                  <div className="wa-tpl-info">
                    <h4>{t.name}</h4>
                    <p>{t.body.substring(0, 30)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="wa-main-area">
          
          {/* ---- COMPOSE TAB ---- */}
          {activeTab === 'compose' && (
            <div className="wa-compose-panel glass-panel">
              <div className="wa-panel-header">
                <h2>New WhatsApp Message</h2>
                {selectedTemplate && (
                  <span className="wa-badge">Template: {selectedTemplate.name}</span>
                )}
              </div>

              <div className="wa-form">
                <div className="wa-form-row">
                  <div className="wa-form-group">
                    <label>WhatsApp Number</label>
                    <div className="wa-input-with-icon">
                      <Smartphone size={16} />
                      <input 
                        type="text" 
                        placeholder="e.g. +91 98765 43210" 
                        value={composePhone}
                        onChange={e => setComposePhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="wa-form-group">
                    <label>Contact Name (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul" 
                      value={composeToName}
                      onChange={e => handleNameChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="wa-form-group">
                  <label>Business Name (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Acme Corp" 
                    value={composeBusiness}
                    onChange={e => handleBusinessChange(e.target.value)}
                  />
                </div>

                {/* Variables Injector */}
                {Object.keys(composeVars).length > 0 && (
                  <div className="wa-variables-box">
                    <h4>Template Variables</h4>
                    <div className="wa-vars-grid">
                      {Object.keys(composeVars).map(key => (
                        <div key={key} className="wa-var-item">
                          <label>{key.replace('_', ' ')}</label>
                          <input 
                            type="text" 
                            value={composeVars[key]}
                            onChange={(e) => handleVarChange(key, e.target.value)}
                            placeholder={`Value for ${key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="wa-form-group">
                  <label>Message Content</label>
                  <textarea 
                    rows={8}
                    className="wa-message-body"
                    placeholder="Type your WhatsApp message..."
                    value={composeBody}
                    onChange={e => setComposeBody(e.target.value)}
                  />
                </div>

                <div className="wa-form-actions">
                  <button 
                    className="wa-btn wa-btn-primary" 
                    onClick={handleSend}
                    disabled={!composePhone || !composeBody}
                  >
                    <Send size={18} /> Open in WhatsApp Web
                  </button>
                  <span className="wa-helper-text">
                    This will open a new tab directly into your WhatsApp Desktop/Web chat.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ---- TEMPLATES TAB ---- */}
          {activeTab === 'templates' && (
            <div className="wa-templates-manager glass-panel">
              <div className="wa-panel-header">
                <h2>Manage WhatsApp Templates</h2>
                <button className="wa-btn wa-btn-secondary" onClick={() => setNewTemplate({ name: '', body: '' })}>
                  <Plus size={16} /> Create Template
                </button>
              </div>

              {/* Edit Existing Template */}
              {editingTemplate && (
                <div className="wa-editor-card">
                  <h3>Edit Template</h3>
                  <input 
                    type="text" 
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    placeholder="Template Name"
                  />
                  <textarea 
                    rows={6}
                    value={editingTemplate.body}
                    onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})}
                    placeholder="Message Body (Use {{variable_name}} for dynamic data)"
                  />
                  <div className="wa-editor-actions">
                    <button className="wa-btn wa-btn-primary" onClick={handleSaveEdit}>Save Changes</button>
                    <button className="wa-btn wa-btn-ghost" onClick={() => setEditingTemplate(null)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Create New Template */}
              {newTemplate && (
                <div className="wa-editor-card new-card">
                  <h3>New Template</h3>
                  <input 
                    type="text" 
                    value={newTemplate.name}
                    onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                    placeholder="Template Name (e.g. Cold Outreach #1)"
                  />
                  <textarea 
                    rows={6}
                    value={newTemplate.body}
                    onChange={e => setNewTemplate({...newTemplate, body: e.target.value})}
                    placeholder="Message Body (Use {{variable_name}} for dynamic data)"
                  />
                  <div className="wa-editor-actions">
                    <button className="wa-btn wa-btn-primary" onClick={handleSaveNew}>Create</button>
                    <button className="wa-btn wa-btn-ghost" onClick={() => setNewTemplate(null)}>Cancel</button>
                  </div>
                </div>
              )}

              <div className="wa-templates-grid">
                {templates.map(t => (
                  <div key={t.id} className="wa-template-card">
                    <div className="wa-tc-header">
                      <h3>{t.name}</h3>
                      <div className="wa-tc-actions">
                        <button className="icon-btn" onClick={() => {
                          setEditingTemplate(t);
                          setNewTemplate(null);
                        }}><Edit3 size={16}/></button>
                        <button className="icon-btn danger" onClick={() => handleDeleteTemplate(t.id)}><X size={16}/></button>
                      </div>
                    </div>
                    <div className="wa-tc-body">
                      {t.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default WhatsAppOutreach;
