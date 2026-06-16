import React, { useState, useEffect } from 'react';
import { inventarisAPI } from '../../services/api';

/**
 * Komponen ImageUpload
 * 
 * Props:
 * - currentImageUrl: URL foto yang saat ini tersimpan di database
 * - onUploadSuccess: Callback saat upload berhasil, mengirimkan URL foto S3 baru
 * - inventarisId: ID dari barang inventaris (diperlukan untuk endpoint)
 * - disabled: Status jika form secara keseluruhan sedang disubmit
 */
const ImageUpload = ({ currentImageUrl, onUploadSuccess, inventarisId, disabled }) => {
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sinkronisasi previewUrl ketika currentImageUrl dari database berubah (misal setelah refresh/edit)
  useEffect(() => {
    setPreviewUrl(currentImageUrl || '');
  }, [currentImageUrl]);

  const handleFileChange = async (e) => {
    setError('');
    setSuccess('');
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validasi Mimetype (Frontend)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format file tidak didukung. Hanya menerima JPG, PNG, atau WEBP.');
      return;
    }

    // 2. Validasi Ukuran File (Frontend - maks 5MB)
    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setError('Ukuran file terlalu besar. Maksimal ukuran file adalah 5MB.');
      return;
    }

    // Buat URL preview lokal sementara untuk feedback visual instan
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // Jalankan pengunggahan file ke S3
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    if (!inventarisId) {
      setError('ID Inventaris tidak ditemukan. Simpan data barang terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('foto', file);

    // Jalankan interval progress tiruan (smooth indicator)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const res = await inventarisAPI.uploadFoto(inventarisId, formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.success) {
        setSuccess('Foto barang berhasil diunggah ke S3!');
        setPreviewUrl(res.data.foto_barang);
        if (onUploadSuccess) {
          onUploadSuccess(res.data.foto_barang);
        }
      } else {
        setError(res.message || 'Gagal mengunggah foto.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errMsg = err.response?.data?.message || 'Gagal mengunggah foto. Periksa koneksi internet atau credentials AWS Anda.';
      setError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Box Preview */}
      <div style={styles.previewBox}>
        {previewUrl ? (
          <img src={previewUrl} alt="Preview Foto Barang" style={styles.image} />
        ) : (
          <div style={styles.placeholder}>
            <span style={{ fontSize: '40px' }}>📦</span>
            <span style={{ marginTop: '8px', fontSize: '12px', color: '#a0aec0' }}>Belum ada foto barang</span>
          </div>
        )}
      </div>

      {/* Kontrol Input File */}
      <div style={styles.uploadControls}>
        <div style={styles.fileInputWrapper}>
          <input
            type="file"
            id={`file-upload-${inventarisId}`}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={styles.hiddenFileInput}
            disabled={disabled || isUploading}
          />
          <label
            htmlFor={`file-upload-${inventarisId}`}
            style={{
              ...styles.uploadLabel,
              backgroundColor: disabled || isUploading ? '#cbd5e1' : '#1a365d',
              cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
            }}
          >
            {isUploading ? '⏳ Mengunggah...' : '📷 Pilih & Upload Foto'}
          </label>
          <span style={styles.infoText}>Maksimal 5MB (JPG, PNG, WEBP)</span>
        </div>

        {/* State Loading / Progress Bar */}
        {isUploading && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBarWrapper}>
              <div style={{ ...styles.progressBar, width: `${uploadProgress}%` }} />
            </div>
            <span style={styles.progressText}>{uploadProgress}% Mengunggah ke S3...</span>
          </div>
        )}

        {/* Feedback Pesan Sukses */}
        {success && <div style={styles.successMessage}>✅ {success}</div>}

        {/* Feedback Pesan Error */}
        {error && <div style={styles.errorMessage}>⚠️ {error}</div>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    width: '100%',
    boxSizing: 'border-box',
  },
  previewBox: {
    width: '120px',
    height: '120px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  uploadControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: '1',
    minWidth: '200px',
  },
  fileInputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  hiddenFileInput: {
    display: 'none',
  },
  uploadLabel: {
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center',
    transition: 'background-color 0.2s',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  infoText: {
    fontSize: '11px',
    color: '#718096',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '4px',
  },
  progressBarWrapper: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3182ce',
    transition: 'width 0.2s ease',
  },
  progressText: {
    fontSize: '11px',
    color: '#4a5568',
    fontWeight: '500',
  },
  successMessage: {
    fontSize: '12px',
    color: '#22543d',
    backgroundColor: '#c6f6d5',
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #c6f6d5',
    fontWeight: '500',
  },
  errorMessage: {
    fontSize: '12px',
    color: '#742a2a',
    backgroundColor: '#fed7d7',
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #fed7d7',
    fontWeight: '500',
  },
};

export default ImageUpload;
