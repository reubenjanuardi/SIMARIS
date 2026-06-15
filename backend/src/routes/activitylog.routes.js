'use strict';

const express = require('express');
const router  = express.Router();

const {
  getAll,
  exportLog,
} = require('../controllers/activitylog.controller');

const { authenticate, authorize } = require('../middleware/auth.middleware');

// =============================================================
// ACTIVITY LOG ROUTES — sesuai plan.md section 5
// Base path: /api/activitylog
// =============================================================

/**
 * GET /api/activitylog
 * Query: user_id, tipe_aktivitas, tanggal_mulai, tanggal_akhir,
 *        tabel_target, instance_id, search, page, limit
 * Akses: admin, viewer
 */
router.get('/', authenticate, authorize('admin', 'viewer'), getAll);

/**
 * GET /api/activitylog/export
 * Download CSV dengan filter yang sama
 * Kolom: No, Timestamp, User, Tipe Aktivitas, Tabel Target, Deskripsi, IP Address, Instance ID
 * Akses: admin only
 */
router.get('/export', authenticate, authorize('admin'), exportLog);

module.exports = router;
