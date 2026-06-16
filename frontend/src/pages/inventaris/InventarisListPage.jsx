import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventarisAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const InventarisListPage = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  // State Data & Pagination
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // State Filters
  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedKondisi, setSelectedKondisi] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Loader & Error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Kategori saat mount
  useEffect(() => {
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
    fetchCategories();
  }, []);

  // Fetch Inventaris saat page atau filter berubah
  const fetchInventaris = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit,
        search: search.trim() || undefined,
        kategori_id: selectedKategori || undefined,
        kondisi: selectedKondisi || undefined,
        status_aset: selectedStatus || undefined,
      };

      const res = await inventarisAPI.list(params);
      if (res.success) {
        setItems(res.data.items);
        setTotalItems(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching inventaris:', err);
      setError('Gagal memuat daftar inventaris. Harap periksa koneksi server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset ke halaman 1 saat filter berubah
    setCurrentPage(1);
  }, [search, selectedKategori, selectedKondisi, selectedStatus]);

  useEffect(() => {
    fetchInventaris();
  }, [currentPage, selectedKategori, selectedKondisi, selectedStatus]);

  // Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventaris();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedKategori('');
    setSelectedKondisi('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  // Render Badge Kondisi
  const renderKondisiBadge = (kondisi) => {
    let bg = '#e2e8f0';
    let text = '#4a5568';
    
    switch (kondisi) {
      case 'Baik':
        bg = '#c6f6d5';
        text = '#22543d';
        break;
      case 'Rusak':
        bg = '#fed7d7';
        text = '#742a2a';
        break;
      case 'Perbaikan':
        bg = '#feebc8';
        text = '#7b341e';
        break;
      case 'Hilang':
        bg = '#e2e8f0';
        text = '#4a5568';
        break;
    }

    return (
      <span style={{ ...styles.badge, backgroundColor: bg, color: text }}>
        {kondisi}
      </span>
    );
  };

  // Render Badge Status Aset
  const renderStatusBadge = (status) => {
    let bg = '#e2e8f0';
    let text = '#4a5568';

    switch (status) {
      case 'Aktif':
        bg = '#ebf8ff';
        text = '#2b6cb0';
        break;
      case 'Dipinjam':
        bg = '#fffaf0';
        text = '#dd6b20';
        break;
      case 'Dalam Perbaikan':
        bg = '#feebc8';
        text = '#9c4221';
        break;
      case 'Dihapus':
        bg = '#edf2f7';
        text = '#718096';
        break;
    }

    return (
      <span style={{ ...styles.badge, backgroundColor: bg, color: text }}>
        {status}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header Panel */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Daftar Inventaris</h1>
          <p style={styles.subtitle}>Total Aset Tercatat: {totalItems} item</p>
        </div>
        {hasRole('admin', 'staff') && (
          <button
            onClick={() => navigate('/inventaris/tambah')}
            style={styles.addBtn}
          >
            ➕ Tambah Barang
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div style={styles.filterCard}>
        <form onSubmit={handleSearchSubmit} style={styles.filterForm}>
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Cari nama, kode, lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.inputSearch}
            />
            <button type="submit" style={styles.searchBtn}>Cari</button>
          </div>
          
          <div style={styles.filtersGroup}>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              style={styles.select}
            >
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
              ))}
            </select>

            <select
              value={selectedKondisi}
              onChange={(e) => setSelectedKondisi(e.target.value)}
              style={styles.select}
            >
              <option value="">Semua Kondisi</option>
              <option value="Baik">Baik</option>
              <option value="Rusak">Rusak</option>
              <option value="Perbaikan">Perbaikan</option>
              <option value="Hilang">Hilang</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={styles.select}
            >
              <option value="">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Dipinjam">Dipinjam</option>
              <option value="Dalam Perbaikan">Dalam Perbaikan</option>
              <option value="Dihapus">Dihapus</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              style={styles.resetBtn}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Konten Utama (Tabel / Loader / Error) */}
      {isLoading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: '12px', color: '#718096' }}>Memuat daftar barang...</p>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <p style={{ color: '#e53e3e', fontWeight: '500' }}>{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div style={styles.emptyContainer}>
          <p style={{ color: '#718096', fontSize: '15px' }}>Tidak ada aset inventaris yang cocok dengan filter pencarian.</p>
        </div>
      ) : (
        <>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>Kode</th>
                  <th style={styles.th}>Nama Barang</th>
                  <th style={styles.th}>Kategori</th>
                  <th style={styles.th}>Kondisi</th>
                  <th style={styles.th}>Lokasi</th>
                  <th style={styles.th}>Status Aset</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: '600', color: '#1a365d' }}>{item.kode_inventaris}</td>
                    <td style={{ ...styles.td, fontWeight: '500' }}>{item.nama_barang}</td>
                    <td style={styles.td}>{item.kategori?.nama_kategori || 'N/A'}</td>
                    <td style={styles.td}>{renderKondisiBadge(item.kondisi)}</td>
                    <td style={styles.td}>{item.lokasi}</td>
                    <td style={styles.td}>{renderStatusBadge(item.status_aset)}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        onClick={() => navigate(`/inventaris/${item.id}`)}
                        style={styles.detailBtn}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  ...styles.pageBtn,
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Sebelumnya
              </button>
              
              <div style={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={{
                      ...styles.numBtn,
                      backgroundColor: currentPage === p ? '#1a365d' : '#f7fafc',
                      color: currentPage === p ? '#ffffff' : '#2d3748',
                      border: currentPage === p ? '1px solid #1a365d' : '1px solid #cbd5e1',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.pageBtn,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Berikutnya
              </button>
            </div>
          )}
        </>
      )}
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
    '&:hover': {
      backgroundColor: '#2b6cb0',
    },
  },
  filterCard: {
    backgroundColor: '#f7fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '16px',
  },
  filterForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  searchBox: {
    display: 'flex',
    gap: '10px',
  },
  inputSearch: {
    flex: 1,
    padding: '10px 16px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  searchBtn: {
    padding: '10px 24px',
    backgroundColor: '#2b6cb0',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  filtersGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '13px',
    minWidth: '150px',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  resetBtn: {
    padding: '8px 16px',
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  tableWrapper: {
    overflowX: 'auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    borderBottom: '2px solid #edf2f7',
    backgroundColor: '#f8fafc',
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#4a5568',
  },
  tr: {
    borderBottom: '1px solid #edf2f7',
    '&:hover': {
      backgroundColor: '#f8fafc',
    },
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#2d3748',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  detailBtn: {
    padding: '6px 14px',
    backgroundColor: '#ebf8ff',
    color: '#2b6cb0',
    border: '1px solid #bee3f8',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#2b6cb0',
      color: '#ffffff',
    },
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
    padding: '10px 0',
  },
  pageBtn: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#4a5568',
  },
  pageNumbers: {
    display: 'flex',
    gap: '6px',
  },
  numBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
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
    padding: '20px',
    backgroundColor: '#fff5f5',
    border: '1px solid #fed7d7',
    borderRadius: '8px',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
  },
};

export default InventarisListPage;
