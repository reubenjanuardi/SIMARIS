import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { peminjamanAPI, inventarisAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import FormModal from '../../components/common/FormModal';

/**
 * PeminjamanListPage Component
 * Halaman untuk mengelola alur peminjaman dan pengembalian barang.
 */
const PeminjamanListPage = () => {
  const { user, hasRole } = useAuth();

  // State Data
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State Pagination & Filter Status
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('Semua'); // Semua | Pending | Approved | Dikembalikan | Rejected

  // State Dropdown Aset Aktif untuk Form Pengajuan
  const [activeAssets, setActiveAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // State Modal Request Peminjaman
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [formRequest, setFormRequest] = useState({
    barang_id: '',
    tanggal_rencana_kembali: '',
    catatan: '',
  });

  // State Modal Return Peminjaman
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnId, setReturnId] = useState(null);
  const [formReturn, setFormReturn] = useState({
    kondisi_saat_kembali: 'Baik',
    catatan: '',
  });

  // State Dialog Konfirmasi (Approve/Reject)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: '', // 'approve' | 'reject'
    id: null,
    title: '',
    message: '',
  });

  // Fetch daftar peminjaman
  const fetchPeminjaman = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: 10,
        status: activeTab === 'Semua' ? undefined : activeTab,
      };
      const res = await peminjamanAPI.list(params);
      if (res.success) {
        setData(res.data.items);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching peminjaman:', err);
      setError('Gagal memuat data peminjaman. Silakan coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch aset berstatus 'Aktif' untuk form request
  const fetchActiveAssets = async () => {
    setLoadingAssets(true);
    try {
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
    fetchPeminjaman();
  }, [currentPage, activeTab]);

  // Handle Tab Click
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // reset ke page 1
  };

  // Buka Modal Request Peminjaman
  const handleOpenRequestModal = () => {
    fetchActiveAssets();
    setFormRequest({
      barang_id: '',
      tanggal_rencana_kembali: '',
      catatan: '',
    });
    setIsRequestModalOpen(true);
  };

  // Submit Request Peminjaman
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setError('');
    if (!formRequest.barang_id || !formRequest.tanggal_rencana_kembali) {
      alert('Mohon isi barang dan tanggal rencana kembali.');
      return;
    }

    try {
      const res = await peminjamanAPI.create(formRequest);
      if (res.success) {
        setIsRequestModalOpen(false);
        fetchPeminjaman();
        alert('Permintaan peminjaman berhasil diajukan.');
      }
    } catch (err) {
      console.error('Error creating peminjaman:', err);
      alert(err.response?.data?.message || 'Gagal mengajukan peminjaman.');
    }
  };

  // Buka Modal Return Peminjaman
  const handleOpenReturnModal = (id) => {
    setReturnId(id);
    setFormReturn({
      kondisi_saat_kembali: 'Baik',
      catatan: '',
    });
    setIsReturnModalOpen(true);
  };

  // Submit Return Peminjaman
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    try {
      const res = await peminjamanAPI.return(returnId, formReturn);
      if (res.success) {
        setIsReturnModalOpen(false);
        fetchPeminjaman();
        alert('Barang berhasil dikembalikan.');
      }
    } catch (err) {
      console.error('Error returning item:', err);
      alert(err.response?.data?.message || 'Gagal mengembalikan barang.');
    }
  };

  // Pemicu Dialog Konfirmasi (Approve/Reject)
  const openConfirmDialog = (type, id, barangName) => {
    setConfirmDialog({
      isOpen: true,
      type,
      id,
      title: type === 'approve' ? 'Setujui Peminjaman' : 'Tolak Peminjaman',
      message: type === 'approve'
        ? `Apakah Anda yakin ingin menyetujui peminjaman barang "${barangName}"?`
        : `Apakah Anda yakin ingin menolak peminjaman barang "${barangName}"?`,
    });
  };

  // Eksekusi Konfirmasi
  const handleConfirmAction = async () => {
    const { type, id } = confirmDialog;
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    try {
      let res;
      if (type === 'approve') {
        res = await peminjamanAPI.approve(id);
      } else {
        res = await peminjamanAPI.reject(id);
      }
      if (res.success) {
        fetchPeminjaman();
        alert(type === 'approve' ? 'Peminjaman disetujui.' : 'Peminjaman ditolak.');
      }
    } catch (err) {
      console.error(`Error during ${type}:`, err);
      alert(err.response?.data?.message || `Gagal memproses peminjaman.`);
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
      header: 'Peminjam',
      key: 'peminjam',
      render: (peminjam) => (
        <div>
          <div style={{ fontWeight: '600' }}>{peminjam?.nama || 'N/A'}</div>
          <div style={{ fontSize: '12px', color: '#718096' }}>{peminjam?.departemen || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Barang',
      key: 'barang',
      render: (barang) => (
        <div>
          <div style={{ fontWeight: '500', color: '#1a365d' }}>{barang?.nama_barang || 'N/A'}</div>
          <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'monospace' }}>
            {barang?.kode_inventaris || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Tgl Pinjam',
      key: 'tanggal_peminjaman',
      render: (val) => val ? new Date(val).toLocaleDateString('id-ID') : '-',
    },
    {
      header: 'Tgl Rencana Kembali',
      key: 'tanggal_rencana_kembali',
      render: (val) => val ? new Date(val).toLocaleDateString('id-ID') : '-',
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (val) => <StatusBadge type="peminjaman" value={val} />,
    },
    {
      header: 'Aksi',
      align: 'center',
      render: (val, row) => {
        const isAdmin = hasRole('admin');
        const isCurrentPeminjam = user && user.id === row.peminjam_id;

        return (
          <div style={styles.actionGroup}>
            {row.status === 'Pending' && isAdmin && (
              <>
                <button
                  onClick={() => openConfirmDialog('approve', row.id, row.barang?.nama_barang)}
                  style={styles.approveBtn}
                >
                  Setujui
                </button>
                <button
                  onClick={() => openConfirmDialog('reject', row.id, row.barang?.nama_barang)}
                  style={styles.rejectBtn}
                >
                  Tolak
                </button>
              </>
            )}

            {row.status === 'Approved' && (isCurrentPeminjam || isAdmin) && (
              <button
                onClick={() => handleOpenReturnModal(row.id)}
                style={styles.returnBtn}
              >
                Kembalikan
              </button>
            )}

            {row.status !== 'Pending' && row.status !== 'Approved' && (
              <span style={{ fontSize: '13px', color: '#a0aec0' }}>Tidak ada aksi</span>
            )}
          </div>
        );
      },
    },
  ];

  const tabs = ['Semua', 'Pending', 'Approved', 'Dikembalikan', 'Rejected'];

  return (
    <div style={styles.container}>
      {/* Header Halaman */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Peminjaman Barang</h1>
          <p style={styles.subtitle}>Kelola permintaan peminjaman dan pengembalian aset kantor.</p>
        </div>
        <button onClick={handleOpenRequestModal} style={styles.addBtn}>
          ➕ Request Peminjaman
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

      {/* Tabel Data Peminjaman */}
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

      {/* Modal Form: Request Peminjaman */}
      <FormModal
        isOpen={isRequestModalOpen}
        title="Formulir Request Peminjaman"
        onClose={() => setIsRequestModalOpen(false)}
      >
        <form onSubmit={handleSubmitRequest} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Pilih Aset (Status Aktif)</label>
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
                  {asset.nama_barang} ({asset.kode_inventaris})
                </option>
              ))}
            </select>
            {loadingAssets && <span style={{ fontSize: '12px', color: '#718096' }}>Memuat daftar aset...</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tanggal Rencana Kembali</label>
            <input
              type="date"
              value={formRequest.tanggal_rencana_kembali}
              onChange={(e) => setFormRequest({ ...formRequest, tanggal_rencana_kembali: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Catatan Tambahan (Opsional)</label>
            <textarea
              value={formRequest.catatan}
              onChange={(e) => setFormRequest({ ...formRequest, catatan: e.target.value })}
              style={styles.textarea}
              placeholder="Tulis alasan peminjaman atau kebutuhan lainnya..."
              rows={3}
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
              Kirim Request
            </button>
          </div>
        </form>
      </FormModal>

      {/* Modal Form: Pengembalian Barang */}
      <FormModal
        isOpen={isReturnModalOpen}
        title="Formulir Pengembalian Barang"
        onClose={() => setIsReturnModalOpen(false)}
      >
        <form onSubmit={handleSubmitReturn} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Kondisi Saat Kembali</label>
            <select
              value={formReturn.kondisi_saat_kembali}
              onChange={(e) => setFormReturn({ ...formReturn, kondisi_saat_kembali: e.target.value })}
              style={styles.select}
              required
            >
              <option value="Baik">Baik</option>
              <option value="Rusak">Rusak</option>
              <option value="Hilang">Hilang</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Catatan Pengembalian (Opsional)</label>
            <textarea
              value={formReturn.catatan}
              onChange={(e) => setFormReturn({ ...formReturn, catatan: e.target.value })}
              style={styles.textarea}
              placeholder="Masukkan kondisi fisik barang atau masalah jika ada..."
              rows={3}
            />
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
              style={styles.cancelBtn}
            >
              Batal
            </button>
            <button type="submit" style={styles.submitBtn}>
              Proses Kembali
            </button>
          </div>
        </form>
      </FormModal>

      {/* Dialog Konfirmasi Setujui/Tolak */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirmAction}
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
  approveBtn: {
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
  rejectBtn: {
    padding: '6px 12px',
    backgroundColor: '#fed7d7',
    color: '#742a2a',
    border: '1px solid #fed7d7',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  returnBtn: {
    padding: '6px 12px',
    backgroundColor: '#ebf8ff',
    color: '#2b6cb0',
    border: '1px solid #ebf8ff',
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

export default PeminjamanListPage;
