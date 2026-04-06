import React, { useState, useEffect } from 'react';
import { 
  Shield, Settings, Save, LogOut, Globe, DollarSign, 
  Flame, ChevronRight, Target, Menu, X, FileSearch, Mail, LayoutDashboard, MessageCircle
} from 'lucide-react';
import Leads from './Leads';
import AuditLeads from './AuditLeads';
import EmailOutreach from './EmailOutreach';
import WhatsAppOutreach from './WhatsAppOutreach';
import CrmPipeline from './CrmPipeline';
import './Admin.css';
import API, { WA_API } from '../config';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSectionState] = useState(() => {
    // Restore section from URL hash on load (e.g. /admin#crm?lead=123)
    const hashData = window.location.hash.replace('#', '').split('?')[0];
    const validSections = ['general', 'pricing', 'leads', 'audits', 'emails', 'whatsapp', 'crm'];
    return validSections.includes(hashData) ? hashData : 'general';
  });

  // Update URL hash when section changes
  const setActiveSection = (section) => {
    setActiveSectionState(section);
    // Persist query params if present
    const query = window.location.hash.includes('?') ? '?' + window.location.hash.split('?')[1] : '';
    window.location.hash = section + query;
  };
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle hash changes dynamically without page reload
  useEffect(() => {
    const handleHashChange = () => {
      const hashData = window.location.hash.replace('#', '').split('?')[0];
      const validSections = ['general', 'pricing', 'leads', 'audits', 'emails', 'whatsapp', 'crm'];
      if (validSections.includes(hashData)) {
        setActiveSectionState(hashData);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const [content, setContent] = useState({
    location: '',
    email: '',
    whatsappNumber: '',
    pricing: { starter: 0, growth: 0, pro: 0 }
  });

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchContent();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch(`${API}/api/content`);
      const data = await response.json();
      setContent(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load content from server.');
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return;
    setError('');
    setLoading(true);
    try {
      // 1. Double-verify password against WhatsApp Engine (this is our source of truth for outreach)
      const res = await fetch(`${WA_API}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (res.ok) {
        sessionStorage.setItem('adminToken', password);
        setIsAuthenticated(true);
        fetchContent();
      } else {
        setError('Invalid Admin Password');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection to backend failed');
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = sessionStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API}/api/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(content)
      });
      const result = await response.json();
      if (response.ok) {
        alert('Site updated successfully!');
      } else {
        setError(result.error || 'Failed to save updates');
        if (response.status === 401) handleLogout();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setPassword('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('price_')) {
      const key = name.replace('price_', '');
      setContent({ ...content, pricing: { ...content.pricing, [key]: parseInt(value, 10) } });
    } else {
      setContent({ ...content, [name]: value });
    }
  };

  const navItems = [
    { id: 'general', label: 'General Info', icon: <Settings size={20} /> },
    { id: 'pricing', label: 'Pricing Packages', icon: <DollarSign size={20} /> },
    { id: 'leads', label: 'Lead Pipeline', icon: <Flame size={20} /> },
    { id: 'audits', label: 'Audit Leads', icon: <FileSearch size={20} /> },
    { id: 'emails', label: 'Email Outreach', icon: <Mail size={20} /> },
    { id: 'whatsapp', label: 'WhatsApp Outreach', icon: <MessageCircle size={20} /> },
    { id: 'crm', label: 'Sales Pipeline', icon: <LayoutDashboard size={20} /> },
    { id: 'site', label: 'View Site', icon: <Globe size={20} />, isLink: true },
  ];

  if (loading && isAuthenticated) {
    return <div className="admin-shell"><div className="text-center" style={{padding:'4rem'}}>Loading dashboard...</div></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-shell login-container">
        <div className="glass-panel login-panel">
          <div className="text-center">
            <Shield size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h2>Admin Gateway</h2>
            <p className="text-muted mb-4">Enter password to access site controls</p>
          </div>
          {error && <div className="error-alert">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input type="password" placeholder="Admin Password" value={password}
                onChange={(e) => setPassword(e.target.value)} className="admin-input" />
            </div>
            <button type="submit" className="btn btn-primary w-full">Access Dashboard</button>
          </form>
          <div className="mt-4 text-center">
             <a href="/" className="text-muted" style={{textDecoration: 'underline', fontSize: '0.9rem'}}>Return to Website</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar glass-panel ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <a href="/" className="sidebar-logo">
            <Target size={24} color="var(--primary)" />
            {sidebarOpen && <span>Growth<span className="text-gradient">AI</span></span>}
          </a>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            item.isLink ? (
              <a key={item.id} href="/" target="_blank" className="sidebar-item">
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && <ChevronRight size={16} className="item-chevron" />}
              </a>
            ) : (
              <button
                key={item.id}
                className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            )
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-item logout-btn">
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* General Information Section */}
        {activeSection === 'general' && (
          <div className="admin-page">
            <div className="page-header">
              <h1><Settings size={28} color="var(--accent)" /> General <span className="text-gradient">Information</span></h1>
              <p className="text-muted">Update your agency's core details. Changes reflect across the live site instantly.</p>
            </div>
            {error && <div className="error-alert mb-4">{error}</div>}
            <div className="admin-card glass-panel">
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Target Location (City)</label>
                    <input type="text" name="location" value={content.location} onChange={handleChange} className="admin-input" />
                  </div>
                  <div className="form-group">
                    <label>Contact Email</label>
                    <input type="email" name="email" value={content.email} onChange={handleChange} className="admin-input" />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp Number (e.g. +918743933258)</label>
                    <input type="text" name="whatsappNumber" value={content.whatsappNumber} onChange={handleChange} className="admin-input" />
                  </div>
                </div>
                <div className="form-footer">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    <Save size={20} /> {loading ? 'Saving...' : 'Save & Publish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pricing Section */}
        {activeSection === 'pricing' && (
          <div className="admin-page">
            <div className="page-header">
              <h1><DollarSign size={28} color="var(--accent)" /> Pricing <span className="text-gradient">Packages</span></h1>
              <p className="text-muted">Set monthly pricing for each tier (INR). Changes update the live site instantly.</p>
            </div>
            {error && <div className="error-alert mb-4">{error}</div>}
            <div className="admin-card glass-panel">
              <form onSubmit={handleSave}>
                <div className="pricing-form-grid">
                  <div className="pricing-form-card">
                    <h3>Starter</h3>
                    <div className="form-group">
                      <label>Monthly Price (₹)</label>
                      <input type="number" name="price_starter" value={content.pricing.starter} onChange={handleChange} className="admin-input" />
                    </div>
                  </div>
                  <div className="pricing-form-card highlight">
                    <h3>Growth <span className="popular-tag">Popular</span></h3>
                    <div className="form-group">
                      <label>Monthly Price (₹)</label>
                      <input type="number" name="price_growth" value={content.pricing.growth} onChange={handleChange} className="admin-input" />
                    </div>
                  </div>
                  <div className="pricing-form-card">
                    <h3>Pro Funnel</h3>
                    <div className="form-group">
                      <label>Monthly Price (₹)</label>
                      <input type="number" name="price_pro" value={content.pricing.pro} onChange={handleChange} className="admin-input" />
                    </div>
                  </div>
                </div>
                <div className="form-footer">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    <Save size={20} /> {loading ? 'Saving...' : 'Save & Publish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Leads Pipeline Section */}
        {activeSection === 'leads' && <Leads />}

        {/* Audit Leads Section */}
        {activeSection === 'audits' && <AuditLeads />}

        {/* Email Outreach Section */}
        {activeSection === 'emails' && <EmailOutreach />}

        {/* WhatsApp Outreach Section */}
        {activeSection === 'whatsapp' && <WhatsAppOutreach />}

        {/* CRM Pipeline Section */}
        {activeSection === 'crm' && <CrmPipeline />}
      </main>
    </div>
  );
};

export default Admin;
