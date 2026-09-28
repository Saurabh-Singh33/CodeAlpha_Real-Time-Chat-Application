import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, sendAdminForgotPasswordOtp, resetAdminPassword } from './adminApi';
import { ShieldCheck, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft, X } from 'lucide-react';
import './admin.css';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter Email, 2 = OTP & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated as admin, redirect directly to dashboard
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await adminLogin(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail) {
      setForgotError('Please enter your admin email.');
      return;
    }

    try {
      setForgotLoading(true);
      const data = await sendAdminForgotPasswordOtp(forgotEmail);
      if (data.success) {
        setForgotStep(2);
        setForgotSuccess(`OTP code sent to your registered admin email.`);
      }
    } catch (err) {
      setForgotError(err.message || 'Failed to send OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!otpCode || !newPassword || !confirmPassword) {
      setForgotError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    try {
      setForgotLoading(true);
      const data = await resetAdminPassword(forgotEmail, otpCode, newPassword);
      if (data.success) {
        setIsForgotModalOpen(false);
        setSuccessMsg('Password reset successfully! You can now log in.');
        setEmail(forgotEmail);
        setPassword('');
        setForgotStep(1);
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-logo">
            V
          </div>

          <h1 className="admin-login-title">VartaConnect</h1>
          <p className="admin-login-subtitle">Admin Control Portal</p>
        </div>

        {error && (
          <div className="admin-alert admin-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="admin-alert admin-alert-warning" style={{ background: '#F2FCD4', color: '#274E13', border: '1px solid #D1F275' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-input-group">
            <label className="admin-label">Admin Email</label>
            <input
              type="email"
              className="admin-input"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="admin-input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="admin-label">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError('');
                  setForgotSuccess('');
                  setForgotStep(1);
                  setIsForgotModalOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#52525B',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="admin-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#52525B',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ width: '100%', marginTop: '12px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* Forgot Password OTP Modal */}
      {isForgotModalOpen && (
        <div className="admin-drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="admin-login-card" style={{ maxWidth: '440px', position: 'relative' }}>
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="admin-btn-icon"
              style={{ position: 'absolute', right: '16px', top: '16px' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#F2FCD4', color: '#18181B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <KeyRound size={22} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: '#18181B' }}>
                {forgotStep === 1 ? 'Admin Password Recovery' : 'Verify OTP & Reset'}
              </h2>
              <p style={{ fontSize: '13px', color: '#52525B', margin: 0 }}>
                {forgotStep === 1
                  ? 'OTP code will be sent strictly to your registered admin Gmail inbox.'
                  : `Enter the 6-digit OTP code sent to ${forgotEmail}`}
              </p>
            </div>

            {forgotError && (
              <div className="admin-alert admin-alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="admin-alert admin-alert-warning" style={{ background: '#F2FCD4', color: '#274E13', border: '1px solid #D1F275', marginBottom: '16px' }}>
                <CheckCircle2 size={16} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestOtp}>
                <div className="admin-input-group">
                  <label className="admin-label">Admin Email</label>
                  <input
                    type="email"
                    className="admin-input"
                    placeholder="admin@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setIsForgotModalOpen(false)}
                    disabled={forgotLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    style={{ flex: 1 }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="admin-input-group">
                  <label className="admin-label">6-Digit OTP Code</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="123456"
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 700, fontSize: '16px' }}
                  />
                </div>

                <div className="admin-input-group">
                  <label className="admin-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="admin-input"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#52525B',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="admin-input-group">
                  <label className="admin-label">Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="admin-input"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#52525B',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setForgotStep(1)}
                    disabled={forgotLoading}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    style={{ flex: 1 }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLogin;
