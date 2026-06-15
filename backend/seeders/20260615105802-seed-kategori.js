'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Insert 4 kategori barang sesuai plan.md section 8.
   * Tabel kategori_barang tidak pakai timestamps (timestamps: false di model).
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('kategori_barang', [
      {
        // Kategori 1: Elektronik
        nama_kategori: 'Elektronik',
        deskripsi:
          'Perangkat elektronik kantor seperti laptop, komputer, printer, monitor, dan aksesoris elektronik lainnya.',
      },
      {
        // Kategori 2: Furnitur
        nama_kategori: 'Furnitur',
        deskripsi:
          'Perabot kantor seperti meja, kursi, lemari, rak buku, dan furnitur pendukung aktivitas kerja.',
      },
      {
        // Kategori 3: Supplies
        nama_kategori: 'Supplies',
        deskripsi:
          'Perlengkapan habis pakai seperti kertas, tinta printer, alat tulis, dan kebutuhan operasional harian.',
      },
      {
        // Kategori 4: Meeting Equipment
        nama_kategori: 'Meeting Equipment',
        deskripsi:
          'Peralatan untuk keperluan rapat dan presentasi seperti proyektor, layar, whiteboard, dan sistem audio.',
      },
    ]);
  },

  /**
   * DOWN: Hapus semua kategori seed.
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('kategori_barang', {
      nama_kategori: ['Elektronik', 'Furnitur', 'Supplies', 'Meeting Equipment'],
    });
  },
};
