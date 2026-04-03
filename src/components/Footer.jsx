import React, { useContext } from 'react';
import { Target, Mail, MapPin, MessageSquare } from 'lucide-react';
import { ContentContext } from '../context/ContentContext';
import './Footer.css';

const Footer = () => {
  const { content } = useContext(ContentContext);

  return (
    <footer id="contact" className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#" className="logo">
              <div className="logo-icon">
                <Target size={24} color="var(--primary)" />
              </div>
              <span className="logo-text">Growth<span className="text-gradient">AI</span> Engine</span>
            </a>
            <p className="text-muted mt-4">
              We build AI-powered lead generation engines for local businesses in {content.location}. Stop hunting for customers, let them come to you.
            </p>
          </div>

          <div className="footer-links">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#services">Services</a></li>
              <li><a href="#process">How It Works</a></li>
              <li><a href="#industries">Industries</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h3>Contact Us</h3>
            <div className="contact-item">
              <MapPin size={18} color="var(--primary)" />
              <span className="text-muted">{content.location}, India</span>
            </div>
            <div className="contact-item">
              <Mail size={18} color="var(--primary)" />
              <span className="text-muted">{content.email}</span>
            </div>
            <div className="contact-item mt-4">
              <a href="#" className="btn btn-primary">
                Book Free Audit
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="text-muted">© {new Date().getFullYear()} GrowthAI Engine. All rights reserved.</p>
        </div>
      </div>

      {/* Floating WhatsApp CTA */}
      <a href={`https://wa.me/${content.whatsappNumber}`} target="_blank" rel="noreferrer" className="whatsapp-float">
        <MessageSquare size={24} />
      </a>
    </footer>
  );
};

export default Footer;
