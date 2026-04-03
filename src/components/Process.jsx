import React from 'react';
import { Search, PenTool, TrendingUp } from 'lucide-react';
import './Process.css';

const Process = () => {
  const steps = [
    {
      icon: <Search size={32} color="var(--primary)" />,
      title: "1. Audit & Local SEO Mapping",
      desc: "We analyze your digital presence, find where you are losing customers to competitors, and optimize your Google Business Profile to show up first in local searches."
    },
    {
      icon: <PenTool size={32} color="var(--secondary)" />,
      title: "2. Build The Conversion Engine",
      desc: "We build a lightning-fast, AI-optimized landing page designed for one thing only: turning visitors into paying leads and appointment bookings."
    },
    {
      icon: <TrendingUp size={32} color="var(--accent)" />,
      title: "3. Turn On Targeted Ads",
      desc: "We launch highly targeted Google & Meta campaigns to put your new landing page in front of locals actively searching for your services right now."
    }
  ];

  return (
    <section id="process" className="process">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">How We Generate <span className="text-gradient">Consistent Leads</span></h2>
          <p className="section-subtitle">A proven 3-step system that turns your online presence from a digital brochure into an automated lead generation machine.</p>
        </div>

        <div className="process-timeline">
          {steps.map((step, index) => (
            <div key={index} className="process-step glass-panel">
              <div className="step-number">{index + 1}</div>
              <div className="step-icon-container">
                {step.icon}
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
