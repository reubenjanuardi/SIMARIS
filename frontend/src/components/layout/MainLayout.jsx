import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MainLayout = ({ children }) => {
  const { user, logout, instanceId, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Definisikan item menu navigasi beserta batasan role-nya
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'staff', 'viewer'] },
    { path: '/inventaris', label: 'Inventaris', icon: '📦', roles: ['admin', 'staff', 'viewer'] },
    { path: '/peminjaman', label: 'Peminjaman', icon: '📝', roles: ['admin', 'staff', 'viewer'] },
    { path: '/maintenance', label: 'Maintenance', icon: '🔧', roles: ['admin', 'staff', 'viewer'] },
    { path: '/pengadaan', label: 'Pengadaan', icon: '🛒', roles: ['admin', 'staff'] },
    { path: '/penghapusan', label: 'Penghapusan', icon: '🗑️', roles: ['admin', 'staff'] },
    { path: '/activity-log', label: 'Activity Log', icon: '📜', roles: ['admin', 'viewer'] },
  ];

  // Saring menu berdasarkan role user saat ini
  const filteredMenus = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div style={styles.container}>
      {/* Sidebar Kiri */}
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <span style={styles.logoIcon}>🏢</span>
          <span style={styles.logoText}>SIMARIS</span>
        </div>
        
        <nav style={styles.nav}>
          {filteredMenus.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              style={({ isActive }) => ({
                ...styles.navLink,
                backgroundColor: isActive ? '#2b6cb0' : 'transparent',
                fontWeight: isActive ? '600' : '400',
              })}
            >
              <span style={styles.navIcon}>{menu.icon}</span>
              <span>{menu.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Area Kanan */}
      <div style={styles.mainArea}>
        {/* Header Atas */}
        <header style={styles.header}>
          <div style={styles.headerTitle}>
            Sistem Manajemen Inventaris Kantor
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userBadge}>
              <span style={styles.userName}>{user?.nama || 'User'}</span>
              <span style={styles.userRole}>
                {user?.role === 'admin' ? 'Administrator' : user?.role === 'staff' ? 'Staff' : 'Viewer'}
              </span>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Keluar
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main style={styles.content}>
          <div style={styles.card}>
            {children}
          </div>
        </main>

        {/* Footer Kecil */}
        <footer style={styles.footer}>
          <span>Served by Instance: <strong style={styles.instanceHighlight}>{instanceId}</strong></span>
        </footer>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    backgroundColor: '#f7fafc',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#1a365d',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
  },
  logoContainer: {
    padding: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  nav: {
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  navIcon: {
    fontSize: '18px',
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflowY: 'hidden',
  },
  header: {
    height: '70px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#4a5568',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748',
  },
  userRole: {
    fontSize: '12px',
    color: '#718096',
    textTransform: 'capitalize',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#e53e3e',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    minHeight: 'calc(100% - 48px)',
  },
  footer: {
    height: '40px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#718096',
    fontSize: '12px',
  },
  instanceHighlight: {
    color: '#2b6cb0',
  },
};

export default MainLayout;
