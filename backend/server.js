'use strict';

// Load environment variables PERTAMA sebelum apapun
require('dotenv').config();

const app      = require('./src/app');
const sequelize = require('./src/config/database');
const logger   = require('./src/config/logger');

// Port dari .env, fallback ke 8081 sesuai plan.md
const PORT = process.env.PORT || 8081;

/**
 * Fungsi utama untuk menginisialisasi dan menjalankan server.
 * Dibuat async agar bisa await koneksi DB sebelum mulai listen.
 */
async function startServer() {
  try {
    // --- Langkah 1: Test koneksi ke database ---
    await sequelize.authenticate();
    logger.info('Koneksi database berhasil.');

    // --- Langkah 2: Sinkronisasi model Sequelize ke database ---
    // - alter: true  → update tabel yang sudah ada tanpa hapus data (development)
    // - alter: false → tidak ada perubahan otomatis (production, pakai migration)
    const isProduction = process.env.NODE_ENV === 'production';
    await sequelize.sync({ alter: !isProduction });

    if (isProduction) {
      logger.info('Mode PRODUCTION: sinkronisasi model dinonaktifkan (gunakan migration).');
    } else {
      logger.info('Mode DEVELOPMENT: sinkronisasi model dengan alter:true berhasil.');
    }

    // --- Langkah 3: Jalankan HTTP server ---
    app.listen(PORT, () => {
      // Tampilkan info startup yang lengkap di log
      logger.info('='.repeat(50));
      logger.info('SIMARIS Backend Server berhasil berjalan!');
      logger.info(`URL          : http://localhost:${PORT}`);
      logger.info(`Health Check : http://localhost:${PORT}/health`);
      logger.info(`Environment  : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Instance ID  : ${process.env.INSTANCE_ID || 'local-dev'}`);
      logger.info('='.repeat(50));
    });

  } catch (error) {
    // Jika koneksi DB gagal, log error dan keluar
    logger.error('Gagal menjalankan server:', { message: error.message });
    process.exit(1);
  }
}

// Jalankan server
startServer();
