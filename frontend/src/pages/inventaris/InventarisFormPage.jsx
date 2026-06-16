import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { inventarisAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ImageUpload from '../../components/common/ImageUpload';

const InventarisFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { instanceId } = useAuth();
  const isEditMode = !!id;

  const [successBanner, setSuccessBanner] = useState('');

  // State Form Fields
  const [formData, setFormData] = useState({
    kode_inventaris: '',
    nama_barang: '',
    kategori_id: '',
    deskripsi: '',
    kondisi: 'Baik',
    lokasi: '',
    pemilik_id: '',
    harga_perolehan: '',
    tanggal_masuk: '',
    no_seri: '',
    masa_garansi: '',
    catatan: '',
    foto_barang: '',
  });

  // State Dinamis Dropdown
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Deteksi redirect dari mode TAMBAH ke EDIT untuk upload foto
  useEffect(() => {
    if (location.state && location.state.showUploadMessage) {
      setSuccessBanner('🎉 Barang inventaris baru berhasil ditambahkan! Silakan lengkapi dengan mengunggah foto barang di kolom yang tersedia di bawah.');
      // Bersihkan state agar banner tidak muncul lagi saat di-reload
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch Dropdowns & Edit Data (jika mode edit)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Fetch kategori dan user secara paralel
        const [resCats, resUsers] = await Promise.all([
          inventarisAPI.categories(),
          authAPI.users(),
        ]);

        if (resCats.success) setCategories(resCats.data);
        if (resUsers.success) setUsers(resUsers.data);

        // Jika mode edit, ambil data barang saat ini
        if (isEditMode) {
          const resDetail = await inventarisAPI.get(id);
          if (resDetail.success) {
            const barang = resDetail.data.inventaris;
            
            // Format tanggal agar sesuai dengan input date HTML (YYYY-MM-DD)
            const formatDateForInput = (dateStr) => {
              if (!dateStr) return '';
              return dateStr.split('T')[0];
            };

            setFormData({
              kode_inventaris: barang.kode_inventaris || '',
              nama_barang: barang.nama_barang || '',
              kategori_id: barang.kategori_id || '',
              deskripsi: barang.deskripsi || '',
              kondisi: barang.kondisi || 'Baik',
              lokasi: barang.lokasi || '',
              pemilik_id: barang.pemilik_id || '',
              harga_perolehan: barang.harga_perolehan ? parseFloat(barang.harga_perolehan) : '',
              tanggal_masuk: formatDateForInput(barang.tanggal_masuk),
              no_seri: barang.no_seri || '',
              masa_garansi: formatDateForInput(barang.masa_garansi),
              catatan: barang.catatan || '',
              foto_barang: barang.foto_barang || '',
            });
          } else {
            setError('Gagal memuat data barang untuk diedit.');
          }
        } else {
          // Jika mode tambah, buat auto-suggest kode inventaris
          const generatedCode = generateAutoSuggestCode();
          setFormData(prev => ({
            ...prev,
            kode_inventaris: generatedCode,
            // Berikan default tanggal masuk hari ini
            tanggal_masuk: new Date().toISOString().split('T')[0],
          }));
        }
      } catch (err) {
        console.error('Error loading form dependencies:', err);
        setError('Gagal memuat data pendukung formulir dari server.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isEditMode]);

  // Generator Kode Auto-Suggest (Format: INV-YYYY-XXX)
  const generateAutoSuggestCode = () => {
    const year = new Date().getFullYear();
    // Cari angka random 3 digit untuk simulasi nomor urut
    const number = Math.floor(100 + Math.random() * 900);
    return `INV-${year}-${number}`;
  };

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Hapus error validasi khusus untuk input yang diubah
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // File upload ditangani langsung oleh komponen ImageUpload ketika dalam mode Edit.
  // Input file disembunyikan saat dalam mode Tambah.

  // Validasi Input Sisi Client
  const validateForm = () => {
    const errors = {};
    if (!formData.kode_inventaris.trim()) {
      errors.kode_inventaris = 'Kode inventaris wajib diisi';
    } else if (!/^INV-\d{4}-\d{3,4}$/.test(formData.kode_inventaris.trim())) {
      errors.kode_inventaris = 'Format kode tidak valid. Contoh: INV-2026-001';
    }

    if (!formData.nama_barang.trim()) {
      errors.nama_barang = 'Nama barang wajib diisi';
    }

    if (!formData.kategori_id) {
      errors.kategori_id = 'Pilih kategori barang';
    }

    if (!formData.lokasi.trim()) {
      errors.lokasi = 'Lokasi barang wajib diisi';
    }

    if (!formData.harga_perolehan) {
      errors.harga_perolehan = 'Harga perolehan wajib diisi';
    } else if (isNaN(formData.harga_perolehan) || parseFloat(formData.harga_perolehan) < 0) {
      errors.harga_perolehan = 'Harga perolehan harus bernilai positif';
    }

    if (!formData.tanggal_masuk) {
      errors.tanggal_masuk = 'Tanggal masuk wajib diisi';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Siapkan payload dengan format tipe data yang sesuai
    const payload = {
      ...formData,
      kategori_id: parseInt(formData.kategori_id, 10),
      pemilik_id: formData.pemilik_id ? parseInt(formData.pemilik_id, 10) : null,
      harga_perolehan: parseFloat(formData.harga_perolehan),
      // Set null jika string kosong pada kolom tanggal/nullable
      masa_garansi: formData.masa_garansi || null,
      no_seri: formData.no_seri.trim() || null,
      deskripsi: formData.deskripsi.trim() || null,
      catatan: formData.catatan.trim() || null,
      foto_barang: formData.foto_barang || null,
    };

    try {
      let res;
      if (isEditMode) {
        res = await inventarisAPI.update(id, payload);
      } else {
        res = await inventarisAPI.create(payload);
      }

      if (res.success) {
        if (isEditMode) {
          alert('Barang inventaris berhasil diperbarui!');
          navigate('/inventaris');
        } else {
          // Redirect ke mode EDIT agar user bisa upload foto dengan ID yang didapat dari response
          navigate(`/inventaris/edit/${res.data.id}`, { state: { showUploadMessage: true } });
        }
      } else {
        setError(res.message || 'Terjadi kesalahan saat menyimpan data.');
      }
    } catch (err) {
      console.error('Error saving inventaris:', err);
      const errorMsg = err.response?.data?.message || 'Gagal menyimpan data ke server. Periksa kembali inputan Anda.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '12px', color: '#718096' }}>Memuat data form...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Halaman */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{isEditMode ? '✏️ Edit Barang Inventaris' : '📦 Tambah Inventaris Baru'}</h1>
          <p style={styles.subtitle}>
            {isEditMode ? `Memperbarui data aset ${formData.kode_inventaris}` : 'Daftarkan aset atau perlengkapan kantor baru ke database.'}
          </p>
        </div>
        <div style={styles.refreshBadge}>
          <span>Server Instance: <strong>{instanceId}</strong></span>
        </div>
      </div>

      {/* Tampilan Banner Sukses Redirect */}
      {successBanner && (
        <div style={styles.successBannerBox}>
          {successBanner}
        </div>
      )}

      {/* Tampilan Error Global */}
      {error && (
        <div style={styles.errorBox}>
          <strong>Gagal:</strong> {error}
        </div>
      )}

      {/* Formulir Utama */}
      <form onSubmit={handleSubmit} style={styles.formCard}>
        
        {/* Row 1: Kode & Nama */}
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Kode Inventaris <span style={styles.required}>*</span></label>
            <input
              type="text"
              name="kode_inventaris"
              value={formData.kode_inventaris}
              onChange={handleChange}
              placeholder="Format: INV-YYYY-XXX"
              style={{
                ...styles.input,
                borderColor: validationErrors.kode_inventaris ? '#e53e3e' : '#cbd5e1'
              }}
              required
            />
            {validationErrors.kode_inventaris && (
              <span style={styles.inputError}>{validationErrors.kode_inventaris}</span>
            )}
            <small style={styles.helpText}>Gunakan kode unik. Format wajib: INV-YYYY-XXX</small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Nama Barang <span style={styles.required}>*</span></label>
            <input
              type="text"
              name="nama_barang"
              value={formData.nama_barang}
              onChange={handleChange}
              placeholder="Contoh: Laptop ThinkPad L14"
              style={{
                ...styles.input,
                borderColor: validationErrors.nama_barang ? '#e53e3e' : '#cbd5e1'
              }}
              required
            />
            {validationErrors.nama_barang && (
              <span style={styles.inputError}>{validationErrors.nama_barang}</span>
            )}
          </div>
        </div>

        {/* Row 2: Kategori & Lokasi */}
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Kategori Barang <span style={styles.required}>*</span></label>
            <select
              name="kategori_id"
              value={formData.kategori_id}
              onChange={handleChange}
              style={{
                ...styles.select,
                borderColor: validationErrors.kategori_id ? '#e53e3e' : '#cbd5e1'
              }}
              required
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
              ))}
            </select>
            {validationErrors.kategori_id && (
              <span style={styles.inputError}>{validationErrors.kategori_id}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Lokasi Penyimpanan <span style={styles.required}>*</span></label>
            <input
              type="text"
              name="lokasi"
              value={formData.lokasi}
              onChange={handleChange}
              placeholder="Contoh: Ruang Meeting Lantai 3, Gudang IT"
              style={{
                ...styles.input,
                borderColor: validationErrors.lokasi ? '#e53e3e' : '#cbd5e1'
              }}
              required
            />
            {validationErrors.lokasi && (
              <span style={styles.inputError}>{validationErrors.lokasi}</span>
            )}
          </div>
        </div>

        {/* Row 3: Kondisi & Status Aset */}
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Kondisi Barang</label>
            <select
              name="kondisi"
              value={formData.kondisi}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="Baik">Baik</option>
              <option value="Rusak">Rusak</option>
              <option value="Perbaikan">Perbaikan</option>
              <option value="Hilang">Hilang</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Status Aset</label>
            <select
              name="status_aset"
              value={formData.status_aset}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="Aktif">Aktif</option>
              <option value="Dipinjam">Dipinjam</option>
              <option value="Dalam Perbaikan">Dalam Perbaikan</option>
              <option value="Dihapus">Dihapus</option>
            </select>
          </div>
        </div>

        {/* Row 4: Harga Perolehan & Tanggal Masuk */}
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Harga Perolehan (Rupiah) <span style={styles.required}>*</span></label>
            <input
              type="number"
              name="harga_perolehan"
              value={formData.harga_perolehan}
              onChange={handleChange}
              placeholder="Contoh: 12500000"
              style={{
                ...styles.input,
                borderColor: validationErrors.harga_perolehan ? '#e53e3e' : '#cbd5e1'
              }}
              required
            />
            {validationErrors.harga_perolehan && (
              <span style={styles.inputError}>{validationErrors.harga_perolehan}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tanggal Masuk <span style={styles.required}>*</span></label>
            <input
              type="date"
              name="tanggal_masuk"
              value={formData.tanggal_masuk}
              onChange={handleChange}
              style={{
                ...styles.input,
                borderColor: validationErrors.tanggal_masuk ? '#e53e3e' : '#cbd5e1'
              }}
              required
            />
            {validationErrors.tanggal_masuk && (
              <span style={styles.inputError}>{validationErrors.tanggal_masuk}</span>
            )}
          </div>
        </div>

        {/* Row 5: No Seri & Masa Garansi */}
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nomor Seri (Optional)</label>
            <input
              type="text"
              name="no_seri"
              value={formData.no_seri}
              onChange={handleChange}
              placeholder="Contoh: SN-IT-9018471"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Masa Garansi Habis (Optional)</label>
            <input
              type="date"
              name="masa_garansi"
              value={formData.masa_garansi}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        {/* Row 6: PIC Pemilik (Dropdown User) & File Foto */}
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Penanggung Jawab / PIC (Optional)</label>
            <select
              name="pemilik_id"
              value={formData.pemilik_id}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">-- Pilih User --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.nama} ({u.role})</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Foto Barang (Optional)</label>
            {isEditMode ? (
              <ImageUpload
                currentImageUrl={formData.foto_barang}
                onUploadSuccess={(newUrl) => {
                  setFormData(prev => ({ ...prev, foto_barang: newUrl }));
                }}
                inventarisId={id}
                disabled={isSubmitting}
              />
            ) : (
              <div style={styles.photoPlaceholderInfo}>
                <span style={{ fontSize: '18px', marginRight: '8px' }}>ℹ️</span>
                <span style={{ color: '#718096', fontSize: '13px' }}>
                  Foto barang dapat diunggah setelah barang disimpan ke database (dalam mode Edit).
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Row 7: Deskripsi */}
        <div style={styles.formGroupFull}>
          <label style={styles.label}>Deskripsi Detail Barang</label>
          <textarea
            name="deskripsi"
            value={formData.deskripsi}
            onChange={handleChange}
            placeholder="Tulis deskripsi spesifikasi barang, nomor model, dsb."
            rows="3"
            style={styles.textarea}
          />
        </div>

        {/* Row 8: Catatan */}
        <div style={styles.formGroupFull}>
          <label style={styles.label}>Catatan Inventaris</label>
          <textarea
            name="catatan"
            value={formData.catatan}
            onChange={handleChange}
            placeholder="Tulis catatan kondisi saat ini, kelengkapan, dll."
            rows="2"
            style={styles.textarea}
          />
        </div>

        {/* Tombol Aksi Form */}
        <div style={styles.actionButtons}>
          <button
            type="button"
            onClick={() => navigate('/inventaris')}
            style={styles.cancelBtn}
            disabled={isSubmitting}
          >
            Batal
          </button>
          
          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              backgroundColor: isSubmitting ? '#a0aec0' : '#1a365d',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Tambah Inventaris'}
          </button>
        </div>

      </form>
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
  refreshBadge: {
    fontSize: '12px',
    color: '#718096',
    backgroundColor: '#edf2f7',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  errorBox: {
    backgroundColor: '#fff5f5',
    border: '1px solid #fed7d7',
    color: '#c53030',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#4a5568',
  },
  required: {
    color: '#e53e3e',
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    '&:focus': {
      borderColor: '#1a365d',
    },
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    width: '100%',
  },
  textarea: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    width: '100%',
  },
  helpText: {
    fontSize: '11px',
    color: '#a0aec0',
    marginTop: '2px',
  },
  inputError: {
    fontSize: '11px',
    color: '#e53e3e',
    fontWeight: '500',
  },
  fileInputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '1px dashed #cbd5e1',
    borderRadius: '6px',
    padding: '8px 12px',
    backgroundColor: '#f8fafc',
  },
  fileInputHidden: {
    display: 'none',
  },
  fileInputLabel: {
    padding: '6px 12px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#4a5568',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  fileNameText: {
    fontSize: '12px',
    color: '#718096',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px',
  },
  previewContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '10px',
  },
  previewLabel: {
    fontSize: '11px',
    color: '#718096',
    fontWeight: '600',
  },
  previewImage: {
    width: '60px',
    height: '45px',
    objectFit: 'cover',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid #edf2f7',
    paddingTop: '20px',
    marginTop: '10px',
  },
  cancelBtn: {
    padding: '10px 24px',
    backgroundColor: '#ffffff',
    color: '#4a5568',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f7fafc',
    },
  },
  submitBtn: {
    padding: '10px 24px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
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
  successBannerBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '10px',
  },
  photoPlaceholderInfo: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    border: '1px dashed #cbd5e1',
    borderRadius: '6px',
  },
};

export default InventarisFormPage;
