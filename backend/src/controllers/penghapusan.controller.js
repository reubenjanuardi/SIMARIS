'use strict';

const {
  PenghapusanAset,
  Inventaris,
  User,
}                     = require('../models');
const { logActivity } = require('../utils/activityLogger');

const USER_SAFE_ATTR  = ['id', 'nama', 'username', 'departemen', 'role'];
const INVENTARIS_ATTR = ['id', 'kode_inventaris', 'nama_barang', 'kondisi', 'status_aset', 'lokasi', 'harga_perolehan'];

// =============================================================
// GET ALL — List penghapusan aset
// GET /api/penghapusan
// Akses: admin
// =============================================================
async function getAll(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset   = (pageNum - 1) * limitNum;

    const { count, rows } = await PenghapusanAset.findAndCountAll({
      include: [
        { model: Inventaris, as: 'barang',   attributes: INVENTARIS_ATTR },
        { model: User,       as: 'approver', attributes: USER_SAFE_ATTR  },
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
    console.error('[Penghapusan.getAll]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data penghapusan aset.',
    });
  }
}

// =============================================================
// CREATE — Ajukan penghapusan aset
// POST /api/penghapusan
// Akses: admin, staff (ajukan saja, belum approve)
// =============================================================
async function create(req, res) {
  try {
    const {
      barang_id,
      alasan_penghapusan,
      tanggal_penghapusan,
      nilai_sisa,
      catatan,
    } = req.body;

    // Validasi field wajib
    if (!barang_id || !alasan_penghapusan || !tanggal_penghapusan) {
      return res.status(400).json({
        success: false,
        message: 'Field barang_id, alasan_penghapusan, dan tanggal_penghapusan wajib diisi.',
      });
    }

    // Verifikasi barang ada di inventaris
    const barang = await Inventaris.findByPk(barang_id);
    if (!barang) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan di inventaris.',
      });
    }

    // Hanya barang dengan status 'Aktif' yang bisa diajukan penghapusan
    // Tidak bisa hapus aset yang sedang dipinjam atau dalam perbaikan
    if (barang.status_aset !== 'Aktif') {
      return res.status(400).json({
        success: false,
        message: `Barang '${barang.nama_barang}' tidak dapat diajukan penghapusan karena statusnya '${barang.status_aset}'. Selesaikan proses yang sedang berjalan terlebih dahulu.`,
      });
    }

    // Cegah pengajuan ganda untuk barang yang sudah ada pengajuan aktif
    if (barang.status_aset === 'Dihapus') {
      return res.status(400).json({
        success: false,
        message: 'Barang ini sudah dihapus sebelumnya.',
      });
    }

    // Buat record pengajuan penghapusan
    // Status aset BELUM berubah di sini — hanya berubah saat approve
    const penghapusan = await PenghapusanAset.create({
      barang_id,
      alasan_penghapusan,
      tanggal_penghapusan,
      nilai_sisa:   nilai_sisa || null,
      catatan:      catatan    || null,
      approved_by:  null, // Belum diapprove
    });

    // Catat aktivitas pengajuan penghapusan
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'PENGHAPUSAN_REQUEST',
      tabelTarget:        'penghapusan_aset',
      idTarget:           penghapusan.id,
      nilaiLama:          null,
      nilaiBaru:          {
        barang_id,
        alasan_penghapusan,
        tanggal_penghapusan,
        nilai_sisa: nilai_sisa || null,
      },
      deskripsiPerubahan: `Penghapusan aset diajukan untuk ${barang.nama_barang} (${barang.kode_inventaris}) oleh ${req.user.nama}. Alasan: ${alasan_penghapusan}`,
      req,
    });

    return res.status(201).json({
      success: true,
      data: penghapusan,
    });

  } catch (error) {
    console.error('[Penghapusan.create]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengajukan penghapusan aset. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// APPROVE — Setujui penghapusan aset
// PUT /api/penghapusan/:id/approve
// Akses: admin
// =============================================================
async function approve(req, res) {
  try {
    const { id } = req.params;

    const penghapusan = await PenghapusanAset.findByPk(id, {
      include: [
        { model: Inventaris, as: 'barang',   attributes: INVENTARIS_ATTR },
      ],
    });

    if (!penghapusan) {
      return res.status(404).json({
        success: false,
        message: 'Data penghapusan aset tidak ditemukan.',
      });
    }

    // Cek apakah sudah pernah di-approve (approved_by sudah terisi)
    if (penghapusan.approved_by !== null) {
      return res.status(400).json({
        success: false,
        message: 'Penghapusan aset ini sudah disetujui sebelumnya.',
      });
    }

    // Verifikasi barang masih belum dihapus
    const barang = await Inventaris.findByPk(penghapusan.barang_id);
    if (barang.status_aset === 'Dihapus') {
      return res.status(400).json({
        success: false,
        message: 'Barang ini sudah berstatus Dihapus.',
      });
    }

    // Set approved_by dan tanggal penghapusan final
    await penghapusan.update({
      approved_by:        req.user.id,
      tanggal_penghapusan: penghapusan.tanggal_penghapusan || new Date().toISOString().split('T')[0],
    });

    // Update status aset inventaris menjadi 'Dihapus' (final)
    await barang.update({
      status_aset: 'Dihapus',
    });

    // Catat aktivitas persetujuan penghapusan
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'PENGHAPUSAN_APPROVE',
      tabelTarget:        'penghapusan_aset',
      idTarget:           penghapusan.id,
      nilaiLama:          { status_aset: barang.status_aset, approved_by: null },
      nilaiBaru:          { status_aset: 'Dihapus', approved_by: req.user.id },
      deskripsiPerubahan: `Aset ${barang.nama_barang} (${barang.kode_inventaris}) resmi dihapus dari inventaris. Disetujui oleh ${req.user.nama}.`,
      req,
    });

    return res.status(200).json({
      success: true,
      data: penghapusan,
    });

  } catch (error) {
    console.error('[Penghapusan.approve]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyetujui penghapusan aset. Silakan coba beberapa saat lagi.',
    });
  }
}

module.exports = { getAll, create, approve };
