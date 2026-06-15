'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Ambil DATABASE_URL dari environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL tidak ditemukan di file .env');
}

// Buat instance Sequelize menggunakan connection string
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',

  // Matikan logging query SQL di production agar tidak banjir log
  logging: process.env.NODE_ENV === 'production' ? false : console.log,

  pool: {
    // Jumlah maksimum koneksi di pool
    max: 10,
    // Jumlah minimum koneksi yang selalu aktif
    min: 0,
    // Waktu tunggu sebelum timeout (ms)
    acquire: 30000,
    // Waktu koneksi idle sebelum dilepas (ms)
    idle: 10000,
  },

  define: {
    // Sequelize akan otomatis menggunakan snake_case untuk nama kolom
    underscored: true,
    // Otomatis tambah created_at dan updated_at
    timestamps: true,
  },
});

module.exports = sequelize;
