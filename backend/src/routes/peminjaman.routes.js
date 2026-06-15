'use strict';

const express = require('express');
const router  = express.Router();

const {
  getAll,
  create,
  approve,
  reject,
  returnBarang,
} = require('../controllers/peminjaman.controller');

const { authenticate, authorize } = require('../middleware/auth.middleware');

// =============================================================
// PEMINJAMAN ROUTES — sesuai plan.md section 5
// Base path: /api/peminjaman
// =============================================================

/** GET /api/peminjaman — List semua, filter by status. Akses: semua role */
router.get('/', authenticate, getAll);

/** POST /api/peminjaman — Request pinjam barang. Akses: semua role */
router.post('/', authenticate, create);

/** PUT /api/peminjaman/:id/approve — Setujui peminjaman. Akses: admin */
router.put('/:id/approve', authenticate, authorize('admin'), approve);

/** PUT /api/peminjaman/:id/reject — Tolak peminjaman. Akses: admin */
router.put('/:id/reject', authenticate, authorize('admin'), reject);

/** PUT /api/peminjaman/:id/return — Kembalikan barang. Akses: peminjam atau admin */
router.put('/:id/return', authenticate, returnBarang);

module.exports = router;

