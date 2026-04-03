import React, { useContext } from 'react';
import { ArrowRight, BarChart2, ShieldCheck, Zap } from 'lucide-react';
import { ContentContext } from '../context/ContentContext';
import './Hero.css';

const Hero = () => {
  const { content } = useContext(ContentContext);

  return (
    <section className="hero">
      <div className="hero-glow background-glow"></div>
      
      <div className="container hero-container">
        <div className="hero-badge animate-fade-in">
          <Zap size={16} color="var(--accent)" />
          <span>AI-Powered Lead Generation Partner</span>
        </div>
        
        <h1 className="hero-title animate-fade-in delay-100">
          We Generate <span className="text-gradient">High-Quality Leads</span><br />
          For Local Businesses
        </h1>
        
        <p className="section-subtitle animate-fade-in delay-200" style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>
          Stop wasting money on generic agencies. We specialize in building hyper-targeted lead systems for <strong>Dentists, Coaching Institutes, and Real Estate Brokers</strong> in {content.location}.
        </p>
        
        <div className="hero-actions animate-fade-in delay-300">
          <a href="#contact" className="btn btn-primary btn-lg">
            Get a Free Website Audit <ArrowRight size={20} />
          </a>
          <a href="#pricing" className="btn btn-secondary btn-lg">
            View Pricing <BarChart2 size={20} />
          </a>
        </div>
        
        <div className="hero-stats glass-panel animate-fade-in delay-300">
          <div className="stat-item">
            <h3 className="text-gradient">50+</h3>
            <p className="text-muted">Leads Generated</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <h3 className="text-gradient">15%</h3>
            <p className="text-muted">Avg. Conversion</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <h3 className="text-gradient">
              <ShieldCheck size={28} color="var(--accent)" />
            </h3>
            <p className="text-muted">Guaranteed Work</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
