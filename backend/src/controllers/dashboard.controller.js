'use strict';

const { Op, fn, col, literal } = require('sequelize');
const {
  Inventaris,
  KategoriBarang,
  PeminjamanBarang,
  MaintenanceBarang,
  ActivityLog,
  User,
}                               = require('../models');

const USER_SAFE_ATTR = ['id', 'nama', 'username', 'departemen', 'role'];

// =============================================================
// GET SUMMARY — Statistik keseluruhan inventaris
// GET /api/dashboard/summary
// Akses: semua role
// =============================================================
async function getSummary(req, res) {
  try {
    // ── 1. Total aset & nilai ──────────────────────────────────
    const total_aset = await Inventaris.count({
      where: { status_aset: { [Op.ne]: 'Dihapus' } },
    });

    const total_nilai_aset = await Inventaris.sum('harga_perolehan', {
      where: { status_aset: { [Op.ne]: 'Dihapus' } },
    });

    // ── 2. Breakdown kondisi ───────────────────────────────────
    const kondisiRows = await Inventaris.findAll({
      attributes: [
        'kondisi',
        [fn('COUNT', col('id')), 'jumlah'],
      ],
      where: { status_aset: { [Op.ne]: 'Dihapus' } },
      group: ['kondisi'],
      raw: true,
    });
    const breakdown_kondisi = {};
    kondisiRows.forEach(r => {
      breakdown_kondisi[r.kondisi] = parseInt(r.jumlah, 10);
    });

    // ── 3. Breakdown status_aset ───────────────────────────────
    const statusRows = await Inventaris.findAll({
      attributes: [
        'status_aset',
        [fn('COUNT', col('id')), 'jumlah'],
      ],
      where: { status_aset: { [Op.ne]: 'Dihapus' } },
      group: ['status_aset'],
      raw: true,
    });
    const breakdown_status = {};
    statusRows.forEach(r => {
      breakdown_status[r.status_aset] = parseInt(r.jumlah, 10);
    });

    // ── 4. Breakdown per kategori ─────────────────────────────
    const kategoriRows = await Inventaris.findAll({
      attributes: [
        'kategori_id',
        [fn('COUNT', col('Inventaris.id')), 'jumlah'],
      ],
      where: { status_aset: { [Op.ne]: 'Dihapus' } },
      include: [{
        model: KategoriBarang,
        as:    'kategori',
        attributes: ['nama_kategori'],
      }],
      group: ['Inventaris.kategori_id', 'kategori.id'],
      raw:  true,
      nest: true,
    });
    const breakdown_kategori = {};
    kategoriRows.forEach(r => {
      const nama = r.kategori ? r.kategori.nama_kategori : 'Tidak Dikategorikan';
      breakdown_kategori[nama] = parseInt(r.jumlah, 10);
    });

    // ── 5. Barang butuh perhatian ─────────────────────────────
    // Kondisi Rusak atau garansi < 30 hari dari sekarang
    const tigaPuluhHari = new Date();
    tigaPuluhHari.setDate(tigaPuluhHari.getDate() + 30);

    const barang_butuh_perhatian = await Inventaris.count({
      where: {
        status_aset: { [Op.ne]: 'Dihapus' },
        [Op.or]: [
          { kondisi: { [Op.in]: ['Rusak', 'Perbaikan', 'Hilang'] } },
          {
            masa_garansi: {
              [Op.and]: [
                { [Op.ne]: null },
                { [Op.lte]: tigaPuluhHari },
              ],
            },
          },
        ],
      },
    });

    // ── 6. Statistik modul peminjaman & maintenance ────────────
    const peminjaman_aktif = await PeminjamanBarang.count({
      where: { status: 'Approved' },
    });

    const peminjaman_pending = await PeminjamanBarang.count({
      where: { status: 'Pending' },
    });

    const maintenance_berjalan = await MaintenanceBarang.count({
      where: { status: 'Dalam Perbaikan' },
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_aset,
          total_nilai_aset:       total_nilai_aset || 0,
          breakdown_kondisi,
          breakdown_status,
          breakdown_kategori,
          barang_butuh_perhatian,
          peminjaman_aktif,
          peminjaman_pending,
          maintenance_berjalan,
        },
      },
    });

  } catch (error) {
    console.error('[Dashboard.getSummary]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data ringkasan dashboard.',
    });
  }
}

// =============================================================
// GET RECENT ACTIVITY — 10 log aktivitas terbaru
// GET /api/dashboard/recent-activity
// Akses: semua role
// =============================================================
async function getRecentActivity(req, res) {
  try {
    const logs = await ActivityLog.findAll({
      include: [{
        model:      User,
        as:         'user',
        attributes: USER_SAFE_ATTR,
        required:   false,
      }],
      order: [['timestamp', 'DESC']],
      limit: 10,
    });

    return res.status(200).json({
      success: true,
      data:    logs,
    });

  } catch (error) {
    console.error('[Dashboard.getRecentActivity]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data aktivitas terbaru.',
    });
  }
}

