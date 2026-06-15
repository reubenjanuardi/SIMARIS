'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ActivityLog extends Model {
    /**
     * Definisi asosiasi antar model.
     */
    static associate(models) {
      // Setiap log aktivitas dikaitkan dengan satu user (bisa null untuk log sistem)
      ActivityLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }

  ActivityLog.init(
    {
      // ID auto-increment, primary key
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // FK ke users — siapa yang melakukan aksi (null jika log otomatis sistem)
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      // Tipe aktivitas dalam format UPPER_SNAKE_CASE sesuai plan.md
      // Contoh: LOGIN, TAMBAH_BARANG, PINJAM_BARANG_REQUEST, dll.
      tipe_aktivitas: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      // Nama tabel yang terdampak oleh aksi ini
      tabel_target: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      // ID record spesifik yang terdampak
      id_target: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      // Snapshot data SEBELUM perubahan (PostgreSQL JSONB untuk query yang efisien)
      nilai_lama: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      // Snapshot data SESUDAH perubahan
      nilai_baru: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      // Penjelasan singkat dalam Bahasa Indonesia tentang apa yang terjadi
      deskripsi_perubahan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      // IP address user yang melakukan aksi (IPv4 atau IPv6)
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },

      // Instance EC2 mana yang memproses request ini — KUNCI untuk demo load balancer
      instance_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      // Waktu kejadian — default NOW() dari database
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'ActivityLog',
      tableName: 'activity_log',
      // Tabel ini tidak pakai created_at/updated_at Sequelize standar
      // karena kita pakai kolom 'timestamp' sendiri
      timestamps: false,
      underscored: true,
    }
  );

  return ActivityLog;
};
