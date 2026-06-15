'use strict';

const jwt = require('jsonwebtoken');

/**
 * Middleware: authenticate
 *
 * Memverifikasi JWT dari header Authorization.
 * Jika valid, attach payload user ke req.user.
 * Jika tidak valid, kembalikan response 401.
 *
 * Header yang diharapkan: Authorization: Bearer <token>
 */
function authenticate(req, res, next) {
  // Ambil header Authorization dari request
  const authHeader = req.headers['authorization'];

  // Pastikan header ada dan formatnya benar (Bearer <token>)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token autentikasi tidak ditemukan.',
    });
  }

  // Pisahkan kata "Bearer" dari token-nya
  const token = authHeader.split(' ')[1];

  try {
    // Verifikasi token menggunakan JWT_SECRET dari .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach data user dari payload token ke object request
    // Payload berisi: id, username, role, nama
    req.user = decoded;

    // Lanjutkan ke middleware atau controller berikutnya
    next();
  } catch (error) {
    // Token tidak valid atau sudah kadaluarsa
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau sudah kadaluarsa. Silakan login kembali.',
    });
  }
}

/**
 * Middleware Factory: authorize
 *
 * Membuat middleware yang memeriksa apakah role user
 * termasuk dalam daftar role yang diizinkan.
 *
 * Penggunaan: router.get('/path', authenticate, authorize('admin', 'staff'), controller)
 *
 * @param {...string} roles - Daftar role yang diizinkan (admin, staff, viewer)
 * @returns {Function} Middleware Express
 */
function authorize(...roles) {
  return function (req, res, next) {
    // Pastikan authenticate sudah dipanggil sebelum authorize
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentikasi diperlukan sebelum otorisasi.',
      });
    }

    // Cek apakah role user ada di dalam daftar role yang diizinkan
    const userRole = req.user.role;
    const isAllowed = roles.includes(userRole);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Role '${userRole}' tidak memiliki izin untuk aksi ini.`,
      });
    }

    // Role cocok, lanjutkan ke handler berikutnya
    next();
  };
}

module.exports = { authenticate, authorize };
