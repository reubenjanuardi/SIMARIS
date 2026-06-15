'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Inventaris extends Model {
    /**
     * Definisi asosiasi antar model.
     */
    static associate(models) {
      // Setiap barang masuk ke satu kategori
      Inventaris.belongsTo(models.KategoriBarang, {
        foreignKey: 'kategori_id',
        as: 'kategori',
      });

      // PIC / pemilik bertanggung jawab barang ini
      Inventaris.belongsTo(models.User, {
        foreignKey: 'pemilik_id',
        as: 'pemilik',
      });

      // User yang sedang aktif meminjam barang ini
      Inventaris.belongsTo(models.User, {
        foreignKey: 'peminjam_id',
        as: 'peminjam',
      });

      // Satu barang bisa punya banyak riwayat peminjaman
      Inventaris.hasMany(models.PeminjamanBarang, {
        foreignKey: 'barang_id',
        as: 'riwayat_peminjaman',
      });

      // Satu barang bisa punya banyak riwayat maintenance
      Inventaris.hasMany(models.MaintenanceBarang, {
        foreignKey: 'barang_id',
        as: 'riwayat_maintenance',
      });

      // Satu barang bisa dihapus/dipensiunkan
      Inventaris.hasMany(models.PenghapusanAset, {
        foreignKey: 'barang_id',
        as: 'riwayat_penghapusan',
      });
    }
  }

  Inventaris.init(
    {
      // ID auto-increment, primary key
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // Kode unik barang, format: INV-YYYY-XXX (contoh: INV-2026-001)
      kode_inventaris: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },

      // Nama deskriptif barang
      nama_barang: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      // FK ke tabel kategori_barang
      kategori_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'kategori_barang',
          key: 'id',
        },
      },

      // Deskripsi lebih lengkap tentang barang
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Kondisi fisik barang saat ini
      kondisi: {
        type: DataTypes.ENUM('Baik', 'Rusak', 'Perbaikan', 'Hilang'),
        allowNull: false,
        defaultValue: 'Baik',
      },

      // Lokasi fisik barang (ruangan, lantai, gedung)
      lokasi: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      // FK ke users — siapa PIC / pemilik barang ini
      pemilik_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      // FK ke users — siapa yang sedang meminjam (null = tidak dipinjam)
      peminjam_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      // Waktu mulai dipinjam (null = tidak sedang dipinjam)
      tanggal_peminjaman: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Harga beli / harga perolehan barang
      harga_perolehan: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0,
      },

      // Tanggal barang masuk ke inventaris
      tanggal_masuk: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      // Nomor seri / serial number barang (opsional)
      no_seri: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      // Tanggal berakhirnya masa garansi
      masa_garansi: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      // Catatan tambahan tentang barang
      catatan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Path atau URL S3 untuk foto barang
      foto_barang: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      // Status ketersediaan barang untuk manajemen aset
      status_aset: {
        type: DataTypes.ENUM('Aktif', 'Dipinjam', 'Dalam Perbaikan', 'Dihapus'),
        allowNull: false,
        defaultValue: 'Aktif',
      },
    },
    {
      sequelize,
      modelName: 'Inventaris',
      tableName: 'inventaris',
      timestamps: true,
      underscored: true,
    }
  );

  return Inventaris;
};
