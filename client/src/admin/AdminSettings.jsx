import React, { useState, useEffect } from 'react';
import { getAdminSystemStatus, getAdminAuditLogs } from './adminApi';
import { Server, Database, Radio, Sparkles, Shield, Clock, HardDrive, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import './admin.css';

function AdminSettings() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        setLoading(true);
        const [statusData, auditData] = await Promise.all([
          getAdminSystemStatus(),
          getAdminAuditLogs()
        ]);

        if (statusData.success) {
          setSystemStatus(statusData.status);
        }
        if (auditData.success) {
          setAuditLogs(auditData.auditLogs || []);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch settings/system status:', err);
        setError('Failed to fetch system status and audit logs.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettingsData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadge = (state) => {
    if (state === 'Online' || state === 'Connected' || state === 'Available') {
      return (
        <span className="admin-badge admin-badge-active" style={{ gap: '6px' }}>
          <span className="admin-pulse-dot" style={{ width: '6px', height: '6px' }}></span>
          🟢 {state}
        </span>
      );
    }
    if (state === 'Not Configured' || state === 'Rate-limited') {
      return (
        <span className="admin-badge admin-badge-offline" style={{ color: '#D97706', background: '#FEF3C7' }}>
          ⚠️ {state}
        </span>
      );
    }
    return (
      <span className="admin-badge admin-badge-error">
        🔴 {state || 'Offline'}
      </span>
    );
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-greeting">System Settings & Status</h1>
          <p className="admin-subtext">View infrastructure health, TTL retention rules, and administrative audit history.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: System Status & Application Info */}
      <div className="admin-dashboard-bottom-grid" style={{ marginBottom: '24px' }}>
        {/* Card 1: System Status Live Indicators */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} /> System Status (Live Indicators)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #F0F0EA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={16} style={{ color: '#555555' }} />
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Backend Application Server</span>
              </div>
              {getStatusBadge(systemStatus ? systemStatus.backend : 'Online')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #F0F0EA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={16} style={{ color: '#555555' }} />
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Database (MongoDB Atlas)</span>
              </div>
              {getStatusBadge(systemStatus ? systemStatus.database : 'Connected')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #F0F0EA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Radio size={16} style={{ color: '#555555' }} />
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Socket.IO Real-time Gateway</span>
              </div>
              {getStatusBadge(systemStatus ? systemStatus.socket : 'Connected')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #F0F0EA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={16} style={{ color: '#555555' }} />
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Gemini AI Engine</span>
              </div>
              {getStatusBadge(systemStatus ? systemStatus.gemini : 'Available')}
            </div>
          </div>
        </div>

        {/* Card 2: App & Data Retention Config */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={18} /> Application & Retention Policy
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #F0F0EA' }}>
              <span style={{ fontSize: '12px', color: '#777777', display: 'block' }}>Application Name</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#202020' }}>
                {systemStatus ? systemStatus.appName : 'VartaConnect'}
              </span>
            </div>

            <div style={{ padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #F0F0EA' }}>
              <span style={{ fontSize: '12px', color: '#777777', display: 'block' }}>Environment</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#202020', textTransform: 'capitalize' }}>
                {systemStatus ? systemStatus.environment : 'Development / Production'}
              </span>
            </div>

            <div style={{ padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #F0F0EA' }}>
              <span style={{ fontSize: '12px', color: '#777777', display: 'block' }}>Chat Retention (Atlas TTL Index)</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#202020' }}>
                {systemStatus && systemStatus.retention ? systemStatus.retention.chatRetention : '24 Hours'}
              </span>
            </div>

            <div style={{ padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #F0F0EA' }}>
              <span style={{ fontSize: '12px', color: '#777777', display: 'block' }}>AI Summary Retention (Atlas TTL Index)</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#202020' }}>
                {systemStatus && systemStatus.retention ? systemStatus.retention.aiSummaryRetention : '3 Days'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Audit Logs Table */}
      <div className="admin-card">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} /> Admin Action Audit Logs (Last 20 Actions)
        </h3>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Admin Email</th>
                <th>Action</th>
                <th>Target ID</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#777777', padding: '32px' }}>
                    {loading ? 'Loading audit logs...' : 'No audit actions recorded yet.'}
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '12px', color: '#555555' }}>{formatDate(log.timestamp)}</td>
                    <td style={{ fontWeight: 600 }}>{log.adminEmail}</td>
                    <td>
                      <span className="admin-badge admin-badge-live" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.targetId || 'N/A'}</td>
                    <td style={{ fontSize: '13px', color: '#444444' }}>{log.details || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#777777' }}>{log.ipAddress || '127.0.0.1'}</td>
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

export default AdminSettings;
