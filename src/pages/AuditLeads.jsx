import React, { useState, useEffect, useCallback } from 'react';
import { Search, Mail, Phone, Globe, BarChart3, Users, Target, TrendingDown, ExternalLink, Loader2 } from 'lucide-react';
import './AuditLeads.css';

const API = 'http://localhost:3001';

const AuditLeads = () => {
  const [token] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [audits, setAudits] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50, ...(search && { search }) });
      const res = await fetch(`${API}/api/audits?${params}`, { headers });
      const data = await res.json();
      setAudits(data.audits || []);
      setTotal(data.total || 0);
      setStats(data.stats || {});
    } catch (err) {
      console.error('Failed to fetch audits', err);
    }
    setLoading(false);
  }, [page, search, token]);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="leads-container">
      <div className="leads-header">
        <div>
          <h1>Audit <span className="text-gradient">Leads</span></h1>
          <p className="text-muted">Prospects who used the free website audit tool</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <Users size={24} color="var(--primary)" />
          <div>
            <span className="stat-number">{stats.total || 0}</span>
            <span className="stat-label text-muted">Total Audits</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <Mail size={24} color="var(--accent)" />
          <div>
            <span className="stat-number">{stats.with_email || 0}</span>
            <span className="stat-label text-muted">With Email</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <TrendingDown size={24} color="#ef4444" />
          <div>
            <span className="stat-number">{stats.poor_sites || 0}</span>
            <span className="stat-label text-muted">Poor Sites (&lt;40)</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <Target size={24} color="#f59e0b" />
          <div>
            <span className="stat-number">{stats.avg_score || '—'}</span>
            <span className="stat-label text-muted">Avg Score</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="filters-bar glass-panel">
        <div className="filter-group">
          <Search size={18} color="var(--text-muted)" />
          <input type="text" className="filter-input"
            placeholder="Search by URL, name, email..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <span className="results-count-inline">{total} audit{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="leads-table-wrapper glass-panel">
        {loading ? (
          <div className="table-loading"><Loader2 size={32} className="spin" /> Loading...</div>
        ) : audits.length === 0 ? (
          <div className="table-empty">
            <BarChart3 size={48} color="var(--text-muted)" />
            <p>No audit submissions yet. Share the audit tool link with prospects!</p>
          </div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th>Score</th>
                <th>Website</th>
                <th>Business</th>
                <th>Contact</th>
                <th>Issues</th>
                <th>Speed</th>
                <th>Date</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id} className={a.overall_score < 40 ? 'hot-row' : ''}>
                  <td>
                    <span className="audit-score-badge" style={{ background: getScoreColor(a.overall_score) + '22', color: getScoreColor(a.overall_score), borderColor: getScoreColor(a.overall_score) }}>
                      {a.grade} · {a.overall_score}
                    </span>
                  </td>
                  <td>
                    <a href={a.url} target="_blank" rel="noreferrer" className="website-link">
                      <Globe size={14} /> {a.url.replace(/https?:\/\//, '').substring(0, 35)}
                    </a>
                  </td>
                  <td className="name-cell">
                    <span className="lead-name">{a.business_name || '—'}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {a.contact_name && <div>{a.contact_name}</div>}
                      {a.contact_email && <a href={`mailto:${a.contact_email}`} className="phone-link"><Mail size={12} /> {a.contact_email}</a>}
                      {a.contact_phone && <a href={`tel:${a.contact_phone}`} className="phone-link"><Phone size={12} /> {a.contact_phone}</a>}
                      {!a.contact_name && !a.contact_email && <span className="text-muted">No contact info</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', display: 'flex', gap: '6px' }}>
                      {a.critical_issues > 0 && <span className="badge-critical">{a.critical_issues} critical</span>}
                      {a.warnings > 0 && <span className="badge-warning">{a.warnings} warn</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: getScoreColor(a.page_speed_performance || 0), fontWeight: 700 }}>
                      {a.page_speed_performance != null ? a.page_speed_performance : '—'}
                    </span>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td>
                    <a href={`${API}/api/audits/${a.id}`} target="_blank" rel="noreferrer" className="maps-link" title="View Full Report">
                      <ExternalLink size={16} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditLeads;
