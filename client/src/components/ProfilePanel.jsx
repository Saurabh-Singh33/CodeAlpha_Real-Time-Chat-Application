import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, X, Camera } from 'lucide-react';

const ProfilePanel = ({ isOpen, onClose, user, onUpdate }) => {
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
        name: user.name || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || '',
        dob: user.dob || '',
        sex: user.sex || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
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
        alert('Profile updated successfully!');
        onClose();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-panel-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={e => e.stopPropagation()}>
        <div className="profile-header">
          <button className="profile-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {formData.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-avatar-upload">
              <Camera size={14} />
            </div>
          </div>
          <h2>{formData.name}</h2>
          <p style={{ opacity: 0.8, fontSize: '0.9rem', marginTop: '0.2rem' }}>{formData.email}</p>
        </div>

        <form className="profile-body" onSubmit={handleSubmit}>
          <h3 className="profile-section-title">Personal Information</h3>

          <div className="profile-form-group">
            <label className="profile-label">Full Name</label>
            <div className="profile-input-wrapper">
              <div className="profile-icon"><User size={16}/></div>
              <input 
                type="text" 
                name="name"
                className="profile-input" 
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label className="profile-label">Email Address (Read Only)</label>
            <div className="profile-input-wrapper">
              <div className="profile-icon"><Mail size={16}/></div>
              <input 
                type="email" 
                className="profile-input" 
                value={formData.email}
                readOnly
                style={{ opacity: 0.6 }}
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label className="profile-label">Mobile Number</label>
            <div className="profile-input-wrapper">
              <div className="profile-icon"><Phone size={16}/></div>
              <input 
                type="text" 
                name="mobileNumber"
                className="profile-input" 
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label className="profile-label">Date of Birth</label>
            <div className="profile-input-wrapper">
              <div className="profile-icon"><Calendar size={16}/></div>
              <input 
                type="date" 
                name="dob"
                className="profile-input" 
                value={formData.dob}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label className="profile-label">Gender</label>
            <div className="profile-input-wrapper">
              <select 
                name="sex" 
                className="profile-input" 
                value={formData.sex}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button type="submit" className="profile-save-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePanel;
