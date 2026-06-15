'use strict';

const logger = require('../config/logger');

/**
 * Helper untuk mencatat aktivitas pengguna ke tabel activity_log.
 *
 * Fungsi ini TIDAK boleh throw error ke caller — jika logging gagal,
 * cukup catat ke winston agar operasi utama tidak terganggu.
 *
 * @param {Object} params
 * @param {number|null}  params.userId              - ID user yang melakukan aksi
 * @param {string}       params.tipeAktivitas       - Tipe aktivitas (UPPER_SNAKE_CASE, lihat plan.md)
 * @param {string|null}  params.tabelTarget         - Nama tabel yang terdampak
 * @param {number|null}  params.idTarget            - ID record yang terdampak
 * @param {Object|null}  params.nilaiLama           - Snapshot data sebelum perubahan
 * @param {Object|null}  params.nilaiBaru           - Snapshot data sesudah perubahan
 * @param {string}       params.deskripsiPerubahan  - Penjelasan singkat dalam Bahasa Indonesia
 * @param {string|null}  params.ipAddress           - IP address user (bisa dari req.ip)
 * @param {Object|null}  params.req                 - Express request object (opsional)
 */
async function logActivity({
  userId = null,
  tipeAktivitas,
  tabelTarget = null,
  idTarget = null,
  nilaiLama = null,
  nilaiBaru = null,
  deskripsiPerubahan,
  ipAddress = null,
  req = null,
}) {
  try {
    // Import model di dalam fungsi untuk menghindari circular dependency
    // (model butuh sequelize, sequelize butuh diinit dulu)
    const { ActivityLog } = require('../models');

    // Ambil instance_id dari environment variable untuk identifikasi load balancer
    const instanceId = process.env.INSTANCE_ID || 'unknown';

    // Jika req tersedia, coba ambil IP dari request
    const resolvedIp = ipAddress || (req ? req.ip : null);

    // Simpan ke tabel activity_log
    await ActivityLog.create({
      user_id: userId,
      tipe_aktivitas: tipeAktivitas,
      tabel_target: tabelTarget,
      id_target: idTarget,
      // Simpan snapshot sebagai JSON string agar mudah dibaca
      nilai_lama: nilaiLama ? JSON.stringify(nilaiLama) : null,
      nilai_baru: nilaiBaru ? JSON.stringify(nilaiBaru) : null,
      deskripsi_perubahan: deskripsiPerubahan,
      ip_address: resolvedIp,
      instance_id: instanceId,
    });
  } catch (error) {
    // Jika logging gagal, catat ke winston tapi JANGAN crash aplikasi
    logger.error('Gagal mencatat activity log', {
      error: error.message,
      tipeAktivitas,
      userId,
      idTarget,
    });
  }
}

module.exports = { logActivity };
