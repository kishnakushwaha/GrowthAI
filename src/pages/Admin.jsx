import React, { useState, useEffect } from 'react';
import { 
  Shield, Settings, Save, LogOut, Globe, DollarSign, 
  Flame, ChevronRight, Target, Menu, X, FileSearch, Mail, LayoutDashboard, MessageCircle, Layers, Activity, Users
} from 'lucide-react';
import Leads from './Leads';
import AuditLeads from './AuditLeads';
import EmailOutreach from './EmailOutreach';
import WhatsAppOutreach from './WhatsAppOutreach';
import CrmPipeline from './CrmPipeline';
import SeoSignals from './SeoSignals';
import WebsiteIntelligence from './WebsiteIntelligence';
import Sequences from './Sequences';
import OutreachMonitor from './OutreachMonitor';
import './Admin.css';
import API, { WA_API } from '../config';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [agencyName, setAgencyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSectionState] = useState(() => {
    // Restore section from URL hash on load
    const hashData = window.location.hash.replace('#', '').split('?')[0];
    const validSections = ['general', 'pricing', 'team', 'leads', 'signals', 'intelligence', 'sequences', 'monitor', 'audits', 'emails', 'whatsapp', 'crm'];
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
      const validSections = ['general', 'pricing', 'team', 'leads', 'signals', 'intelligence', 'sequences', 'monitor', 'audits', 'emails', 'whatsapp', 'crm'];
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
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Invalid Admin Password');
        setLoading(false);
        return;
      }
      
      // Password accepted — store JWT token
      sessionStorage.setItem('adminToken', data.token);
      setIsAuthenticated(true);
      fetchContent();
    } catch (err) {
      console.error('Login error:', err);
      setError(`Connection failed: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agencyName || !name || !email || !password) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyName, name, email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }
      
      sessionStorage.setItem('adminToken', data.token);
      setIsAuthenticated(true);
      fetchContent();
    } catch (err) {
      setError(`Connection failed: ${err.message}`);
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
    setEmail('');
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
    { id: 'team', label: 'Team Settings', icon: <Users size={20} /> },
    { id: 'leads', label: 'Lead Database', icon: <Flame size={20} /> },
    { id: 'signals', label: 'SEO & Tech Signals', icon: <Globe size={20} /> },
    { id: 'intelligence', label: 'Website Intelligence', icon: <Target size={20} /> },
    { id: 'sequences', label: 'Automation Builder', icon: <Layers size={20} /> },
    { id: 'monitor', label: 'Outreach Monitor', icon: <Activity size={20} /> },
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
            <h2>{isLoginMode ? 'Agency Login' : 'Create Agency Account'}</h2>
            <p className="text-muted mb-4">
              {isLoginMode ? 'Enter credentials to access workspace' : 'Register your agency to start using GrowthAI'}
            </p>
          </div>
          {error && <div className="error-alert">{error}</div>}
          
          {isLoginMode ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input type="email" placeholder="Work Email" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="admin-input" required />
              </div>
              <div className="form-group" style={{marginTop: '1rem'}}>
                <input type="password" placeholder="Password" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="admin-input" required />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{marginTop: '1.5rem'}}>
                {loading ? 'Authenticating...' : 'Access Workspace'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <input type="text" placeholder="Agency Name (e.g. Acme Marketing)" value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)} className="admin-input" required />
              </div>
              <div className="form-group" style={{marginTop: '1rem'}}>
                <input type="text" placeholder="Your Full Name" value={name}
                  onChange={(e) => setName(e.target.value)} className="admin-input" required />
              </div>
              <div className="form-group" style={{marginTop: '1rem'}}>
                <input type="email" placeholder="Work Email" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="admin-input" required />
              </div>
              <div className="form-group" style={{marginTop: '1rem'}}>
                <input type="password" placeholder="Create Password" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="admin-input" required />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{marginTop: '1.5rem'}}>
                {loading ? 'Creating Account...' : 'Register Agency'}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
             <button onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="text-muted" style={{background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline'}}>
               {isLoginMode ? "Don't have an agency? Sign Up" : "Already have an account? Log In"}
             </button>
             <br />
             <a href="/" className="text-muted" style={{display: 'inline-block', marginTop: '1rem', textDecoration: 'underline', fontSize: '0.9rem'}}>Return to Website</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar glass-panel ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Shield size={28} color="var(--primary)" />
            {sidebarOpen && <span>Growth<span className="text-gradient">AI</span> <span style={{ fontSize: '10px', opacity: 0.5 }}>v1.5</span></span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
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

        {/* Team Settings Section */}
        {activeSection === 'team' && (
          <TeamSettingsAdmin />
        )}

        {/* Leads Pipeline Section */}
        {activeSection === 'leads' && <Leads />}

        {/* Brand New SEO & Tech Signals Phase 5 Map */}
        {activeSection === 'signals' && (
          <SeoSignals />
        )}

        {/* Phase 6 Intelligence Map */}
        {activeSection === 'intelligence' && (
          <WebsiteIntelligence />
        )}

        {/* Phase 8 Sequences Builder */}
        {activeSection === 'sequences' && (
          <Sequences />
        )}

        {/* Phase 9 Outreach Monitor */}
        {activeSection === 'monitor' && (
          <OutreachMonitor />
        )}

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

const TeamSettingsAdmin = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/api/users`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API}/api/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(newUser)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setNewUser({ name: '', email: '', password: '', role: 'member' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><Users size={28} color="var(--accent)" /> Team <span className="text-gradient">Settings</span></h1>
        <p className="text-muted">Create logins for your team members so they can access this dashboard.</p>
      </div>
      
      {error && <div className="error-alert mb-4">{error}</div>}

      <div className="glass-panel admin-card mb-4">
        <h3>Add New Team Member</h3>
        <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Full Name" className="admin-input" 
                 value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
          <input type="email" placeholder="Email Address" className="admin-input" 
                 value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
          <input type="password" placeholder="Password" className="admin-input" 
                 value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
          <select className="admin-input" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      </div>

      <div className="glass-panel admin-card">
        <h3>Current Team Members</h3>
        <table className="admin-table mt-4" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{textAlign: 'left'}}>Name</th>
              <th style={{textAlign: 'left'}}>Email</th>
              <th style={{textAlign: 'left'}}>Role</th>
              <th style={{textAlign: 'left'}}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name || 'Unknown'}</td>
                <td>{u.email}</td>
                <td><span className={`status-badge ${u.role}`}>{u.role}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="4">No team members found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
