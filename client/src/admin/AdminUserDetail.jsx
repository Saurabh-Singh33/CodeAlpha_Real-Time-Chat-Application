import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAdminUserDetail } from './adminApi';
import { ArrowLeft, User, Calendar, Mail, Phone, Video, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import './admin.css';

function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({ totalMeetings: 0, hostedCount: 0, joinedCount: 0, totalMessagesSent: 0 });
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await getAdminUserDetail(id);
        if (data.success) {
          setUser(data.user);
          setMetrics(data.metrics || {});
          setRecentMeetings(data.recentMeetings || []);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch user details:', err);
        setError(err.message || 'Failed to load user details.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div>
        <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/users')} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Users
        </button>
        <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
          Loading user detail profile...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div>
        <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/users')} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Users
        </button>
        <div className="admin-alert admin-alert-error">
          <span>{error || 'User not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/users')} style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Users List
      </button>

      {/* Header User Profile Banner */}
      <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div className="admin-avatar" style={{ width: '64px', height: '64px', fontSize: '24px' }}>
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#18181B' }}>{user.name}</h2>
            <span className={`admin-badge ${user.status === 'Active' ? 'admin-badge-active' : 'admin-badge-offline'}`}>
              {user.status === 'Active' && <span className="admin-pulse-dot" style={{ width: '6px', height: '6px' }}></span>}
              {user.status}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#52525B', fontSize: '14px', fontWeight: 500 }}>{user.email}</p>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="admin-dashboard-bottom-grid" style={{ marginBottom: '24px' }}>
        {/* Account Info Card */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, borderBottom: '1px solid #EBEBE5', paddingBottom: '10px', color: '#18181B' }}>
            Account Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#52525B', display: 'block', fontSize: '12px', fontWeight: 600 }}>User ID</span>
              <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#18181B' }}>{user._id}</span>
            </div>
            <div>
              <span style={{ color: '#52525B', display: 'block', fontSize: '12px', fontWeight: 600 }}>Auth Provider</span>
              <span style={{ fontWeight: 600, textTransform: 'capitalize', color: '#18181B' }}>{user.provider || 'local'}</span>
            </div>
            <div>
              <span style={{ color: '#52525B', display: 'block', fontSize: '12px', fontWeight: 600 }}>Account Joined</span>
              <span style={{ fontWeight: 600, color: '#18181B' }}>{formatDate(user.createdAt)}</span>
            </div>
            <div>
              <span style={{ color: '#52525B', display: 'block', fontSize: '12px', fontWeight: 600 }}>Last Active Timestamp</span>
              <span style={{ fontWeight: 600, color: '#18181B' }}>{formatDate(user.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Meeting & Activity Stats Card */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, borderBottom: '1px solid #EBEBE5', paddingBottom: '10px', color: '#18181B' }}>
            Meeting & Activity Metrics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ background: '#FAFDF5', padding: '16px', borderRadius: '14px', border: '1px solid #E4E4E7' }}>
              <Video size={18} style={{ color: '#18181B', marginBottom: '6px' }} />
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#18181B' }}>{metrics.totalMeetings || 0}</div>
              <div style={{ fontSize: '12px', color: '#52525B', fontWeight: 700 }}>Total Meetings</div>
            </div>

            <div style={{ background: '#FAFDF5', padding: '16px', borderRadius: '14px', border: '1px solid #E4E4E7' }}>
              <ShieldCheck size={18} style={{ color: '#18181B', marginBottom: '6px' }} />
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#18181B' }}>{metrics.hostedCount || 0}</div>
              <div style={{ fontSize: '12px', color: '#52525B', fontWeight 700 }}>Hosted Meetings</div>
            </div>

            <div style={{ background: '#FAFDF5', padding: '16px', borderRadius: '14px', border: '1px solid #E4E4E7' }}>
              <User size={18} style={{ color: '#18181B', marginBottom: '6px' }} />
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#18181B' }}>{metrics.joinedCount || 0}</div>
              <div style={{ fontSize: '12px', color: '#52525B', fontWeight: 700 }}>Joined Meetings</div>
            </div>

            <div style={{ background: '#FAFDF5', padding: '16px', borderRadius: '14px', border: '1px solid #E4E4E7' }}>
              <MessageSquare size={18} style={{ color: '#18181B', marginBottom: '6px' }} />
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#18181B' }}>{metrics.totalMessagesSent || 0}</div>
              <div style={{ fontSize: '12px', color: '#52525B', fontWeight: 700 }}>Messages Sent</div>
            </div>
          </div>
        </div>
      </div>


      {/* Recent Meetings Table */}
      <div className="admin-card">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 700 }}>
          Recent Meetings Participated In
        </h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Team</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {recentMeetings.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#777777', padding: '24px' }}>
                    No recent meetings found for this user.
                  </td>
                </tr>
              ) : (
                recentMeetings.map((m) => (
                  <tr key={m._id}>
                    <td style={{ fontWeight: 600 }}>{m.title}</td>
                    <td>{m.date}</td>
                    <td>{m.time}</td>
                    <td>{m.team || 'Personal'}</td>
                    <td>{formatDate(m.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminUserDetail;
