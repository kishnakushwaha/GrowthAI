import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Download, Filter, Flame, Globe, Phone, MapPin, Star, 
  ExternalLink, Loader2, PlayCircle, X, ChevronLeft, ChevronRight,
  BarChart3, Users, AlertTriangle, TrendingUp, Mail, FileSpreadsheet, MessageCircle,
  Play, Square, CheckCircle2, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import './Leads.css';

import API, { WA_API } from '../config';

const Leads = () => {
  const [token] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [leads, setLeads] = useState([]);
  const [enrollments, setEnrollments] = useState({});
  const [sentPhones, setSentPhones] = useState({});
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({});
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [minRating, setMinRating] = useState('');
  const [hotOnly, setHotOnly] = useState(false);
  const [noWebsite, setNoWebsite] = useState(false);
  const [lowReviews, setLowReviews] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('scraped_at');
  const [sortDir, setSortDir] = useState('desc');

  // Scraper
  const [scrapeQuery, setScrapeQuery] = useState(() => sessionStorage.getItem('scrapeQuery') || '');
  const [scrapeCount, setScrapeCount] = useState(20);
  const [scraping, setScraping] = useState(false);
  const [scrapeLog, setScrapeLog] = useState([]);
  const [showScrapePanel, setShowScrapePanel] = useState(() => !!sessionStorage.getItem('activeScrapeJob'));
  const [activeJobId, setActiveJobId] = useState(() => sessionStorage.getItem('activeScrapeJob') || null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 50,
        sort_by: sortBy, sort_dir: sortDir,
        ...(search && { search }),
        ...(industry && { industry }),
        ...(minRating && { min_rating: minRating }),
        ...(hotOnly && { hot_only: 'true' }),
        ...(noWebsite && { no_website: 'true' }),
        ...(lowReviews && { low_reviews: 'true' }),
      });
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch(`${API}/api/leads?${params}`, { headers });
      const data = await res.json();
      setLeads(data.leads || []);
      setTotal(data.total || 0);
      setStats(data.stats || {});
      setIndustries(data.industries || []);
    } catch (err) {
      console.error('Failed to fetch leads', err);
    }
    setLoading(false);
  }, [page, sortBy, sortDir, search, industry, minRating, hotOnly, noWebsite, lowReviews, token]);

  const fetchEnrollments = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch(`${WA_API}/api/wa/enrollments`, { headers });
      const data = await res.json();
      const map = {};
      (data.enrollments || []).forEach(e => { map[e.lead_id] = e; });
      setEnrollments(map);
    } catch (err) { console.error('Failed to fetch enrollments'); }
  };

  const fetchSentPhones = async () => {
    try {
      const res = await fetch(`${WA_API}/api/wa/sent-phones`);
      const data = await res.json();
      const map = {};
      (data.phones || []).forEach(p => {
        // Normalize phone: strip leading 91 for 12-digit numbers
        let phone = p.phone;
        if (phone.length === 12 && phone.startsWith('91')) phone = phone.slice(2);
        map[phone] = p;
        map[p.phone] = p; // also keep original
      });
      setSentPhones(map);
    } catch (err) { console.error('Failed to fetch sent phones'); }
  };

  useEffect(() => { 
    fetchLeads(); 
    fetchEnrollments();
    fetchSentPhones();
  }, [fetchLeads]);

  const startWASequence = async (lead) => {
    if (!lead.phone || lead.phone === 'N/A') {
      alert("This lead doesn't have a valid phone number.");
      return;
    }
    setActionLoading(lead.id);
    try {
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch(`${WA_API}/api/wa/enroll`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          lead_id: lead.id,
          phone: lead.phone,
          biz_name: lead.place_name,
          city: lead.city 
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchEnrollments();
      } else {
        alert(data.error || "Failed to start sequence.");
      }
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const stopWASequence = async (leadId) => {
    setActionLoading(leadId);
    try {
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch(`${WA_API}/api/wa/stop`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ lead_id: leadId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchEnrollments();
      }
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  // Poll active scrape job
  useEffect(() => {
    if (!activeJobId) {
      setScraping(false);
      return;
    }
    
    sessionStorage.setItem('activeScrapeJob', activeJobId);
    setScraping(true);
    // Open the panel if there's an active job running in background
    setShowScrapePanel(true);
    
    // Fetch immediately on mount to not wait 2 seconds for first update UI
    const checkJob = async () => {
      try {
        const res = await fetch(`${API}/api/scrape/${activeJobId}`, { headers });
        const job = await res.json();
        setScrapeLog(job.output || []);
        if (job.status !== 'running') {
          setScraping(false);
          setActiveJobId(null);
          sessionStorage.removeItem('activeScrapeJob');
          fetchLeads(); // Refresh leads
        }
      } catch (err) { console.error(err); }
    };
    checkJob();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/scrape/${activeJobId}`, { headers });
        const job = await res.json();
        setScrapeLog(job.output || []);
        if (job.status !== 'running') {
          setScraping(false);
          setActiveJobId(null);
          sessionStorage.removeItem('activeScrapeJob');
          clearInterval(interval);
          fetchLeads(); // Refresh leads
        }
      } catch (err) { console.error(err); }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeJobId]);

  const startScrape = async () => {
    if (!scrapeQuery.trim()) return;
    setScraping(true);
    setScrapeLog(['Starting scraper...']);
    sessionStorage.setItem('scrapeQuery', scrapeQuery);
    try {
      const res = await fetch(`${API}/api/scrape`, {
        method: 'POST', headers,
        body: JSON.stringify({ query: scrapeQuery, count: scrapeCount })
      });
      const data = await res.json();
      setActiveJobId(data.jobId);
    } catch (err) {
      setScrapeLog(['Failed to start scraper']);
      setScraping(false);
    }
  };

  const fetchExportData = async () => {
    const res = await fetch(`${API}/api/leads/export`, { headers });
    if (!res.ok) throw new Error('Export failed to fetch');
    const textData = await res.text();
    // Parse CSV into rows array
    const rows = textData.split('\n').map(row => row.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));
    return rows;
  };

  const exportCSV = async () => {
    try {
      const res = await fetch(`${API}/api/leads/export`, { headers });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads_export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    }
  };

  const exportExcel = async () => {
    try {
      const rows = await fetchExportData();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");
      XLSX.writeFile(wb, "leads_export.xlsx");
    } catch (err) {
      console.error('Excel export failed:', err);
      alert('Excel export failed. Please try again.');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="leads-container">
      {/* Header */}
      <div className="leads-header">
        <div>
          <h1>Lead <span className="text-gradient">Pipeline</span></h1>
          <p className="text-muted">Scrape, filter, and manage your prospect database</p>
        </div>
        <div className="leads-header-actions">
          <button className="btn btn-secondary" onClick={exportExcel}>
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={18} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowScrapePanel(!showScrapePanel)}>
            <PlayCircle size={18} /> New Scrape
          </button>
        </div>
      </div>

      {/* Scrape Panel */}
      {showScrapePanel && (
        <div className="scrape-panel glass-panel">
          <div className="scrape-panel-header">
            <h3>🔍 Run Google Maps Scraper</h3>
            <button onClick={() => setShowScrapePanel(false)}><X size={20} color="var(--text-muted)" /></button>
          </div>
          <div className="scrape-form">
            <div className="scrape-input-group">
              <input
                type="text" className="admin-input"
                placeholder="e.g. Dentist in Delhi, Coaching Institute in Noida..."
                value={scrapeQuery}
                onChange={(e) => setScrapeQuery(e.target.value)}
                disabled={scraping}
              />
              <input
                type="number" className="admin-input count-input"
                placeholder="Count"
                value={scrapeCount}
                onChange={(e) => setScrapeCount(parseInt(e.target.value) || 10)}
                disabled={scraping}
                min={5} max={100}
              />
              <button className="btn btn-primary" onClick={startScrape} disabled={scraping || !scrapeQuery.trim()}>
                {scraping ? <><Loader2 size={18} className="spin" /> Scraping...</> : <><Search size={18} /> Start</>}
              </button>
            </div>
          </div>
          {scrapeLog.length > 0 && (
            <div className="scrape-log">
              {scrapeLog.map((line, i) => (
                <div key={i} className={`log-line ${line.startsWith('ERROR') ? 'log-error' : line.startsWith('✅') ? 'log-success' : ''}`}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <Users size={24} color="var(--primary)" />
          <div>
            <span className="stat-number">{stats.total || 0}</span>
            <span className="stat-label text-muted">Total Leads</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <Flame size={24} color="#ef4444" />
          <div>
            <span className="stat-number">{stats.hot_leads || 0}</span>
            <span className="stat-label text-muted">Hot Leads</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <AlertTriangle size={24} color="#f59e0b" />
          <div>
            <span className="stat-number">{stats.no_website || 0}</span>
            <span className="stat-label text-muted">No Website</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <TrendingUp size={24} color="var(--accent)" />
          <div>
            <span className="stat-number">{stats.avg_rating || '—'}</span>
            <span className="stat-label text-muted">Avg Rating</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar glass-panel">
        <div className="filter-group">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text" className="filter-input"
            placeholder="Search by name, address, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} color="var(--text-muted)" />
          <select
            className="filter-select"
            value={industry}
            onChange={(e) => { setIndustry(e.target.value); setPage(1); }}
          >
            <option value="">All Industries</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <Star size={18} color="var(--text-muted)" />
          <select
            className="filter-select"
            value={minRating}
            onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
          >
            <option value="">Any Rating</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>
        </div>
        <button
          className={`filter-btn ${hotOnly ? 'active' : ''}`}
          onClick={() => { setHotOnly(!hotOnly); setPage(1); }}
        >
          <Flame size={16} /> Hot Leads
        </button>
        <button
          className={`filter-btn ${noWebsite ? 'active' : ''}`}
          onClick={() => { setNoWebsite(!noWebsite); setPage(1); }}
        >
          <Globe size={16} /> No Website
        </button>
        <button
          className={`filter-btn ${lowReviews ? 'active review-btn' : 'review-btn'}`}
          onClick={() => { setLowReviews(!lowReviews); setPage(1); }}
        >
          <Star size={16} /> &lt;15 Reviews
        </button>
      </div>

      {/* Results Count */}
      <div className="results-count">
        <span className="results-count-number">{total}</span>
        <span className="results-count-label">
          {total === 1 ? 'lead' : 'leads'} found
          {(search || industry || minRating || hotOnly || noWebsite || lowReviews) && ` (filtered from ${stats.total || 0} total)`}
        </span>
      </div>

      {/* Leads Table */}
      <div className="leads-table-wrapper glass-panel">
        {loading ? (
          <div className="table-loading"><Loader2 size={32} className="spin" /> Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="table-empty">
            <BarChart3 size={48} color="var(--text-muted)" />
            <p>No leads found. Run a scrape or adjust your filters.</p>
          </div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('place_name')}>
                  Business {sortBy === 'place_name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="sortable" onClick={() => handleSort('rating')}>
                  Rating {sortBy === 'rating' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="sortable" onClick={() => handleSort('reviews')}>
                  Reviews {sortBy === 'reviews' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th>Phone</th>
                <th>Website</th>
                <th>Address</th>
                <th>Status</th>
                <th style={{ minWidth: '200px', width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className={lead.is_hot_lead ? 'hot-row' : ''}>
                  <td className="name-cell">
                    <span className="lead-name">{lead.place_name}</span>
                    <span className="lead-industry text-muted">{lead.industry}</span>
                  </td>
                  <td>
                    <div className="rating-cell">
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                      <span>{lead.rating !== 'N/A' ? lead.rating : '—'}</span>
                    </div>
                  </td>
                  <td>{lead.reviews || '0'}</td>
                  <td>
                    {lead.phone !== 'N/A' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a href={`tel:${lead.phone}`} className="phone-link">
                          <Phone size={14} /> {lead.phone}
                        </a>
                        {(() => {
                          const cleanPhone = lead.phone?.replace(/[^0-9]/g, '') || '';
                          const sent = sentPhones[cleanPhone] || sentPhones['91' + cleanPhone];
                          if (sent) return (
                            <span style={{ 
                              fontSize: '9px', fontWeight: 'bold', padding: '2px 5px', 
                              borderRadius: '4px', background: '#059669', color: '#fff',
                              whiteSpace: 'nowrap'
                            }}>
                              ✓ SENT{sent.count > 1 ? ` x${sent.count}` : ''}
                            </span>
                          );
                          return null;
                        })()}
                      </div>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    {lead.website && lead.website !== 'N/A' ? (
                      <a href={lead.website} target="_blank" rel="noreferrer" className="website-link">
                        <Globe size={14} /> Visit
                      </a>
                    ) : (
                      <span className="no-website-badge">No Website</span>
                    )}
                  </td>
                  <td className="address-cell">
                    <MapPin size={14} color="var(--text-muted)" />
                    <span>{lead.address !== 'N/A' ? lead.address : '—'}</span>
                  </td>
                  <td>
                    {lead.is_hot_lead ? (
                      <span className="hot-badge"><Flame size={14} /> Hot</span>
                    ) : (
                      <span className="cold-badge">Normal</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: 'max-content', paddingRight: '8px' }}>
                      {lead.maps_url && (
                        <a href={lead.maps_url} target="_blank" rel="noreferrer" className="maps-link" title="Open in Google Maps" style={{ flexShrink: 0 }}>
                          <ExternalLink size={16} />
                        </a>
                      )}
                      <button 
                        className="email-action-btn"
                        title="Send Email"
                        onClick={() => {
                          const targetEmail = lead.email && lead.email !== 'N/A' ? lead.email : '';
                          const businessName = lead.place_name || '';
                          window.location.hash = `#emails?email=${encodeURIComponent(targetEmail)}&business=${encodeURIComponent(businessName)}`;
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: '4px', borderRadius: '4px', flexShrink: 0 }}
                      >
                        <Mail size={16} />
                      </button>
                      <button 
                        className="email-action-btn"
                        title="WhatsApp Outreach"
                        onClick={() => {
                          const targetPhone = lead.phone && lead.phone !== 'N/A' ? lead.phone : '';
                          const businessName = lead.place_name || '';
                          
                          // Improved Smart City Extraction
                          const findCity = (addr, ind) => {
                            const combined = `${addr || ''} ${ind || ''}`.toLowerCase();
                            
                            // 1. High Priority: Explicit Indian Cities
                            const commonCities = [
                              'Delhi', 'Noida', 'Gurgaon', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 
                              'Chennai', 'Kolkata', 'Jaipur', 'Lucknow', 'Ahmedabad', 'Chandigarh',
                              'Prayagraj', 'Allahabad', 'Varanasi', 'Kanpur', 'Agra', 'Indore', 'Bhopal'
                            ];
                            
                            for (const c of commonCities) {
                              if (combined.includes(c.toLowerCase())) return c;
                            }

                            // 2. Medium Priority: Extract word after "in " (e.g. "Dentists in Prayagraj")
                            const inMatch = ind?.match(/in\s+([A-Z][a-z]+)/);
                            if (inMatch) return inMatch[1];
                            
                            // 3. Fallback: Parse from Address
                            if (!addr || addr === 'N/A') return 'your city';
                            const parts = addr.split(',').map(s => s.trim());
                            if (parts.length >= 2) {
                              // Often city is the 2nd to last part (before State/Zip)
                              const possible = parts[parts.length - 2]; 
                              if (possible && !/^\d+$/.test(possible) && possible.length > 2) return possible;
                            }
                            return parts[0]; 
                          };

                          const cityName = findCity(lead.address, lead.industry);
                          window.location.hash = `#whatsapp?phone=${encodeURIComponent(targetPhone)}&business=${encodeURIComponent(businessName)}&city=${encodeURIComponent(cityName)}`;
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#25D366', padding: '4px', borderRadius: '4px', flexShrink: 0 }}
                      >
                        <MessageCircle size={16} />
                      </button>

                      {/* START/STOP AUTOMATION BUTTONS */}
                      <div className="automation-controls" style={{ display: 'flex', gap: '6px', marginLeft: '6px', borderLeft: '1px solid var(--border-light)', paddingLeft: '8px', flexShrink: 0, alignItems: 'center' }}>
                        {enrollments[lead.id]?.status === 'active' ? (
                          <button 
                            onClick={() => stopWASequence(lead.id)}
                            disabled={actionLoading === lead.id}
                            title="Stop Automated Sequence"
                            style={{ background: '#fee2e2', border: 'none', padding: '4px', borderRadius: '4px', color: '#dc2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '24px', minHeight: '24px', flexShrink: 0 }}
                          >
                            <Square size={14} fill="#dc2626" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => startWASequence(lead)}
                            disabled={actionLoading === lead.id || lead.phone === 'N/A' || !lead.phone}
                            title="Start 3-Step WhatsApp Sequence"
                            style={{ background: '#ecfdf5', border: 'none', padding: '4px', borderRadius: '4px', color: '#059669', cursor: 'pointer', opacity: (lead.phone === 'N/A' || !lead.phone) ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '24px', minHeight: '24px', flexShrink: 0 }}
                          >
                            {actionLoading === lead.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="#059669" />}
                          </button>
                        )}
                        
                        {enrollments[lead.id] && (
                          <div style={{ fontSize: '10px', color: enrollments[lead.id].status === 'active' ? '#059669' : '#6b7280', display: 'flex', alignItems: 'center', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {enrollments[lead.id].status === 'active' ? `STEP ${enrollments[lead.id].current_step}` : 'PAUSED'}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="page-btn">
              <ChevronLeft size={18} />
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="page-btn">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leads;
