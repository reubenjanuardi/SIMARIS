import React from 'react';

/**
 * ConfirmModal Component
 * Dialog konfirmasi standar (Ya / Batal) dengan visual backdrop blur.
 * 
 * Props:
 * - isOpen: boolean
 * - title: string (Judul dialog)
 * - message: string (Deskripsi/pesan konfirmasi)
 * - onConfirm: function() (Dipanggil saat klik konfirmasi/Setuju)
 * - onCancel: function() (Dipanggil saat klik batal)
 * - confirmText: string (opsional, default 'Ya, Lanjutkan')
 * - cancelText: string (opsional, default 'Batal')
 */
const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal'
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
        </div>
        <div style={styles.body}>
          <p style={styles.message}>{message}</p>
        </div>
        <div style={styles.footer}>
          <button onClick={onCancel} style={styles.cancelBtn}>
            {cancelText}
          </button>
          <button onClick={onConfirm} style={styles.confirmBtn}>
            {confirmText}
          </button>
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
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxWidth: '440px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    border: '1px solid #e2e8f0',
  },
  header: {
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '12px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a365d',
    margin: 0,
  },
  body: {
    padding: '4px 0',
  },
  message: {
    fontSize: '14px',
    color: '#4a5568',
    lineHeight: '1.5',
    margin: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
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
    transition: 'background-color 0.2s',
  },
  confirmBtn: {
    padding: '10px 18px',
    backgroundColor: '#1a365d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 4px rgba(26, 54, 93, 0.2)',
  },
};

export default ConfirmModal;
