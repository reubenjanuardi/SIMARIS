'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Buat tabel 'maintenance_barang'
   * Dependensi: users & inventaris harus sudah ada.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('maintenance_barang', {
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
        onDelete: 'RESTRICT',
      },

      tanggal_maintenance: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      deskripsi_masalah: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      // FK → users.id (teknisi yang ditugaskan)
      teknisi_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      biaya_perbaikan: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },

      // Diisi saat maintenance selesai
      tanggal_selesai: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM('Diajukan', 'Dalam Perbaikan', 'Selesai', 'Batal'),
        allowNull: false,
        defaultValue: 'Diajukan',
      },

      // Dokumentasi foto kondisi barang (path/URL)
      foto_sebelum: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      foto_sesudah: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      // Tabel ini hanya punya created_at (sesuai plan.md schema 4.5)
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  /**
   * DOWN: Hapus tabel 'maintenance_barang'
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('maintenance_barang');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_maintenance_barang_status";');
  },
};
