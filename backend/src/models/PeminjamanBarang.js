'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PeminjamanBarang extends Model {
    /**
     * Definisi asosiasi antar model.
     */
    static associate(models) {
      // Setiap record peminjaman merujuk ke satu barang di inventaris
      PeminjamanBarang.belongsTo(models.Inventaris, {
        foreignKey: 'barang_id',
        as: 'barang',
      });

      // User yang mengajukan/melakukan peminjaman
      PeminjamanBarang.belongsTo(models.User, {
        foreignKey: 'peminjam_id',
        as: 'peminjam',
      });

      // Admin yang menyetujui atau menolak peminjaman
      PeminjamanBarang.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver',
      });
    }
  }

  PeminjamanBarang.init(
    {
      // ID auto-increment, primary key
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // FK ke inventaris — barang mana yang dipinjam
      barang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'inventaris',
          key: 'id',
        },
      },

      // FK ke users — siapa yang meminjam
      peminjam_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      // Kapan barang mulai dipinjam
      tanggal_peminjaman: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      // Kapan rencana barang akan dikembalikan
      tanggal_rencana_kembali: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      // Kapan barang benar-benar dikembalikan (null = belum dikembalikan)
      tanggal_kembali_aktual: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Catatan kondisi barang saat dikembalikan
      kondisi_saat_kembali: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      // Status alur peminjaman
      status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Dikembalikan'),
        allowNull: false,
        defaultValue: 'Pending',
      },

      // FK ke users — admin yang approve/reject (null = belum diproses)
      approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      // Catatan tambahan dari peminjam atau admin
      catatan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'PeminjamanBarang',
      tableName: 'peminjaman_barang',
      // Sesuai plan.md: tabel ini hanya punya created_at, tidak ada updated_at
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  return PeminjamanBarang;
};
