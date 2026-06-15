'use strict';

const { Op }          = require('sequelize');
const {
  PeminjamanBarang,
  Inventaris,
  User,
}                     = require('../models');
const { logActivity } = require('../utils/activityLogger');

// Atribut User yang aman ditampilkan
const USER_SAFE_ATTR = ['id', 'nama', 'username', 'departemen', 'role'];

// Atribut Inventaris ringkas untuk ditampilkan di list peminjaman
const INVENTARIS_ATTR = [
  'id', 'kode_inventaris', 'nama_barang', 'kondisi', 'status_aset', 'lokasi',
];

// =============================================================
// GET ALL — List peminjaman dengan filter status
// GET /api/peminjaman
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

    const { count, rows } = await PeminjamanBarang.findAndCountAll({
      where: whereClause,
      include: [
        { model: Inventaris, as: 'barang', attributes: INVENTARIS_ATTR },
        { model: User, as: 'peminjam',  attributes: USER_SAFE_ATTR },
        { model: User, as: 'approver',  attributes: USER_SAFE_ATTR },
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
    console.error('[Peminjaman.getAll]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data peminjaman.',
    });
  }
}

// =============================================================
// CREATE — Request peminjaman baru
// POST /api/peminjaman
// Akses: semua role
// =============================================================
async function create(req, res) {
  try {
    const { barang_id, tanggal_rencana_kembali, catatan } = req.body;

    // Validasi field wajib
    if (!barang_id || !tanggal_rencana_kembali) {
      return res.status(400).json({
        success: false,
        message: 'Field barang_id dan tanggal_rencana_kembali wajib diisi.',
      });
    }

    // Cek apakah barang ada di inventaris
    const barang = await Inventaris.findByPk(barang_id);
    if (!barang) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan di inventaris.',
      });
    }

    // Barang harus berstatus 'Aktif' untuk bisa dipinjam
    if (barang.status_aset !== 'Aktif') {
      return res.status(400).json({
        success: false,
        message: `Barang '${barang.nama_barang}' tidak dapat dipinjam karena statusnya '${barang.status_aset}'.`,
      });
    }

    // Buat record peminjaman baru dengan status Pending
    const peminjaman = await PeminjamanBarang.create({
      barang_id,
      peminjam_id:             req.user.id,
      tanggal_peminjaman:      new Date(),
      tanggal_rencana_kembali,
      status:                  'Pending',
      catatan:                 catatan || null,
    });

    // Catat aktivitas pengajuan peminjaman
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'PINJAM_BARANG_REQUEST',
      tabelTarget:        'peminjaman_barang',
      idTarget:           peminjaman.id,
      nilaiLama:          null,
      nilaiBaru:          { barang_id, status: 'Pending', tanggal_rencana_kembali },
      deskripsiPerubahan: `${req.user.nama} mengajukan peminjaman ${barang.nama_barang} (${barang.kode_inventaris}).`,
      req,
    });

    return res.status(201).json({
      success: true,
      data: peminjaman,
    });

  } catch (error) {
    console.error('[Peminjaman.create]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengajukan peminjaman. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// APPROVE — Setujui peminjaman
// PUT /api/peminjaman/:id/approve
// Akses: admin
// =============================================================
async function approve(req, res) {
  try {
    const { id } = req.params;

    // Cari record peminjaman beserta data barang
    const peminjaman = await PeminjamanBarang.findByPk(id, {
      include: [
        { model: Inventaris, as: 'barang', attributes: INVENTARIS_ATTR },
        { model: User, as: 'peminjam', attributes: USER_SAFE_ATTR },
      ],
    });

    if (!peminjaman) {
      return res.status(404).json({
        success: false,
        message: 'Data peminjaman tidak ditemukan.',
      });
    }

    // Hanya peminjaman berstatus 'Pending' yang bisa di-approve
    if (peminjaman.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Peminjaman tidak dapat disetujui karena statusnya '${peminjaman.status}'.`,
      });
    }

    // Cek ulang status barang — bisa saja sudah dipinjam orang lain sementara menunggu
    const barangTerkini = await Inventaris.findByPk(peminjaman.barang_id);
    if (barangTerkini.status_aset !== 'Aktif') {
      return res.status(400).json({
        success: false,
        message: `Barang '${barangTerkini.nama_barang}' sudah tidak tersedia (status: ${barangTerkini.status_aset}).`,
      });
    }

    const sekarang = new Date();

    // Update status peminjaman menjadi Approved
    await peminjaman.update({
      status:      'Approved',
      approved_by: req.user.id,
    });

    // Update inventaris: tandai sedang dipinjam
    await barangTerkini.update({
      status_aset:        'Dipinjam',
      peminjam_id:        peminjaman.peminjam_id,
      tanggal_peminjaman: sekarang,
    });

    // Catat aktivitas approval
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'PINJAM_BARANG_APPROVE',
      tabelTarget:        'peminjaman_barang',
      idTarget:           peminjaman.id,
      nilaiLama:          { status: 'Pending' },
      nilaiBaru:          { status: 'Approved', approved_by: req.user.id },
      deskripsiPerubahan: `Peminjaman ${barangTerkini.nama_barang} oleh ${peminjaman.peminjam.nama} disetujui oleh ${req.user.nama}.`,
      req,
    });

    return res.status(200).json({
      success: true,
      data: peminjaman,
    });

  } catch (error) {
    console.error('[Peminjaman.approve]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyetujui peminjaman. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// REJECT — Tolak peminjaman
// PUT /api/peminjaman/:id/reject
// Akses: admin
// =============================================================
async function reject(req, res) {
  try {
    const { id }     = req.params;
    const { catatan } = req.body; // Alasan penolakan (opsional)

    const peminjaman = await PeminjamanBarang.findByPk(id, {
      include: [
        { model: Inventaris, as: 'barang',  attributes: INVENTARIS_ATTR },
        { model: User,       as: 'peminjam', attributes: USER_SAFE_ATTR },
      ],
    });

    if (!peminjaman) {
      return res.status(404).json({
        success: false,
        message: 'Data peminjaman tidak ditemukan.',
      });
    }

    // Hanya status 'Pending' yang bisa di-reject
    if (peminjaman.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Peminjaman tidak dapat ditolak karena statusnya '${peminjaman.status}'.`,
      });
    }

    // Update status menjadi Rejected, tambah catatan alasan jika ada
    await peminjaman.update({
      status:      'Rejected',
      approved_by: req.user.id, // Yang reject pun dicatat di approved_by
      catatan:     catatan || peminjaman.catatan,
    });

    // Catat aktivitas penolakan
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'PINJAM_BARANG_REJECT',
      tabelTarget:        'peminjaman_barang',
      idTarget:           peminjaman.id,
      nilaiLama:          { status: 'Pending' },
      nilaiBaru:          { status: 'Rejected', approved_by: req.user.id },
      deskripsiPerubahan: `Peminjaman ${peminjaman.barang.nama_barang} oleh ${peminjaman.peminjam.nama} ditolak oleh ${req.user.nama}.`,
      req,
    });

    return res.status(200).json({
      success: true,
      data: peminjaman,
    });

  } catch (error) {
    console.error('[Peminjaman.reject]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menolak peminjaman. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// RETURN — Pengembalian barang
// PUT /api/peminjaman/:id/return
// Akses: peminjam (user sendiri) atau admin
// =============================================================
async function returnBarang(req, res) {
  try {
    const { id } = req.params;
    const { kondisi_saat_kembali, catatan } = req.body;

    // kondisi_saat_kembali wajib diisi saat pengembalian
    if (!kondisi_saat_kembali) {
      return res.status(400).json({
        success: false,
        message: 'Field kondisi_saat_kembali wajib diisi saat pengembalian.',
      });
    }

    const peminjaman = await PeminjamanBarang.findByPk(id, {
      include: [
        { model: Inventaris, as: 'barang',  attributes: [...INVENTARIS_ATTR, 'nama_barang'] },
        { model: User,       as: 'peminjam', attributes: USER_SAFE_ATTR },
      ],
    });

    if (!peminjaman) {
      return res.status(404).json({
        success: false,
        message: 'Data peminjaman tidak ditemukan.',
      });
    }

    // Hanya peminjaman 'Approved' yang bisa dikembalikan
    if (peminjaman.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: `Barang tidak dapat dikembalikan karena status peminjaman '${peminjaman.status}'.`,
      });
    }

    // Pastikan yang mengembalikan adalah peminjam itu sendiri atau admin
    const isAdmin    = req.user.role === 'admin';
    const isPeminjam = req.user.id === peminjaman.peminjam_id;
    if (!isAdmin && !isPeminjam) {
      return res.status(403).json({
        success: false,
        message: 'Hanya peminjam atau admin yang dapat mengembalikan barang ini.',
      });
    }

    const sekarang = new Date();

    // Update record peminjaman — tandai sudah dikembalikan
    await peminjaman.update({
      status:                 'Dikembalikan',
      tanggal_kembali_aktual: sekarang,
      kondisi_saat_kembali,
      catatan:                catatan || peminjaman.catatan,
    });

    // Tentukan kondisi barang berdasarkan kondisi saat dikembalikan
    // Jika dikembalikan dalam kondisi buruk, update kondisi inventaris
    const kondisiBarangBaru = kondisi_saat_kembali === 'Baik' ? 'Baik' : kondisi_saat_kembali;

    // Update inventaris — barang kembali tersedia
    const barang = await Inventaris.findByPk(peminjaman.barang_id);
    await barang.update({
      status_aset:        'Aktif',
      peminjam_id:        null,
      tanggal_peminjaman: null,
      // Update kondisi barang jika berbeda dari kondisi semula
      kondisi:            kondisiBarangBaru,
    });

    // Catat aktivitas pengembalian
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'KEMBALI_BARANG',
      tabelTarget:        'peminjaman_barang',
      idTarget:           peminjaman.id,
      nilaiLama:          { status: 'Approved', kondisi_saat_kembali: null },
      nilaiBaru:          { status: 'Dikembalikan', kondisi_saat_kembali },
      deskripsiPerubahan: `Barang ${barang.nama_barang} dikembalikan oleh ${peminjaman.peminjam.nama}, kondisi: ${kondisi_saat_kembali}.`,
      req,
    });

    return res.status(200).json({
      success: true,
      data: peminjaman,
    });

  } catch (error) {
    console.error('[Peminjaman.return]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses pengembalian barang. Silakan coba beberapa saat lagi.',
    });
  }
}

module.exports = { getAll, create, approve, reject, returnBarang };
