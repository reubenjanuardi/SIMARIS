'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Middleware custom untuk X-Instance-Id header
const { instanceIdHeader } = require('./middleware/activityLogger.middleware');

// Import semua router sesuai plan.md section 5
const authRoutes         = require('./routes/auth.routes');
const inventarisRoutes   = require('./routes/inventaris.routes');
const peminjamanRoutes   = require('./routes/peminjaman.routes');
const maintenanceRoutes  = require('./routes/maintenance.routes');
const pengadaanRoutes    = require('./routes/pengadaan.routes');
const penghapusanRoutes  = require('./routes/penghapusan.routes');
const activitylogRoutes  = require('./routes/activitylog.routes');
const dashboardRoutes    = require('./routes/dashboard.routes');

const app = express();

// =============================================================
// MIDDLEWARE GLOBAL
// =============================================================

// Helmet: set berbagai HTTP header keamanan secara otomatis
app.use(helmet());

// CORS: izinkan request dari frontend (VITE_API_URL / FRONTEND_URL)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // Expose header X-Instance-Id agar bisa dibaca JS di browser
  exposedHeaders: ['X-Instance-Id'],
  credentials: true,
}));

// Morgan: log setiap HTTP request di console (hanya development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Parse body request sebagai JSON
app.use(express.json());

// Parse body request sebagai URL-encoded form (untuk form HTML biasa)
app.use(express.urlencoded({ extended: true }));

// Inject X-Instance-Id ke SETIAP response (untuk demo load balancer)
app.use(instanceIdHeader);

// =============================================================
// HEALTH CHECK ENDPOINT (wajib untuk AWS Load Balancer health check)
// =============================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status:      'OK',
      instance:    process.env.INSTANCE_ID || 'unknown',
      timestamp:   new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime:      process.uptime(),
    },
  });
});

// =============================================================
// MOUNT ROUTES API
// =============================================================
app.use('/api/auth',        authRoutes);
app.use('/api/inventaris',  inventarisRoutes);
app.use('/api/peminjaman',  peminjamanRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/pengadaan',   pengadaanRoutes);
app.use('/api/penghapusan', penghapusanRoutes);
app.use('/api/activitylog', activitylogRoutes);
app.use('/api/dashboard',   dashboardRoutes);

// =============================================================
// HANDLER: 404 — Endpoint tidak ditemukan
// =============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`,
  });
});

// =============================================================
// GLOBAL ERROR HANDLER
// Dipanggil saat ada next(error) dari controller/middleware lain
// =============================================================
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Log error lengkap ke server log
  console.error('[Global Error Handler]', err);

  // Kirim response error ke client dalam format standar
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.',
  });
});

module.exports = app;
