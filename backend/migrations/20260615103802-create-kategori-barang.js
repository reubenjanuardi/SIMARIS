'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Buat tabel 'kategori_barang'
   * Tabel master kategori — harus ada sebelum tabel inventaris & pengadaan.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('kategori_barang', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      nama_kategori: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },

      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // Tabel kategori tidak pakai timestamps (sesuai model KategoriBarang.js)
    });
  },

  /**
   * DOWN: Hapus tabel 'kategori_barang'
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('kategori_barang');
  },
};
