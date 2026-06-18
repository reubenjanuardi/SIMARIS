'use strict';

const express = require('express');
const router  = express.Router();

const {
  getAll,
  create,
  approve,
} = require('../controllers/penghapusan.controller');

const { authenticate, authorize } = require('../middleware/auth.middleware');

// =============================================================
// PENGHAPUSAN ROUTES — sesuai plan.md section 5
// Base path: /api/penghapusan
// =============================================================

/** GET /api/penghapusan — List semua. Akses: admin */
router.get('/', authenticate, authorize('admin', 'staff'), getAll);

/** POST /api/penghapusan — Ajukan penghapusan. Akses: admin, staff */
router.post('/', authenticate, authorize('admin', 'staff'), create);

/** PUT /api/penghapusan/:id/approve — Approve penghapusan. Akses: admin */
router.put('/:id/approve', authenticate, authorize('admin'), approve);

module.exports = router;

