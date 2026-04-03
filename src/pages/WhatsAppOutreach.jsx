import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle, Send, Settings, FileText, Users, Eye, MousePointer, AlertCircle,
  Loader2, ChevronDown, ChevronUp, Edit3, Plus, X, Check, Smartphone
} from 'lucide-react';
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

  // Load Templates from LocalStorage
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

  // Handle incoming lead data from URL hash parameters
  useEffect(() => {
    const handlePopulateFromURL = () => {
      const hash = window.location.hash;
      if (hash.includes('whatsapp?')) {
        const queryParams = new URLSearchParams(hash.split('?')[1]);
        const phone = queryParams.get('phone');
        const business = queryParams.get('business');
        
        // Clean phone number (remove spaces, hyphens)
        if (phone) {
          let cleanPhone = phone.replace(/[\s-()]/g, '');
          // If it starts with 0, replace with 91 for India (assumption based on local context)
          if (cleanPhone.startsWith('0')) {
            cleanPhone = '91' + cleanPhone.substring(1);
          } else if (!cleanPhone.startsWith('+')) {
            // Wait, if it has no prefix, maybe append 91? Or leave as is. 
            // Most numbers scraped are standard. Let's just strip symbols.
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
        
        // Remove the query parameters from URL without refreshing
        window.history.replaceState(null, '', window.location.pathname + '#whatsapp');
      }
    };
    
    handlePopulateFromURL();
    window.addEventListener('hashchange', handlePopulateFromURL);
    return () => window.removeEventListener('hashchange', handlePopulateFromURL);
  }, [rawTemplate]);

  // Save templates
  const saveTemplates = (newTpls) => {
    setTemplates(newTpls);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTpls));
  };


  // Auto-fill: compute variables from compose fields
  const getAutoVars = (name, business) => ({
    contact_name: name || '',
    business_name: business || ''
  });

  // Re-render body from raw template with current vars
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

  // Handle compose field changes — auto-sync to variables AND update body
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

  // Open WhatsApp Link
  const handleSend = () => {
    if (!composePhone || !composeBody) {
      alert("Please ensure phone number and message exist.");
      return;
    }
    // Deep Link Format: https://wa.me/{phone}?text={encodedBody}
    // Alternatively: https://web.whatsapp.com/send?phone={phone}&text={encodedBody}
    
    // Clean phone number by removing everything except numbers and plus
    const cleanNumber = composePhone.replace(/[^0-9+]/g, '');
    const encodedMessage = encodeURIComponent(composeBody);
    const url = `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMessage}`;
    
    window.open(url, '_blank');
  };

  // Template Handlers
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
    const tpl = {
      id: `tpl_wa_${Date.now()}`,
      ...newTemplate
    };
    saveTemplates([...templates, tpl]);
    setNewTemplate(null);
  };

  return (
    <div className="wa-outreach-container">
      {/* Header */}
      <div className="wa-header">
        <div>
          <h1>WhatsApp <span className="text-wa-gradient">Outreach</span></h1>
          <p className="text-muted">Direct high-conversion messaging without API limits</p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="wa-content">
        
        {/* Left Sidebar */}
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
