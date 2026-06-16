import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inventarisAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const InventarisDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole, instanceId } = useAuth();

  const [item, setItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const fetchDetail = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await inventarisAPI.get(id);
      if (res.success) {
        setItem(res.data.inventaris);
        setHistory(res.data.activityHistory || []);
      }
    } catch (err) {
      console.error('Error fetching inventaris detail:', err);
      setError('Gagal memuat detail barang. Barangkali barang telah dihapus atau tidak ditemukan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Format ke Rupiah
  const formatRupiah = (val) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Format tanggal
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Format waktu log
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handler Soft Delete (Hanya Admin)
  const handleDelete = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus barang '${item?.nama_barang}' dari sistem? (Soft delete)`)) {
      return;
    }

    setDeleteError('');
    try {
      const res = await inventarisAPI.delete(id);
      if (res.success) {
        alert('Barang berhasil dihapus (soft delete).');
        navigate('/inventaris');
      } else {
        setDeleteError(res.message || 'Gagal menghapus barang.');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan server saat menghapus barang.';
      setDeleteError(errMsg);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '12px', color: '#718096' }}>Memuat detail barang...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={styles.errorContainer}>
        <p style={{ color: '#e53e3e', fontWeight: '500', marginBottom: '15px' }}>{error || 'Barang tidak ditemukan'}</p>
        <button onClick={() => navigate('/inventaris')} style={styles.backBtn}>Kembali ke Daftar</button>
      </div>
    );
  }

  // Cek validitas tombol aksi
  const isAktif = item.status_aset === 'Aktif';
  const isRusak = item.kondisi === 'Rusak';
  const isPerbaikan = item.kondisi === 'Perbaikan';

  return (
    <div style={styles.container}>
      {/* Tombol Kembali & Judul */}
      <div style={styles.header}>
        <button onClick={() => navigate('/inventaris')} style={styles.backLinkBtn}>
          ⬅️ Kembali ke Daftar
        </button>
        <div style={styles.refreshBadge}>
          <span>Instance: <strong>{instanceId}</strong></span>
        </div>
      </div>

      {/* Info Utama Aset */}
      <div style={styles.mainGrid}>
        
        {/* Detail Kolom Kiri */}
        <div style={styles.detailsCard}>
          <div style={styles.titleRow}>
            <div>
              <span style={styles.kodeLabel}>{item.kode_inventaris}</span>
              <h2 style={styles.itemTitle}>{item.nama_barang}</h2>
            </div>
            <div style={styles.badgeRow}>
              {/* Badge Kondisi */}
              <span style={{
                ...styles.badge,
                backgroundColor: item.kondisi === 'Baik' ? '#c6f6d5' : item.kondisi === 'Rusak' ? '#fed7d7' : item.kondisi === 'Perbaikan' ? '#feebc8' : '#e2e8f0',
                color: item.kondisi === 'Baik' ? '#22543d' : item.kondisi === 'Rusak' ? '#742a2a' : item.kondisi === 'Perbaikan' ? '#7b341e' : '#4a5568'
              }}>
                Kondisi: {item.kondisi}
              </span>
              
              {/* Badge Status Aset */}
              <span style={{
                ...styles.badge,
                backgroundColor: item.status_aset === 'Aktif' ? '#ebf8ff' : item.status_aset === 'Dipinjam' ? '#fffaf0' : item.status_aset === 'Dalam Perbaikan' ? '#feebc8' : '#edf2f7',
                color: item.status_aset === 'Aktif' ? '#2b6cb0' : item.status_aset === 'Dipinjam' ? '#dd6b20' : item.status_aset === 'Dalam Perbaikan' ? '#9c4221' : '#718096'
              }}>
                Status: {item.status_aset}
              </span>
            </div>
          </div>

          {deleteError && (
            <div style={styles.deleteErrorBox}>{deleteError}</div>
          )}

          {/* Grid Informasi Atribut */}
          <div style={styles.infoGrid}>
            <div style={styles.infoGroup}>
              <span style={styles.infoLabel}>Kategori</span>
              <span style={styles.infoValue}>{item.kategori?.nama_kategori || '-'}</span>
            </div>

            <div style={styles.infoGroup}>
              <span style={styles.infoLabel}>Lokasi Penyimpanan</span>
              <span style={styles.infoValue}>{item.lokasi}</span>
            </div>

            <div style={styles.infoGroup}>
              <span style={styles.infoLabel}>No Seri / Model</span>
              <span style={styles.infoValue}>{item.no_seri || '-'}</span>
            </div>

            <div style={styles.infoGroup}>
              <span style={styles.infoLabel}>Masa Garansi</span>
              <span style={styles.infoValue}>{formatDate(item.masa_garansi)}</span>
            </div>

            <div style={styles.infoGroup}>
              <span style={styles.infoLabel}>Tanggal Masuk</span>
              <span style={styles.infoValue}>{formatDate(item.tanggal_masuk)}</span>
            </div>

            <div style={styles.infoGroup}>
              <span style={styles.infoLabel}>Harga Perolehan</span>
              <span style={styles.infoValue}>{formatRupiah(item.harga_perolehan)}</span>
            </div>

            <div style={styles.infoGroup}>
              <span style={styles.infoLabel}>Penanggung Jawab (PIC)</span>
              <span style={styles.infoValue}>{item.pemilik?.nama || '-'} ({item.pemilik?.departemen || 'Umum'})</span>
            </div>

            <div style={styles.infoGroup}>
              <span style={styles.infoLabel}>Peminjam Saat Ini</span>
              <span style={styles.infoValue}>
                {item.peminjam ? `${item.peminjam.nama} (${item.peminjam.departemen || 'Staf'})` : 'Tidak sedang dipinjam'}
              </span>
            </div>
          </div>

          <div style={styles.descBox}>
            <h4 style={styles.descTitle}>Deskripsi Barang</h4>
            <p style={styles.descText}>{item.deskripsi || 'Tidak ada deskripsi.'}</p>
          </div>

          <div style={styles.descBox}>
            <h4 style={styles.descTitle}>Catatan Tambahan</h4>
            <p style={styles.descText}>{item.catatan || 'Tidak ada catatan.'}</p>
          </div>
        </div>

        {/* Panel Kanan (Foto + Tombol Aksi) */}
        <div style={styles.sideCard}>
          {/* Foto Barang */}
          <div style={styles.fotoContainer}>
            {item.foto_barang ? (
              <img src={item.foto_barang} alt={item.nama_barang} style={styles.image} />
            ) : (
              <div style={styles.noFoto}>
                <span style={{ fontSize: '48px' }}>📷</span>
                <span style={{ marginTop: '8px', fontSize: '13px' }}>Tidak Ada Foto</span>
              </div>
            )}
          </div>

          {/* Tombol Aksi berdasarkan Peran dan Status */}
          <div style={styles.actionsPanel}>
            <h4 style={styles.sideTitle}>Tindakan Aset</h4>

            {/* Edit (Admin/Staff, barang Aktif/Rusak/Perbaikan, tapi tidak jika Dihapus) */}
            {hasRole('admin', 'staff') && item.status_aset !== 'Dihapus' && (
              <button
                onClick={() => navigate(`/inventaris/edit/${item.id}`)}
                style={styles.actionBtnEdit}
              >
                ✏️ Edit Data Barang
              </button>
            )}

            {/* Pinjam (Semua Role, barang Aktif) */}
            {isAktif && (
              <button
                onClick={() => navigate('/peminjaman', { state: { barangId: item.id, namaBarang: item.nama_barang } })}
                style={styles.actionBtnBorrow}
              >
                📝 Ajukan Peminjaman
              </button>
            )}

            {/* Ajukan Maintenance (Semua Role, kondisi Aktif / Rusak) */}
            {(isAktif || isRusak) && item.status_aset !== 'Dihapus' && (
              <button
                onClick={() => navigate('/maintenance', { state: { barangId: item.id, namaBarang: item.nama_barang } })}
                style={styles.actionBtnMaint}
              >
                🔧 Ajukan Maintenance
              </button>
            )}

            {/* Ajukan Penghapusan (Admin, barang Aktif) */}
            {hasRole('admin') && isAktif && (
              <button
                onClick={() => navigate('/penghapusan', { state: { barangId: item.id, namaBarang: item.nama_barang } })}
                style={styles.actionBtnDelete}
              >
                🗑️ Ajukan Penghapusan Aset
              </button>
            )}

            {/* Soft Delete Langsung (Hanya Admin) */}
            {hasRole('admin') && item.status_aset !== 'Dihapus' && (
              <button
                onClick={handleDelete}
                style={styles.softDeleteBtn}
              >
                ⚠️ Hapus Barang (Soft Delete)
              </button>
            )}

            {item.status_aset === 'Dihapus' && (
              <p style={styles.deletedText}>Barang ini sudah berstatus dihapus.</p>
            )}
          </div>
        </div>

      </div>

      {/* Riwayat Aktivitas Log */}
      <div style={styles.logCard}>
        <h3 style={styles.logTitle}>📜 Riwayat Aktivitas Barang ({history.length} Log Terbaru)</h3>
        <div style={styles.logList}>
          {history.length > 0 ? (
            history.map((log) => (
              <div key={log.id} style={styles.logItem}>
                <div style={styles.logMeta}>
                  <span style={styles.logTime}>{formatDateTime(log.timestamp)}</span>
                  <span style={styles.logUser}>Oleh: <strong>{log.user?.nama || 'Sistem'}</strong></span>
                </div>
                <div style={styles.logDesc}>
                  <span>{log.deskripsi_perubahan}</span>
                  <span style={styles.instanceBadge}>{log.instance_id || 'local-dev'}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '16px 0' }}>
              Belum ada riwayat perubahan/aktivitas untuk barang ini.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '12px',
  },
  backLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#2b6cb0',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#ebf8ff',
    },
  },
  refreshBadge: {
    fontSize: '12px',
    color: '#718096',
    backgroundColor: '#edf2f7',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr',
    gap: '24px',
    alignItems: 'start',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '16px',
  },
  kodeLabel: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#2b6cb0',
    backgroundColor: '#ebf8ff',
    padding: '3px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1a365d',
    margin: '8px 0 0 0',
  },
  badgeRow: {
    display: 'flex',
    gap: '8px',
  },
  badge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  deleteErrorBox: {
    backgroundColor: '#fff5f5',
    border: '1px solid #fed7d7',
    color: '#c53030',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: '500',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px 24px',
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  infoGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderBottom: '1px solid #f7fafc',
    paddingBottom: '8px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#718096',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: '15px',
    color: '#2d3748',
    fontWeight: '500',
  },
  descBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #edf2f7',
  },
  descTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: '6px',
    textTransform: 'uppercase',
  },
  descText: {
    fontSize: '14px',
    color: '#2d3748',
    lineHeight: '1.5',
    whiteSpace: 'pre-line',
  },
  sideCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fotoContainer: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px',
    height: '240px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: '6px',
  },
  noFoto: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#a0aec0',
  },
  actionsPanel: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  sideTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1a365d',
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '6px',
    marginBottom: '4px',
    textTransform: 'uppercase',
  },
  actionBtnEdit: {
    padding: '10px',
    backgroundColor: '#3182ce',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': { backgroundColor: '#2b6cb0' },
  },
  actionBtnBorrow: {
    padding: '10px',
    backgroundColor: '#dd6b20',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': { backgroundColor: '#c05621' },
  },
  actionBtnMaint: {
    padding: '10px',
    backgroundColor: '#319795',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': { backgroundColor: '#2c7a7b' },
  },
  actionBtnDelete: {
    padding: '10px',
    backgroundColor: '#e53e3e',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': { backgroundColor: '#c53030' },
  },
  softDeleteBtn: {
    padding: '10px',
    backgroundColor: '#ffffff',
    color: '#e53e3e',
    border: '1px solid #e53e3e',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '10px',
    '&:hover': {
      backgroundColor: '#fff5f5',
    },
  },
  deletedText: {
    fontSize: '13px',
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '10px',
  },
  logCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  logTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: '16px',
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '350px',
    overflowY: 'auto',
  },
  logItem: {
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '10px',
  },
  logMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#a0aec0',
    marginBottom: '4px',
  },
  logTime: {
    fontStyle: 'italic',
  },
  logUser: {
    color: '#4a5568',
  },
  logDesc: {
    fontSize: '13px',
    color: '#2d3748',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instanceBadge: {
    fontSize: '10px',
    color: '#718096',
    backgroundColor: '#edf2f7',
    borderRadius: '10px',
    padding: '2px 8px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
  },
  spinner: {
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #1a365d',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    padding: '30px',
    backgroundColor: '#fff5f5',
    border: '1px solid #fed7d7',
    borderRadius: '8px',
    textAlign: 'center',
  },
  backBtn: {
    padding: '8px 16px',
    backgroundColor: '#1a365d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default InventarisDetailPage;
