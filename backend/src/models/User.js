'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    /**
     * Definisi asosiasi antar model.
     * Dipanggil dari index.js setelah semua model diload.
     */
    static associate(models) {
      // Satu user bisa memiliki banyak barang sebagai pemilik/PIC
      User.hasMany(models.Inventaris, {
        foreignKey: 'pemilik_id',
        as: 'barang_dimiliki',
      });

      // Satu user bisa sedang meminjam banyak barang
      User.hasMany(models.Inventaris, {
        foreignKey: 'peminjam_id',
        as: 'barang_dipinjam',
      });

      // Satu user bisa punya banyak riwayat peminjaman
      User.hasMany(models.PeminjamanBarang, {
        foreignKey: 'peminjam_id',
        as: 'riwayat_peminjaman',
      });

      // Satu user bisa punya banyak activity log
      User.hasMany(models.ActivityLog, {
        foreignKey: 'user_id',
        as: 'activity_logs',
      });
    }

    /**
     * Override toJSON agar field 'password' tidak pernah
     * ikut keluar saat data user dikonversi ke JSON response API.
     * Ini penting untuk keamanan — password hash tidak boleh bocor.
     */
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init(
    {
      // ID auto-increment, primary key
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // Username unik untuk login
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      // Password yang sudah di-hash dengan bcrypt
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      // Nama lengkap user
      nama: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      // Email user (opsional, tapi sebaiknya diisi)
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      // Departemen/divisi tempat user bekerja
      departemen: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      // Role user: admin punya akses penuh, staff terbatas, viewer hanya baca
      role: {
        type: DataTypes.ENUM('admin', 'staff', 'viewer'),
        allowNull: false,
        defaultValue: 'staff',
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      // created_at & updated_at otomatis ditangani Sequelize
      timestamps: true,
      underscored: true, // konversi camelCase ke snake_case otomatis
    }
  );

  return User;
};
