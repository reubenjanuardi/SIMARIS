import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DashboardPage = () => {
  const { instanceId } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [alertsData, setAlertsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Panggil parallel API calls
      const [resSummary, resLogs, resAlerts] = await Promise.all([
        dashboardAPI.summary(),
        dashboardAPI.recentActivity(),
        dashboardAPI.alerts(),
      ]);

      if (resSummary.success) setSummary(resSummary.data.summary);
      if (resLogs.success) setRecentLogs(resLogs.data);
      if (resAlerts.success) setAlertsData(resAlerts.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard. Silakan periksa koneksi backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format currency ke Rupiah
  const formatRupiah = (val) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Format tanggal ke lokal
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

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '15px', color: '#4a5568' }}>Memuat data dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '40px' }}>⚠️</span>
        <h2 style={{ color: '#e53e3e', margin: '15px 0 10px 0' }}>Terjadi Kesalahan</h2>
        <p style={{ color: '#4a5568', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchData} style={styles.retryBtn}>Coba Lagi</button>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header Halaman */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard Ringkasan</h1>
          <p style={styles.pageSubtitle}>Pantau status aset, peminjaman, dan riwayat aktivitas terbaru.</p>
        </div>
        <div style={styles.refreshBadge}>
          <span style={styles.pulseDot}></span>
          <span>Last Request served by: <strong>{instanceId}</strong></span>
        </div>
      </div>

      {/* Row Stats Card */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statsCard, borderLeft: '5px solid #2b6cb0' }}>
          <div style={styles.statsCardInfo}>
            <span style={styles.statsLabel}>Total Aset</span>
            <span style={styles.statsValue}>{summary?.total_aset || 0}</span>
          </div>
          <span style={styles.statsIcon}>📦</span>
        </div>

        <div style={{ ...styles.statsCard, borderLeft: '5px solid #319795' }}>
          <div style={styles.statsCardInfo}>
            <span style={styles.statsLabel}>Total Nilai Aset</span>
            <span style={{ ...styles.statsValue, fontSize: '20px' }}>{formatRupiah(summary?.total_nilai_aset)}</span>
          </div>
          <span style={styles.statsIcon}>💰</span>
        </div>

        <div style={{ ...styles.statsCard, borderLeft: '5px solid #dd6b20' }}>
          <div style={styles.statsCardInfo}>
            <span style={styles.statsLabel}>Peminjaman Aktif</span>
            <span style={styles.statsValue}>{summary?.peminjaman_aktif || 0}</span>
          </div>
          <span style={styles.statsIcon}>📝</span>
        </div>

        <div style={{ ...styles.statsCard, borderLeft: '5px solid #e53e3e' }}>
          <div style={styles.statsCardInfo}>
            <span style={styles.statsLabel}>Maintenance Berjalan</span>
            <span style={styles.statsValue}>{summary?.maintenance_berjalan || 0}</span>
          </div>
          <span style={styles.statsIcon}>🔧</span>
        </div>
      </div>

      {/* Grid Utama (Split Kolom) */}
      <div style={styles.mainGrid}>
        
        {/* Kolom Kiri: Breakdown Kondisi & Kategori */}
        <div style={styles.leftCol}>
          
          {/* Card Breakdown Kondisi */}
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>Breakdown Kondisi Barang</h3>
            <div style={styles.breakdownGrid}>
              <div style={styles.breakdownItem}>
                <span style={{ ...styles.dot, backgroundColor: '#48bb78' }} />
                <span style={styles.breakdownLabel}>Baik</span>
                <span style={styles.breakdownValue}>{summary?.breakdown_kondisi?.Baik || 0}</span>
              </div>
              <div style={styles.breakdownItem}>
                <span style={{ ...styles.dot, backgroundColor: '#e53e3e' }} />
                <span style={styles.breakdownLabel}>Rusak</span>
                <span style={styles.breakdownValue}>{summary?.breakdown_kondisi?.Rusak || 0}</span>
              </div>
              <div style={styles.breakdownItem}>
                <span style={{ ...styles.dot, backgroundColor: '#ecc94b' }} />
                <span style={styles.breakdownLabel}>Perbaikan</span>
                <span style={styles.breakdownValue}>{summary?.breakdown_kondisi?.Perbaikan || 0}</span>
              </div>
              <div style={styles.breakdownItem}>
                <span style={{ ...styles.dot, backgroundColor: '#a0aec0' }} />
                <span style={styles.breakdownLabel}>Hilang</span>
                <span style={styles.breakdownValue}>{summary?.breakdown_kondisi?.Hilang || 0}</span>
              </div>
            </div>
          </div>

          {/* Card Breakdown Kategori */}
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>Breakdown Per Kategori</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Nama Kategori</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Jumlah Item</th>
                  </tr>
                </thead>
                <tbody>
                  {summary?.breakdown_kategori && Object.keys(summary.breakdown_kategori).length > 0 ? (
                    Object.entries(summary.breakdown_kategori).map(([kategori, jumlah]) => (
                      <tr key={kategori} style={styles.tr}>
                        <td style={styles.td}>{kategori}</td>
                        <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold' }}>{jumlah}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" style={{ ...styles.td, textAlign: 'center', color: '#a0aec0' }}>
                        Tidak ada data kategori
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Alerts & Recent Activity */}
        <div style={styles.rightCol}>
          
          {/* Kotak Alert Barang Butuh Perhatian */}
          {alertsData && alertsData.total_alerts > 0 && (
            <div style={styles.alertCard}>
              <h3 style={styles.alertTitle}>🚨 Perhatian Dibutuhkan ({alertsData.total_alerts})</h3>
              <div style={styles.alertList}>
                {alertsData.alerts.kondisi_kritis.map(item => (
                  <div key={`kritis-${item.id}`} style={styles.alertItemRed}>
                    <strong>{item.kode_inventaris}</strong> - {item.nama_barang} ({item.kondisi})
                    <div style={styles.alertSub}>{item.pesan_alert} • Lokasi: {item.lokasi}</div>
                  </div>
                ))}

                {alertsData.alerts.garansi_hampir_habis.map(item => (
                  <div key={`garansi-${item.id}`} style={styles.alertItemYellow}>
                    <strong>{item.kode_inventaris}</strong> - {item.nama_barang}
                    <div style={styles.alertSub}>
                      {item.pesan_alert} (Garansi: {item.masa_garansi})
                    </div>
                  </div>
                ))}

                {alertsData.alerts.maintenance_macet.map(item => (
                  <div key={`maint-${item.id}`} style={styles.alertItemYellow}>
                    <strong>{item.barang?.kode_inventaris}</strong> - {item.barang?.nama_barang}
                    <div style={styles.alertSub}>
                      {item.pesan_alert} • Teknisi ID: {item.teknisi_id || 'Belum Ditunjuk'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card Recent Activity */}
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>Aktivitas Terbaru (10 Log Terakhir)</h3>
            <div style={styles.activityList}>
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <div key={log.id} style={styles.activityItem}>
                    <div style={styles.activityMeta}>
                      <span style={styles.activityTime}>{formatDateTime(log.timestamp)}</span>
                      <span style={styles.activityUser}>{log.user?.nama || 'System'}</span>
                    </div>
                    <div style={styles.activityDesc}>
                      {log.deskripsi_perubahan}
                      <span style={{
                        ...styles.instanceBadge,
                        backgroundColor: log.instance_id === 'instance-2' ? '#2c5282' : '#2b6cb0',
                      }}>
                        {log.instance_id || 'local'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px 0' }}>
                  Tidak ada log aktivitas terbaru
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '16px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a365d',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#718096',
    margin: '4px 0 0 0',
  },
  refreshBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ebf8ff',
    border: '1px solid #bee3f8',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '12px',
    color: '#2b6cb0',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#3182ce',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #e2e8f0',
  },
  statsCardInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  statsLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statsValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2d3748',
  },
  statsIcon: {
    fontSize: '32px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '24px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: '16px',
    borderBottom: '1px solid #f7fafc',
    paddingBottom: '8px',
  },
  breakdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  breakdownItem: {
    backgroundColor: '#f7fafc',
    border: '1px solid #edf2f7',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  breakdownLabel: {
    fontSize: '14px',
    color: '#4a5568',
    flex: 1,
  },
  breakdownValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2d3748',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    borderBottom: '2px solid #edf2f7',
  },
  th: {
    textAlign: 'left',
    padding: '10px 8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#718096',
  },
  tr: {
    borderBottom: '1px solid #edf2f7',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '12px 8px',
    fontSize: '14px',
    color: '#2d3748',
  },
  alertCard: {
    backgroundColor: '#fffaf0',
    border: '1px solid #feebc8',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  alertTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#dd6b20',
    marginBottom: '14px',
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  alertItemRed: {
    backgroundColor: '#fff5f5',
    borderLeft: '4px solid #e53e3e',
    borderRadius: '4px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#c53030',
  },
  alertItemYellow: {
    backgroundColor: '#fffaf0',
    borderLeft: '4px solid #dd6b20',
    borderRadius: '4px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#c05621',
  },
  alertSub: {
    fontSize: '11px',
    color: '#718096',
    marginTop: '4px',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  activityItem: {
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '10px',
  },
  activityMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#a0aec0',
    marginBottom: '4px',
  },
  activityTime: {
    fontStyle: 'italic',
  },
  activityUser: {
    fontWeight: '600',
    color: '#4a5568',
  },
  activityDesc: {
    fontSize: '13px',
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  instanceBadge: {
    fontSize: '10px',
    color: '#ffffff',
    borderRadius: '12px',
    padding: '2px 8px',
    fontWeight: '500',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  spinner: {
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #1a365d',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  retryBtn: {
    padding: '8px 20px',
    backgroundColor: '#1a365d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#2b6cb0',
    },
  },
};

export default DashboardPage;
