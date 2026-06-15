'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Insert 3 user awal sesuai plan.md section 8.
   * Password di-hash dengan bcrypt saltRounds:10 sebelum disimpan.
   */
  async up(queryInterface, Sequelize) {
    // Hash password sekali untuk semua user (password sama: password123)
    // saltRounds: 10 adalah nilai standar yang aman untuk produksi
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        // User 1: Admin — akses penuh ke semua fitur
        username:   'admin1',
        password:   hashedPassword,
        nama:       'Admin Utama',
        email:      'admin1@simaris.local',
        departemen: 'IT',
        role:       'admin',
        created_at: now,
        updated_at: now,
      },
      {
        // User 2: Staff — bisa kelola barang, tidak bisa hapus/approve
        username:   'staff1',
        password:   hashedPassword,
        nama:       'Staff Gudang',
        email:      'staff1@simaris.local',
        departemen: 'Operasional',
        role:       'staff',
        created_at: now,
        updated_at: now,
      },
      {
        // User 3: Viewer — hanya bisa melihat data
        username:   'viewer1',
        password:   hashedPassword,
        nama:       'Pemantau Aset',
        email:      'viewer1@simaris.local',
        departemen: 'Keuangan',
        role:       'viewer',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  /**
   * DOWN: Hapus semua user seed (berdasarkan username unik).
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      username: ['admin1', 'staff1', 'viewer1'],
    });
  },
};
