import React from 'react';

/**
 * DataTable Component
 * Tabel reusable dengan support loader dan pagination.
 * 
 * Props:
 * - columns: Array of objects. Contoh:
 *   [
 *     { header: 'Nama', key: 'nama', render: (val, row) => val },
 *     { header: 'Aksi', key: 'id', align: 'center', render: (id, row) => <button>...</button> }
 *   ]
 * - data: Array of objects (data records).
 * - loading: boolean
 * - pagination: { currentPage: number, totalPages: number, totalItems: number } (opsional)
 * - onPageChange: function(newPage) (opsional)
 */
const DataTable = ({ columns, data = [], loading = false, pagination, onPageChange }) => {
  const handlePageClick = (page) => {
    if (onPageChange && page >= 1 && page <= (pagination?.totalPages || 1)) {
      onPageChange(page);
    }
  };

  return (
    <div style={styles.container}>
      {/* Wrapper untuk responsive scroll */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              {columns.map((col, index) => (
                <th
                  key={index}
                  style={{
                    ...styles.th,
                    textAlign: col.align || 'left',
                    width: col.width || 'auto',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={styles.tdLoading}>
                  <div style={styles.loadingWrapper}>
                    <div style={styles.spinner}></div>
                    <span style={styles.loadingText}>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={styles.tdEmpty}>
                  Tidak ada data yang tersedia.
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} style={styles.tr}>
                  {columns.map((col, colIndex) => {
                    const value = col.key ? row[col.key] : undefined;
                    return (
                      <td
                        key={colIndex}
                        style={{
                          ...styles.td,
                          textAlign: col.align || 'left',
                        }}
                      >
                        {col.render ? col.render(value, row, rowIndex) : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => handlePageClick(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            style={{
              ...styles.pageBtn,
              opacity: pagination.currentPage === 1 ? 0.5 : 1,
              cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Sebelumnya
          </button>

          <div style={styles.pageNumbers}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                style={{
                  ...styles.numBtn,
                  backgroundColor: pagination.currentPage === page ? '#1a365d' : '#f7fafc',
                  color: pagination.currentPage === page ? '#ffffff' : '#2d3748',
                  border: pagination.currentPage === page ? '1px solid #1a365d' : '1px solid #cbd5e1',
                }}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageClick(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            style={{
              ...styles.pageBtn,
              opacity: pagination.currentPage === pagination.totalPages ? 0.5 : 1,
              cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
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
  headerRow: {
    borderBottom: '2px solid #edf2f7',
    backgroundColor: '#f8fafc',
  },
  th: {
    padding: '14px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#4a5568',
  },
  tr: {
    borderBottom: '1px solid #edf2f7',
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: '#f8fafc',
    },
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#2d3748',
  },
  tdLoading: {
    padding: '40px 0',
    textAlign: 'center',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  spinner: {
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #1a365d',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#718096',
  },
  tdEmpty: {
    padding: '40px 16px',
    textAlign: 'center',
    color: '#718096',
    fontSize: '14px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
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
    transition: 'background-color 0.2s',
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
    transition: 'all 0.2s',
  },
};

export default DataTable;
