import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasRole, isLoading } = useAuth();

  // Tampilkan loading screen sederhana jika sesi sedang dipulihkan
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Inter, sans-serif',
        color: '#1a365d',
        backgroundColor: '#f7fafc',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #1a365d',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px auto'
          }} />
          <p>Memuat sesi...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Jika belum login, arahkan ke halaman login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Jika role yang dimiliki tidak sesuai dengan yang diizinkan
  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
