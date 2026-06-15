'use strict';

const { Op }          = require('sequelize');
const {
  MaintenanceBarang,
  Inventaris,
  User,
}                     = require('../models');
const { logActivity } = require('../utils/activityLogger');

const USER_SAFE_ATTR     = ['id', 'nama', 'username', 'departemen', 'role'];
const INVENTARIS_ATTR    = ['id', 'kode_inventaris', 'nama_barang', 'kondisi', 'status_aset', 'lokasi'];

// =============================================================
// GET ALL — List maintenance dengan filter status
// GET /api/maintenance
// Akses: semua role
// =============================================================
async function getAll(req, res) {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset   = (pageNum - 1) * limitNum;

    const { count, rows } = await MaintenanceBarang.findAndCountAll({
      where: whereClause,
      include: [
        { model: Inventaris, as: 'barang',  attributes: INVENTARIS_ATTR },
        { model: User,       as: 'teknisi', attributes: USER_SAFE_ATTR },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        items:      rows,
        total:      count,
        page:       pageNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });

  } catch (error) {
    console.error('[Maintenance.getAll]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data maintenance.',
    });
  }
}

// =============================================================
// CREATE — Ajukan permintaan maintenance
// POST /api/maintenance
// Akses: semua role
// =============================================================
async function create(req, res) {
  try {
    const { barang_id, deskripsi_masalah, teknisi_id } = req.body;

    // Validasi field wajib
    if (!barang_id || !deskripsi_masalah) {
      return res.status(400).json({
        success: false,
        message: 'Field barang_id dan deskripsi_masalah wajib diisi.',
      });
    }

    // Verifikasi barang ada
    const barang = await Inventaris.findByPk(barang_id);
    if (!barang) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan di inventaris.',
      });
    }

    // Buat record maintenance dengan status awal 'Diajukan'
    // Kondisi barang BELUM diubah di sini — hanya saat maintenance di-start
    const maintenance = await MaintenanceBarang.create({
      barang_id,
      tanggal_maintenance: new Date(),
      deskripsi_masalah,
      teknisi_id:          teknisi_id || null,
      status:              'Diajukan',
    });

    // Catat aktivitas pengajuan maintenance
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'MAINTENANCE_REQUEST',
      tabelTarget:        'maintenance_barang',
      idTarget:           maintenance.id,
      nilaiLama:          null,
      nilaiBaru:          { barang_id, status: 'Diajukan', deskripsi_masalah },
      deskripsiPerubahan: `Maintenance diajukan untuk ${barang.nama_barang} (${barang.kode_inventaris}): ${deskripsi_masalah}`,
      req,
    });

    return res.status(201).json({
      success: true,
      data: maintenance,
    });

  } catch (error) {
    console.error('[Maintenance.create]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengajukan maintenance. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// START — Mulai proses maintenance
// PUT /api/maintenance/:id/start
// Akses: admin, staff (sebagai teknisi)
// =============================================================
async function start(req, res) {
  try {
    const { id } = req.params;

    const maintenance = await MaintenanceBarang.findByPk(id, {
      include: [{ model: Inventaris, as: 'barang', attributes: INVENTARIS_ATTR }],
    });

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Data maintenance tidak ditemukan.',
      });
    }

    // Hanya status 'Diajukan' yang bisa di-start
    if (maintenance.status !== 'Diajukan') {
      return res.status(400).json({
        success: false,
        message: `Maintenance tidak dapat dimulai karena statusnya '${maintenance.status}'.`,
      });
    }

    // Update maintenance — set teknisi dan status Dalam Perbaikan
    await maintenance.update({
      status:     'Dalam Perbaikan',
      teknisi_id: req.user.id,
    });

    // Update inventaris — barang masuk mode perbaikan
    const barang = await Inventaris.findByPk(maintenance.barang_id);
    await barang.update({
      kondisi:    'Perbaikan',
      status_aset: 'Dalam Perbaikan',
    });

    // Catat aktivitas mulai maintenance
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'MAINTENANCE_START',
      tabelTarget:        'maintenance_barang',
      idTarget:           maintenance.id,
      nilaiLama:          { status: 'Diajukan' },
      nilaiBaru:          { status: 'Dalam Perbaikan', teknisi_id: req.user.id },
      deskripsiPerubahan: `${req.user.nama} memulai proses maintenance ${barang.nama_barang}. Kondisi barang diubah ke 'Perbaikan'.`,
      req,
    });

    return res.status(200).json({
      success: true,
      data: maintenance,
    });

  } catch (error) {
    console.error('[Maintenance.start]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memulai maintenance. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// COMPLETE — Selesaikan proses maintenance
// PUT /api/maintenance/:id/complete
// Akses: admin, staff (sebagai teknisi)
// =============================================================
async function complete(req, res) {
  try {
    const { id }             = req.params;
    const { biaya_perbaikan } = req.body;

    const maintenance = await MaintenanceBarang.findByPk(id, {
      include: [{ model: Inventaris, as: 'barang', attributes: INVENTARIS_ATTR }],
    });

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Data maintenance tidak ditemukan.',
      });
    }

    // Hanya yang 'Dalam Perbaikan' yang bisa di-complete
    if (maintenance.status !== 'Dalam Perbaikan') {
      return res.status(400).json({
        success: false,
        message: `Maintenance tidak dapat diselesaikan karena statusnya '${maintenance.status}'.`,
      });
    }

    const sekarang = new Date();

    // Update maintenance — tandai selesai beserta biaya dan tanggal
    await maintenance.update({
      status:          'Selesai',
      tanggal_selesai: sekarang,
      biaya_perbaikan: biaya_perbaikan || null,
    });

    // Update inventaris — barang kembali aktif dengan kondisi Baik
    const barang = await Inventaris.findByPk(maintenance.barang_id);
    await barang.update({
      kondisi:     'Baik',
      status_aset: 'Aktif',
    });

    // Format biaya untuk tampilan deskripsi log
    const biayaFormat = biaya_perbaikan
      ? `Rp ${Number(biaya_perbaikan).toLocaleString('id-ID')}`
      : 'tidak dicatat';

    // Catat aktivitas selesai maintenance
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'MAINTENANCE_SELESAI',
      tabelTarget:        'maintenance_barang',
      idTarget:           maintenance.id,
      nilaiLama:          { status: 'Dalam Perbaikan' },
      nilaiBaru:          { status: 'Selesai', biaya_perbaikan, tanggal_selesai: sekarang },
      deskripsiPerubahan: `Maintenance ${barang.nama_barang} selesai, biaya: ${biayaFormat}. Kondisi barang kembali 'Baik'.`,
      req,
    });

    return res.status(200).json({
      success: true,
      data: maintenance,
    });

  } catch (error) {
    console.error('[Maintenance.complete]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyelesaikan maintenance. Silakan coba beberapa saat lagi.',
    });
  }
}

module.exports = { getAll, create, start, complete };
