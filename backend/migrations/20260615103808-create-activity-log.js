'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Buat tabel 'activity_log'
   * Tabel ini harus paling TERAKHIR karena referensi ke users.
   * Ini adalah modul UTAMA untuk audit trail dan demo load balancer.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_log', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // FK → users.id (null jika log sistem otomatis)
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        // SET NULL agar log tetap ada meski user dihapus
        onDelete: 'SET NULL',
      },

      // Tipe aktivitas dalam format UPPER_SNAKE_CASE
      // Contoh: LOGIN, TAMBAH_BARANG, PINJAM_BARANG_REQUEST
      tipe_aktivitas: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },

      // Nama tabel yang terdampak
      tabel_target: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      // ID record spesifik yang terdampak
      id_target: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      // Snapshot data sebelum perubahan — pakai JSONB untuk query efisien di PostgreSQL
      nilai_lama: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      // Snapshot data sesudah perubahan
      nilai_baru: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      // Penjelasan singkat Bahasa Indonesia tentang apa yang terjadi
      deskripsi_perubahan: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      // IP address request (mendukung IPv6 — max 45 karakter)
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },

      // KOLOM KUNCI untuk demo load balancer:
      // menunjukkan EC2 instance mana yang memproses request ini
      instance_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      // Waktu kejadian — menggunakan kolom 'timestamp' sesuai plan.md section 4.8
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Tambahkan index pada kolom yang sering dipakai untuk filter/search
    // Index ini mempercepat query dashboard dan halaman activity log
    await queryInterface.addIndex('activity_log', ['user_id'], {
      name: 'idx_activity_log_user_id',
    });

    await queryInterface.addIndex('activity_log', ['tipe_aktivitas'], {
      name: 'idx_activity_log_tipe_aktivitas',
    });

    await queryInterface.addIndex('activity_log', ['timestamp'], {
      name: 'idx_activity_log_timestamp',
    });

    await queryInterface.addIndex('activity_log', ['instance_id'], {
      name: 'idx_activity_log_instance_id',
    });
  },

  /**
   * DOWN: Hapus tabel 'activity_log' dan semua index-nya
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activity_log');
  },
};
