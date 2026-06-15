'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Buat tabel 'inventaris'
   * Dependensi: users (pemilik_id, peminjam_id) & kategori_barang (kategori_id)
   * harus sudah ada sebelum migration ini dijalankan.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventaris', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // Kode unik format INV-YYYY-XXX
      kode_inventaris: {
        type: Sequelize.STRING(20),
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
        onDelete: 'RESTRICT', // Jangan hapus kategori jika masih ada barang
      },

      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      kondisi: {
        type: Sequelize.ENUM('Baik', 'Rusak', 'Perbaikan', 'Hilang'),
        allowNull: false,
        defaultValue: 'Baik',
      },

      lokasi: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      // FK → users.id (PIC / pemilik barang)
      pemilik_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Jika user dihapus, set pemilik_id jadi null
      },

      // FK → users.id (user yang sedang meminjam)
      peminjam_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      tanggal_peminjaman: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      harga_perolehan: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0,
      },

      tanggal_masuk: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      no_seri: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      masa_garansi: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      catatan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      foto_barang: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      status_aset: {
        type: Sequelize.ENUM('Aktif', 'Dipinjam', 'Dalam Perbaikan', 'Dihapus'),
        allowNull: false,
        defaultValue: 'Aktif',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  /**
   * DOWN: Hapus tabel 'inventaris' beserta ENUM types-nya
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('inventaris');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inventaris_kondisi";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inventaris_status_aset";');
  },
};
