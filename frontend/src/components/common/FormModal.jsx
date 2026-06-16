import React from 'react';

/**
 * FormModal Component
 * Modal wrapper untuk menampung form input dengan header, judul, dan tombol close.
 * 
 * Props:
 * - isOpen: boolean
 * - title: string (Judul modal)
 * - onClose: function() (Dipanggil saat klik tombol close/batal)
 * - children: ReactNode (Isi form/konten)
 * - maxWidth: string (opsional, default '500px')
 */
const FormModal = ({ isOpen, title, onClose, children, maxWidth = '500px' }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth }}>
        {/* Header Modal */}
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Tutup modal">
            ✕
          </button>
        </div>
        
        {/* Content Body Modal */}
        <div style={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 32, 44, 0.4)', // semi-transparan gelap
    backdropFilter: 'blur(4px)', // efek blur modern
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh', // batasi tinggi maksimum modal
    border: '1px solid #e2e8f0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #edf2f7',
    padding: '16px 20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a365d',
    margin: 0,
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '18px',
    color: '#a0aec0',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
    transition: 'color 0.2s',
    ':hover': {
      color: '#4a5568',
    },
  },
  body: {
    padding: '20px',
    overflowY: 'auto', // aktifkan scroll jika konten form panjang
    flex: 1,
  },
};

export default FormModal;
