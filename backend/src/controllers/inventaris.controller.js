'use strict';

const { Op }          = require('sequelize');
const {
  Inventaris,
  KategoriBarang,
  User,
  ActivityLog,
}                     = require('../models');
const { logActivity } = require('../utils/activityLogger');

// Atribut User yang aman ditampilkan (tanpa password, tanpa timestamp sensitif)
const USER_SAFE_ATTRIBUTES = ['id', 'nama', 'username', 'departemen', 'role'];

// =============================================================
// GET ALL — List inventaris dengan filter & pagination
// GET /api/inventaris
// Akses: semua role
// =============================================================
async function getAll(req, res) {
  try {
    // Ambil query params, berikan default yang wajar
    const {
      kategori_id,
      kondisi,
      status_aset,
      search,
      page  = 1,
      limit = 10,
    } = req.query;

    // Bangun klausa WHERE secara dinamis berdasarkan filter yang dikirim
    const whereClause = {};

    // Filter by kategori
    if (kategori_id) {
      whereClause.kategori_id = parseInt(kategori_id, 10);
    }

    // Filter by kondisi barang (Baik, Rusak, Perbaikan, Hilang)
    if (kondisi) {
      whereClause.kondisi = kondisi;
    }

    // Filter by status aset (Aktif, Dipinjam, Dalam Perbaikan, Dihapus)
    if (status_aset) {
      whereClause.status_aset = status_aset;
    }

    // Pencarian teks bebas di 3 kolom sekaligus
    if (search) {
      whereClause[Op.or] = [
        { nama_barang:      { [Op.iLike]: `%${search}%` } },
        { kode_inventaris:  { [Op.iLike]: `%${search}%` } },
        { lokasi:           { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Hitung offset untuk pagination
    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // max 100 per halaman
    const offset   = (pageNum - 1) * limitNum;

    // Query ke DB dengan include asosiasi dan pagination
    const { count, rows } = await Inventaris.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: KategoriBarang,
          as:    'kategori',
          // Hanya ambil field yang perlu ditampilkan di list view
          attributes: ['id', 'nama_kategori'],
        },
        {
          model:      User,
          as:         'pemilik',
          attributes: USER_SAFE_ATTRIBUTES,
        },
        {
          model:      User,
          as:         'peminjam',
          attributes: USER_SAFE_ATTRIBUTES,
        },
      ],
      // Urutkan dari yang terbaru ditambahkan
      order:  [['created_at', 'DESC']],
      limit:  limitNum,
      offset,
      // Hindari duplikat baris akibat JOIN (penting saat pakai include + limit)
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
    console.error('[Inventaris.getAll]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data inventaris. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// GET BY ID — Detail satu barang + riwayat aktivitas
// GET /api/inventaris/:id
// Akses: semua role
// =============================================================
async function getById(req, res) {
  try {
    const { id } = req.params;

    // Ambil barang lengkap beserta semua asosiasi
    const inventaris = await Inventaris.findByPk(id, {
      include: [
        {
          model:      KategoriBarang,
          as:         'kategori',
          attributes: ['id', 'nama_kategori', 'deskripsi'],
        },
        {
          model:      User,
          as:         'pemilik',
          attributes: USER_SAFE_ATTRIBUTES,
        },
        {
          model:      User,
          as:         'peminjam',
          attributes: USER_SAFE_ATTRIBUTES,
        },
      ],
    });

    // Barang tidak ditemukan
    if (!inventaris) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan.',
      });
    }

    // Ambil 10 activity_log terbaru yang berkaitan dengan barang ini
    // Filter: tabel_target='inventaris' DAN id_target=id barang ini
    const activityHistory = await ActivityLog.findAll({
      where: {
        tabel_target: 'inventaris',
        id_target:    parseInt(id, 10),
      },
      include: [
        {
          model:      User,
          as:         'user',
          attributes: USER_SAFE_ATTRIBUTES,
        },
      ],
      order: [['timestamp', 'DESC']],
      limit: 10,
    });

    return res.status(200).json({
      success: true,
      data: {
        inventaris,
        activityHistory,
      },
    });

  } catch (error) {
    console.error('[Inventaris.getById]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail barang. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// CREATE — Tambah barang baru ke inventaris
// POST /api/inventaris
// Akses: admin, staff
// =============================================================
async function create(req, res) {
  try {
    const {
      kode_inventaris,
      nama_barang,
      kategori_id,
      deskripsi,
      kondisi,
      lokasi,
      pemilik_id,
      harga_perolehan,
      tanggal_masuk,
      no_seri,
      masa_garansi,
      catatan,
      status_aset,
    } = req.body;

    // --- Validasi field wajib ---
    if (!kode_inventaris || !nama_barang || !kategori_id || !lokasi || !harga_perolehan || !tanggal_masuk) {
      return res.status(400).json({
        success: false,
        message: 'Field kode_inventaris, nama_barang, kategori_id, lokasi, harga_perolehan, dan tanggal_masuk wajib diisi.',
      });
    }

    // --- Cek apakah kode_inventaris sudah dipakai ---
    const kodeExist = await Inventaris.findOne({ where: { kode_inventaris } });
    if (kodeExist) {
      return res.status(409).json({
        success: false,
        message: `Kode inventaris '${kode_inventaris}' sudah digunakan. Gunakan kode yang berbeda.`,
      });
    }

    // --- Cek apakah kategori_id valid ---
    const kategoriExist = await KategoriBarang.findByPk(kategori_id);
    if (!kategoriExist) {
      return res.status(400).json({
        success: false,
        message: 'Kategori tidak ditemukan. Pastikan kategori_id valid.',
      });
    }

    // --- Simpan barang baru ke database ---
    const barangBaru = await Inventaris.create({
      kode_inventaris,
      nama_barang,
      kategori_id,
      deskripsi:       deskripsi       || null,
      kondisi:         kondisi         || 'Baik',
      lokasi,
      pemilik_id:      pemilik_id      || null,
      harga_perolehan,
      tanggal_masuk,
      no_seri:         no_seri         || null,
      masa_garansi:    masa_garansi    || null,
      catatan:         catatan         || null,
      status_aset:     status_aset     || 'Aktif',
    });

    // --- Catat aktivitas penambahan barang ---
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'TAMBAH_BARANG',
      tabelTarget:        'inventaris',
      idTarget:           barangBaru.id,
      nilaiLama:          null,
      nilaiBaru: {
        kode_inventaris:  barangBaru.kode_inventaris,
        nama_barang:      barangBaru.nama_barang,
        kategori_id:      barangBaru.kategori_id,
        kondisi:          barangBaru.kondisi,
        status_aset:      barangBaru.status_aset,
        lokasi:           barangBaru.lokasi,
        harga_perolehan:  barangBaru.harga_perolehan,
      },
      deskripsiPerubahan: `Barang ${nama_barang} (${kode_inventaris}) ditambahkan ke inventaris.`,
      req,
    });

    return res.status(201).json({
      success: true,
      data: barangBaru,
    });

  } catch (error) {
    console.error('[Inventaris.create]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan barang. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// UPDATE — Edit data barang (partial update)
// PUT /api/inventaris/:id
// Akses: admin, staff
// =============================================================
async function update(req, res) {
  try {
    const { id } = req.params;

    // Ambil data barang yang akan diupdate — simpan sebagai snapshot nilaiLama
    const barang = await Inventaris.findByPk(id);
    if (!barang) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan.',
      });
    }

    // Simpan snapshot data lama SEBELUM diubah (untuk audit log)
    const nilaiLama = {
      nama_barang:  barang.nama_barang,
      kondisi:      barang.kondisi,
      lokasi:       barang.lokasi,
      status_aset:  barang.status_aset,
      kategori_id:  barang.kategori_id,
      pemilik_id:   barang.pemilik_id,
      deskripsi:    barang.deskripsi,
      catatan:      barang.catatan,
    };

    // Deteksi perubahan spesifik untuk menentukan tipe log yang paling tepat
    // Prioritas: UBAH_LOKASI dan UBAH_KONDISI lebih spesifik dari UBAH_BARANG
    const lokasiберubah  = req.body.lokasi  !== undefined && req.body.lokasi  !== barang.lokasi;
    const kondisiBerubah = req.body.kondisi !== undefined && req.body.kondisi !== barang.kondisi;

    // Tentukan tipe log berdasarkan apa yang berubah
    let tipeLog        = 'UBAH_BARANG';
    let deskripsiLog   = `Data barang ${barang.nama_barang} (${barang.kode_inventaris}) diperbarui.`;

    if (lokasiберubah && !kondisiBerubah) {
      // Hanya lokasi yang berubah
      tipeLog      = 'UBAH_LOKASI';
      deskripsiLog = `Lokasi ${barang.nama_barang} diubah dari '${barang.lokasi}' ke '${req.body.lokasi}'.`;
    } else if (kondisiBerubah && !lokasiберubah) {
      // Hanya kondisi yang berubah
      tipeLog      = 'UBAH_KONDISI';
      deskripsiLog = `Kondisi ${barang.nama_barang} diubah dari '${barang.kondisi}' ke '${req.body.kondisi}'.`;
    } else if (lokasiберubah && kondisiBerubah) {
      // Keduanya berubah — gunakan UBAH_BARANG dengan deskripsi lengkap
      deskripsiLog = `Data barang ${barang.nama_barang} diperbarui: lokasi dari '${barang.lokasi}' ke '${req.body.lokasi}', kondisi dari '${barang.kondisi}' ke '${req.body.kondisi}'.`;
    }

    // Lakukan update — hanya field yang ada di req.body yang diupdate (partial update)
    // Field yang tidak dikirim tidak akan berubah
    const fieldsYangBolehDiupdate = [
      'nama_barang', 'kategori_id', 'deskripsi', 'kondisi',
      'lokasi', 'pemilik_id', 'harga_perolehan', 'tanggal_masuk',
      'no_seri', 'masa_garansi', 'catatan', 'foto_barang', 'status_aset',
    ];

    const updatePayload = {};
    fieldsYangBolehDiupdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        updatePayload[field] = req.body[field];
      }
    });

    // Terapkan perubahan ke database
    await barang.update(updatePayload);

    // Snapshot data baru SESUDAH diupdate (untuk audit log)
    const nilaiBaru = {
      nama_barang:  barang.nama_barang,
      kondisi:      barang.kondisi,
      lokasi:       barang.lokasi,
      status_aset:  barang.status_aset,
      kategori_id:  barang.kategori_id,
      pemilik_id:   barang.pemilik_id,
      deskripsi:    barang.deskripsi,
      catatan:      barang.catatan,
    };

    // --- Catat aktivitas update ---
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      tipeLog,
      tabelTarget:        'inventaris',
      idTarget:           barang.id,
      nilaiLama,
      nilaiBaru,
      deskripsiPerubahan: deskripsiLog,
      req,
    });

    return res.status(200).json({
      success: true,
      data: barang,
    });

  } catch (error) {
    console.error('[Inventaris.update]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data barang. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// DESTROY — Soft delete barang (ubah status_aset = 'Dihapus')
// DELETE /api/inventaris/:id
// Akses: admin only
// =============================================================
async function destroy(req, res) {
  try {
    const { id } = req.params;

    // Cari barang yang akan dihapus
    const barang = await Inventaris.findByPk(id);
    if (!barang) {
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan.',
      });
    }

    // Cegah penghapusan barang yang sedang dipinjam
    if (barang.status_aset === 'Dipinjam') {
      return res.status(400).json({
        success: false,
        message: `Barang '${barang.nama_barang}' tidak dapat dihapus karena sedang dipinjam. Selesaikan peminjaman terlebih dahulu.`,
      });
    }

    // Cegah penghapusan ganda
    if (barang.status_aset === 'Dihapus') {
      return res.status(400).json({
        success: false,
        message: 'Barang ini sudah dihapus sebelumnya.',
      });
    }

    // Soft delete: TIDAK hapus record dari DB, hanya ubah status_aset
    // Ini penting agar riwayat peminjaman & maintenance tetap dapat diakses
    await barang.update({ status_aset: 'Dihapus' });

    // --- Catat aktivitas penghapusan ---
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'HAPUS_BARANG',
      tabelTarget:        'inventaris',
      idTarget:           barang.id,
      nilaiLama:          { status_aset: 'Aktif' },
      nilaiBaru:          { status_aset: 'Dihapus' },
      deskripsiPerubahan: `Barang ${barang.nama_barang} (${barang.kode_inventaris}) dihapus dari sistem (soft delete).`,
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Barang '${barang.nama_barang}' berhasil dihapus dari sistem.`,
    });

  } catch (error) {
    console.error('[Inventaris.destroy]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus barang. Silakan coba beberapa saat lagi.',
    });
  }
}

module.exports = { getAll, getById, create, update, destroy };
