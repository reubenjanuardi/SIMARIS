import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, setInstanceIdCallback } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('simaris_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [instanceId, setInstanceId] = useState('unknown');

  // Daftarkan callback untuk mendeteksi instance ID dari header API response
  useEffect(() => {
    setInstanceIdCallback((id) => {
      setInstanceId(id);
    });
  }, []);

  // Memulihkan sesi saat pertama kali aplikasi dimuat (pada mount)
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('simaris_token');
      if (savedToken) {
        try {
          // Panggil endpoint /me untuk mendapatkan profil pengguna saat ini
          const response = await authAPI.me();
          if (response.success && response.data) {
            setUser(response.data);
            setToken(savedToken);
          } else {
            // Jika tidak berhasil, hapus token yang tidak valid
            logoutStateReset();
          }
        } catch (error) {
          console.error('Gagal memulihkan sesi:', error);
          logoutStateReset();
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // Helper untuk reset state autentikasi
  const logoutStateReset = () => {
    localStorage.removeItem('simaris_token');
    setUser(null);
    setToken(null);
  };

  // Fungsi Login
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(username, password);
      
      if (response.success && response.data) {
        const { token: jwtToken, user: userData } = response.data;
        
        // Simpan token ke localStorage
        localStorage.setItem('simaris_token', jwtToken);
        setToken(jwtToken);
        setUser(userData);
        
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, message: response.message || 'Login gagal' };
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error saat login:', error);
      const errorMsg = error.response?.data?.message || 'Koneksi ke server gagal. Harap coba lagi.';
      return { success: false, message: errorMsg };
    }
  };

  // Fungsi Logout
  const logout = async () => {
    try {
      // Panggil API logout terlebih dahulu ke backend untuk audit log
      await authAPI.logout();
    } catch (error) {
      console.error('Error saat logout ke server:', error);
    } finally {
      // Tetap hapus token lokal meskipun request API logout gagal
      logoutStateReset();
    }
  };

  // Fungsi untuk cek apakah user sudah login
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // Fungsi untuk cek hak akses role
  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        instanceId,
        login,
        logout,
        isAuthenticated,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook untuk menggunakan AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};
