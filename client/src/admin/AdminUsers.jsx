import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminUsers, deleteAdminUser } from './adminApi';
import { Search, Filter, MoreVertical, Eye, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import './admin.css';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Delete modal state
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers({ page, limit: 20, search, status: statusFilter });
      if (data.success) {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalUsers(data.totalUsers || 0);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await deleteAdminUser(userToDelete._id);
      setUserToDelete(null);
      setActiveMenuId(null);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
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
          <h1 className="admin-greeting">User Management</h1>
          <p className="admin-subtext">Monitor, search, and manage registered VartaConnect accounts.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="admin-card">
        {/* Controls Header: Search & Filter */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '20px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#777777' }} />
              <input
                type="text"
                className="admin-input"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '42px' }}
              />
            </div>
            <button type="submit" className="admin-btn admin-btn-secondary">Search</button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} style={{ color: '#777777' }} />
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Offline">Offline Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#777777', padding: '32px' }}>
                    {loading ? 'Loading users list...' : 'No users match your filter parameters.'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td style={{ fontWeight: 600 }}>{user.name}</td>
                    <td style={{ color: '#555555' }}>{user.email}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.lastActive)}</td>
                    <td>
                      <span className={`admin-badge ${user.status === 'Active' ? 'admin-badge-active' : 'admin-badge-offline'}`}>
                        {user.status === 'Active' && <span className="admin-pulse-dot" style={{ width: '6px', height: '6px' }}></span>}
                        {user.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', position: 'relative' }}>
                      <button
                        className="admin-btn-icon"
                        onClick={() => setActiveMenuId(activeMenuId === user._id ? null : user._id)}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenuId === user._id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: '16px',
                            top: '40px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            border: '1px solid #EBEBE5',
                            padding: '6px',
                            zIndex: 50,
                            minWidth: '140px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          <button
                            className="admin-btn-icon"
                            style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', gap: '8px', fontSize: '13px' }}
                            onClick={() => {
                              setActiveMenuId(null);
                              navigate(`/admin/users/${user._id}`);
                            }}
                          >
                            <Eye size={15} />
                            <span>View Details</span>
                          </button>
                          <button
                            className="admin-btn-icon"
                            style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', gap: '8px', fontSize: '13px', color: '#DC2626' }}
                            onClick={() => {
                              setActiveMenuId(null);
                              setUserToDelete(user);
                            }}
                          >
                            <Trash2 size={15} />
                            <span>Delete User</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="admin-pagination">
          <div className="admin-pagination-text">
            Showing page {page} of {totalPages} ({totalUsers} total users)
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

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="admin-drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="admin-login-card" style={{ maxWidth: '440px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px', color: '#DC2626' }}>
              <AlertTriangle size={42} />
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, margin: '0 0 8px 0', textAlign: 'center' }}>
              Confirm Delete User?
            </h2>
            <p style={{ fontSize: '14px', color: '#555555', textAlign: 'center', marginBottom: '20px' }}>
              Are you sure you want to delete <strong>{userToDelete.name}</strong> ({userToDelete.email})?
              <br />
              <small style={{ color: '#777777', display: 'block', marginTop: '8px' }}>
                The user account will be removed immediately. Associated messages will be marked pendingDeletion and cleaned up by MongoDB Atlas TTL.
              </small>
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="admin-btn admin-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-danger"
                style={{ flex: 1 }}
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
