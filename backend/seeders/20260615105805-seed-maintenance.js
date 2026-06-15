'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Insert 2 record maintenance sesuai plan.md section 8.
   *
   * Mapping ID:
   *   Users      → staff1=2
   *   Inventaris → Printer HP=2, Kursi Ergonomis=4
   */
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Maintenance Printer dimulai 5 hari lalu
    const limaHariLalu = new Date(now);
    limaHariLalu.setDate(limaHariLalu.getDate() - 5);

    // Maintenance Kursi dimulai 10 hari lalu, selesai 8 hari lalu
    const sepuluhHariLalu = new Date(now);
    sepuluhHariLalu.setDate(sepuluhHariLalu.getDate() - 10);

    const delapanHariLalu = new Date(now);
    delapanHariLalu.setDate(delapanHariLalu.getDate() - 8);

    await queryInterface.bulkInsert('maintenance_barang', [
      {
        // MT-001: Printer HP — cartridge macet, sedang dikerjakan staff1
        // Sesuai dengan inventaris item 2 yang kondisi='Perbaikan', status_aset='Dalam Perbaikan'
        barang_id:         2, // Printer HP LaserJet
        tanggal_maintenance: limaHariLalu,
        deskripsi_masalah: 'Cartridge tersumbat dan tidak dapat menarik kertas dengan baik. Roll kertas aus sehingga kertas sering macet (paper jam) di tengah proses cetak.',
        teknisi_id:        2, // staff1
        biaya_perbaikan:   null, // Belum dihitung karena masih dikerjakan
        tanggal_selesai:   null, // Belum selesai
        status:            'Dalam Perbaikan',
        foto_sebelum:      null,
        foto_sesudah:      null,
        created_at:        limaHariLalu,
      },
      {
        // MT-002: Kursi Ergonomis — ganti roda, sudah Selesai
        barang_id:         4, // Kursi Ergonomis
        tanggal_maintenance: sepuluhHariLalu,
        deskripsi_masalah: 'Dua dari lima roda kursi patah sehingga kursi tidak stabil dan berbahaya digunakan. Perlu penggantian seluruh set roda.',
        teknisi_id:        2, // staff1
        biaya_perbaikan:   150000, // Rp 150.000 untuk set roda baru
        tanggal_selesai:   delapanHariLalu, // Selesai dalam 2 hari
        status:            'Selesai',
        foto_sebelum:      null,
        foto_sesudah:      null,
        created_at:        sepuluhHariLalu,
      },
    ]);
  },

  /**
   * DOWN: Hapus semua maintenance seed.
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('maintenance_barang', {
      barang_id: [2, 4],
    });
  },
};
