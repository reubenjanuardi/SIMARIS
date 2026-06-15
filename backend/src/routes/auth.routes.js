'use strict';

const express    = require('express');
const router     = express.Router();

// Import controller functions
const {
  register,
  login,
  logout,
  getMe,
} = require('../controllers/auth.controller');

// Import middleware autentikasi & otorisasi
const { authenticate, authorize } = require('../middleware/auth.middleware');

// =============================================================
// AUTH ROUTES — sesuai plan.md section 5
// Base path: /api/auth (dipasang di app.js)
// =============================================================

/**
 * POST /api/auth/register
 * Daftarkan user baru.
 * Akses: Admin only (harus login dulu, lalu cek role admin)
 */
router.post('/register', authenticate, authorize('admin'), register);

/**
 * POST /api/auth/login
 * Login dengan username + password, mendapatkan JWT token.
 * Akses: Public (tidak perlu token)
 */
router.post('/login', login);

/**
 * POST /api/auth/logout
 * Catat aktivitas logout. Client bertanggung jawab menghapus token.
 * Akses: Semua user yang sudah login
 */
router.post('/logout', authenticate, logout);

/**
 * GET /api/auth/me
 * Ambil data profil user yang sedang login (fresh dari DB).
 * Akses: Semua user yang sudah login
 */
router.get('/me', authenticate, getMe);

module.exports = router;

