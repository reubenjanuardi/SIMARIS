'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Insert 15 record activity_log untuk demo audit trail & load balancer.
   *
   * PENTING untuk demo:
   * - instance_id berganti-ganti antara 'instance-1' dan 'instance-2'
   *   untuk mensimulasikan request yang didistribusikan oleh AWS ALB
   * - Timestamp bervariasi dari 3 hari lalu sampai hari ini
   * - nilai_lama & nilai_baru berisi JSON realistis sebagai audit snapshot
   */
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Helper: buat Date offset dari sekarang (negatif = masa lalu)
    function offsetJam(jam) {
      const d = new Date(now);
      d.setHours(d.getHours() - jam);
      return d;
    }

    await queryInterface.bulkInsert('activity_log', [
      // ============================================================
      // HARI INI (berbagai jam)
      // ============================================================
      {
        // Log 1: Login admin — instance-1 yang handle request ini
        user_id:             1, // admin1
        tipe_aktivitas:      'LOGIN',
        tabel_target:        'users',
        id_target:           1,
        nilai_lama:          null,
        nilai_baru:          JSON.stringify({ username: 'admin1', role: 'admin' }),
        deskripsi_perubahan: 'Admin Utama berhasil login ke sistem.',
        ip_address:          '192.168.1.10',
        instance_id:         'instance-1',
        timestamp:           offsetJam(1),
      },
      {
        // Log 2: Tambah barang baru — instance-2 yang handle
        user_id:             1, // admin1
        tipe_aktivitas:      'TAMBAH_BARANG',
        tabel_target:        'inventaris',
        id_target:           10,
        nilai_lama:          null,
        nilai_baru:          JSON.stringify({
          kode_inventaris: 'INV-2026-010',
          nama_barang:     'Mic Set + Speaker Portable',
          kondisi:         'Baik',
          status_aset:     'Aktif',
        }),
        deskripsi_perubahan: 'Admin Utama menambahkan barang baru: Mic Set + Speaker Portable (INV-2026-010).',
        ip_address:          '192.168.1.10',
        instance_id:         'instance-2', // Load balancer round-robin ke instance-2
        timestamp:           offsetJam(2),
      },
      {
        // Log 3: Approve peminjaman proyektor — instance-1
        user_id:             1, // admin1
        tipe_aktivitas:      'PINJAM_BARANG_APPROVE',
        tabel_target:        'peminjaman_barang',
        id_target:           1,
        nilai_lama:          JSON.stringify({ status: 'Pending' }),
        nilai_baru:          JSON.stringify({ status: 'Approved', approved_by: 1 }),
        deskripsi_perubahan: 'Admin Utama menyetujui peminjaman Proyektor Epson EB-X51 oleh Staff Gudang.',
        ip_address:          '192.168.1.10',
        instance_id:         'instance-1',
        timestamp:           offsetJam(3),
      },
      {
        // Log 4: Login staff — instance-2
        user_id:             2, // staff1
        tipe_aktivitas:      'LOGIN',
        tabel_target:        'users',
        id_target:           2,
        nilai_lama:          null,
        nilai_baru:          JSON.stringify({ username: 'staff1', role: 'staff' }),
        deskripsi_perubahan: 'Staff Gudang berhasil login ke sistem.',
        ip_address:          '192.168.1.20',
        instance_id:         'instance-2',
        timestamp:           offsetJam(4),
      },
      {
        // Log 5: Request peminjaman proyektor (sebelum di-approve) — instance-1
        user_id:             2, // staff1
        tipe_aktivitas:      'PINJAM_BARANG_REQUEST',
        tabel_target:        'peminjaman_barang',
        id_target:           1,
        nilai_lama:          null,
        nilai_baru:          JSON.stringify({
          barang_id:    5,
          peminjam_id:  2,
          status:       'Pending',
          catatan:      'Peminjaman untuk presentasi evaluasi vendor minggu ini.',
        }),
        deskripsi_perubahan: 'Staff Gudang mengajukan permintaan peminjaman Proyektor Epson EB-X51.',
        ip_address:          '192.168.1.20',
        instance_id:         'instance-1',
        timestamp:           offsetJam(5),
      },

      // ============================================================
      // KEMARIN (offset 24-48 jam)
      // ============================================================
      {
        // Log 6: Pengembalian whiteboard — instance-2
        user_id:             2, // staff1
        tipe_aktivitas:      'KEMBALI_BARANG',
        tabel_target:        'peminjaman_barang',
        id_target:           3,
        nilai_lama:          JSON.stringify({
          status:             'Approved',
          tanggal_kembali_aktual: null,
        }),
        nilai_baru:          JSON.stringify({
          status:                 'Dikembalikan',
          kondisi_saat_kembali:   'Baik',
          tanggal_kembali_aktual: new Date(now.getTime() - 25 * 3600000).toISOString(),
        }),
        deskripsi_perubahan: 'Staff Gudang mengembalikan Whiteboard Magnetic 120x240cm dalam kondisi Baik.',
        ip_address:          '192.168.1.20',
        instance_id:         'instance-2',
        timestamp:           offsetJam(25),
      },
      {
        // Log 7: Ubah kondisi lemari — instance-1
        user_id:             1, // admin1
        tipe_aktivitas:      'UBAH_KONDISI',
        tabel_target:        'inventaris',
        id_target:           9,
        nilai_lama:          JSON.stringify({ kondisi: 'Baik' }),
        nilai_baru:          JSON.stringify({ kondisi: 'Rusak' }),
        deskripsi_perubahan: 'Admin Utama mengubah kondisi Lemari Arsip 4 Pintu dari Baik menjadi Rusak. Engsel pintu patah.',
        ip_address:          '192.168.1.10',
        instance_id:         'instance-1',
        timestamp:           offsetJam(26),
      },
      {
        // Log 8: Request maintenance monitor — instance-2
        user_id:             2, // staff1
        tipe_aktivitas:      'MAINTENANCE_REQUEST',
        tabel_target:        'maintenance_barang',
        id_target:           1,
        nilai_lama:          null,
        nilai_baru:          JSON.stringify({
          barang_id:         2,
          deskripsi_masalah: 'Cartridge tersumbat dan paper jam berulang.',
          status:            'Diajukan',
        }),
        deskripsi_perubahan: 'Staff Gudang mengajukan permintaan maintenance untuk Printer HP LaserJet Pro M404n.',
        ip_address:          '192.168.1.20',
        instance_id:         'instance-2',
        timestamp:           offsetJam(30),
      },
      {
        // Log 9: Mulai maintenance printer — instance-1
        user_id:             2, // staff1 (sebagai teknisi)
        tipe_aktivitas:      'MAINTENANCE_START',
        tabel_target:        'maintenance_barang',
        id_target:           1,
        nilai_lama:          JSON.stringify({ status: 'Diajukan' }),
        nilai_baru:          JSON.stringify({ status: 'Dalam Perbaikan', teknisi_id: 2 }),
        deskripsi_perubahan: 'Staff Gudang memulai proses perbaikan Printer HP LaserJet Pro M404n. Kondisi barang diubah menjadi Perbaikan.',
        ip_address:          '192.168.1.20',
        instance_id:         'instance-1',
        timestamp:           offsetJam(29),
      },
      {
        // Log 10: Login viewer — instance-2
        user_id:             3, // viewer1
        tipe_aktivitas:      'LOGIN',
        tabel_target:        'users',
        id_target:           3,
        nilai_lama:          null,
        nilai_baru:          JSON.stringify({ username: 'viewer1', role: 'viewer' }),
        deskripsi_perubahan: 'Pemantau Aset berhasil login ke sistem.',
        ip_address:          '192.168.1.30',
        instance_id:         'instance-2',
        timestamp:           offsetJam(32),
      },

      // ============================================================
      // 2-3 HARI LALU (offset 48-72 jam)
      // ============================================================
      {
        // Log 11: Maintenance kursi selesai — instance-1
        user_id:             2, // staff1
        tipe_aktivitas:      'MAINTENANCE_SELESAI',
        tabel_target:        'maintenance_barang',
        id_target:           2,
        nilai_lama:          JSON.stringify({ status: 'Dalam Perbaikan', tanggal_selesai: null }),
        nilai_baru:          JSON.stringify({
          status:         'Selesai',
          biaya_perbaikan: 150000,
          tanggal_selesai: offsetJam(48).toISOString(),
        }),
        deskripsi_perubahan: 'Maintenance Kursi Ergonomis selesai. Roda diganti, biaya perbaikan Rp 150.000. Kondisi barang kembali Baik.',
        ip_address:          '192.168.1.20',
        instance_id:         'instance-1',
        timestamp:           offsetJam(48),
      },
      {
        // Log 12: Ubah lokasi monitor — instance-2
        user_id:             1, // admin1
        tipe_aktivitas:      'UBAH_LOKASI',
        tabel_target:        'inventaris',
        id_target:           8,
        nilai_lama:          JSON.stringify({ lokasi: 'Ruang Staff' }),
        nilai_baru:          JSON.stringify({ lokasi: 'Ruang IT' }),
        deskripsi_perubahan: 'Admin Utama memindahkan Monitor LG 27" UltraGear dari Ruang Staff ke Ruang IT.',
        ip_address:          '192.168.1.10',
        instance_id:         'instance-2',
        timestamp:           offsetJam(50),
      },
      {
        // Log 13: Tambah barang laptop — instance-1
        user_id:             1, // admin1
        tipe_aktivitas:      'TAMBAH_BARANG',
        tabel_target:        'inventaris',
        id_target:           1,
        nilai_lama:          null,
        nilai_baru:          JSON.stringify({
          kode_inventaris: 'INV-2026-001',
          nama_barang:     'Laptop Dell XPS 13',
          kondisi:         'Baik',
          status_aset:     'Aktif',
          harga_perolehan: 12000000,
        }),
        deskripsi_perubahan: 'Admin Utama menambahkan barang baru: Laptop Dell XPS 13 (INV-2026-001) senilai Rp 12.000.000.',
        ip_address:          '192.168.1.10',
        instance_id:         'instance-1',
        timestamp:           offsetJam(60),
      },
      {
        // Log 14: Tambah barang proyektor — instance-2
        user_id:             1, // admin1
        tipe_aktivitas:      'TAMBAH_BARANG',
        tabel_target:        'inventaris',
        id_target:           5,
        nilai_lama:          null,
        nilai_baru:          JSON.stringify({
          kode_inventaris: 'INV-2026-005',
          nama_barang:     'Proyektor Epson EB-X51',
          kondisi:         'Baik',
          status_aset:     'Aktif',
          harga_perolehan: 8000000,
        }),
        deskripsi_perubahan: 'Admin Utama menambahkan barang baru: Proyektor Epson EB-X51 (INV-2026-005) senilai Rp 8.000.000.',
        ip_address:          '192.168.1.10',
        instance_id:         'instance-2',
        timestamp:           offsetJam(65),
      },
      {
        // Log 15: Request peminjaman whiteboard (paling lama) — instance-1
        user_id:             2, // staff1
        tipe_aktivitas:      'PINJAM_BARANG_REQUEST',
        tabel_target:        'peminjaman_barang',
        id_target:           3,
        nilai_lama:          null,
        nilai_baru:          JSON.stringify({
          barang_id:    6,
          peminjam_id:  2,
          status:       'Pending',
          catatan:      'Digunakan untuk sesi brainstorming tim operasional.',
        }),
        deskripsi_perubahan: 'Staff Gudang mengajukan permintaan peminjaman Whiteboard Magnetic 120x240cm untuk sesi brainstorming.',
        ip_address:          '192.168.1.20',
        instance_id:         'instance-1',
        timestamp:           offsetJam(72),
      },
    ]);
  },

  /**
   * DOWN: Hapus semua activity_log seed.
   * Karena tidak ada constraint unik selain id (auto-increment),
   * kita hapus berdasarkan rentang timestamp seed.
   */
  async down(queryInterface, Sequelize) {
    // Hapus log dengan tipe aktivitas yang ada di seed ini
    // Cara aman: hapus semua log yang instance_id-nya adalah seed data kita
    await queryInterface.bulkDelete('activity_log', {
      instance_id: ['instance-1', 'instance-2'],
    });
  },
};