// =============================================================
// GET ALERT BARANG — Aset yang butuh tindak lanjut segera
// GET /api/dashboard/low-stock
// Tiga kategori alert:
//   1. Barang kondisi Rusak atau Hilang
//   2. Barang dengan masa_garansi dalam 30 hari ke depan
//   3. Maintenance yang sudah > 7 hari berstatus 'Dalam Perbaikan'
// Akses: semua role
// =============================================================
async function getAlertBarang(req, res) {
  try {
    const sekarang      = new Date();
    const tigaPuluhHari = new Date();
    tigaPuluhHari.setDate(tigaPuluhHari.getDate() + 30);
    const tujuhHariLalu = new Date();
    tujuhHariLalu.setDate(tujuhHariLalu.getDate() - 7);

    // ── Alert 1: Barang kondisi Rusak atau Hilang ──────────────
    const barangKondisiKritis = await Inventaris.findAll({
      where: {
        status_aset: { [Op.ne]: 'Dihapus' },
        kondisi:     { [Op.in]: ['Rusak', 'Hilang'] },
      },
      include: [
        { model: KategoriBarang, as: 'kategori', attributes: ['id', 'nama_kategori'] },
        { model: User, as: 'pemilik', attributes: USER_SAFE_ATTR, required: false },
      ],
      order: [['kondisi', 'ASC'], ['nama_barang', 'ASC']],
    });

    // ── Alert 2: Garansi habis atau hampir habis (< 30 hari) ───
    const barangGaransiHampirHabis = await Inventaris.findAll({
      where: {
        status_aset: { [Op.ne]: 'Dihapus' },
        masa_garansi: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.lte]: tigaPuluhHari },
          ],
        },
        // Exclude yang sudah di-alert di kategori kondisi Rusak/Hilang
        kondisi: { [Op.notIn]: ['Rusak', 'Hilang'] },
      },
      include: [
        { model: KategoriBarang, as: 'kategori', attributes: ['id', 'nama_kategori'] },
        { model: User, as: 'pemilik', attributes: USER_SAFE_ATTR, required: false },
      ],
      order: [['masa_garansi', 'ASC']],
    });

    // ── Alert 3: Maintenance yang macet > 7 hari ───────────────
    const maintenanceMacet = await MaintenanceBarang.findAll({
      where: {
        status:             'Dalam Perbaikan',
        tanggal_maintenance: { [Op.lte]: tujuhHariLalu },
      },
      include: [
        {
          model:      Inventaris,
          as:         'barang',
          attributes: ['id', 'kode_inventaris', 'nama_barang', 'lokasi'],
        },
        {
          model:      User,
          as:         'teknisi',
          attributes: USER_SAFE_ATTR,
          required:   false,
        },
      ],
      order: [['tanggal_maintenance', 'ASC']],
    });

    // Tambahkan label jenis alert dan sisa hari garansi ke masing-masing item
    const alertKondisi = barangKondisiKritis.map(item => ({
      ...item.toJSON(),
      jenis_alert: 'kondisi_kritis',
      pesan_alert: `Kondisi barang: ${item.kondisi}`,
    }));

    const alertGaransi = barangGaransiHampirHabis.map(item => {
      const tglGaransi = new Date(item.masa_garansi);
      const sisaHari   = Math.ceil((tglGaransi - sekarang) / (1000 * 60 * 60 * 24));
      return {
        ...item.toJSON(),
        jenis_alert: sisaHari <= 0 ? 'garansi_habis' : 'garansi_hampir_habis',
        pesan_alert: sisaHari <= 0
          ? 'Garansi sudah habis'
          : `Garansi habis dalam ${sisaHari} hari`,
        sisa_hari_garansi: sisaHari,
      };
    });

    const alertMaintenance = maintenanceMacet.map(item => {
      const hariMacet = Math.ceil(
        (sekarang - new Date(item.tanggal_maintenance)) / (1000 * 60 * 60 * 24)
      );
      return {
        ...item.toJSON(),
        jenis_alert: 'maintenance_terlama',
        pesan_alert: `Maintenance sudah berlangsung ${hariMacet} hari tanpa selesai`,
        hari_berlangsung: hariMacet,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        alerts: {
          kondisi_kritis:      alertKondisi,
          garansi_hampir_habis: alertGaransi,
          maintenance_macet:   alertMaintenance,
        },
        total_alerts:
          alertKondisi.length +
          alertGaransi.length +
          alertMaintenance.length,
      },
    });

  } catch (error) {
    console.error('[Dashboard.getAlertBarang]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data alert barang.',
    });
  }
}

module.exports = { getSummary, getRecentActivity, getAlertBarang };
