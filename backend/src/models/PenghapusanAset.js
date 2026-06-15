'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PenghapusanAset extends Model {
    /**
     * Definisi asosiasi antar model.
     */
    static associate(models) {
      // Setiap penghapusan merujuk ke satu barang di inventaris
      PenghapusanAset.belongsTo(models.Inventaris, {
        foreignKey: 'barang_id',
        as: 'barang',
      });

      // Admin yang menyetujui penghapusan aset
      PenghapusanAset.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver',
      });
    }
  }

  PenghapusanAset.init(
    {
      // ID auto-increment, primary key
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // FK ke inventaris — barang mana yang akan dihapus
      barang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'inventaris',
          key: 'id',
        },
      },

      // Alasan mengapa barang ini dihapus dari inventaris
      alasan_penghapusan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      // Tanggal resmi penghapusan aset dari daftar inventaris
      tanggal_penghapusan: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      // Nilai sisa barang saat dihapus (untuk keperluan akuntansi)
      nilai_sisa: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },

      // FK ke users — admin yang menyetujui penghapusan
      approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      // Catatan tambahan tentang proses penghapusan
      catatan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'PenghapusanAset',
      tableName: 'penghapusan_aset',
      // Sesuai plan.md: tabel ini hanya punya created_at
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  return PenghapusanAset;
};
