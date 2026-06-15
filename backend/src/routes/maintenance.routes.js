'use strict';

const express = require('express');
const router  = express.Router();

const {
  getAll,
  create,
  start,
  complete,
} = require('../controllers/maintenance.controller');

const { authenticate, authorize } = require('../middleware/auth.middleware');

// =============================================================
// MAINTENANCE ROUTES — sesuai plan.md section 5
// Base path: /api/maintenance
// =============================================================

/** GET /api/maintenance — List semua, filter by status. Akses: semua role */
router.get('/', authenticate, getAll);

/** POST /api/maintenance — Ajukan maintenance. Akses: semua role */
router.post('/', authenticate, create);

/** PUT /api/maintenance/:id/start — Mulai maintenance. Akses: admin, staff */
router.put('/:id/start', authenticate, authorize('admin', 'staff'), start);

/** PUT /api/maintenance/:id/complete — Selesaikan maintenance. Akses: admin, staff */
router.put('/:id/complete', authenticate, authorize('admin', 'staff'), complete);

module.exports = router;

