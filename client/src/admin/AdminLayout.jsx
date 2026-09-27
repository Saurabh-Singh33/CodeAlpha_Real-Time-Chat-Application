import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Video, Clock, Settings, LogOut, Menu, X } from 'lucide-react';
import './admin.css';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState({ name: 'Saurabh', email: 'admin@vartaconnect.com' });

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    const storedUser = sessionStorage.getItem('adminUser');
    if (storedUser) {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch (err) {
        // Fallback default
      }
    }
  }, [navigate, location]);

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    navigate('/admin/login', { replace: true });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="admin-layout-container">
      {/* Mobile Top Bar */}
      <div className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
          <span style={{ background: '#C8F24A', padding: '4px 8px', borderRadius: '6px' }}>V</span>
          VartaConnect Admin
        </div>
        <button className="admin-btn-icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar Panel */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div>
          <div className="admin-brand">
            <div className="admin-brand-icon">V</div>
            <div className="admin-brand-title">VartaConnect</div>
          </div>


          <div className="admin-profile-card">
            <div className="admin-avatar">
              {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="admin-profile-info">
              <span className="admin-profile-name">{adminUser.name || 'Saurabh'}</span>
              <span className="admin-profile-email">{adminUser.email || 'admin@vartaconnect.com'}</span>
            </div>
          </div>

          <nav className="admin-nav">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/users"
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <Users size={18} />
              <span>Users</span>
            </NavLink>

            <NavLink
              to="/admin/meetings"
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <Video size={18} />
              <span>Meetings</span>
            </NavLink>

            <NavLink
              to="/admin/activity"
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <Clock size={18} />
              <span>Activity</span>
            </NavLink>

            <div className="admin-nav-divider"></div>

            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>

        <div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Outlet View */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
