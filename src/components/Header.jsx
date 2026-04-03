import React, { useState, useEffect } from 'react';
import { Target, Menu, X } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${isScrolled ? 'scrolled glass-panel' : ''}`}>
      <div className="container header-container">
        <a href="#" className="logo">
          <div className="logo-icon">
            <Target size={24} color="var(--primary)" />
          </div>
          <span className="logo-text">Growth<span className="text-gradient">AI</span> Engine</span>
        </a>

        <nav className="desktop-nav">
          <ul>
            <li><a href="#services">Services</a></li>
            <li><a href="#process">How It Works</a></li>
            <li><a href="#industries">Industries</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <a href="#audit" className="btn btn-secondary hidden-mobile">Free Audit</a>
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu glass-panel">
          <nav>
            <ul>
              <li><a href="#services" onClick={() => setIsMobileMenuOpen(false)}>Services</a></li>
              <li><a href="#process" onClick={() => setIsMobileMenuOpen(false)}>How It Works</a></li>
              <li><a href="#industries" onClick={() => setIsMobileMenuOpen(false)}>Industries</a></li>
              <li><a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a></li>
              <li><a href="#audit" className="btn btn-primary menu-btn" onClick={() => setIsMobileMenuOpen(false)}>Free Audit</a></li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
