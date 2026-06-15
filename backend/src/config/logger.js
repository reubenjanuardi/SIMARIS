'use strict';

const { createLogger, format, transports } = require('winston');
const path = require('path');

// Folder untuk menyimpan file log
const LOG_DIR = path.join(__dirname, '../../logs');

// Format log: [2026-06-15 10:00:00] INFO: Pesan log {"key":"value"}
const logFormat = format.combine(
  // Tambahkan timestamp ke setiap log
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),

  // Format output log menjadi teks yang mudah dibaca
  format.printf(({ timestamp, level, message, ...metadata }) => {
    // Jika ada metadata tambahan, tampilkan sebagai JSON
    const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${meta}`.trim();
  })
);

// Buat logger instance dengan multiple transport
const logger = createLogger({
  // Level log minimum yang akan diproses
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',

  format: logFormat,

  transports: [
    // Transport 1: Tampilkan log di console (hanya saat development)
    new transports.Console({
      silent: process.env.NODE_ENV === 'production',
      format: format.combine(
        format.colorize(), // Warna berbeda per level (info=hijau, error=merah)
        logFormat
      ),
    }),

    // Transport 2: Simpan semua log error ke file error.log
    new transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error', // Hanya level error ke bawah
      maxsize: 5 * 1024 * 1024, // Maksimal 5MB per file
      maxFiles: 5,              // Simpan maksimal 5 file rotasi
    }),

    // Transport 3: Simpan semua log (info, warn, error) ke combined.log
    new transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // Maksimal 10MB per file
      maxFiles: 10,
    }),
  ],

  // Jangan crash app jika logger sendiri error
  exitOnError: false,
});

module.exports = logger;
