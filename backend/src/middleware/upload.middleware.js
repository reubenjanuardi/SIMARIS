'use strict';

const multer = require('multer');

// Gunakan memory storage agar file tidak disimpan di disk lokal
const storage = multer.memoryStorage();

// Konfigurasi Multer
const upload = multer({
  storage,
  limits: {
    // Batasi ukuran file maks 5MB
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // Validasi tipe mime
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      const err = new Error('Format file tidak didukung. Hanya menerima JPEG, PNG, atau WEBP.');
      err.code = 'LIMIT_UNSUPPORTED_TYPE';
      return cb(err, false);
    }
    
    cb(null, true);
  },
});

// Wrapper middleware untuk menangani error multer secara konsisten
const uploadSingleFoto = (req, res, next) => {
  const uploadMiddleware = upload.single('foto');

  uploadMiddleware(req, res, (err) => {
    if (err) {
      let status = 400;
      let message = 'Gagal mengunggah foto.';

      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'Ukuran file terlalu besar. Maksimal ukuran file adalah 5MB.';
      } else if (err.code === 'LIMIT_UNSUPPORTED_TYPE') {
        message = err.message;
      } else if (err.message) {
        message = err.message;
      }

      return res.status(status).json({
        success: false,
        message,
      });
    }

    next();
  });
};

module.exports = uploadSingleFoto;
