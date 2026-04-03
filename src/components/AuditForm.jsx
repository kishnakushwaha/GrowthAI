import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuditForm.css';

import API from '../config';

const AuditForm = () => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          business_name: businessName,
          contact_name: name,
          contact_email: email,
          contact_phone: phone
        })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Audit failed');
      }
    } catch (err) {
      setError('Network error — please try again.');
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getGradeEmoji = (grade) => {
    const map = { A: '🏆', B: '👍', C: '⚠️', D: '👎', F: '🚨' };
    return map[grade] || '❓';
  };

  return (
    <section id="audit" className="audit-section">
      <div className="container">
        <div className="section-label">FREE TOOL</div>
        <h2>Get Your <span className="text-gradient">Free Website Audit</span></h2>
        <p className="section-subtitle">
          Discover what's holding your website back. Get an instant, AI-powered analysis with actionable recommendations.
        </p>

        {!result ? (
          <form className="audit-form glass-panel" onSubmit={handleSubmit}>
            <div className="audit-form-grid">
              <div className="audit-form-group full-width">
                <label>Website URL *</label>
                <input
                  type="text" className="audit-input"
                  placeholder="e.g. www.yourbusiness.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
              <div className="audit-form-group">
                <label>Business Name</label>
                <input type="text" className="audit-input" placeholder="Your Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div className="audit-form-group">
                <label>Your Name</label>
                <input type="text" className="audit-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="audit-form-group">
                <label>Email</label>
                <input type="email" className="audit-input" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="audit-form-group">
                <label>Phone</label>
                <input type="tel" className="audit-input" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            {error && <div className="audit-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-lg audit-submit" disabled={loading}>
              {loading ? (
                <><span className="audit-spinner"></span> Analyzing your website...</>
              ) : (
                '🔍 Run Free Audit Now'
              )}
            </button>
            {loading && (
              <p className="audit-wait-text">This takes 15-30 seconds — we're running a deep analysis...</p>
            )}
          </form>
        ) : (
          <div className="audit-results glass-panel">
            {/* Score Section */}
            <div className="audit-score-header">
              <div className="audit-score-ring" style={{ '--score-color': getScoreColor(result.overallScore) }}>
                <svg viewBox="0 0 120 120" className="score-svg">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={getScoreColor(result.overallScore)} strokeWidth="8"
                    strokeDasharray={`${(result.overallScore / 100) * 339} 339`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="score-text">
                  <span className="score-number">{result.overallScore}</span>
                  <span className="score-label">/100</span>
                </div>
              </div>
              <div className="audit-score-info">
                <h3>{getGradeEmoji(result.grade)} Grade: {result.grade}</h3>
                <p className="audit-url">{result.url}</p>
                <div className="audit-summary-badges">
                  <span className="badge-critical">{result.summary.critical} Critical</span>
                  <span className="badge-warning">{result.summary.warnings} Warnings</span>
                  <span className="badge-pass">{result.summary.passed} Passed</span>
                </div>
              </div>
            </div>

            {/* PageSpeed Scores */}
            {result.pageSpeed && (
              <div className="pagespeed-grid">
                <div className="pagespeed-card">
                  <div className="ps-score" style={{ color: getScoreColor(result.pageSpeed.performance) }}>{result.pageSpeed.performance}</div>
                  <div className="ps-label">Performance</div>
                </div>
                <div className="pagespeed-card">
                  <div className="ps-score" style={{ color: getScoreColor(result.pageSpeed.seo) }}>{result.pageSpeed.seo}</div>
                  <div className="ps-label">SEO</div>
                </div>
                <div className="pagespeed-card">
                  <div className="ps-score" style={{ color: getScoreColor(result.pageSpeed.accessibility) }}>{result.pageSpeed.accessibility}</div>
                  <div className="ps-label">Accessibility</div>
                </div>
                <div className="pagespeed-card">
                  <div className="ps-score" style={{ color: getScoreColor(result.pageSpeed.bestPractices) }}>{result.pageSpeed.bestPractices}</div>
                  <div className="ps-label">Best Practices</div>
                </div>
              </div>
            )}

            {/* Speed Metrics */}
            {result.pageSpeed && (
              <div className="speed-metrics">
                <div className="speed-metric">
                  <span className="sm-label">First Paint</span>
                  <span className="sm-value">{result.pageSpeed.fcp}</span>
                </div>
                <div className="speed-metric">
                  <span className="sm-label">Largest Paint</span>
                  <span className="sm-value">{result.pageSpeed.lcp}</span>
                </div>
                <div className="speed-metric">
                  <span className="sm-label">Layout Shift</span>
                  <span className="sm-value">{result.pageSpeed.cls}</span>
                </div>
                <div className="speed-metric">
                  <span className="sm-label">Speed Index</span>
                  <span className="sm-value">{result.pageSpeed.speedIndex}</span>
                </div>
              </div>
            )}

            {/* Detailed Checks */}
            <div className="audit-checks">
              <h3>Detailed Analysis</h3>
              {['critical', 'warning', 'good'].map(severity => {
                const items = result.checks.filter(c => c.severity === severity);
                if (items.length === 0) return null;
                return (
                  <div key={severity} className="checks-group">
                    <h4 className={`checks-group-title severity-${severity}`}>
                      {severity === 'critical' ? '🚨 Critical Issues' : severity === 'warning' ? '⚠️ Warnings' : '✅ Passed'}
                    </h4>
                    {items.map((check, i) => (
                      <div key={i} className={`check-item severity-${check.severity}`}>
                        <div className="check-header">
                          <span className="check-category">{check.category}</span>
                          <span className="check-name">{check.item}</span>
                        </div>
                        <p className="check-message">{check.message}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="audit-cta">
              <h3>Want us to fix these issues?</h3>
              <p>Our team can improve your score to 80+ and get you ranking on Google within 30 days.</p>
              <a href="https://wa.me/918743933258?text=Hi! I just ran a website audit and scored {result.overallScore}/100. I'd like help improving it." target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
                💬 Book a Free Strategy Call
              </a>
              <button className="btn btn-secondary" onClick={() => { setResult(null); setUrl(''); }}>
                Run Another Audit
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AuditForm;
