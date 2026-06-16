import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { maintenanceAPI, inventarisAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import FormModal from '../../components/common/FormModal';

/**
 * MaintenanceListPage Component
 * Halaman untuk memantau dan memperbarui status pemeliharaan barang inventaris.
 */
const MaintenanceListPage = () => {
  const { hasRole } = useAuth();

  // State Data
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State Pagination & Filter Status
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('Semua'); // Semua | Diajukan | Dalam Perbaikan | Selesai | Batal

  // State Dropdown Barang Aktif
  const [activeAssets, setActiveAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // State Modal Request Maintenance
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [formRequest, setFormRequest] = useState({
    barang_id: '',
    deskripsi_masalah: '',
  });

  // State Modal Complete Maintenance (Input Biaya)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeId, setCompleteId] = useState(null);
  const [biayaPerbaikan, setBiayaPerbaikan] = useState('');

  // State Dialog Konfirmasi (Start)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    barangName: '',
  });

  // Fetch daftar maintenance
  const fetchMaintenance = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: 10,
        status: activeTab === 'Semua' ? undefined : activeTab,
      };
      const res = await maintenanceAPI.list(params);
      if (res.success) {
        setData(res.data.items);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching maintenance:', err);
      setError('Gagal memuat data maintenance. Silakan coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch aset untuk request maintenance
  const fetchActiveAssets = async () => {
    setLoadingAssets(true);
    try {
      // Hanya menampilkan barang berstatus Aktif
      const res = await inventarisAPI.list({ status_aset: 'Aktif', limit: 100 });
      if (res.success) {
        setActiveAssets(res.data.items);
      }
    } catch (err) {
      console.error('Error fetching active assets:', err);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, [currentPage, activeTab]);

  // Handle Tab Change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Buka Modal Request
  const handleOpenRequestModal = () => {
    fetchActiveAssets();
    setFormRequest({
      barang_id: '',
      deskripsi_masalah: '',
    });
    setIsRequestModalOpen(true);
  };

  // Submit Request
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!formRequest.barang_id || !formRequest.deskripsi_masalah) {
      alert('Mohon pilih barang dan masukkan deskripsi masalah.');
      return;
    }

    try {
      const res = await maintenanceAPI.create(formRequest);
      if (res.success) {
        setIsRequestModalOpen(false);
        fetchMaintenance();
        alert('Permintaan perbaikan/maintenance berhasil diajukan.');
      }
    } catch (err) {
      console.error('Error creating maintenance:', err);
      alert(err.response?.data?.message || 'Gagal mengajukan perbaikan.');
    }
  };

  // Pemicu Dialog Konfirmasi Start
  const handleOpenStartConfirm = (id, barangName) => {
    setConfirmDialog({
      isOpen: true,
      id,
      barangName,
    });
  };

  // Eksekusi Start Maintenance
  const handleConfirmStart = async () => {
    const { id } = confirmDialog;
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await maintenanceAPI.start(id);
      if (res.success) {
        fetchMaintenance();
        alert('Proses perbaikan barang telah dimulai.');
      }
    } catch (err) {
      console.error('Error starting maintenance:', err);
      alert(err.response?.data?.message || 'Gagal memulai perbaikan.');
    }
  };

  // Buka Modal Complete
  const handleOpenCompleteModal = (id) => {
    setCompleteId(id);
    setBiayaPerbaikan('');
    setIsCompleteModalOpen(true);
  };

  // Submit Complete Maintenance
  const handleSubmitComplete = async (e) => {
    e.preventDefault();
    try {
      const res = await maintenanceAPI.complete(completeId, {
        biaya_perbaikan: biayaPerbaikan ? parseFloat(biayaPerbaikan) : 0,
      });
      if (res.success) {
        setIsCompleteModalOpen(false);
        fetchMaintenance();
        alert('Proses perbaikan barang telah diselesaikan.');
      }
    } catch (err) {
      console.error('Error completing maintenance:', err);
      alert(err.response?.data?.message || 'Gagal menyelesaikan perbaikan.');
    }
  };

  // Konfigurasi Kolom Tabel
  const columns = [
    {
      header: 'No',
      align: 'center',
      width: '50px',
      render: (val, row, index) => (currentPage - 1) * 10 + index + 1,
    },
    {
      header: 'Barang',
      key: 'barang',
      render: (barang) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1a365d' }}>{barang?.nama_barang || 'N/A'}</div>
          <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'monospace' }}>
            {barang?.kode_inventaris || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Masalah',
      key: 'deskripsi_masalah',
      render: (val) => (
        <span style={{ fontSize: '13px', display: 'inline-block', maxWidth: '250px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {val}
        </span>
      ),
    },
    {
      header: 'Teknisi',
      key: 'teknisi',
      render: (teknisi) => teknisi?.nama || <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>Belum ditugaskan</span>,
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (val) => <StatusBadge type="maintenance" value={val} />,
    },
    {
      header: 'Tgl Mulai',
      key: 'tanggal_maintenance',
      render: (val) => val ? new Date(val).toLocaleDateString('id-ID') : '-',
    },
    {
      header: 'Tgl Selesai',
      key: 'tanggal_selesai',
      render: (val) => val ? new Date(val).toLocaleDateString('id-ID') : '-',
    },
    {
      header: 'Biaya',
      key: 'biaya_perbaikan',
      align: 'right',
      render: (val) => val ? `Rp ${Number(val).toLocaleString('id-ID')}` : '-',
    },
    {
      header: 'Aksi',
      align: 'center',
      render: (val, row) => {
        const isAuthorized = hasRole('admin', 'staff');

        return (
          <div style={styles.actionGroup}>
            {row.status === 'Diajukan' && isAuthorized && (
              <button
                onClick={() => handleOpenStartConfirm(row.id, row.barang?.nama_barang)}
                style={styles.startBtn}
              >
                Mulai
              </button>
            )}

            {row.status === 'Dalam Perbaikan' && isAuthorized && (
              <button
                onClick={() => handleOpenCompleteModal(row.id)}
                style={styles.completeBtn}
              >
                Selesai
              </button>
            )}

            {(!isAuthorized || (row.status !== 'Diajukan' && row.status !== 'Dalam Perbaikan')) && (
              <span style={{ fontSize: '13px', color: '#a0aec0' }}>Tidak ada aksi</span>
            )}
          </div>
        );
      },
    },
  ];

  const tabs = ['Semua', 'Diajukan', 'Dalam Perbaikan', 'Selesai', 'Batal'];

  return (
    <div style={styles.container}>
      {/* Header Halaman */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Maintenance Barang</h1>
          <p style={styles.subtitle}>Pantau status pemeliharaan dan perbaikan aset inventaris.</p>
        </div>
        <button onClick={handleOpenRequestModal} style={styles.addBtn}>
          🔧 Ajukan Maintenance
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p>{error}</p>
        </div>
      )}

      {/* Tabs Filter Status */}
      <div style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              ...styles.tab,
              color: activeTab === tab ? '#1a365d' : '#718096',
              borderBottom: activeTab === tab ? '3px solid #1a365d' : '3px solid transparent',
              fontWeight: activeTab === tab ? '700' : '500',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tabel Data Maintenance */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
        }}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Modal Form: Ajukan Maintenance */}
      <FormModal
        isOpen={isRequestModalOpen}
        title="Formulir Pengajuan Maintenance"
        onClose={() => setIsRequestModalOpen(false)}
      >
        <form onSubmit={handleSubmitRequest} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Pilih Aset Bermasalah</label>
            <select
              value={formRequest.barang_id}
              onChange={(e) => setFormRequest({ ...formRequest, barang_id: e.target.value })}
              style={styles.select}
              required
              disabled={loadingAssets}
            >
              <option value="">-- Pilih Barang --</option>
              {activeAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.nama_barang} ({asset.kode_inventaris}) - {asset.kondisi}
                </option>
              ))}
            </select>
            {loadingAssets && <span style={{ fontSize: '12px', color: '#718096' }}>Memuat daftar aset...</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Deskripsi Masalah / Kerusakan</label>
            <textarea
              value={formRequest.deskripsi_masalah}
              onChange={(e) => setFormRequest({ ...formRequest, deskripsi_masalah: e.target.value })}
              style={styles.textarea}
              placeholder="Deskripsikan gejala kerusakan atau masalah teknis pada barang..."
              rows={4}
              required
            />
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              style={styles.cancelBtn}
            >
              Batal
            </button>
            <button type="submit" style={styles.submitBtn}>
              Ajukan Permintaan
            </button>
          </div>
        </form>
      </FormModal>

      {/* Modal Form: Selesaikan Maintenance (Input Biaya) */}
      <FormModal
        isOpen={isCompleteModalOpen}
        title="Selesaikan Maintenance"
        onClose={() => setIsCompleteModalOpen(false)}
      >
        <form onSubmit={handleSubmitComplete} style={styles.form}>
          <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '8px' }}>
            Apakah perbaikan barang telah selesai? Masukkan total biaya perbaikan di bawah ini jika ada.
          </p>
          <div style={styles.formGroup}>
            <label style={styles.label}>Biaya Perbaikan (Rupiah)</label>
            <input
              type="number"
              placeholder="Masukkan biaya perbaikan (e.g. 150000)"
              value={biayaPerbaikan}
              onChange={(e) => setBiayaPerbaikan(e.target.value)}
              style={styles.input}
              min="0"
            />
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              style={styles.cancelBtn}
            >
              Batal
            </button>
            <button type="submit" style={styles.submitBtn}>
              Selesaikan
            </button>
          </div>
        </form>
      </FormModal>

      {/* Dialog Konfirmasi Mulai Maintenance */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title="Mulai Perbaikan Aset"
        message={`Apakah Anda ingin memulai proses perbaikan pada barang "${confirmDialog.barangName}"? Kondisi barang akan diubah ke 'Perbaikan'.`}
        onConfirm={handleConfirmStart}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
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
  addBtn: {
    padding: '10px 20px',
    backgroundColor: '#1a365d',
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
  tabsContainer: {
    display: 'flex',
    borderBottom: '1px solid #cbd5e1',
    gap: '24px',
    marginBottom: '10px',
  },
  tab: {
    background: 'none',
    border: 'none',
    padding: '10px 4px',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  actionGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  startBtn: {
    padding: '6px 12px',
    backgroundColor: '#feebc8',
    color: '#7b341e',
    border: '1px solid #feebc8',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  completeBtn: {
    padding: '6px 12px',
    backgroundColor: '#c6f6d5',
    color: '#22543d',
    border: '1px solid #c6f6d5',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#4a5568',
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  },
  textarea: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
  },
  cancelBtn: {
    padding: '10px 18px',
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  submitBtn: {
    padding: '10px 18px',
    backgroundColor: '#1a365d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
};

export default MaintenanceListPage;
