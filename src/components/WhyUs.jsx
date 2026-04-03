import React from 'react';
import { XCircle, CheckCircle2 } from 'lucide-react';
import './WhyUs.css';

const WhyUs = () => {
  return (
    <section id="services" className="why-us">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Why Your Current Marketing <span className="text-gradient">Fails</span></h2>
          <p className="section-subtitle">The old way of growing a local business doesn't work anymore. Just having a Facebook page or printing flyers is burning your money.</p>
        </div>

        <div className="comparison-grid">
          <div className="glass-panel comparison-card negative-card">
            <div className="card-header">
              <div className="icon-wrapper bg-red">
                <XCircle size={28} color="#ef4444" />
              </div>
              <h3>The Old Way</h3>
            </div>
            <ul className="comparison-list">
              <li><XCircle size={18} color="#ef4444" /> Posting on Facebook and getting zero patients.</li>
              <li><XCircle size={18} color="#ef4444" /> Buying expensive billboards that you can't track.</li>
              <li><XCircle size={18} color="#ef4444" /> Handing out flyers in the street randomly.</li>
              <li><XCircle size={18} color="#ef4444" /> Depending solely on JustDial to give you old leads.</li>
              <li><XCircle size={18} color="#ef4444" /> "Hope marketing" — paying and praying they come.</li>
            </ul>
          </div>

          <div className="glass-panel comparison-card positive-card">
            <div className="card-header">
              <div className="icon-wrapper bg-green">
                <CheckCircle2 size={28} color="var(--accent)" />
              </div>
              <h3>The GrowthAI System</h3>
            </div>
            <ul className="comparison-list">
              <li><CheckCircle2 size={18} color="var(--accent)" /> Ranking #1 on Google when people search for your service.</li>
              <li><CheckCircle2 size={18} color="var(--accent)" /> Highly targeted Ads shown only to ready-to-buy customers.</li>
              <li><CheckCircle2 size={18} color="var(--accent)" /> A fast, trust-building website that converts visitors.</li>
              <li><CheckCircle2 size={18} color="var(--accent)" /> Leads delivered directly to your WhatsApp.</li>
              <li><CheckCircle2 size={18} color="var(--accent)" /> 100% Trackable ROI — you know what every Rupee does.</li>
            </ul>
            <div className="card-footer">
              <a href="#contact" className="btn btn-primary w-full">I Want This System</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
