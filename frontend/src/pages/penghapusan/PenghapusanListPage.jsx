import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { penghapusanAPI, inventarisAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import FormModal from '../../components/common/FormModal';

/**
 * PenghapusanListPage Component
 * Halaman untuk mencatat pengajuan dan persetujuan penghapusan aset kantor.
 */
const PenghapusanListPage = () => {
  const { hasRole } = useAuth();

  // State Data
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State Dropdown Barang Aktif
  const [activeAssets, setActiveAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // State Modal Ajukan Penghapusan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDisposal, setFormDisposal] = useState({
    barang_id: '',
    alasan_penghapusan: '',
    tanggal_penghapusan: new Date().toISOString().split('T')[0],
    nilai_sisa: '',
    catatan: '',
  });

  // State Dialog Konfirmasi (Approve)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    barangName: '',
  });

  // Fetch daftar pengajuan penghapusan
  const fetchPenghapusan = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: 10,
      };
      const res = await penghapusanAPI.list(params);
      if (res.success) {
        setData(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching disposal list:', err);
      setError('Gagal mengambil data penghapusan aset.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch aset Aktif
  const fetchActiveAssets = async () => {
    setLoadingAssets(true);
    try {
      const res = await inventarisAPI.list({ status_aset: 'Aktif', limit: 100 });
      if (res.success) {
        setActiveAssets(res.data.items || []);
      }
    } catch (err) {
      console.error('Error fetching active assets:', err);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchPenghapusan();
  }, [currentPage]);

  // Buka Modal Ajukan
  const handleOpenModal = () => {
    fetchActiveAssets();
    setFormDisposal({
      barang_id: '',
      alasan_penghapusan: '',
      tanggal_penghapusan: new Date().toISOString().split('T')[0],
      nilai_sisa: '',
      catatan: '',
    });
    setIsModalOpen(true);
  };

  // Submit Ajukan
  const handleSubmitDisposal = async (e) => {
    e.preventDefault();
    if (!formDisposal.barang_id || !formDisposal.alasan_penghapusan || !formDisposal.tanggal_penghapusan) {
      alert('Mohon isi barang, alasan, dan tanggal pengajuan.');
      return;
    }

    try {
      const payload = {
        ...formDisposal,
        nilai_sisa: formDisposal.nilai_sisa ? parseFloat(formDisposal.nilai_sisa) : null,
      };
      const res = await penghapusanAPI.create(payload);
      if (res.success) {
        setIsModalOpen(false);
        fetchPenghapusan();
        alert('Pengajuan penghapusan aset berhasil dibuat.');
      }
    } catch (err) {
      console.error('Error creating disposal request:', err);
      alert(err.response?.data?.message || 'Gagal mengajukan penghapusan.');
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
      const res = await penghapusanAPI.approve(id);
      if (res.success) {
        fetchPenghapusan();
        alert('Penghapusan aset disetujui. Status barang diubah menjadi "Dihapus".');
      }
    } catch (err) {
      console.error('Error approving disposal:', err);
      alert(err.response?.data?.message || 'Gagal menyetujui penghapusan.');
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
      header: 'Alasan Penghapusan',
      key: 'alasan_penghapusan',
      render: (val) => (
        <span style={{ fontSize: '13px', display: 'inline-block', maxWidth: '250px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {val}
        </span>
      ),
    },
    {
      header: 'Tgl Ajukan',
      key: 'tanggal_penghapusan',
      render: (val) => val ? new Date(val).toLocaleDateString('id-ID') : '-',
    },
    {
      header: 'Nilai Sisa',
      key: 'nilai_sisa',
      align: 'right',
      render: (val) => val ? `Rp ${Number(val).toLocaleString('id-ID')}` : '-',
    },
    {
      header: 'Status',
      align: 'center',
      render: (val, row) => {
        const isApproved = row.approved_by !== null;
        return (
          <StatusBadge
            type="peminjaman"
            value={isApproved ? 'Approved' : 'Pending'}
          />
        );
      },
    },
    {
      header: 'Aksi',
      align: 'center',
      render: (val, row) => {
        const isAdmin = hasRole('admin');
        const isApproved = row.approved_by !== null;

        return (
          <div style={styles.actionGroup}>
            {!isApproved && isAdmin ? (
              <button
                onClick={() => handleOpenApproveConfirm(row.id, row.barang?.nama_barang)}
                style={styles.approveBtn}
              >
                Approve
              </button>
            ) : (
              <span style={{ fontSize: '13px', color: '#a0aec0' }}>
                {isApproved ? 'Selesai' : 'Hanya Admin'}
              </span>
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
          <h1 style={styles.title}>Penghapusan Aset</h1>
          <p style={styles.subtitle}>Kelola proses penarikan dan penghapusan aset dari daftar inventaris aktif.</p>
        </div>
        <button onClick={handleOpenModal} style={styles.addBtn}>
          🗑️ Ajukan Penghapusan
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p>{error}</p>
        </div>
      )}

      {/* Tabel Pengajuan */}
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

      {/* Modal Form: Ajukan Penghapusan */}
      <FormModal
        isOpen={isModalOpen}
        title="Formulir Pengajuan Penghapusan Aset"
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleSubmitDisposal} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Pilih Aset Aktif</label>
            <select
              value={formDisposal.barang_id}
              onChange={(e) => setFormDisposal({ ...formDisposal, barang_id: e.target.value })}
              style={styles.select}
              required
              disabled={loadingAssets}
            >
              <option value="">-- Pilih Barang --</option>
              {activeAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.nama_barang} ({asset.kode_inventaris}) - Rp {Number(asset.harga_perolehan).toLocaleString('id-ID')}
                </option>
              ))}
            </select>
            {loadingAssets && <span style={{ fontSize: '12px', color: '#718096' }}>Memuat daftar aset...</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tanggal Pengajuan Penghapusan</label>
            <input
              type="date"
              value={formDisposal.tanggal_penghapusan}
              onChange={(e) => setFormDisposal({ ...formDisposal, tanggal_penghapusan: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Nilai Sisa / Nilai Jual Aset (Rp - Opsional)</label>
            <input
              type="number"
              placeholder="e.g. 5000000"
              value={formDisposal.nilai_sisa}
              onChange={(e) => setFormDisposal({ ...formDisposal, nilai_sisa: e.target.value })}
              style={styles.input}
              min="0"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Alasan Penghapusan Aset</label>
            <textarea
              value={formDisposal.alasan_penghapusan}
              onChange={(e) => setFormDisposal({ ...formDisposal, alasan_penghapusan: e.target.value })}
              style={styles.textarea}
              placeholder="Tulis alasan penarikan (e.g. rusak berat tidak bisa diperbaiki, masa pakai habis, dijual, dll)..."
              rows={4}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              placeholder="Catatan tambahan..."
              value={formDisposal.catatan}
              onChange={(e) => setFormDisposal({ ...formDisposal, catatan: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={styles.cancelBtn}
            >
              Batal
            </button>
            <button type="submit" style={styles.submitBtn}>
              Kirim Pengajuan
            </button>
          </div>
        </form>
      </FormModal>

      {/* Dialog Konfirmasi Approve */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title="Setujui Penghapusan Aset"
        message={`Apakah Anda yakin ingin menyetujui penghapusan aset "${confirmDialog.barangName}"? Aksi ini akan mengubah status aset menjadi 'Dihapus' secara permanen dan tidak dapat dipinjam kembali.`}
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
  actionGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    alignItems: 'center',
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

export default PenghapusanListPage;
