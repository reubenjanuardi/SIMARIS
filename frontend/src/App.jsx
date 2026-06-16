import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Import Halaman
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import InventarisListPage from './pages/inventaris/InventarisListPage';
import InventarisDetailPage from './pages/inventaris/InventarisDetailPage';
import InventarisFormPage from './pages/inventaris/InventarisFormPage';
import PeminjamanListPage from './pages/peminjaman/PeminjamanListPage';
import MaintenanceListPage from './pages/maintenance/MaintenanceListPage';
import PengadaanListPage from './pages/pengadaan/PengadaanListPage';
import PenghapusanListPage from './pages/penghapusan/PenghapusanListPage';
import ActivityLogPage from './pages/activitylog/ActivityLogPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rute Publik */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rute Terproteksi (Hanya dapat diakses jika sudah login) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Inventaris (Semua Role) */}
          <Route
            path="/inventaris"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <InventarisListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Form Tambah Inventaris (Hanya Admin dan Staff) */}
          <Route
            path="/inventaris/tambah"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <MainLayout>
                  <InventarisFormPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Form Edit Inventaris (Hanya Admin dan Staff) */}
          <Route
            path="/inventaris/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <MainLayout>
                  <InventarisFormPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Detail Inventaris (Semua Role) - Taruh di paling akhir agar tidak memicu tabrakan rute */}
          <Route
            path="/inventaris/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <InventarisDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Peminjaman (Semua Role) */}
          <Route
            path="/peminjaman"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PeminjamanListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Maintenance (Semua Role) */}
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MaintenanceListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Pengadaan (Hanya Admin dan Staff) */}
          <Route
            path="/pengadaan"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <MainLayout>
                  <PengadaanListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Penghapusan Aset (Hanya Admin dan Staff) */}
          <Route
            path="/penghapusan"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <MainLayout>
                  <PenghapusanListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Activity Log (Hanya Admin dan Viewer) */}
          <Route
            path="/activity-log"
            element={
              <ProtectedRoute allowedRoles={['admin', 'viewer']}>
                <MainLayout>
                  <ActivityLogPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirect Rute / ke /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Mengarahkan Rute Tak Dikenal Kembali ke Rute Awal */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
