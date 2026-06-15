import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, instanceId } = useAuth();
  const navigate = useNavigate();

  // Jika pengguna sudah terotentikasi, alihkan ke dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Panggil endpoint saat mount untuk mendapatkan instance ID awal dari server
  useEffect(() => {
    authAPI.me().catch(() => {
      // Mengabaikan error 401 karena ini hanya untuk mendeteksi instance ID pada awal load
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan Password wajib diisi');
      return;
    }

    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={styles.container}>
      {/* Kartu Login */}
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoIcon}>🏢</div>
          <h1 style={styles.title}>SIMARIS</h1>
          <p style={styles.subtitle}>Sistem Manajemen Inventaris Kantor</p>
        </div>

        {/* Tampilan Error */}
        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span>
            <span style={styles.errorMessage}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="username" style={styles.label}>Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username Anda"
              style={styles.input}
              disabled={isSubmitting}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password Anda"
              style={styles.input}
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              backgroundColor: isSubmitting ? '#4a5568' : '#1a365d',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div style={styles.spinnerContainer}>
                <div style={styles.spinner} />
                <span>Memproses...</span>
              </div>
            ) : (
              'Masuk Ke Sistem'
            )}
          </button>
        </form>
      </div>

      {/* Badge Instance ID di Pojok Kiri Bawah */}
      <div style={styles.instanceBadge}>
        <span style={styles.instanceDot}></span>
        <span>Instance ID: <strong>{instanceId}</strong></span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0f172a',
    backgroundImage: 'radial-gradient(circle at top right, #1e293b, #0f172a)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    position: 'relative',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoIcon: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a365d',
    margin: '0 0 4px 0',
    letterSpacing: '1px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  errorIcon: {
    fontSize: '16px',
  },
  errorMessage: {
    fontSize: '13px',
    color: '#991b1b',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    width: '100%',
    '&:focus': {
      borderColor: '#1a365d',
      boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
    },
  },
  submitBtn: {
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '10px',
  },
  spinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  spinner: {
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    animation: 'spin 1s linear infinite',
  },
  instanceBadge: {
    position: 'absolute',
    bottom: '24px',
    left: '24px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '8px 16px',
    color: '#94a3b8',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  instanceDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    display: 'inline-block',
  },
};

export default LoginPage;
