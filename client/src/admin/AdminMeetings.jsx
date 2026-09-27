import React, { useState, useEffect } from 'react';
import { getAdminMeetings, getAdminMeetingDetail } from './adminApi';
import { Search, Filter, Video, Radio, ChevronLeft, ChevronRight, X, Sparkles, Users, Clock } from 'lucide-react';
import './admin.css';

function AdminMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All | Live | Ended
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMeetings, setTotalMeetings] = useState(0);
  
  // Side Panel Drawer State
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [meetingDetail, setMeetingDetail] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await getAdminMeetings({ page, limit: 20, search, status: statusFilter });
      if (data.success) {
        setMeetings(data.meetings || []);
        setTotalPages(data.totalPages || 1);
        setTotalMeetings(data.totalMeetings || 0);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
      setError('Failed to load meetings list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [page, statusFilter]);

  const handleRowClick = async (roomId) => {
    setSelectedMeetingId(roomId);
    setDrawerLoading(true);
    try {
      const data = await getAdminMeetingDetail(roomId);
      if (data.success) {
        setMeetingDetail(data.meetingDetails);
      }
    } catch (err) {
      console.error('Failed to fetch meeting detail:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMeetings();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-greeting">Meetings Monitor</h1>
          <p className="admin-subtext">View ongoing live calls and past meeting logs across VartaConnect.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="admin-card">
        {/* Controls: Search & Tabs */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '20px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#777777' }} />
              <input
                type="text"
                className="admin-input"
                placeholder="Search meeting ID or host..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '42px' }}
              />
            </div>
            <button type="submit" className="admin-btn admin-btn-secondary">Search</button>
          </form>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', background: '#F7F7F3', borderRadius: '12px', padding: '4px', border: '1px solid #EBEBE5' }}>
            {['All', 'Live', 'Ended'].map((tab) => (
              <button
                key={tab}
                className="admin-btn"
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: statusFilter === tab ? '#C8F24A' : 'transparent',
                  color: '#202020',
                  fontWeight: statusFilter === tab ? 700 : 500,
                  boxShadow: 'none'
                }}
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
              >
                {tab === 'Live' && <Radio size={14} color="#10B981" style={{ marginRight: '4px' }} />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Meetings Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Meeting ID</th>
                <th>Title / Host</th>
                <th>Participants</th>
                <th>Duration</th>
                <th>Created</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {meetings.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#777777', padding: '32px' }}>
                    {loading ? 'Loading meetings...' : 'No meetings found.'}
                  </td>
                </tr>
              ) : (
                meetings.map((m) => (
                  <tr key={m._id || m.meetingId} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(m.meetingId)}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{m.meetingId.slice(-8)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.title}</div>
                      <div style={{ fontSize: '12px', color: '#777777' }}>Host: {m.host}</div>
                    </td>
                    <td>{m.participantsCount || 1}</td>
                    <td>{m.duration}</td>
                    <td>{formatDate(m.createdAt)}</td>
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

        {/* Pagination */}
        <div className="admin-pagination">
          <div className="admin-pagination-text">
            Page {page} of {totalPages} ({totalMeetings} meetings total)
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

      {/* Side Panel Drawer for Meeting Details */}
      {selectedMeetingId && (
        <div className="admin-drawer-overlay" onClick={() => setSelectedMeetingId(null)}>
          <div className="admin-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={20} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Meeting Details</h3>
              </div>
              <button className="admin-btn-icon" onClick={() => setSelectedMeetingId(null)}>
                <X size={20} />
              </button>
            </div>

            {drawerLoading ? (
              <p style={{ textAlign: 'center', color: '#777777', padding: '40px 0' }}>Loading details...</p>
            ) : meetingDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#777777', display: 'block' }}>Meeting Room ID</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>{meetingDetail.meetingId}</span>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: '#777777', display: 'block' }}>Meeting Title</span>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{meetingDetail.title}</span>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: '#777777', display: 'block' }}>Meeting Host</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{meetingDetail.host} ({meetingDetail.hostEmail})</span>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1, background: '#F7F7F3', padding: '12px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#777777', display: 'block' }}>Status</span>
                    <span className={`admin-badge ${meetingDetail.status === 'Live' ? 'admin-badge-live' : 'admin-badge-ended'}`} style={{ marginTop: '4px' }}>
                      {meetingDetail.status}
                    </span>
                  </div>

                  <div style={{ flex: 1, background: '#F7F7F3', padding: '12px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#777777', display: 'block' }}>AI Notes Enabled</span>
                    <span className={`admin-badge ${meetingDetail.aiNotesEnabled ? 'admin-badge-active' : 'admin-badge-offline'}`} style={{ marginTop: '4px' }}>
                      <Sparkles size={12} /> {meetingDetail.aiNotesEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} /> Active / Joined Participants ({meetingDetail.participants ? meetingDetail.participants.length : 0})
                  </h4>
                  {meetingDetail.participants && meetingDetail.participants.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {meetingDetail.participants.map((p, idx) => (
                        <div key={idx} style={{ padding: '8px 12px', background: '#F7F7F3', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{p.username}</span>
                          {p.isHost && <span style={{ fontSize: '11px', fontWeight: 700, color: '#365314' }}>HOST</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#777777', margin: 0 }}>No active participants currently connected.</p>
                  )}
                </div>

                {meetingDetail.aiAnalysisSummary && (
                  <div style={{ background: '#FAFDF5', border: '1px solid #E2F99B', padding: '14px', borderRadius: '14px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px 0', color: '#365314', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} /> AI Summary Snippet
                    </h4>
                    <p style={{ fontSize: '13px', color: '#333333', margin: 0, lineHeight: 1.5 }}>
                      {meetingDetail.aiAnalysisSummary}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMeetings;
