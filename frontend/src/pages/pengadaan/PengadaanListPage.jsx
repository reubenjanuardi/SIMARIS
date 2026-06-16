import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pengadaanAPI, inventarisAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import FormModal from '../../components/common/FormModal';

/**
 * PengadaanListPage Component
 * Halaman untuk mengelola permintaan pengadaan barang/PO.
 */
const PengadaanListPage = () => {
  const { hasRole } = useAuth();

  // State Data
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State Pagination & Filter Status
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState(''); // Semua | Draft | Approved | Arrived | Rejected

  // State Modal Buat PO
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [formPO, setFormPO] = useState({
    nama_barang: '',
    kategori_id: '',
    qty: '',
    vendor: '',
    harga_satuan: '',
    tanggal_estimasi_tiba: '',
  });

  // State Modal Arrived
  const [isArrivedModalOpen, setIsArrivedModalOpen] = useState(false);
  const [arrivedId, setArrivedId] = useState(null);
  const [tanggalTerima, setTanggalTerima] = useState('');

  // State Dialog Konfirmasi (Approve)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    barangName: '',
  });

  // Fetch data pengadaan
  const fetchPengadaan = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: 10,
        status: selectedStatus || undefined,
      };
      const res = await pengadaanAPI.list(params);
      if (res.success) {
        // Karena API /api/pengadaan mengembalikan paginasi
        setData(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching pengadaan:', err);
      setError('Gagal memuat data pengadaan barang.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Kategori untuk Form PO
  const fetchCategories = async () => {
    try {
      const res = await inventarisAPI.categories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchPengadaan();
  }, [currentPage, selectedStatus]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset & Buka Modal PO
  const handleOpenPOModal = () => {
    setFormPO({
      nama_barang: '',
      kategori_id: '',
      qty: '',
      vendor: '',
      harga_satuan: '',
      tanggal_estimasi_tiba: '',
    });
    setIsPOModalOpen(true);
  };

  // Submit PO Baru
  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (!formPO.nama_barang || !formPO.kategori_id || !formPO.qty || !formPO.harga_satuan) {
      alert('Mohon isi field nama barang, kategori, qty, dan harga satuan.');
      return;
    }

    try {
      const payload = {
        ...formPO,
        qty: parseInt(formPO.qty, 10),
        harga_satuan: parseFloat(formPO.harga_satuan),
      };
      const res = await pengadaanAPI.create(payload);
      if (res.success) {
        setIsPOModalOpen(false);
        fetchPengadaan();
        alert('PO Pengadaan berhasil dibuat dengan status Draft.');
      }
    } catch (err) {
      console.error('Error creating PO:', err);
      alert(err.response?.data?.message || 'Gagal membuat PO Pengadaan.');
    }
  };

  // Pemicu Dialog Konfirmasi Approve
  const handleOpenApproveConfirm = (id, barangName) => {
    setConfirmDialog({
      isOpen: true,
      id,
      barangName,
    });
  };

  // Eksekusi Approve
  const handleConfirmApprove = async () => {
    const { id } = confirmDialog;
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await pengadaanAPI.approve(id);
      if (res.success) {
        fetchPengadaan();
        alert('PO Pengadaan berhasil disetujui.');
      }
    } catch (err) {
      console.error('Error approving PO:', err);
      alert(err.response?.data?.message || 'Gagal menyetujui PO.');
    }
  };

  // Buka Modal Arrived
  const handleOpenArrivedModal = (id) => {
    setArrivedId(id);
    setTanggalTerima(new Date().toISOString().split('T')[0]);
    setIsArrivedModalOpen(true);
  };

  // Submit Arrived
  const handleSubmitArrived = async (e) => {
    e.preventDefault();
    try {
      const res = await pengadaanAPI.arrived(arrivedId, {
        tanggal_terima: tanggalTerima,
      });
      if (res.success) {
        setIsArrivedModalOpen(false);
        fetchPengadaan();
        alert('Barang PO telah ditandai tiba.');
      }
    } catch (err) {
      console.error('Error setting arrived PO:', err);
      alert(err.response?.data?.message || 'Gagal mengubah status PO.');
    }
  };

  // Konfigurasi Kolom Tabel
  const columns = [
    {
      header: 'No PO',
      key: 'nomor_po',
      render: (val) => <span style={{ fontWeight: '700', color: '#1a365d', fontFamily: 'monospace' }}>{val}</span>,
    },
    {
      header: 'Barang',
      key: 'nama_barang',
      render: (val) => <span style={{ fontWeight: '500' }}>{val}</span>,
    },
    {
      header: 'Kategori',
      key: 'kategori',
      render: (kategori) => kategori?.nama_kategori || '-',
    },
    {
      header: 'Qty',
      key: 'qty',
      align: 'center',
    },
    {
      header: 'Vendor',
      key: 'vendor',
      render: (val) => val || '-',
    },
    {
      header: 'Total Harga',
      key: 'total_harga',
      align: 'right',
      render: (val) => `Rp ${Number(val).toLocaleString('id-ID')}`,
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (val) => <StatusBadge type="peminjaman" value={val} />, // Menggunakan skema warna badge yang mirip
    },
    {
      header: 'Aksi',
      align: 'center',
      render: (val, row) => {
        const isAdmin = hasRole('admin');
        const isStaffOrAdmin = hasRole('admin', 'staff');

        return (
          <div style={styles.actionGroup}>
            {row.status === 'Draft' && isAdmin && (
              <button
                onClick={() => handleOpenApproveConfirm(row.id, row.nama_barang)}
                style={styles.approveBtn}
              >
                Setujui
              </button>
            )}

            {row.status === 'Approved' && isStaffOrAdmin && (
              <button
                onClick={() => handleOpenArrivedModal(row.id)}
                style={styles.arrivedBtn}
              >
                Tiba
              </button>
            )}

            {row.status !== 'Draft' && row.status !== 'Approved' && (
              <span style={{ fontSize: '13px', color: '#a0aec0' }}>Tidak ada aksi</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={styles.container}>
      {/* Header Panel */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Pengadaan Barang (PO)</h1>
          <p style={styles.subtitle}>Kelola pengajuan pembelian barang inventaris baru.</p>
        </div>
        <button onClick={handleOpenPOModal} style={styles.addBtn}>
          🛒 Buat PO Pengadaan
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p>{error}</p>
        </div>
      )}

      {/* Filter Status Selector */}
      <div style={styles.filterCard}>
        <div style={styles.filterForm}>
          <label style={styles.filterLabel}>Saring Status PO:</label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.selectFilter}
          >
            <option value="">Semua Status PO</option>
            <option value="Draft">Draft (Menunggu Approval)</option>
            <option value="Approved">Approved (Disetujui)</option>
            <option value="Ordered">Ordered (Dipesan)</option>
            <option value="Arrived">Arrived (Tiba)</option>
            <option value="Rejected">Rejected (Ditolak)</option>
          </select>
        </div>
      </div>

      {/* Tabel PO */}
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

      {/* Modal Form: Buat PO */}
      <FormModal
        isOpen={isPOModalOpen}
        title="Formulir Purchase Order (PO) Baru"
        onClose={() => setIsPOModalOpen(false)}
      >
        <form onSubmit={handleSubmitPO} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nama Barang</label>
            <input
              type="text"
              placeholder="e.g. Dell PowerEdge R740 Server"
              value={formPO.nama_barang}
              onChange={(e) => setFormPO({ ...formPO, nama_barang: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Kategori Barang</label>
            <select
              value={formPO.kategori_id}
              onChange={(e) => setFormPO({ ...formPO, kategori_id: e.target.value })}
              style={styles.select}
              required
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nama_kategori}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.gridTwo}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Jumlah (Qty)</label>
              <input
                type="number"
                placeholder="e.g. 2"
                value={formPO.qty}
                onChange={(e) => setFormPO({ ...formPO, qty: e.target.value })}
                style={styles.input}
                min="1"
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Harga Satuan (Rp)</label>
              <input
                type="number"
                placeholder="e.g. 25000000"
                value={formPO.harga_satuan}
                onChange={(e) => setFormPO({ ...formPO, harga_satuan: e.target.value })}
                style={styles.input}
                min="0"
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Nama Vendor / Supplier</label>
            <input
              type="text"
              placeholder="e.g. PT. Global Teknologi"
              value={formPO.vendor}
              onChange={(e) => setFormPO({ ...formPO, vendor: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Estimasi Tanggal Tiba</label>
            <input
              type="date"
              value={formPO.tanggal_estimasi_tiba}
              onChange={(e) => setFormPO({ ...formPO, tanggal_estimasi_tiba: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={() => setIsPOModalOpen(false)}
              style={styles.cancelBtn}
            >
              Batal
            </button>
            <button type="submit" style={styles.submitBtn}>
              Buat Draft PO
            </button>
          </div>
        </form>
      </FormModal>

      {/* Modal Form: Barang Tiba */}
      <FormModal
        isOpen={isArrivedModalOpen}
        title="Tandai Penerimaan Barang"
        onClose={() => setIsArrivedModalOpen(false)}
      >
        <form onSubmit={handleSubmitArrived} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tanggal Terima Barang</label>
            <input
              type="date"
              value={tanggalTerima}
              onChange={(e) => setTanggalTerima(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={() => setIsArrivedModalOpen(false)}
              style={styles.cancelBtn}
            >
              Batal
            </button>
            <button type="submit" style={styles.submitBtn}>
              Tandai Tiba
            </button>
          </div>
        </form>
      </FormModal>

      {/* Dialog Konfirmasi Approve */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title="Setujui PO Pengadaan"
        message={`Apakah Anda yakin ingin menyetujui Purchase Order untuk "${confirmDialog.barangName}"? Setelah disetujui, PO siap dipesan.`}
        onConfirm={handleConfirmApprove}
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
  filterCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
  },
  filterForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#4a5568',
  },
  selectFilter: {
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
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
  },
  arrivedBtn: {
    padding: '6px 12px',
    backgroundColor: '#ebf8ff',
    color: '#2b6cb0',
    border: '1px solid #ebf8ff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
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
  gridTwo: {
    display: 'flex',
    gap: '12px',
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
    width: '100%',
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

export default PengadaanListPage;
