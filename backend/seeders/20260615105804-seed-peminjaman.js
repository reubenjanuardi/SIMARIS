'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Insert 3 record peminjaman sesuai plan.md section 8.
   *
   * Mapping ID:
   *   Users      → admin1=1, staff1=2, viewer1=3
   *   Inventaris → item ke-5 (Proyektor)=5, item ke-6 (Whiteboard)=6, item ke-8 (Monitor)=8
   */
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Hitung variasi tanggal untuk data yang realistis
    const kemarin = new Date(now);
    kemarin.setDate(kemarin.getDate() - 1);

    const tigaHariLalu = new Date(now);
    tigaHariLalu.setDate(tigaHariLalu.getDate() - 3);

    const semingguLalu = new Date(now);
    semingguLalu.setDate(semingguLalu.getDate() - 7);

    const rencanaTiga = new Date(now);
    rencanaTiga.setDate(rencanaTiga.getDate() + 3);

    const rencanaMinggu = new Date(now);
    rencanaMinggu.setDate(rencanaMinggu.getDate() + 7);

    const rencanaLimaBelas = new Date(now);
    rencanaLimaBelas.setDate(rencanaLimaBelas.getDate() + 15);

    await queryInterface.bulkInsert('peminjaman_barang', [
      {
        // PJ-001: staff1 meminjam Proyektor, sudah Approved oleh admin1
        // Sesuai dengan inventaris item 5 yang status_aset = 'Dipinjam'
        barang_id:              5, // Proyektor Epson EB-X51
        peminjam_id:            2, // staff1
        tanggal_peminjaman:     tigaHariLalu,
        tanggal_rencana_kembali: rencanaTiga,
        tanggal_kembali_aktual: null,
        kondisi_saat_kembali:   null,
        status:                 'Approved',
        approved_by:            1, // admin1
        catatan:                'Peminjaman untuk presentasi evaluasi vendor minggu ini.',
        created_at:             tigaHariLalu,
      },
      {
        // PJ-002: viewer1 request pinjam Monitor, masih Pending menunggu approval admin
        barang_id:              8, // Monitor LG 27"
        peminjam_id:            3, // viewer1
        tanggal_peminjaman:     now,
        tanggal_rencana_kembali: rencanaLimaBelas,
        tanggal_kembali_aktual: null,
        kondisi_saat_kembali:   null,
        status:                 'Pending',
        approved_by:            null, // Belum diapprove
        catatan:                'Dibutuhkan untuk kebutuhan audit keuangan bulan Juni.',
        created_at:             now,
      },
      {
        // PJ-003: staff1 pinjam Whiteboard — sudah Dikembalikan kemarin
        barang_id:              6, // Whiteboard 120x240
        peminjam_id:            2, // staff1
        tanggal_peminjaman:     semingguLalu,
        tanggal_rencana_kembali: kemarin,
        tanggal_kembali_aktual: kemarin, // Sudah dikembalikan tepat waktu
        kondisi_saat_kembali:   'Baik',
        status:                 'Dikembalikan',
        approved_by:            1, // admin1
        catatan:                'Digunakan untuk sesi brainstorming tim operasional. Dikembalikan dalam kondisi baik.',
        created_at:             semingguLalu,
      },
    ]);
  },

  /**
   * DOWN: Hapus semua peminjaman seed.
   * Gunakan kombinasi barang_id + peminjam_id agar tidak hapus data lain.
   */
  async down(queryInterface, Sequelize) {
    const { Op } = require('sequelize');
    await queryInterface.bulkDelete('peminjaman_barang', {
      barang_id: [5, 6, 8],
    });
  },
};
