'use strict';

/**
 * Middleware: instanceIdHeader
 *
 * Menyisipkan header X-Instance-Id ke SETIAP response dari server.
 * Header ini digunakan untuk memverifikasi load balancer saat demo —
 * dengan melihat DevTools browser, kita bisa tahu request dilayani
 * oleh instance EC2 mana.
 *
 * Nilai diambil dari process.env.INSTANCE_ID (diset manual per instance).
 */
function instanceIdHeader(req, res, next) {
  // Set header sebelum response dikirim ke client
  res.setHeader('X-Instance-Id', process.env.INSTANCE_ID || 'unknown');

  // Lanjutkan ke middleware atau route handler berikutnya
  next();
}

module.exports = { instanceIdHeader };
