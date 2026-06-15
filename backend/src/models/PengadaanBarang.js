'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PengadaanBarang extends Model {
    /**
     * Definisi asosiasi antar model.
     */
    static associate(models) {
      // Barang yang diadakan masuk ke satu kategori
      PengadaanBarang.belongsTo(models.KategoriBarang, {
        foreignKey: 'kategori_id',
        as: 'kategori',
      });

      // Admin yang menyetujui pengadaan ini
      PengadaanBarang.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver',
      });

      // User yang membuat pengajuan pengadaan
      PengadaanBarang.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator',
      });
    }
  }

  PengadaanBarang.init(
    {
      // ID auto-increment, primary key
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // Nomor Purchase Order — unik per transaksi pengadaan
      nomor_po: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },

      // Nama barang yang dipesan (belum tentu sudah ada di inventaris)
      nama_barang: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      // FK ke kategori_barang
      kategori_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'kategori_barang',
          key: 'id',
        },
      },

      // Jumlah barang yang dipesan
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      // Nama vendor/supplier
      vendor: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      // Harga per satuan barang
      harga_satuan: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },

      // Total harga = qty * harga_satuan (dihitung di controller sebelum save)
      total_harga: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },

      // Tanggal order dikirimkan ke vendor
      tanggal_order: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      // Estimasi tanggal barang tiba
      tanggal_estimasi_tiba: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      // Tanggal aktual barang diterima
      tanggal_terima: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      // Status progress pengadaan
      status: {
        type: DataTypes.ENUM('Draft', 'Approved', 'Ordered', 'Arrived', 'Rejected'),
        allowNull: false,
        defaultValue: 'Draft',
      },

      // FK ke users — siapa yang approve (null = belum diapprove)
      approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      // FK ke users — siapa yang membuat pengajuan ini
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'PengadaanBarang',
      tableName: 'pengadaan_barang',
      // Sesuai plan.md: tabel ini hanya punya created_at
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  return PengadaanBarang;
};
