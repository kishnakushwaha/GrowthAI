import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, AlertTriangle, CheckCircle, Search, Mail, EyeOff, LayoutDashboard, Copy, Zap, MessageCircle, Code, Monitor, ExternalLink, Globe, PlusSquare, Play, X, Loader2 } from 'lucide-react';
import API from '../config';
import './Leads.css';

const WebsiteIntelligence = () => {
  const [token] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('no_tracking');
  const [search, setSearch] = useState('');
  const [enrollingLead, setEnrollingLead] = useState(null); // Lead being enrolled
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [refreshingId, setRefreshingId] = useState(null);

  useEffect(() => {
    fetchIntelligence();
    fetchCampaigns();
  }, [token]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API}/api/sequences/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCampaigns(data || []);
    } catch (err) {
      console.error('Failed to fetch campaigns', err);
    }
  };

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API}/api/signals`, { headers });
      const data = await res.json();
      setLeads(data.signals || []);
    } catch (err) {
      console.error('Failed to fetch intelligence', err);
    }
    setLoading(false);
  };

  const handleRefreshIntel = async (leadId) => {
    // leadId should be the business_id
    const targetId = leadId.businesses?.id || leadId;
    setRefreshingId(targetId);
    try {
      const res = await fetch(`${API}/api/intelligence/enrich/${targetId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => (l.businesses?.id === targetId || l.lead_id === targetId) ? data.updated : l));
      } else {
        alert(data.error || 'Enrichment failed');
      }
    } catch (err) { 
      console.error(err); 
    } finally {
      setRefreshingId(null);
    }
  };

  const enrollInCampaign = async () => {
    if (!selectedCampaign || !enrollingLead) return;
    setEnrolling(true);
    try {
      const res = await fetch(`${API}/api/sequences/enroll`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          campaign_id: selectedCampaign,
          lead_id: enrollingLead.businesses?.id || enrollingLead.business_id
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Lead enrolled successfully! Automation will begin shortly.');
        setEnrollingLead(null);
      } else {
        alert(data.error || 'Failed to enroll lead');
      }
    } catch (err) {
      alert('Network error during enrollment');
    }
    setEnrolling(false);
  };

  const getLinkInfo = (url) => {
    if (!url || url === 'N/A') return null;
    const lowerUrl = url.toLowerCase();
    let Icon = Globe;
    let label = 'View Website';

    if (lowerUrl.includes('instagram.com')) { label = 'Instagram'; }
    else if (lowerUrl.includes('facebook.com')) { label = 'Facebook'; }
    else if (lowerUrl.includes('youtube.com')) { label = 'YouTube'; }
    else if (lowerUrl.includes('linkedin.com')) { label = 'LinkedIn'; }

    return { Icon, label };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const counts = {
    ads_no_retargeting: leads.filter(l => l.opportunity_type === 'ads_no_retargeting').length,
    no_tracking: leads.filter(l => l.opportunity_type === 'no_tracking').length,
    tracking_ok_seo_weak: leads.filter(l => l.opportunity_type === 'tracking_ok_seo_weak').length,
    well_optimized: leads.filter(l => l.opportunity_type === 'well_optimized').length,
  };

  const displayedLeads = leads.filter(l => 
    l.opportunity_type === activeTab && 
    (l.businesses?.place_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1><Target size={28} color="#f59e0b" /> Website <span className="text-gradient">Intelligence</span></h1>
          <p className="text-muted">Algorithmically classified leads based on Urgency & Deal size. Send AI-pre-written Pitches.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div className={`admin-card metric-card ${activeTab === 'ads_no_retargeting' ? 'active-segment' : ''}`} 
             style={{ cursor: 'pointer', border: activeTab === 'ads_no_retargeting' ? '2px solid #facc15' : '' }}
             onClick={() => setActiveTab('ads_no_retargeting')}>
          <div className="metric-icon" style={{ background: 'rgba(250, 204, 21, 0.15)' }}><TrendingUp color="#facc15" size={24} /></div>
          <div>
            <h3>{counts.ads_no_retargeting}</h3>
            <p style={{ color: '#facc15', fontSize: '0.9rem', fontWeight: 'bold' }}>🟡 High Spend, No Pixels</p>
          </div>
        </div>

        <div className={`admin-card metric-card ${activeTab === 'no_tracking' ? 'active-segment' : ''}`} 
             style={{ cursor: 'pointer', border: activeTab === 'no_tracking' ? '2px solid #ef4444' : '' }}
             onClick={() => setActiveTab('no_tracking')}>
          <div className="metric-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}><EyeOff color="#ef4444" size={24} /></div>
          <div>
            <h3>{counts.no_tracking}</h3>
            <p style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 'bold' }}>🔴 Completely Blind</p>
          </div>
        </div>

        <div className={`admin-card metric-card ${activeTab === 'tracking_ok_seo_weak' ? 'active-segment' : ''}`}
             style={{ cursor: 'pointer', border: activeTab === 'tracking_ok_seo_weak' ? '2px solid #f97316' : '' }}
             onClick={() => setActiveTab('tracking_ok_seo_weak')}>
          <div className="metric-icon" style={{ background: 'rgba(249, 115, 22, 0.15)' }}><AlertTriangle color="#f97316" size={24} /></div>
          <div>
            <h3>{counts.tracking_ok_seo_weak}</h3>
            <p style={{ color: '#f97316', fontSize: '0.9rem', fontWeight: 'bold' }}>🟠 Tracking OK, Weak SEO</p>
          </div>
        </div>

        <div className={`admin-card metric-card ${activeTab === 'well_optimized' ? 'active-segment' : ''}`}
             style={{ cursor: 'pointer', border: activeTab === 'well_optimized' ? '2px solid #22c55e' : '' }}
             onClick={() => setActiveTab('well_optimized')}>
          <div className="metric-icon" style={{ background: 'rgba(34, 197, 94, 0.15)' }}><CheckCircle color="#22c55e" size={24} /></div>
          <div>
            <h3>{counts.well_optimized}</h3>
            <p style={{ color: '#22c55e', fontSize: '0.9rem', fontWeight: 'bold' }}>🟢 Well Optimized (Skip)</p>
          </div>
        </div>
      </div>

      <div className="admin-card glass-panel leads-table-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
            {activeTab === 'ads_no_retargeting' && 'Running Ads with Broken Retargeting'}
            {activeTab === 'no_tracking' && 'Zero Tracking Installed'}
            {activeTab === 'tracking_ok_seo_weak' && 'Losing Organic Traffic'}
            {activeTab === 'well_optimized' && 'Healthy Digital Footprint'}
          </h2>
          <div className="scrape-input-group" style={{ width: '250px' }}>
            <Search size={16} className="text-muted" />
            <input type="text" placeholder="Search..." className="scrape-input" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="table-loading">
            <div className="spin"><LayoutDashboard size={32} /></div>
            <p>Clustering Intelligence...</p>
          </div>
        ) : displayedLeads.length === 0 ? (
          <div className="table-empty">
            <CheckCircle size={48} className="text-muted" style={{ opacity: 0.5 }} />
            <h3>No Leads in this Segment</h3>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>CMS Stack</th>
                  <th>Pixel & Ads</th>
                  <th>SEO Penalty</th>
                  <th>Speed</th>
                  <th>AI Human Summary</th>
                  <th>AI Icebreaker</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedLeads.map(lead => (
                  <tr key={lead.id}>
                    <td className="name-cell">
                      <span className="lead-name">{lead.businesses?.place_name}</span>
                      <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block' }}>{lead.businesses?.industry}</span>
                      {(() => {
                        const linkData = getLinkInfo(lead.businesses?.website);
                        if (!linkData) return null;
                        const href = lead.businesses.website.startsWith('http') ? lead.businesses.website : `https://${lead.businesses.website}`;
                        return (
                          <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: 'var(--primary)', textDecoration: 'none' }}>
                            <linkData.Icon size={12} /> {linkData.label}
                          </a>
                        );
                      })()}
                    </td>
                    
                    <td>
                      <span className={`hot-badge`} style={{ 
                        background: lead.cms_stack === 'WordPress' ? 'rgba(37, 99, 235, 0.2)' : lead.cms_stack === 'Shopify' ? 'rgba(34, 197, 94, 0.2)' : lead.cms_stack === 'Wix' ? 'rgba(156, 163, 175, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: lead.cms_stack === 'WordPress' ? '#60a5fa' : lead.cms_stack === 'Shopify' ? '#4ade80' : lead.cms_stack === 'Wix' ? '#d1d5db' : '#9ca3af',
                      }}>
                        <Code size={12} /> {lead.cms_stack || 'Custom'}
                      </span>
                    </td>
                    
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        {lead.has_fb_pixel ? <span style={{ fontSize: '0.8rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}><Target size={14} /> Meta Pixel Found</span> : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Meta Pixel</span>}
                        {lead.has_google_ads ? <span style={{ fontSize: '0.8rem', color: '#facc15', display: 'flex', alignItems: 'center', gap: '4px' }}><Monitor size={14} /> G-Tag Found</span> : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Google G-Tag</span>}
                      </div>
                    </td>

                    <td>
                      <span className="hot-badge" style={{ 
                        background: (lead.seo_score >= 7) ? 'rgba(239, 68, 68, 0.2)' : (lead.seo_score >= 4) ? 'rgba(249, 115, 22, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: (lead.seo_score >= 7) ? '#ef4444' : (lead.seo_score >= 4) ? '#f97316' : '#4ade80'
                      }}>
                         {lead.seo_score || 0}/10 Penalty
                      </span>
                    </td>

                    <td>
                      {lead.pagespeed_mobile ? (
                        <span className="hot-badge" style={{
                           background: lead.pagespeed_mobile < 50 ? 'rgba(239, 68, 68, 0.2)' : lead.pagespeed_mobile < 90 ? 'rgba(250, 204, 21, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                           color: lead.pagespeed_mobile < 50 ? '#ef4444' : lead.pagespeed_mobile < 90 ? '#facc15' : '#4ade80'
                        }}>
                          <Zap size={12}/> {lead.pagespeed_mobile}%
                        </span>
                      ) : <span className="text-muted" style={{ fontSize: '0.8rem' }}>Untested</span>}
                    </td>

                    <td style={{ width: '25%', whiteSpace: 'normal', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      {lead.ai_human_summary ? lead.ai_human_summary : <span className="text-muted italic">Click Analyze to generate...</span>}
                    </td>
                    
                    <td style={{ width: '25%', whiteSpace: 'normal', lineHeight: '1.4' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontStyle: 'italic', display: 'block', flex: 1, color: lead.ai_first_line ? 'inherit' : 'rgba(255,255,255,0.3)' }}>
                          {lead.ai_first_line ? `"${lead.ai_first_line}"` : "No Icebreaker available."}
                        </span>
                        {lead.ai_first_line && (
                          <button onClick={() => copyToClipboard(lead.ai_first_line)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)' }} title="Copy Icebreaker">
                            <Copy size={12} />
                          </button>
                        )}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          className="btn-icon" 
                          style={{ background: refreshingId === lead.businesses?.id ? 'var(--bg-surface)' : 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                          onClick={() => handleRefreshIntel(lead.businesses?.id)}
                          disabled={refreshingId === lead.businesses?.id}
                          title="Generate AI Analysis"
                        >
                          {refreshingId === lead.businesses?.id ? <Loader2 size={16} className="spin" /> : <Zap size={16} />}
                        </button>
                        <button 
                           className="btn-icon" 
                           style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                           onClick={() => setEnrollingLead(lead)}
                           title="Enroll in Sequence"
                        >
                           <PlusSquare size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {enrollingLead && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' }}>
          <div className="admin-card glass-panel" style={{ width: '450px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setEnrollingLead(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={24} /></button>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}><Play size={24} color="var(--primary)" /> Enroll Lead</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Enrolling <strong>{enrollingLead.businesses?.place_name}</strong> into automation.</p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select Campaign</label>
              <select className="scrape-input" style={{ width: '100%', padding: '10px' }} value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
                <option value="">-- Choose a Campaign --</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" style={{ flex: 1, padding: '12px' }} disabled={!selectedCampaign || enrolling} onClick={enrollInCampaign}>{enrolling ? 'Enrolling...' : 'Start Automation'}</button>
              <button className="btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={() => setEnrollingLead(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteIntelligence;
