'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class MaintenanceBarang extends Model {
    /**
     * Definisi asosiasi antar model.
     */
    static associate(models) {
      // Setiap record maintenance merujuk ke satu barang di inventaris
      MaintenanceBarang.belongsTo(models.Inventaris, {
        foreignKey: 'barang_id',
        as: 'barang',
      });

      // Teknisi yang mengerjakan maintenance (bisa null jika belum ditugaskan)
      MaintenanceBarang.belongsTo(models.User, {
        foreignKey: 'teknisi_id',
        as: 'teknisi',
      });
    }
  }

  MaintenanceBarang.init(
    {
      // ID auto-increment, primary key
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // FK ke inventaris — barang mana yang dimaintenance
      barang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'inventaris',
          key: 'id',
        },
      },

      // Kapan maintenance dimulai/dilaporkan
      tanggal_maintenance: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      // Penjelasan detail masalah yang ditemukan
      deskripsi_masalah: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      // FK ke users — teknisi yang ditugaskan (null = belum ditugaskan)
      teknisi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      // Biaya yang dibutuhkan untuk perbaikan
      biaya_perbaikan: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },

      // Kapan maintenance selesai dikerjakan (null = belum selesai)
      tanggal_selesai: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Status progress pengerjaan maintenance
      status: {
        type: DataTypes.ENUM('Diajukan', 'Dalam Perbaikan', 'Selesai', 'Batal'),
        allowNull: false,
        defaultValue: 'Diajukan',
      },

      // Foto kondisi barang sebelum diperbaiki (path/URL)
      foto_sebelum: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      // Foto kondisi barang setelah diperbaiki (path/URL)
      foto_sesudah: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'MaintenanceBarang',
      tableName: 'maintenance_barang',
      // Sesuai plan.md: tabel ini hanya punya created_at
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  return MaintenanceBarang;
};
