import React, { useContext } from 'react';
import { Stethoscope, BookOpen, Home, ArrowRight } from 'lucide-react';
import { ContentContext } from '../context/ContentContext';
import './Niche.css';

const Niche = () => {
  const { content } = useContext(ContentContext);
  const niches = [
    {
      id: 'dentists',
      icon: <Stethoscope size={40} color="var(--primary)" />,
      title: "Dentists & Clinics",
      desc: "Stop relying on walk-ins. We help clinics dominate 'dentist near me' searches and run targeted Meta ads to fill your appointment calendar daily.",
      metrics: "Avg. ROI: 4.2x | Expected Leads: 20-40/mo"
    },
    {
      id: 'coaching',
      icon: <BookOpen size={40} color="var(--secondary)" />,
      title: "Coaching Institutes",
      desc: "Fill your batches before they even start. We build funnels that capture student details through free mock tests and targeted area-based ads.",
      metrics: "Avg ROI: 6.5x | Expected Leads: 50-100/mo"
    },
    {
      id: 'real-estate',
      icon: <Home size={40} color="var(--accent)" />,
      title: "Real Estate Brokers",
      desc: "No more cold calling dead JustDial leads. We run hyper-local Google Ads to intercept buyers exactly when they search for properties in your area.",
      metrics: "Avg. ROI: 12x | Expected Leads: 15-30/mo"
    }
  ];

  return (
    <section id="industries" className="niche">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Industries We <span className="text-gradient">Dominate</span></h2>
          <p className="section-subtitle">We don't do everything. We specialize purely in generating local leads across these 3 major verticals in {content.location}.</p>
        </div>

        <div className="niche-grid">
          {niches.map((niche) => (
            <div key={niche.id} className="niche-card glass-panel">
              <div className="niche-icon">
                {niche.icon}
              </div>
              <h3>{niche.title}</h3>
              <p className="text-muted">{niche.desc}</p>
              <div className="niche-metrics">
                <span>{niche.metrics}</span>
              </div>
              <a href="#contact" className="niche-link">
                View Case Study <ArrowRight size={16} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Niche;
