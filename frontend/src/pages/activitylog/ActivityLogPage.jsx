import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { activitylogAPI, authAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';

/**
 * ActivityLogPage Component
 * Halaman untuk melihat jejak audit log aktivitas di aplikasi SIMARIS.
 */
const ActivityLogPage = () => {
  const { hasRole } = useAuth();

  // State Data Logs & Users
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State Filter values
  const [filters, setFilters] = useState({
    search: '',
    user_id: '',
    tipe_aktivitas: '',
    instance_id: '',
    tanggal_mulai: '',
    tanggal_akhir: '',
  });

  // Fetch log aktivitas
  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const activeFilters = {
        page: currentPage,
        limit: 20,
        user_id: filters.user_id || undefined,
        tipe_aktivitas: filters.tipe_aktivitas || undefined,
        instance_id: filters.instance_id || undefined,
        tanggal_mulai: filters.tanggal_mulai || undefined,
        tanggal_akhir: filters.tanggal_akhir || undefined,
        search: filters.search.trim() || undefined,
      };

      const res = await activitylogAPI.list(activeFilters);
      if (res.success) {
        setLogs(res.data.logs || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching activity log:', err);
      setError('Gagal memuat data activity log.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch daftar pengguna untuk dropdown filter
  const fetchUsers = async () => {
    try {
      const res = await authAPI.users();
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching users for filter:', err);
    }
  };

  // Trigger loading logs saat page berubah
  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  // Trigger fetch ulang saat filter berubah (dan reset page ke 1)
  useEffect(() => {
    setCurrentPage(1);
    fetchLogs();
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Filter Change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      user_id: '',
      tipe_aktivitas: '',
      instance_id: '',
      tanggal_mulai: '',
      tanggal_akhir: '',
    });
    setCurrentPage(1);
  };

  // Handle Export CSV
  const handleExportCSV = async () => {
    try {
      const activeFilters = {
        user_id: filters.user_id || undefined,
        tipe_aktivitas: filters.tipe_aktivitas || undefined,
        instance_id: filters.instance_id || undefined,
        tanggal_mulai: filters.tanggal_mulai || undefined,
        tanggal_akhir: filters.tanggal_akhir || undefined,
        search: filters.search.trim() || undefined,
      };

      const response = await activitylogAPI.export(activeFilters);
      
      // Download data blob CSV dari Axios
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `activity-log-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('Gagal mengekspor data log ke CSV.');
    }
  };

  // Daftar Opsi Tipe Aktivitas sesuai plan.md
  const activityTypes = [
    'LOGIN', 'LOGOUT',
    'TAMBAH_BARANG', 'UBAH_BARANG', 'HAPUS_BARANG', 'UBAH_KONDISI', 'UBAH_LOKASI',
    'PINJAM_BARANG_REQUEST', 'PINJAM_BARANG_APPROVE', 'PINJAM_BARANG_REJECT', 'KEMBALI_BARANG',
    'MAINTENANCE_REQUEST', 'MAINTENANCE_START', 'MAINTENANCE_SELESAI',
    'PENGADAAN_CREATE', 'PENGADAAN_APPROVE', 'PENGADAAN_ARRIVED',
    'PENGHAPUSAN_REQUEST', 'PENGHAPUSAN_APPROVE'
  ].map(t => ({ value: t, label: t }));

  // Daftar Opsi User
  const userOptions = users.map(u => ({
    value: String(u.id),
    label: `${u.nama} (${u.username})`
  }));

  // Konfigurasi Input Filter
  const filterConfigs = [
    { key: 'search', label: 'Cari Deskripsi', type: 'text', placeholder: 'Masukkan kata kunci...' },
    { key: 'user_id', label: 'Pengguna', type: 'select', placeholder: 'Semua Pengguna', options: userOptions },
    { key: 'tipe_aktivitas', label: 'Tipe Aktivitas', type: 'select', placeholder: 'Semua Tipe', options: activityTypes },
    { key: 'instance_id', label: 'Instance ID', type: 'select', placeholder: 'Semua Instance', options: [
        { value: 'instance-1', label: 'Instance 1' },
        { value: 'instance-2', label: 'Instance 2' }
      ]
    },
    { key: 'tanggal_mulai', label: 'Tanggal Mulai', type: 'date' },
    { key: 'tanggal_akhir', label: 'Tanggal Akhir', type: 'date' },
  ];

  // Konfigurasi Kolom Tabel
  const columns = [
    {
      header: 'No',
      align: 'center',
      width: '50px',
      render: (val, row, index) => (currentPage - 1) * 20 + index + 1,
    },
    {
      header: 'Timestamp',
      key: 'timestamp',
      width: '180px',
      render: (val) => val ? new Date(val).toLocaleString('id-ID') : '-',
    },
    {
      header: 'User',
      key: 'user',
      width: '150px',
      render: (user) => user ? (
        <div>
          <div style={{ fontWeight: '600' }}>{user.nama}</div>
          <div style={{ fontSize: '11px', color: '#718096' }}>@{user.username}</div>
        </div>
      ) : (
        <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>sistem</span>
      ),
    },
    {
      header: 'Tipe Aktivitas',
      key: 'tipe_aktivitas',
      width: '180px',
      render: (val) => <StatusBadge type="peminjaman" value={val} />,
    },
    {
      header: 'Deskripsi Perubahan',
      key: 'deskripsi_perubahan',
      render: (val) => <span style={{ fontSize: '13px', lineHeight: 1.4 }}>{val}</span>,
    },
    {
      header: 'IP Address',
      key: 'ip_address',
      width: '120px',
      render: (val) => val || '-',
    },
    {
      header: 'Instance',
      key: 'instance_id',
      align: 'center',
      width: '120px',
      render: (val) => <StatusBadge type="instance" value={val || 'unknown'} />,
    },
  ];

  // Menentukan visibilitas tombol ekspor: HANYA jika bukan role viewer
  const showExportBtn = hasRole('admin');

  return (
    <div style={styles.container}>
      {/* Header Panel */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Audit Activity Log</h1>
          <p style={styles.subtitle}>Rekam jejak aktivitas mutasi data sistem inventaris untuk analisis keamanan dan load balancing.</p>
        </div>
        {showExportBtn && (
          <button onClick={handleExportCSV} style={styles.exportBtn}>
            📥 Export CSV
          </button>
        )}
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p>{error}</p>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Tabel Logs */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
        }}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a365d',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#718096',
    margin: '4px 0 0 0',
  },
  exportBtn: {
    padding: '10px 20px',
    backgroundColor: '#2b6cb0',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  errorBox: {
    padding: '12px 16px',
    backgroundColor: '#fff5f5',
    border: '1px solid #fed7d7',
    borderRadius: '8px',
    color: '#c53030',
    fontSize: '14px',
  },
};

export default ActivityLogPage;
