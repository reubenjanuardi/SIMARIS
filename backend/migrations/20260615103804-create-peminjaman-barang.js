'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Buat tabel 'peminjaman_barang'
   * Dependensi: users & inventaris harus sudah ada.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('peminjaman_barang', {
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
        onDelete: 'RESTRICT', // Jangan hapus barang jika masih ada riwayat peminjaman
      },

      // FK → users.id (peminjam)
      peminjam_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      tanggal_peminjaman: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      tanggal_rencana_kembali: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      // Diisi saat barang dikembalikan
      tanggal_kembali_aktual: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      // Catatan kondisi saat pengembalian
      kondisi_saat_kembali: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected', 'Dikembalikan'),
        allowNull: false,
        defaultValue: 'Pending',
      },

      // FK → users.id (admin yang approve/reject)
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

      // Tabel ini hanya punya created_at (sesuai plan.md schema 4.4)
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  /**
   * DOWN: Hapus tabel 'peminjaman_barang'
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('peminjaman_barang');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_peminjaman_barang_status";');
  },
};
