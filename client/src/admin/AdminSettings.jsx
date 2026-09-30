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
        const [statusData, auditData, geminiData] = await Promise.all([
          getAdminSystemStatus(),
          getAdminAuditLogs(),
          import('./adminApi').then(m => m.getAdminGeminiStatus()).catch(() => ({ status: 'error' }))
        ]);

        if (statusData.success) {
          let updatedStatus = { ...statusData.status };
          if (geminiData && geminiData.status) {
            if (geminiData.status === 'ok') updatedStatus.gemini = 'Available';
            else if (geminiData.status === 'quota_exceeded') updatedStatus.gemini = 'Rate-limited';
            else if (geminiData.status === 'invalid_key') updatedStatus.gemini = 'Error';
            else updatedStatus.gemini = 'Error';
            
            updatedStatus.geminiError = geminiData.message;
          }
          setSystemStatus(updatedStatus);
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
          <CheckCircle2 size={14} color="#274E13" /> {state}
        </span>
      );
    }
    if (state === 'Not Configured' || state === 'Rate-limited') {
      return (
        <span className="admin-badge admin-badge-warning" style={{ gap: '6px' }}>
          <AlertCircle size={14} color="#92400E" /> {state}
        </span>
      );
    }
    return (
      <span className="admin-badge admin-badge-error" style={{ gap: '6px' }}>
        <XCircle size={14} color="#991B1B" /> {state || 'Offline'}
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
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#18181B' }}>
            <Server size={18} /> System Status (Live Indicators)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={16} style={{ color: '#18181B' }} />
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#18181B' }}>Backend Application Server</span>
              </div>
              {getStatusBadge(systemStatus ? systemStatus.backend : 'Online')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={16} style={{ color: '#18181B' }} />
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#18181B' }}>Database (MongoDB Atlas)</span>
              </div>
              {getStatusBadge(systemStatus ? systemStatus.database : 'Connected')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Radio size={16} style={{ color: '#18181B' }} />
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#18181B' }}>Socket.IO Real-time Gateway</span>
              </div>
              {getStatusBadge(systemStatus ? systemStatus.socket : 'Connected')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={16} style={{ color: '#18181B' }} />
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#18181B' }}>Gemini AI Engine</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {getStatusBadge(systemStatus ? systemStatus.gemini : 'Available')}
                {systemStatus?.geminiError && systemStatus.gemini !== 'Available' && (
                  <span style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', maxWidth: '150px', textAlign: 'right' }}>
                    {systemStatus.geminiError}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: App & Data Retention Config */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#18181B' }}>
            <HardDrive size={18} /> Application & Retention Policy
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              <span style={{ fontSize: '12px', color: '#52525B', display: 'block', fontWeight: 600 }}>Application Name</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#18181B' }}>
                {systemStatus ? systemStatus.appName : 'VartaConnect'}
              </span>
            </div>

            <div style={{ padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              <span style={{ fontSize: '12px', color: '#52525B', display: 'block', fontWeight: 600 }}>Environment</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#18181B', textTransform: 'capitalize' }}>
                {systemStatus ? systemStatus.environment : 'Development / Production'}
              </span>
            </div>

            <div style={{ padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              <span style={{ fontSize: '12px', color: '#52525B', display: 'block', fontWeight: 600 }}>Chat Retention (Atlas TTL Index)</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#18181B' }}>
                {systemStatus && systemStatus.retention ? systemStatus.retention.chatRetention : '24 Hours'}
              </span>
            </div>

            <div style={{ padding: '12px 14px', background: '#FAFDF5', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              <span style={{ fontSize: '12px', color: '#52525B', display: 'block', fontWeight: 600 }}>AI Summary Retention (Atlas TTL Index)</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#18181B' }}>
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
