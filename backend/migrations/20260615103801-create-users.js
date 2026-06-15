'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Buat tabel 'users'
   * Tabel ini adalah tabel PERTAMA karena semua tabel lain referensi ke sini.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },

      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      nama: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      departemen: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      // ENUM role sesuai plan.md
      role: {
        type: Sequelize.ENUM('admin', 'staff', 'viewer'),
        allowNull: false,
        defaultValue: 'staff',
      },

      // Sequelize dengan underscored:true akan generate created_at & updated_at
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  /**
   * DOWN: Hapus tabel 'users'
   * Jalankan saat rollback migration.
   */
  async down(queryInterface, Sequelize) {
    // Hapus ENUM type juga agar tidak tersisa di PostgreSQL
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  },
};
