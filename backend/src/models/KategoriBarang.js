'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class KategoriBarang extends Model {
    /**
     * Definisi asosiasi antar model.
     */
    static associate(models) {
      // Satu kategori bisa memiliki banyak item inventaris
      KategoriBarang.hasMany(models.Inventaris, {
        foreignKey: 'kategori_id',
        as: 'inventaris',
      });

      // Satu kategori bisa ada di banyak pengadaan
      KategoriBarang.hasMany(models.PengadaanBarang, {
        foreignKey: 'kategori_id',
        as: 'pengadaan',
      });
    }
  }

  KategoriBarang.init(
    {
      // ID auto-increment, primary key
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // Nama kategori: Elektronik, Furnitur, Supplies, Meeting Equipment
      nama_kategori: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      // Deskripsi opsional tentang kategori ini
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'KategoriBarang',
      tableName: 'kategori_barang',
      // Tabel ini tidak butuh updated_at, cukup created_at
      timestamps: false,
      underscored: true,
    }
  );

  return KategoriBarang;
};
