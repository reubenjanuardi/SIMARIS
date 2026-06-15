'use strict';

const express = require('express');
const router  = express.Router();

const {
  getSummary,
  getRecentActivity,
  getAlertBarang,
} = require('../controllers/dashboard.controller');

const { authenticate } = require('../middleware/auth.middleware');

// =============================================================
// DASHBOARD ROUTES — sesuai plan.md section 5
// Base path: /api/dashboard
// =============================================================

/** GET /api/dashboard/summary — Statistik ringkasan inventaris. Akses: semua role */
router.get('/summary', authenticate, getSummary);

/** GET /api/dashboard/recent-activity — 10 aktivitas terbaru. Akses: semua role */
router.get('/recent-activity', authenticate, getRecentActivity);

/**
 * GET /api/dashboard/low-stock
 * Plan.md: "barang butuh perhatian — kondisi rusak/garansi habis"
 * Includes: kondisi kritis, garansi hampir habis, maintenance macet > 7 hari
 * Akses: semua role
 */
router.get('/low-stock', authenticate, getAlertBarang);

module.exports = router;
