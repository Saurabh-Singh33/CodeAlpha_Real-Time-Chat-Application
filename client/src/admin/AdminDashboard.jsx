import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAdminStats, getAdminTodayStats, getAdminSystemStatus, getAdminGeminiStatus } from './adminApi';
import { Users, Video, MessageSquare, Activity, AlertCircle, ArrowUpRight, Clock, ShieldAlert, UserPlus, LogOut, LogIn, Server, Database, Bot } from 'lucide-react';
import io from 'socket.io-client';
import './admin.css';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMeetings: 0,
    activeNow: 0,
    totalMessages: 0
  });
  const [todayStats, setTodayStats] = useState({
    newUsersToday: 0,
    meetingsToday: 0,
    aiSummariesToday: 0,
    totalAiSummaries: 0
  });
  const [systemHealth, setSystemHealth] = useState({
    backend: 'Checking...',
    database: 'Checking...',
    gemini: 'Checking...'
  });
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminName, setAdminName] = useState('Saurabh');
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [data, todayData, sysData, geminiData] = await Promise.all([
        getAdminStats(),
        getAdminTodayStats().catch(() => ({ success: false })),
        getAdminSystemStatus().catch(() => ({ success: false })),
        getAdminGeminiStatus().catch(() => ({ status: 'error' }))
      ]);

      if (data.success) {
        setStats(data.stats);
        setRecentMeetings(data.recentMeetings || []);
        setRecentActivity(data.recentActivity || []);
        setError(null);
      }
      if (todayData.success) {
        setTodayStats(todayData);
      }
      if (sysData.success) {
        setSystemHealth(prev => ({
          ...prev,
          backend: sysData.status.backend,
          database: sysData.status.database
        }));
      }
      if (geminiData) {
        let geminiDisplay = 'Error';
        if (geminiData.status === 'ok') geminiDisplay = 'Available';
        else if (geminiData.status === 'quota_exceeded') geminiDisplay = 'Rate-limited';
        else if (geminiData.status === 'invalid_key') geminiDisplay = 'Error';
        setSystemHealth(prev => ({ ...prev, gemini: geminiDisplay }));
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError('System offline: Unable to reach MongoDB Atlas or backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem('adminUser');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.name) setAdminName(u.name);
      } catch (err) {}
    }

    fetchDashboardData();

    // 30-Second Fallback Polling on Dashboard
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    // Socket.IO Connection for Real-Time Updates
    const socket = io('/', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      socket.emit('join-admin-room');
    });

    socket.on('admin:stats-update', (data) => {
      if (data && typeof data.activeNow === 'number') {
        setStats(prev => ({ ...prev, activeNow: data.activeNow }));
      }
    });

    socket.on('admin:user-online', (data) => {
      fetchDashboardData();
    });

    socket.on('admin:user-offline', (data) => {
      fetchDashboardData();
    });

    socket.on('admin:meeting-started', (data) => {
      fetchDashboardData();
    });

    socket.on('admin:meeting-ended', (data) => {
      fetchDashboardData();
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-greeting">{getGreeting()}, {adminName} 👋</h1>
          <p className="admin-subtext">Here's what's happening across VartaConnect today.</p>

        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: '24px' }}>
          <ShieldAlert size={20} />
          <span style={{ fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* Top Row: 4 Stat Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Total Users</span>
            <div className="admin-stat-icon-wrap">
              <Users size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {loading ? '...' : stats.totalUsers.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>
            +{todayStats.newUsersToday} today
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Total Meetings</span>
            <div className="admin-stat-icon-wrap">
              <Video size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {loading ? '...' : stats.totalMeetings.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>
            +{todayStats.meetingsToday} today
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Active Now</span>
            <div className="admin-stat-icon-wrap">
              <Activity size={20} color="#10B981" />
            </div>
          </div>
          <div className="admin-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? '...' : stats.activeNow}
            <span className="admin-pulse-dot" title="Live Socket.IO Stream"></span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Messages</span>
            <div className="admin-stat-icon-wrap">
              <MessageSquare size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {loading ? '...' : stats.totalMessages.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>
            +0 today
          </div>
        </div>
      </div>

      {/* Second Row: 4 Secondary Stat Cards */}
      <div className="admin-stats-grid" style={{ marginTop: '20px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">New Users Today</span>
            <div className="admin-stat-icon-wrap" style={{ background: '#F0F9FF', color: '#0EA5E9' }}>
              <UserPlus size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {loading ? '...' : todayStats.newUsersToday.toLocaleString()}
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">Meetings Today</span>
            <div className="admin-stat-icon-wrap" style={{ background: '#FEF2F2', color: '#EF4444' }}>
              <Video size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {loading ? '...' : todayStats.meetingsToday.toLocaleString()}
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">AI Summaries Generated</span>
            <div className="admin-stat-icon-wrap" style={{ background: '#FAF5FF', color: '#A855F7' }}>
              <Bot size={20} />
            </div>
          </div>
          <div className="admin-stat-value">
            {loading ? '...' : todayStats.totalAiSummaries.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>
            {todayStats.aiSummariesToday} generated in last 24h
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-title">System Health</span>
            <div className="admin-stat-icon-wrap" style={{ background: '#F8FAFC', color: '#64748B' }}>
              <Activity size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4B5563' }}><Server size={14} /> Backend</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: systemHealth.backend === 'Online' ? '#22c55e' : '#ef4444' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: systemHealth.backend === 'Online' ? '#22c55e' : '#ef4444' }}></span>
                {systemHealth.backend}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4B5563' }}><Database size={14} /> Database</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: systemHealth.database === 'Connected' ? '#22c55e' : '#ef4444' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: systemHealth.database === 'Connected' ? '#22c55e' : '#ef4444' }}></span>
                {systemHealth.database}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4B5563' }}><Bot size={14} /> Gemini API</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: systemHealth.gemini === 'Available' ? '#22c55e' : systemHealth.gemini === 'Rate-limited' ? '#eab308' : '#ef4444' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: systemHealth.gemini === 'Available' ? '#22c55e' : systemHealth.gemini === 'Rate-limited' ? '#eab308' : '#ef4444' }}></span>
                {systemHealth.gemini}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: 2 Large Cards */}
      <div className="admin-dashboard-bottom-grid">
        {/* Card 1: Recent Meetings */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Recent Meetings</h3>
            <Link to="/admin/meetings" style={{ color: '#202020', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Room ID</th>
                  <th>Host</th>
                  <th>Participants</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentMeetings.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#777777', padding: '24px' }}>
                      {loading ? 'Loading recent meetings...' : 'No meetings recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  recentMeetings.map((m) => (
                    <tr key={m.id || m.roomId} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/meetings')}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{m.roomId.slice(-8)}</td>
                      <td>{m.host}</td>
                      <td>{m.participants || 1}</td>
                      <td>{m.duration || 'Ended'}</td>
                      <td>
                        <span className={`admin-badge ${m.status === 'Live' ? 'admin-badge-live' : 'admin-badge-ended'}`}>
                          {m.status === 'Live' && <span className="admin-pulse-dot" style={{ width: '6px', height: '6px' }}></span>}
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Recent Activity */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Recent Activity</h3>
            <Link to="/admin/activity" style={{ color: '#202020', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Feed <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="admin-activity-list">
            {recentActivity.length === 0 ? (
              <p style={{ color: '#777777', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                {loading ? 'Loading activity...' : 'No recent activity.'}
              </p>
            ) : (
              recentActivity.map((act, index) => {
                let IconComponent = Clock;
                let iconColor = '#777777';
                if (act.type === 'user_signup') { IconComponent = UserPlus; iconColor = '#3b82f6'; }
                else if (act.type === 'meeting_start') { IconComponent = Video; iconColor = '#10b981'; }
                else if (act.type === 'meeting_end') { IconComponent = LogOut; iconColor = '#f59e0b'; }
                else if (act.type === 'user_joined_meeting') { IconComponent = LogIn; iconColor = '#8b5cf6'; }

                return (
                  <div className="admin-activity-item" key={act._id || index}>
                    <div className="admin-activity-icon" style={{ color: iconColor }}>
                      <IconComponent size={16} />
                    </div>
                    <div className="admin-activity-content">
                      <p className="admin-activity-text">{act.description}</p>
                      <span className="admin-activity-time">{formatTimeAgo(act.timestamp)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
