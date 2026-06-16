import React from 'react';

/**
 * FilterBar Component
 * Komponen penyaring data dengan input pencarian, dropdown select, dan date pickers.
 * 
 * Props:
 * - filters: Array of filter definitions. Contoh:
 *   [
 *     { key: 'search', label: 'Cari...', type: 'text' },
 *     { key: 'kategori_id', label: 'Pilih Kategori', type: 'select', options: [{ value: '1', label: 'Elektronik' }] }
 *     { key: 'tanggal_mulai', label: 'Mulai', type: 'date' }
 *   ]
 * - values: Object berisi state nilai filter saat ini, e.g. { search: '', kategori_id: '' }
 * - onChange: function(key, value) terpanggil saat nilai filter berubah
 * - onReset: function() (opsional) untuk mereset seluruh filter
 */
const FilterBar = ({ filters = [], values = {}, onChange, onReset }) => {
  const handleChange = (key, value) => {
    if (onChange) {
      onChange(key, value);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.filterGrid}>
        {filters.map((filter) => {
          const currentValue = values[filter.key] ?? '';

          return (
            <div key={filter.key} style={styles.filterItem}>
              {filter.label && <label style={styles.label}>{filter.label}</label>}
              
              {filter.type === 'text' && (
                <input
                  type="text"
                  placeholder={filter.placeholder || `Masukkan ${filter.label}...`}
                  value={currentValue}
                  onChange={(e) => handleChange(filter.key, e.target.value)}
                  style={styles.input}
                />
              )}

              {filter.type === 'select' && (
                <select
                  value={currentValue}
                  onChange={(e) => handleChange(filter.key, e.target.value)}
                  style={styles.select}
                >
                  <option value="">{filter.placeholder || `Semua ${filter.label}`}</option>
                  {(filter.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {filter.type === 'date' && (
                <input
                  type="date"
                  value={currentValue}
                  onChange={(e) => handleChange(filter.key, e.target.value)}
                  style={styles.input}
                />
              )}
            </div>
          );
        })}

        {onReset && (
          <div style={styles.resetBtnContainer}>
            <button type="button" onClick={onReset} style={styles.resetBtn}>
              🔄 Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '16px',
    marginBottom: '20px',
  },
  filterGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: '16px',
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: '1 1 200px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#4a5568',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.2s',
    ':focus': {
      borderColor: '#2b6cb0',
    },
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  resetBtnContainer: {
    display: 'flex',
  },
  resetBtn: {
    padding: '10px 18px',
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    ':hover': {
      backgroundColor: '#cbd5e1',
    },
  },
};

export default FilterBar;
