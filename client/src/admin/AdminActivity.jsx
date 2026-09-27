import React, { useState, useEffect } from 'react';
import { getAdminActivity } from './adminApi';
import { Clock, UserPlus, Video, LogIn, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import './admin.css';

function AdminActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  const fetchActivityFeed = async () => {
    try {
      setLoading(true);
      const data = await getAdminActivity({ page, limit: 50 });
      if (data.success) {
        setActivities(data.activity || []);
        setTotalPages(data.totalPages || 1);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch activity feed:', err);
      setError('Failed to load system activity log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityFeed();
  }, [page]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_signup':
        return <UserPlus size={16} color="#10B981" />;
      case 'meeting_start':
        return <Video size={16} color="#3B82F6" />;
      case 'meeting_end':
        return <Clock size={16} color="#6B7280" />;
      default:
        return <Activity size={16} color="#8B5CF6" />;
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return `${diffSec} sec ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} d ago`;
  };

  const formatDateExact = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-greeting">Activity Feed</h1>
          <p className="admin-subtext">Real-time chronological log of system actions, signups, and meeting events.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-activity-list" style={{ gap: '20px' }}>
          {activities.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#777777', padding: '40px 0' }}>
              {loading ? 'Loading activity feed...' : 'No activity logged yet.'}
            </p>
          ) : (
            activities.map((item, idx) => (
              <div className="admin-activity-item" key={item._id || idx} style={{ paddingBottom: '16px' }}>
                <div className="admin-activity-icon" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                  {getActivityIcon(item.type)}
                </div>
                <div className="admin-activity-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p className="admin-activity-text" style={{ fontSize: '15px' }}>{item.description}</p>
                    <span className="admin-badge admin-badge-offline" style={{ fontSize: '11px' }}>
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#777777' }}>
                    {formatDateExact(item.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="admin-pagination" style={{ marginTop: '24px' }}>
          <div className="admin-pagination-text">
            Page {page} of {totalPages}
          </div>
          <div className="admin-pagination-actions">
            <button
              className="admin-btn admin-btn-secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              className="admin-btn admin-btn-secondary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminActivity;
