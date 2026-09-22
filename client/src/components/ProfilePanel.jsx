import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, X, Camera } from 'lucide-react';

const ProfilePanel = ({ isOpen, onClose, user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    dob: '',
    sex: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || user.username || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || '',
        dob: user.dob || '',
        sex: user.sex || ''
      });
    }
    setIsEditing(false);
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    setIsEditing(true);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    if (user) {
      setFormData({
        name: user.name || user.username || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || '',
        dob: user.dob || '',
        sex: user.sex || ''
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) return;

    setLoading(true);
    try {
      const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.hostname}:5000`;
      const response = await fetch(`${serverUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        if (onUpdate) onUpdate(data.user);
        setIsEditing(false);
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayName = formData.name || 'User';

  return (
    <div className="profile-panel-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={e => e.stopPropagation()}>
        <div className="profile-header">
          <button className="profile-close-btn" onClick={onClose} title="Close">
            <X size={14} />
          </button>
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="profile-avatar-upload" title="Change photo">
              <Camera size={10} />
            </div>
          </div>
          <h2>{displayName}</h2>
          <p>{formData.email}</p>
        </div>

        <form className="profile-body" onSubmit={handleSubmit}>
          <h3 className="profile-section-title">Personal Information</h3>

          <div className="profile-form-group">
            <label className="profile-label">Full Name</label>
            <div className={`profile-input-wrapper ${!isEditing ? 'disabled' : ''}`}>
              <div className="profile-icon"><User size={13}/></div>
              <input 
                type="text" 
                name="name"
                className="profile-input" 
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label className="profile-label">Email Address (Read Only)</label>
            <div className="profile-input-wrapper disabled">
              <div className="profile-icon"><Mail size={13}/></div>
              <input 
                type="email" 
                className="profile-input" 
                value={formData.email}
                disabled={true}
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label className="profile-label">Mobile Number</label>
            <div className={`profile-input-wrapper ${!isEditing ? 'disabled' : ''}`}>
              <div className="profile-icon"><Phone size={13}/></div>
              <input 
                type="text" 
                name="mobileNumber"
                className="profile-input" 
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label className="profile-label">Date of Birth</label>
            <div className={`profile-input-wrapper ${!isEditing ? 'disabled' : ''}`}>
              <div className="profile-icon"><Calendar size={13}/></div>
              <input 
                type="date" 
                name="dob"
                className="profile-input" 
                value={formData.dob}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label className="profile-label">Gender</label>
            <div className={`profile-input-wrapper ${!isEditing ? 'disabled' : ''}`}>
              <select 
                name="sex" 
                className="profile-input" 
                value={formData.sex}
                onChange={handleChange}
                disabled={!isEditing}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Side-by-Side Action Buttons */}
          <div className="profile-btn-row">
            {!isEditing ? (
              <button 
                type="button" 
                className="profile-btn profile-btn-edit" 
                onClick={handleEditClick}
              >
                Edit Profile
              </button>
            ) : (
              <button 
                type="button" 
                className="profile-btn profile-btn-cancel" 
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            )}

            <button 
              type="submit" 
              className={`profile-btn profile-btn-save ${!isEditing ? 'disabled' : ''}`} 
              disabled={!isEditing || loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePanel;
