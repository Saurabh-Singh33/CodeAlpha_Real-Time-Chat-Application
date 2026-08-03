import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Signup({ isModal, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.hostname}:5000`;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        if (isModal && onSuccess) onSuccess();
        navigate('/verify-otp', { state: { email: formData.email } });
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(`${serverUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken: credentialResponse.credential })
      });
      if (res.ok) {
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          window.location.href = '/';
        }
      } else {
        const data = await res.json();
        setError(data.message || 'Google signup failed');
      }
    } catch (err) {
      setError('Cannot connect to server.');
    }
  };

  return (
    <div className={isModal ? "" : "auth-page-container"} style={isModal ? { background: 'none', padding: 0, minHeight: 'auto' } : {}}>
      {!isModal && (
        <button 
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '2rem', left: '2rem', background: '#FFFFFF', border: '1px solid #dadce0', padding: '0.5rem 1rem', borderRadius: '24px', cursor: 'pointer', fontWeight: '500', color: '#5F6368', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 100 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Home
        </button>
      )}
      <div className="glass-auth-card" style={isModal ? { boxShadow: 'none', border: 'none', maxWidth: '750px', margin: '0 auto' } : { maxWidth: '750px', margin: '0 auto' }}>
        {/* Left Side: Mascot Image */}
        <div className="auth-mascot-container">
          <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2938&auto=format&fit=crop" alt="Workspace" className="mascot-img" />
          <div className="mascot-text" style={{ left: '40px', bottom: '40px', paddingRight: '20px' }}>
            <h2 style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.6)' }}>VARTACONNECT</h2>
            <h1 style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.6)' }}>LEARN. GROW.</h1>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="auth-form-container" style={{ position: 'relative', padding: '2.5rem' }}>
          <button 
            onClick={() => { if(isModal && onSuccess) { onSuccess(); } else { navigate('/'); } }} 
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={24} color="#5F6368" />
          </button>
          
          <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
            <div className="logo-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </div>
            <h2>VARTACONNECT</h2>
            <h3 style={{ fontSize: '1.5rem' }}>CREATE ACCOUNT</h3>
            <p>Enter your details to create an account</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="glass-form">
            <div className="form-group" style={{ marginBottom: '0.8rem' }}>
              <label style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Name</label>
              <input type="text" name="name" placeholder="Enter your name" value={formData.name} onChange={handleChange} required style={{ padding: '0.6rem 1rem' }} />
            </div>
            
            <div className="form-group" style={{ marginBottom: '0.8rem' }}>
              <label style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Email</label>
              <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required style={{ padding: '0.6rem 1rem' }} />
            </div>

            <div className="form-group" style={{ marginBottom: '0.8rem' }}>
              <label style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Password</label>
              <input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required style={{ padding: '0.6rem 1rem' }} />
            </div>

            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Confirm Password</label>
              <input type="password" name="confirmPassword" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} required style={{ padding: '0.6rem 1rem' }} />
            </div>

            <button type="submit" className="primary-btn" disabled={loading} style={{ padding: '0.7rem' }}>
              {loading ? 'Creating...' : 'Sign Up'}
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <div className="google-btn-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login Failed')}
                text="signup_with"
                shape="rectangular"
              />
            </div>
          </form>
          
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
