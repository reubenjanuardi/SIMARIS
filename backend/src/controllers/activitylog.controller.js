'use strict';

const { Op }            = require('sequelize');
const { ActivityLog, User } = require('../models');

const USER_SAFE_ATTR = ['id', 'nama', 'username', 'departemen', 'role'];

// =============================================================
// GET ALL — Daftar activity log dengan filter lengkap
// GET /api/activitylog
// Query: user_id, tipe_aktivitas, tanggal_mulai, tanggal_akhir,
//        tabel_target, instance_id, search, page, limit
// Akses: admin, viewer
// =============================================================
async function getAll(req, res) {
  try {
    const {
      user_id,
      tipe_aktivitas,
      tanggal_mulai,
      tanggal_akhir,
      tabel_target,
      instance_id,
      search,
      page  = 1,
      limit = 20,
    } = req.query;

    const whereClause = {};

    // Filter by user
    if (user_id) {
      whereClause.user_id = parseInt(user_id, 10);
    }

    // Filter by tipe aktivitas (mendukung multiple value dipisah koma)
    // Contoh: ?tipe_aktivitas=LOGIN,LOGOUT
    if (tipe_aktivitas) {
      const tipeList = tipe_aktivitas.split(',').map(t => t.trim()).filter(Boolean);
      whereClause.tipe_aktivitas = tipeList.length === 1
        ? tipeList[0]
        : { [Op.in]: tipeList };
    }

    // Filter by tabel target (misal: inventaris, peminjaman_barang, dst)
    if (tabel_target) {
      whereClause.tabel_target = tabel_target;
    }

    // Filter by instance_id — berguna untuk analisis load balancer
    if (instance_id) {
      whereClause.instance_id = instance_id;
    }

    // Filter by rentang tanggal (inklusif kedua ujung)
    if (tanggal_mulai || tanggal_akhir) {
      whereClause.timestamp = {};
      if (tanggal_mulai) {
        whereClause.timestamp[Op.gte] = new Date(tanggal_mulai);
      }
      if (tanggal_akhir) {
        // Set ke akhir hari (23:59:59.999) agar inklusif
        const akhirHari = new Date(tanggal_akhir);
        akhirHari.setHours(23, 59, 59, 999);
        whereClause.timestamp[Op.lte] = akhirHari;
      }
    }

    // Full-text search di kolom deskripsi_perubahan
    if (search) {
      whereClause.deskripsi_perubahan = { [Op.iLike]: `%${search}%` };
    }

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset   = (pageNum - 1) * limitNum;

    const { count, rows } = await ActivityLog.findAndCountAll({
      where: whereClause,
      include: [{
        model:      User,
        as:         'user',
        attributes: USER_SAFE_ATTR,
        required:   false,   // LEFT JOIN — log sistem (user_id null) tetap muncul
      }],
      order: [['timestamp', 'DESC']],
      limit:    limitNum,
      offset,
      distinct: true,        // Cegah count ganda akibat JOIN
    });

    return res.status(200).json({
      success: true,
      data: {
        logs:       rows,
        total:      count,
        page:       pageNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });

  } catch (error) {
    console.error('[ActivityLog.getAll]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data activity log.',
    });
  }
}

// =============================================================
// EXPORT LOG — Export ke CSV dengan filter yang sama
// GET /api/activitylog/export
// Akses: admin only
// Kolom: No, Timestamp, User, Tipe Aktivitas, Tabel Target, Deskripsi, IP Address, Instance ID
// =============================================================
async function exportLog(req, res) {
  try {
    const {
      user_id,
      tipe_aktivitas,
      tanggal_mulai,
      tanggal_akhir,
      tabel_target,
      instance_id,
      search,
    } = req.query;

    // Bangun where clause — logika sama dengan getAll
    const whereClause = {};

    if (user_id)     whereClause.user_id = parseInt(user_id, 10);
    if (tabel_target) whereClause.tabel_target = tabel_target;
    if (instance_id)  whereClause.instance_id  = instance_id;

    if (tipe_aktivitas) {
      const tipeList = tipe_aktivitas.split(',').map(t => t.trim()).filter(Boolean);
      whereClause.tipe_aktivitas = tipeList.length === 1
        ? tipeList[0]
        : { [Op.in]: tipeList };
    }

    if (tanggal_mulai || tanggal_akhir) {
      whereClause.timestamp = {};
      if (tanggal_mulai) whereClause.timestamp[Op.gte] = new Date(tanggal_mulai);
      if (tanggal_akhir) {
        const akhirHari = new Date(tanggal_akhir);
        akhirHari.setHours(23, 59, 59, 999);
        whereClause.timestamp[Op.lte] = akhirHari;
      }
    }

    if (search) {
      whereClause.deskripsi_perubahan = { [Op.iLike]: `%${search}%` };
    }

    // Ambil semua data (tanpa paginasi untuk export penuh)
    const logs = await ActivityLog.findAll({
      where: whereClause,
      include: [{
        model:      User,
        as:         'user',
        attributes: USER_SAFE_ATTR,
        required:   false,
      }],
      order: [['timestamp', 'DESC']],
    });

    // ── Build CSV ────────────────────────────────────────────────
    // Header kolom sesuai spec plan.md
    const csvHeader = [
      'No',
      'Timestamp',
      'User',
      'Tipe Aktivitas',
      'Tabel Target',
      'Deskripsi',
      'IP Address',
      'Instance ID',
    ].join(',');

    // Helper: escape nilai agar aman dalam CSV
    // Jika ada koma, newline, atau tanda kutip — bungkus dengan double-quote
    const esc = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = logs.map((log, idx) => {
      // Format timestamp ke format lokal Indonesia
      const ts = log.timestamp
        ? new Date(log.timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        : '';

      // Tampilkan username dan nama user (atau 'sistem' jika log otomatis)
      const user = log.user
        ? `${log.user.username} (${log.user.nama})`
        : 'sistem';

      return [
        esc(idx + 1),
        esc(ts),
        esc(user),
        esc(log.tipe_aktivitas),
        esc(log.tabel_target),
        esc(log.deskripsi_perubahan),
        esc(log.ip_address),
        esc(log.instance_id),
      ].join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\r\n');

    // Set HTTP header untuk trigger download di browser
    const tanggal  = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `activity-log-${tanggal}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // BOM UTF-8 (\uFEFF) agar Excel bisa baca karakter Indonesia dengan benar
    return res.status(200).send('\uFEFF' + csvContent);

  } catch (error) {
    console.error('[ActivityLog.exportLog]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengekspor activity log. Silakan coba beberapa saat lagi.',
    });
  }
}

module.exports = { getAll, exportLog };
