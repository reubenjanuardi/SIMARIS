'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Buat tabel 'pengadaan_barang'
   * Dependensi: users & kategori_barang harus sudah ada.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pengadaan_barang', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // Nomor Purchase Order — unik per pengadaan
      nomor_po: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },

      nama_barang: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      // FK → kategori_barang.id
      kategori_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'kategori_barang',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      vendor: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      harga_satuan: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },

      // total_harga dihitung di controller: qty * harga_satuan
      total_harga: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },

      tanggal_order: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      tanggal_estimasi_tiba: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      tanggal_terima: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM('Draft', 'Approved', 'Ordered', 'Arrived', 'Rejected'),
        allowNull: false,
        defaultValue: 'Draft',
      },

      // FK → users.id (admin yang approve)
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

      // FK → users.id (user yang membuat pengajuan)
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      // Tabel ini hanya punya created_at (sesuai plan.md schema 4.6)
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  /**
   * DOWN: Hapus tabel 'pengadaan_barang'
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pengadaan_barang');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pengadaan_barang_status";');
  },
};
