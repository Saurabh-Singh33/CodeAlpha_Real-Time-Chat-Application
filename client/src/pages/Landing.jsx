import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { X, Info } from 'lucide-react';
import Login from './Login';
import Signup from './Signup';

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/login' || location.state?.from) {
      setShowLoginModal(true);
    } else if (location.pathname === '/signup') {
      setShowSignupModal(true);
    }
  }, [location.pathname, location.state]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      let code = joinCode.trim();
      if (code.includes('/room/')) {
        code = code.split('/room/')[1];
      }
      navigate(`/room/${code}`);
    }
  };

  return (
    <div className="landing-container" style={{ background: '#FFFFFF', minHeight: '100vh', fontFamily: "'Google Sans', 'Inter', 'Roboto', sans-serif" }}>
      {/* Header */}
      <nav className="landing-nav" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '1rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem' }}>
          <Link to="/" className="logo-placeholder" style={{ display: 'flex', alignItems: 'center', background: 'transparent', textDecoration: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.6rem', background: 'linear-gradient(135deg, #1A73E8 0%, #174ea6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800', letterSpacing: '-0.5px' }}>VartaConnect</span>
          </Link>
        </div>
        
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="nav-links" style={{ display: 'flex', gap: '1.5rem', marginRight: '1rem' }}>
            <Link to="/about" className="nav-link-item">About</Link>
            <Link to="/services" className="nav-link-item">Services</Link>
            <Link to="/contact" className="nav-link-item">Contact Us</Link>
          </div>
          
          <button 
            onClick={() => setShowLoginModal(true)} 
            className="btn-modern-primary">
            Sign in
          </button>
          <button 
            onClick={() => setShowSignupModal(true)} 
            className="btn-modern-secondary">
            Sign up
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="landing-hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4rem 6rem', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Left Text Module */}
        <div className="hero-text" style={{ flex: '1', maxWidth: '600px', textAlign: 'left' }}>
          
          {/* New Badge */}
          <div style={{ display: 'inline-block', background: '#e6f4ea', color: '#137333', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            NEW
          </div>
          
          {/* Headline */}
          <h1 style={{ fontSize: '3rem', lineHeight: '1.2', color: '#202124', fontWeight: '400', marginBottom: '2rem' }}>
            We re-engineered the service we built for secure business meetings, VartaConnect, to make it free and available for all.
          </h1>
          
          {/* Dual CTAs */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
            <button 
              onClick={() => setShowLoginModal(true)} 
              style={{ background: '#1A73E8', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: '500', cursor: 'pointer' }}>
              Sign in
            </button>
            <button 
              style={{ background: '#FFFFFF', color: '#1A73E8', border: '1px solid #dadce0', borderRadius: '4px', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: '500', cursor: 'pointer' }}>
              Try Meet for work
            </button>
          </div>

          {/* Join Module */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#202124', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Join a meeting now</h3>
            
            <form onSubmit={handleJoin} style={{ display: 'inline-flex', alignItems: 'center', background: '#F8F9FA', border: '1px solid #dadce0', borderRadius: '24px', padding: '0.25rem 0.25rem 0.25rem 1rem', minWidth: '350px' }}>
              <input 
                type="text" 
                placeholder="Enter a code or link" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                style={{ flex: '1', border: 'none', outline: 'none', background: 'transparent', fontSize: '1rem', color: '#202124' }} 
              />
              <button type="submit" style={{ background: '#1A73E8', color: '#FFFFFF', border: 'none', borderRadius: '20px', padding: '0.6rem 1.5rem', fontWeight: '500', cursor: 'pointer', marginLeft: '0.5rem' }}>
                Join
              </button>
            </form>
            <Info size={18} color="#5F6368" style={{ marginLeft: '1rem', verticalAlign: 'middle' }} />
          </div>

          {/* Footer Link */}
          <div style={{ borderTop: '1px solid #dadce0', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#5F6368' }}>
              <Link to="/about" style={{ color: '#1A73E8', textDecoration: 'none' }}>Learn more about VartaConnect</Link>
            </p>
          </div>
        </div>

        {/* Right Image Module */}
        <div className="hero-image" style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
          <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2874&auto=format&fit=crop" alt="Video Conferencing Screen" style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #dadce0', padding: '2rem 1.5rem', marginTop: 'auto', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/about" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>About</Link>
            <Link to="/contact" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>Contact</Link>
            <Link to="/services" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>Services</Link>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: '#5F6368', fontSize: '0.9rem', marginRight: '0.5rem' }}>Follow us:</span>
            {/* Instagram */}
            <a href="#" style={{ color: '#5F6368' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            {/* Facebook */}
            <a href="#" style={{ color: '#5F6368' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            {/* LinkedIn */}
            <a href="#" style={{ color: '#5F6368' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
            {/* Twitter/X */}
            <a href="#" style={{ color: '#5F6368' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      {showLoginModal && (
        <div className="profile-panel-overlay" style={{ alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '8px', position: 'relative', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowLoginModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10 }}>
              <X size={24} color="#5F6368" />
            </button>
            <Login isModal={true} onSuccess={() => {
              setShowLoginModal(false);
              if (location.state?.from) {
                navigate(location.state.from.pathname, { replace: true });
              } else {
                navigate('/dashboard');
              }
            }} />
          </div>
        </div>
      )}

      {showSignupModal && (
        <div className="profile-panel-overlay" style={{ alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '8px', position: 'relative', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowSignupModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10 }}>
              <X size={24} color="#5F6368" />
            </button>
            <Signup isModal={true} onSuccess={() => {
              setShowSignupModal(false);
              if (location.state?.from) {
                navigate(location.state.from.pathname, { replace: true });
              } else {
                navigate('/dashboard');
              }
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
