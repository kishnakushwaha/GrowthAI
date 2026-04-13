import React, { useState, useEffect } from 'react';
import { Globe, AlertTriangle, Monitor, Code, Target, Copy, LayoutDashboard, Search, ExternalLink } from 'lucide-react';
import API from '../config';
import './Leads.css';

const SeoSignals = () => {
  const [token] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSignals();
  }, [token]);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API}/api/signals`, { headers });
      const data = await res.json();
      setSignals(data.signals || []);
    } catch (err) {
      console.error('Failed to fetch signals', err);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getLinkInfo = (url) => {
    if (!url || url === 'N/A') return null;
    const lowerUrl = url.toLowerCase();
    let Icon = Globe;
    let label = 'View Website';

    // Legacy Lucide fallback: using Globe for all as social icons are missing in v1.7.0
    if (lowerUrl.includes('instagram.com')) { label = 'Instagram'; }
    else if (lowerUrl.includes('facebook.com')) { label = 'Facebook'; }
    else if (lowerUrl.includes('youtube.com')) { label = 'YouTube'; }
    else if (lowerUrl.includes('linkedin.com')) { label = 'LinkedIn'; }

    return { Icon, label };
  };

  const filteredSignals = signals.filter(s => {
    const nameStr = s.businesses?.place_name?.toLowerCase() || '';
    const cmsStr = s.cms_stack?.toLowerCase() || '';
    return nameStr.includes(searchTerm.toLowerCase()) || cmsStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="admin-page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1><Globe size={28} color="var(--primary)" /> Tech & <span className="text-gradient">SEO Signals</span></h1>
          <p className="text-muted">Analyze deep website metrics, CMS stacks, and Ad trackers.</p>
        </div>
        
        <div className="scrape-input-group" style={{ maxWidth: '300px' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Filter by name or CMS..." 
            className="scrape-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card glass-panel leads-table-wrapper">
        {loading ? (
          <div className="table-loading">
            <div className="spin"><Globe size={32} color="var(--primary)" /></div>
            <p>Scanning technical matrices...</p>
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="table-empty">
            <LayoutDashboard size={48} className="text-muted" style={{ opacity: 0.5 }} />
            <h3>No enriched data yet</h3>
            <p>Run a fresh Google Maps scrape to extract deep metrics!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Business & Domain</th>
                  <th>CMS Stack</th>
                  <th>Pixel & Ads</th>
                  <th>Technical Fundamentals</th>
                  <th>Speed & SEO Scale</th>
                  <th>AI Icebreaker</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignals.map(sig => (
                  <tr key={sig.id}>
                    <td className="name-cell">
                      <span className="lead-name">{sig.businesses?.place_name}</span>
                      <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block' }}>{sig.businesses?.industry}</span>
                      {(() => {
                        const linkData = getLinkInfo(sig.businesses?.website);
                        if (!linkData) return null;
                        const href = sig.businesses.website.startsWith('http') ? sig.businesses.website : `https://${sig.businesses.website}`;
                        return (
                          <a href={href} target="_blank" rel="noreferrer" className="website-link" style={{ marginTop: '6px', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <linkData.Icon size={12} /> {linkData.label}
                          </a>
                        );
                      })()}
                    </td>
                    
                    <td>
                      <span className={`hot-badge`} style={{ 
                        background: sig.cms_stack === 'WordPress' ? 'rgba(37, 99, 235, 0.2)' : 
                                   sig.cms_stack === 'Shopify' ? 'rgba(34, 197, 94, 0.2)' : 
                                   sig.cms_stack === 'Wix' ? 'rgba(156, 163, 175, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: sig.cms_stack === 'WordPress' ? '#60a5fa' : 
                               sig.cms_stack === 'Shopify' ? '#4ade80' : 
                               sig.cms_stack === 'Wix' ? '#d1d5db' : '#9ca3af',
                      }}>
                        <Code size={12} /> {sig.cms_stack || 'Custom / Unknown'}
                      </span>
                    </td>
                    
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        {sig.has_fb_pixel ? (
                          <span style={{ fontSize: '0.8rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Target size={14} /> Meta / FB Pixel Found
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Meta Pixel</span>
                        )}
                        {sig.has_google_ads ? (
                          <span style={{ fontSize: '0.8rem', color: '#facc15', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Monitor size={14} /> G-Tag / Ads Found
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Google G-Tag</span>
                        )}
                      </div>
                    </td>

                    <td>
                       <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        {sig.seo_missing_h1 ? (
                          <span style={{ fontSize: '0.8rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={14} /> Missing H1 Tag
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>H1 Valid</span>
                        )}
                        {sig.seo_missing_meta_desc ? (
                          <span style={{ fontSize: '0.8rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={14} /> Missing Meta Desc
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>Meta Valid</span>
                        )}
                        {sig.title_quality === 'generic' ? (
                          <span style={{ fontSize: '0.8rem', color: '#f97316', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={14} /> Generic Page Title
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>Title Valid</span>
                        )}
                      </div>
                    </td>

                    <td>
                       <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          <span className="hot-badge" style={{ 
                            background: (sig.seo_score >= 7) ? 'rgba(239, 68, 68, 0.2)' : (sig.seo_score >= 4) ? 'rgba(249, 115, 22, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            color: (sig.seo_score >= 7) ? '#ef4444' : (sig.seo_score >= 4) ? '#f97316' : '#4ade80'
                          }}>
                             {sig.seo_score || 0}/10 Penalty
                          </span>
                          
                          {sig.pagespeed_mobile ? (
                            <span className="hot-badge" style={{
                               background: sig.pagespeed_mobile < 50 ? 'rgba(239, 68, 68, 0.2)' : sig.pagespeed_mobile < 90 ? 'rgba(250, 204, 21, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                               color: sig.pagespeed_mobile < 50 ? '#ef4444' : sig.pagespeed_mobile < 90 ? '#facc15' : '#4ade80'
                            }}>
                              {sig.pagespeed_mobile}/100 Mobile Speed
                            </span>
                          ) : (
                             <span className="text-muted" style={{ fontSize: '0.8rem' }}>Untested Speed</span>
                          )}
                       </div>
                    </td>
                    
                    <td style={{ width: '40%', whiteSpace: 'normal', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                      {sig.ai_first_line ? (
                        <div style={{ position: 'relative', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', borderLeft: '2px solid var(--primary)' }}>
                          <span style={{ display: 'block', marginBottom: '8px', fontStyle: 'italic' }}>"{sig.ai_first_line}"</span>
                          <button onClick={() => copyToClipboard(sig.ai_first_line)} className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)' }}>
                            <Copy size={12} /> Copy Pitch
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">No AI pitch generated.</span>
                      )}
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

// Local ExternalLink removed to avoid collision with Lucide import

export default SeoSignals;
