'use strict';

const { Op }          = require('sequelize');
const {
  PengadaanBarang,
  KategoriBarang,
  User,
}                     = require('../models');
const { logActivity } = require('../utils/activityLogger');

const USER_SAFE_ATTR = ['id', 'nama', 'username', 'departemen', 'role'];

// =============================================================
// Helper: Generate nomor PO otomatis
// Format: PO-YYYY-XXX (contoh: PO-2026-001)
// Sequential berdasarkan tahun saat ini
// =============================================================
async function generateNomorPO() {
  const tahun = new Date().getFullYear();
  const prefix = `PO-${tahun}-`;

  // Cari PO terakhir di tahun ini
  const poTerakhir = await PengadaanBarang.findOne({
    where: {
      nomor_po: { [Op.like]: `${prefix}%` },
    },
    order: [['nomor_po', 'DESC']],
  });

  let nomorUrut = 1;
  if (poTerakhir) {
    // Ambil nomor urut dari suffix (3 digit terakhir) dan increment
    const suffixStr = poTerakhir.nomor_po.replace(prefix, '');
    nomorUrut = parseInt(suffixStr, 10) + 1;
  }

  // Format nomor urut jadi 3 digit dengan leading zero: 001, 002, dst.
  const suffixFormatted = String(nomorUrut).padStart(3, '0');
  return `${prefix}${suffixFormatted}`;
}

// =============================================================
// GET ALL — List pengadaan dengan filter status
// GET /api/pengadaan
// Akses: admin, staff
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

    const { count, rows } = await PengadaanBarang.findAndCountAll({
      where: whereClause,
      include: [
        { model: KategoriBarang, as: 'kategori', attributes: ['id', 'nama_kategori'] },
        { model: User, as: 'creator',  attributes: USER_SAFE_ATTR },
        { model: User, as: 'approver', attributes: USER_SAFE_ATTR },
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
    console.error('[Pengadaan.getAll]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pengadaan.',
    });
  }
}

// =============================================================
// CREATE — Buat pengajuan pengadaan baru
// POST /api/pengadaan
// Akses: admin, staff
// =============================================================
async function create(req, res) {
  try {
    const {
      nama_barang,
      kategori_id,
      qty,
      vendor,
      harga_satuan,
      tanggal_estimasi_tiba,
    } = req.body;

    // Validasi field wajib
    if (!nama_barang || !kategori_id || !qty || !harga_satuan) {
      return res.status(400).json({
        success: false,
        message: 'Field nama_barang, kategori_id, qty, dan harga_satuan wajib diisi.',
      });
    }

    // Validasi qty dan harga harus angka positif
    if (parseInt(qty, 10) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah qty harus minimal 1.',
      });
    }

    // Verifikasi kategori ada
    const kategori = await KategoriBarang.findByPk(kategori_id);
    if (!kategori) {
      return res.status(400).json({
        success: false,
        message: 'Kategori tidak ditemukan. Pastikan kategori_id valid.',
      });
    }

    // Auto-generate nomor PO sequential
    const nomor_po = await generateNomorPO();

    // Hitung total harga = qty * harga_satuan
    const qtyNum       = parseInt(qty, 10);
    const hargaNum     = parseFloat(harga_satuan);
    const total_harga  = qtyNum * hargaNum;

    // Buat record pengadaan dengan status awal 'Draft'
    const pengadaan = await PengadaanBarang.create({
      nomor_po,
      nama_barang,
      kategori_id,
      qty:                  qtyNum,
      vendor:               vendor || null,
      harga_satuan:         hargaNum,
      total_harga,
      tanggal_estimasi_tiba: tanggal_estimasi_tiba || null,
      status:               'Draft',
      created_by:           req.user.id,
    });

    // Catat aktivitas pembuatan PO
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'PENGADAAN_CREATE',
      tabelTarget:        'pengadaan_barang',
      idTarget:           pengadaan.id,
      nilaiLama:          null,
      nilaiBaru:          { nomor_po, nama_barang, qty: qtyNum, total_harga, status: 'Draft' },
      deskripsiPerubahan: `PO ${nomor_po} dibuat oleh ${req.user.nama} untuk ${nama_barang} (qty: ${qtyNum}, total: Rp ${total_harga.toLocaleString('id-ID')}).`,
      req,
    });

    return res.status(201).json({
      success: true,
      data: pengadaan,
    });

  } catch (error) {
    console.error('[Pengadaan.create]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat pengadaan. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// APPROVE — Setujui pengadaan
// PUT /api/pengadaan/:id/approve
// Akses: admin
// =============================================================
async function approve(req, res) {
  try {
    const { id } = req.params;

    const pengadaan = await PengadaanBarang.findByPk(id);
    if (!pengadaan) {
      return res.status(404).json({
        success: false,
        message: 'Data pengadaan tidak ditemukan.',
      });
    }

    // Hanya status 'Draft' yang bisa di-approve
    if (pengadaan.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Pengadaan tidak dapat disetujui karena statusnya '${pengadaan.status}'.`,
      });
    }

    await pengadaan.update({
      status:      'Approved',
      approved_by: req.user.id,
    });

    // Catat aktivitas approval
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'PENGADAAN_APPROVE',
      tabelTarget:        'pengadaan_barang',
      idTarget:           pengadaan.id,
      nilaiLama:          { status: 'Draft' },
      nilaiBaru:          { status: 'Approved', approved_by: req.user.id },
      deskripsiPerubahan: `PO ${pengadaan.nomor_po} (${pengadaan.nama_barang}) disetujui oleh ${req.user.nama}.`,
      req,
    });

    return res.status(200).json({
      success: true,
      data: pengadaan,
    });

  } catch (error) {
    console.error('[Pengadaan.approve]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyetujui pengadaan. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// ARRIVED — Barang pesanan sudah tiba
// PUT /api/pengadaan/:id/arrived
// Akses: admin, staff
// =============================================================
async function arrived(req, res) {
  try {
    const { id }          = req.params;
    const { tanggal_terima } = req.body;

    const pengadaan = await PengadaanBarang.findByPk(id);
    if (!pengadaan) {
      return res.status(404).json({
        success: false,
        message: 'Data pengadaan tidak ditemukan.',
      });
    }

    // Hanya status 'Approved' atau 'Ordered' yang bisa jadi Arrived
    const statusValid = ['Approved', 'Ordered'];
    if (!statusValid.includes(pengadaan.status)) {
      return res.status(400).json({
        success: false,
        message: `Pengadaan tidak dapat ditandai tiba karena statusnya '${pengadaan.status}'.`,
      });
    }

    const tglTerima = tanggal_terima ? new Date(tanggal_terima) : new Date();

    await pengadaan.update({
      status:        'Arrived',
      tanggal_terima: tglTerima,
    });

    // Catat aktivitas barang tiba
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'PENGADAAN_ARRIVED',
      tabelTarget:        'pengadaan_barang',
      idTarget:           pengadaan.id,
      nilaiLama:          { status: pengadaan.status },
      nilaiBaru:          { status: 'Arrived', tanggal_terima: tglTerima },
      deskripsiPerubahan: `Barang PO ${pengadaan.nomor_po} (${pengadaan.nama_barang}, qty: ${pengadaan.qty}) telah tiba pada ${tglTerima.toLocaleDateString('id-ID')}.`,
      req,
    });

    return res.status(200).json({
      success: true,
      data: pengadaan,
    });

  } catch (error) {
    console.error('[Pengadaan.arrived]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status pengadaan. Silakan coba beberapa saat lagi.',
    });
  }
}

module.exports = { getAll, create, approve, arrived };
