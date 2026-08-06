import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';

export default function Login({ isModal, onSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { checkAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.hostname}:5000`;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        await checkAuth(); // Logs in the user via HTTP-only cookie
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          navigate('/dashboard');
        }
      } else {
        if (res.status === 403 && data.needsVerification) {
          navigate('/verify-otp', { state: { email: formData.email } });
        } else {
          setError(data.message || 'Login failed');
        }
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
        await checkAuth();
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          navigate('/dashboard');
        }
      } else {
        const data = await res.json();
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      setError('Cannot connect to server.');
    }
  };

  return (
    <div className={isModal ? "" : "auth-page-container"} style={isModal ? { background: 'none', padding: 0, minHeight: 'auto' } : {}}>

      <div className="glass-auth-card" style={isModal ? { boxShadow: 'none', border: 'none' } : {}}>
        {/* Left Side: Mascot Image with Back Button */}
        <div className="auth-mascot-container">
          <button 
            onClick={() => { if(isModal && onSuccess) { onSuccess(); } else { window.location.href = '/'; } }} 
            style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(255, 255, 255, 0.9)', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', color: '#1A73E8', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Home
          </button>
          
          <img src="/man_laptop_desk.png" alt="Professional working at desk" className="mascot-img" />
          
          {/* Subtle dark gradient overlay to ensure text is readable */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}></div>

          <div className="mascot-text" style={{ zIndex: 5 }}>
            <h1>WELCOME.</h1>
            <h1>BACK.</h1>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="auth-form-container">
          <div className="auth-header">
            <div className="logo-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </div>
            <h2>VARTACONNECT</h2>
            <h3>WELCOME BACK</h3>
            <p>Enter your email and password to access your account</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="glass-form">
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" className="forgot-password">Forgot Password</Link>
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <div className="google-btn-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login Failed')}
                text="signin_with"
                shape="rectangular"
              />
            </div>
          </form>
          
          <div className="auth-footer">
            <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
