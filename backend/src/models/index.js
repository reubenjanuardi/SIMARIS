'use strict';

/**
 * index.js — Barrel file untuk semua Sequelize models.
 *
 * File ini bertugas:
 * 1. Import instance Sequelize yang sudah terkonfigurasi
 * 2. Load semua model satu per satu
 * 3. Jalankan static associate() pada setiap model yang memilikinya
 * 4. Export semua model dan instance sequelize agar bisa dipakai di seluruh aplikasi
 *
 * Cara pakai di controller:
 *   const { Inventaris, User, KategoriBarang } = require('../models');
 */

const sequelize = require('../config/database');

// =============================================================
// LOAD SEMUA MODEL
// Urutan load tidak harus mengikuti urutan dependency karena
// associations baru dijalankan di langkah ketiga di bawah.
// =============================================================
const User            = require('./User')(sequelize);
const KategoriBarang  = require('./KategoriBarang')(sequelize);
const Inventaris      = require('./Inventaris')(sequelize);
const PeminjamanBarang  = require('./PeminjamanBarang')(sequelize);
const MaintenanceBarang = require('./MaintenanceBarang')(sequelize);
const PengadaanBarang   = require('./PengadaanBarang')(sequelize);
const PenghapusanAset   = require('./PenghapusanAset')(sequelize);
const ActivityLog       = require('./ActivityLog')(sequelize);

// =============================================================
// KUMPULKAN SEMUA MODEL DALAM SATU OBJECT
// Ini yang akan di-pass ke fungsi associate() setiap model
// =============================================================
const models = {
  User,
  KategoriBarang,
  Inventaris,
  PeminjamanBarang,
  MaintenanceBarang,
  PengadaanBarang,
  PenghapusanAset,
  ActivityLog,
};

// =============================================================
// JALANKAN ASSOCIATIONS
// Loop setiap model, jika punya method associate(), panggil
// dengan meneruskan object 'models' agar bisa cross-reference
// =============================================================
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

// Export semua model dan instance sequelize untuk digunakan di tempat lain
module.exports = {
  sequelize,
  ...models,
};
