'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Buat tabel 'penghapusan_aset'
   * Dependensi: users & inventaris harus sudah ada.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('penghapusan_aset', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // FK → inventaris.id
      barang_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inventaris',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Jaga integritas: jangan hapus barang jika ada record penghapusan
      },

      alasan_penghapusan: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      tanggal_penghapusan: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      // Nilai sisa aset saat dihapus (untuk keperluan akuntansi/laporan)
      nilai_sisa: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },

      // FK → users.id (admin yang approve penghapusan)
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      catatan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // Tabel ini hanya punya created_at (sesuai plan.md schema 4.7)
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  /**
   * DOWN: Hapus tabel 'penghapusan_aset'
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('penghapusan_aset');
  },
};
