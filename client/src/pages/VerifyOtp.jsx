import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function VerifyOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAuth } = useContext(AuthContext);

  const email = location.state?.email;
  const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.hostname}:5000`;

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${serverUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: otpValue })
      });
      const data = await res.json();
      if (res.ok) {
        await checkAuth(); // Logs in the user via HTTP-only cookie
        navigate('/');
      } else {
        setError(data.message || 'OTP Verification failed');
      }
    } catch (err) {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${serverUrl}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('OTP resent successfully');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Cannot connect to server.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="glass-auth-card otp-card">
        <div className="auth-form-container" style={{ flex: '1' }}>
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
            <h3>VERIFY YOUR EMAIL</h3>
            <p>We sent a 6-digit verification code to: <br/><strong>{email}</strong></p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <form onSubmit={handleSubmit} className="glass-form otp-form">
            <div className="otp-inputs">
              {otp.map((data, index) => {
                return (
                  <input
                    className="otp-field"
                    type="text"
                    name="otp"
                    maxLength="1"
                    key={index}
                    value={data}
                    onChange={e => handleChange(e.target, index)}
                    onFocus={e => e.target.select()}
                  />
                );
              })}
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Didn't receive the code? <button type="button" onClick={handleResend} className="text-btn">Resend OTP</button></p>
            <p><Link to="/login">Back to Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
