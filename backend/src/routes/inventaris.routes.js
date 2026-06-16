'use strict';

const express = require('express');
const router  = express.Router();

// Import controller functions
const {
  getAll,
  getById,
  create,
  update,
  destroy,
  getCategories,
} = require('../controllers/inventaris.controller');

// Import middleware
const { authenticate, authorize } = require('../middleware/auth.middleware');

// =============================================================
// INVENTARIS ROUTES — sesuai plan.md section 5
// Base path: /api/inventaris (dipasang di app.js)
// =============================================================

/**
 * GET /api/inventaris
 * List semua barang dengan filter & pagination.
 * Query params: kategori_id, kondisi, status_aset, search, page, limit
 * Akses: semua role (admin, staff, viewer)
 */
router.get('/', authenticate, getAll);

/**
 * GET /api/inventaris/categories
 * Ambil semua kategori barang untuk dropdown.
 * Akses: semua role (admin, staff, viewer)
 */
router.get('/categories', authenticate, getCategories);

/**
 * GET /api/inventaris/:id
 * Detail satu barang + 10 activity log terbaru untuk barang ini.
 * Akses: semua role (admin, staff, viewer)
 */
router.get('/:id', authenticate, getById);

/**
 * POST /api/inventaris
 * Tambah barang baru ke inventaris.
 * Mencatat log TAMBAH_BARANG.
 * Akses: admin, staff
 */
router.post('/', authenticate, authorize('admin', 'staff'), create);

/**
 * PUT /api/inventaris/:id
 * Update data barang (partial update).
 * Mencatat log UBAH_BARANG / UBAH_LOKASI / UBAH_KONDISI sesuai field yang berubah.
 * Akses: admin, staff
 */
router.put('/:id', authenticate, authorize('admin', 'staff'), update);

/**
 * DELETE /api/inventaris/:id
 * Soft delete barang: set status_aset = 'Dihapus', record tetap ada di DB.
 * Mencatat log HAPUS_BARANG.
 * Akses: admin only
 */
router.delete('/:id', authenticate, authorize('admin'), destroy);

module.exports = router;

