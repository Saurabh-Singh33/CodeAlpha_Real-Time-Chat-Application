import React, { useState, useEffect, useRef } from 'react';
import { getAdminProfile, updateAdminProfile, updateAdminPassword } from './adminApi';
import { User, Shield, CheckCircle2, AlertCircle, Edit3, Save } from 'lucide-react';
import './admin.css';

function AdminProfile() {
  const [profile, setProfile] = useState({ email: '', displayName: '' });
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const nameInputRef = useRef(null);
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);
  
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getAdminProfile();
      if (data.success) {
        setProfile(data.profile);
        setDisplayName(data.profile.displayName);
      }
    } catch (err) {
      setProfileError('Failed to fetch profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableEdit = () => {
    setIsEditing(true);
    setProfileMessage(null);
    setProfileError(null);
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 50);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!isEditing) return;
    setProfileMessage(null);
    setProfileError(null);
    try {
      const data = await updateAdminProfile({ displayName });
      if (data.success) {
        setProfileMessage('Profile updated successfully.');
        setProfile(data.profile);
        setIsEditing(false);
        
        // Update session storage so sidebar reflects change
        const storedUser = JSON.parse(sessionStorage.getItem('adminUser') || '{}');
        storedUser.name = data.profile.displayName;
        sessionStorage.setItem('adminUser', JSON.stringify(storedUser));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      const data = await updateAdminPassword({ 
        currentPassword: passwords.currentPassword, 
        newPassword: passwords.newPassword 
      });
      if (data.success) {
        setPasswordMessage('Password changed successfully.');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading profile...</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-greeting">Admin Profile</h1>
          <p className="admin-subtext">Manage your admin display name and credentials.</p>
        </div>
      </div>

      <div className="admin-dashboard-bottom-grid">
        {/* Profile Info */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} /> Public Profile Information
          </h3>

          {profileMessage && (
            <div className="admin-alert admin-alert-active" style={{ backgroundColor: '#F2FCD4', color: '#274E13', border: '1px solid #D1F275' }}>
              <CheckCircle2 size={16} /> <span>{profileMessage}</span>
            </div>
          )}
          {profileError && (
            <div className="admin-alert admin-alert-error">
              <AlertCircle size={16} /> <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSave}>
            <div className="admin-input-group">
              <label className="admin-label">Admin Email (Read Only)</label>
              <input type="text" className="admin-input" value={profile.email} disabled style={{ backgroundColor: '#F4F4F5' }} />
            </div>
            
            <div className="admin-input-group">
              <label className="admin-label">Display Name</label>
              <input 
                ref={nameInputRef}
                type="text" 
                className="admin-input" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)}
                disabled={!isEditing}
                style={!isEditing ? { backgroundColor: '#F4F4F5', cursor: 'not-allowed' } : {}}
                required
              />
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  if (isEditing) {
                    setDisplayName(profile.displayName);
                    setIsEditing(false);
                  } else {
                    handleEnableEdit();
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={16} /> {isEditing ? 'Cancel' : 'Edit'}
              </button>

              <button 
                type="submit" 
                className="admin-btn admin-btn-primary"
                disabled={!isEditing}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  opacity: !isEditing ? 0.5 : 1,
                  cursor: !isEditing ? 'not-allowed' : 'pointer'
                }}
              >
                <Save size={16} /> Save
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} /> Change Password
          </h3>

          {passwordMessage && (
            <div className="admin-alert admin-alert-active" style={{ backgroundColor: '#F2FCD4', color: '#274E13', border: '1px solid #D1F275' }}>
              <CheckCircle2 size={16} /> <span>{passwordMessage}</span>
            </div>
          )}
          {passwordError && (
            <div className="admin-alert admin-alert-error">
              <AlertCircle size={16} /> <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="admin-input-group">
              <label className="admin-label">Current Password</label>
              <input 
                type="password" 
                className="admin-input" 
                value={passwords.currentPassword}
                onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
              />
            </div>
            
            <div className="admin-input-group">
              <label className="admin-label">New Password</label>
              <input 
                type="password" 
                className="admin-input" 
                value={passwords.newPassword}
                onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
              />
            </div>
            
            <div className="admin-input-group">
              <label className="admin-label">Confirm New Password</label>
              <input 
                type="password" 
                className="admin-input" 
                value={passwords.confirmPassword}
                onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="admin-btn admin-btn-primary">Change Password</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
