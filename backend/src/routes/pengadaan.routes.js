'use strict';

const express = require('express');
const router  = express.Router();

const {
  getAll,
  create,
  approve,
  arrived,
} = require('../controllers/pengadaan.controller');

const { authenticate, authorize } = require('../middleware/auth.middleware');

// =============================================================
// PENGADAAN ROUTES — sesuai plan.md section 5
// Base path: /api/pengadaan
// =============================================================

/** GET /api/pengadaan — List semua. Akses: admin, staff */
router.get('/', authenticate, authorize('admin', 'staff'), getAll);

/** POST /api/pengadaan — Buat PO baru. Akses: admin, staff */
router.post('/', authenticate, authorize('admin', 'staff'), create);

/** PUT /api/pengadaan/:id/approve — Approve PO. Akses: admin */
router.put('/:id/approve', authenticate, authorize('admin'), approve);

/** PUT /api/pengadaan/:id/arrived — Tandai barang sudah tiba. Akses: admin, staff */
router.put('/:id/arrived', authenticate, authorize('admin', 'staff'), arrived);

module.exports = router;

