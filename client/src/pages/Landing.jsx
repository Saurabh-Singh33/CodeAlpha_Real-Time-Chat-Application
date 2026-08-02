import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Keyboard, MessageSquare, X } from 'lucide-react';

export default function Landing() {
  const [showAiModal, setShowAiModal] = useState(false);

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="logo-placeholder" style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>VC</div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact Us</a>
          <button 
            onClick={() => setShowAiModal(true)} 
            style={{ background: 'none', border: 'none', color: 'var(--accent-violet)', fontWeight: '700', cursor: 'pointer', fontSize: '1rem' }}
          >
            AI Chatbot
          </button>
        </div>
        <div className="nav-actions" style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" className="btn btn-secondary">Login</Link>
          <Link to="/signup" className="btn btn-primary">Sign Up</Link>
        </div>
      </nav>

      <main className="landing-hero">
        <div className="hero-text">
          <h1>Premium video meetings.<br/>Now free for everyone.</h1>
          <p>We re-engineered the service we built for secure business meetings, VartaConnect, to make it free and available for all.</p>
          
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">
              <Video size={18} />
              New Meeting
            </Link>
            <div className="profile-input-wrapper" style={{ flex: '1', maxWidth: '300px' }}>
              <div className="profile-icon" style={{ background: 'transparent', color: 'var(--text-secondary)' }}><Keyboard size={16}/></div>
              <input type="text" className="profile-input" placeholder="Enter a code or link" />
            </div>
            <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500' }}>Join</Link>
          </div>
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-emerald)' }}>Learn more</span> about VartaConnect
            </p>
          </div>
        </div>

        <div className="hero-image">
          <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2938&auto=format&fit=crop" alt="Video Conferencing" />
        </div>
      </main>

      {showAiModal && (
        <div className="profile-panel-overlay" style={{ alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAiModal(false)}>
          <div className="glass-panel" style={{ width: '400px', height: '500px', display: 'flex', flexDirection: 'column', background: 'var(--bg-card-solid)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={18} color="var(--accent-violet)"/> Varta AI</h3>
              <button onClick={() => setShowAiModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <p>AI Chatbot features coming soon.</p>
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-glass)' }}>
              <div className="profile-input-wrapper">
                <input type="text" className="profile-input" placeholder="Type a message..." disabled />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
