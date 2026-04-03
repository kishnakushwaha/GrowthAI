import React, { useContext } from 'react';
import { Check } from 'lucide-react';
import { ContentContext } from '../context/ContentContext';
import './Pricing.css';

const Pricing = () => {
  const { content } = useContext(ContentContext);
  
  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Investment <span className="text-gradient">Packages</span></h2>
          <p className="section-subtitle">We don't sell services. We sell guaranteed lead generation systems. Choose the model that fits your current growth stage.</p>
        </div>

        <div className="pricing-grid">
          {/* Starter Plan */}
          <div className="pricing-card glass-panel">
            <div className="pricing-header">
              <h3>Starter</h3>
              <div className="price">
                <span className="currency">₹</span>
                <span className="amount">{content.pricing.starter.toLocaleString('en-IN')}</span>
                <span className="period">/mo</span>
              </div>
              <p className="text-muted">Perfect for businesses needing a local presence upgrade.</p>
            </div>
            <div className="pricing-features">
              <ul>
                <li><Check size={18} color="var(--accent)" /> Google Business Profile Setup</li>
                <li><Check size={18} color="var(--accent)" /> Basic Local SEO (Map Ranking)</li>
                <li><Check size={18} color="var(--accent)" /> 5 High-Quality Backlinks/mo</li>
                <li><Check size={18} color="var(--accent)" /> Simple Monthly Report</li>
              </ul>
            </div>
            <div className="pricing-footer">
              <a href="#contact" className="btn btn-secondary w-full">Start Small</a>
            </div>
          </div>

          {/* Growth Plan */}
          <div className="pricing-card glass-panel popular-card">
            <div className="popular-badge">Most Popular</div>
            <div className="pricing-header">
              <h3>Growth</h3>
              <div className="price">
                <span className="currency">₹</span>
                <span className="amount">{content.pricing.growth.toLocaleString('en-IN')}</span>
                <span className="period">/mo</span>
              </div>
              <p className="text-muted text-light">Built for consistent, trackable lead generation.</p>
            </div>
            <div className="pricing-features">
              <ul>
                <li><Check size={18} color="var(--accent)" /> Everything in Starter</li>
                <li><Check size={18} color="var(--accent)" /> High-Converting Landing Page</li>
                <li><Check size={18} color="var(--accent)" /> Google Ads Setup & Mgmt (Ads budget extra)</li>
                <li><Check size={18} color="var(--accent)" /> Advanced Keyword Targeting</li>
                <li><Check size={18} color="var(--accent)" /> Daily Lead Tracking Sheet</li>
              </ul>
            </div>
            <div className="pricing-footer">
              <a href="#contact" className="btn btn-primary w-full">Get Growth System</a>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="pricing-card glass-panel">
            <div className="pricing-header">
              <h3>Pro Funnel</h3>
              <div className="price">
                <span className="currency">₹</span>
                <span className="amount">{content.pricing.pro.toLocaleString('en-IN')}</span>
                <span className="period">/mo</span>
              </div>
              <p className="text-muted">For businesses ready to scale aggressively.</p>
            </div>
            <div className="pricing-features">
              <ul>
                <li><Check size={18} color="var(--accent)" /> Everything in Growth</li>
                <li><Check size={18} color="var(--accent)" /> Custom Multi-Page Website</li>
                <li><Check size={18} color="var(--accent)" /> Meta Ads (FB/IG) Integration</li>
                <li><Check size={18} color="var(--accent)" /> Automated WhatsApp Lead Alerts</li>
                <li><Check size={18} color="var(--accent)" /> Advanced Retargeting System</li>
              </ul>
            </div>
            <div className="pricing-footer">
              <a href="#contact" className="btn btn-secondary w-full">Scale Aggressively</a>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-xl">
          <p className="text-muted">Need a custom website without monthly retainers? <br/><strong>One-time website builds start at ₹15,000.</strong> <a href="#contact" style={{color: 'var(--primary)', textDecoration: 'underline'}}>Let's talk.</a></p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
