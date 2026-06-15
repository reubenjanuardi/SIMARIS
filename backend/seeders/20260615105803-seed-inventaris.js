'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP: Insert 10 item inventaris sesuai plan.md section 8.
   *
   * Mapping ID (berdasarkan urutan insert seeder sebelumnya):
   *   Users      → admin1=1, staff1=2, viewer1=3
   *   Kategori   → Elektronik=1, Furnitur=2, Supplies=3, Meeting Equipment=4
   *
   * Variasi kondisi & status_aset:
   *   - 7 Baik + Aktif
   *   - 1 Perbaikan + Dalam Perbaikan  (item 2: Printer)
   *   - 1 Rusak + Aktif               (item 9: Lemari Arsip)
   *   - 1 Baik + Dipinjam             (item 5: Proyektor)
   */
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Tanggal peminjaman proyektor (3 hari lalu)
    const tanggalPinjamProyektor = new Date(now);
    tanggalPinjamProyektor.setDate(tanggalPinjamProyektor.getDate() - 3);

    await queryInterface.bulkInsert('inventaris', [
      {
        // Item 1: Laptop Dell XPS 13 — aset utama IT
        kode_inventaris:  'INV-2026-001',
        nama_barang:      'Laptop Dell XPS 13',
        kategori_id:      1, // Elektronik
        deskripsi:        'Laptop premium untuk kebutuhan kerja harian tim IT. Prosesor Intel Core i7, RAM 16GB, SSD 512GB.',
        kondisi:          'Baik',
        lokasi:           'Ruang IT',
        pemilik_id:       1, // admin1
        peminjam_id:      null,
        tanggal_peminjaman: null,
        harga_perolehan:  12000000,
        tanggal_masuk:    '2025-03-01',
        no_seri:          'DELL-XPS-2025-001',
        masa_garansi:     '2028-03-01',
        catatan:          'Garansi resmi Dell Indonesia 3 tahun.',
        foto_barang:      null,
        status_aset:      'Aktif',
        created_at:       now,
        updated_at:       now,
      },
      {
        // Item 2: Printer HP LaserJet — sedang dalam perbaikan (cartridge macet)
        kode_inventaris:  'INV-2026-002',
        nama_barang:      'Printer HP LaserJet Pro M404n',
        kategori_id:      1, // Elektronik
        deskripsi:        'Printer laser hitam-putih untuk kebutuhan cetak dokumen administrasi.',
        kondisi:          'Perbaikan',
        lokasi:           'Ruang Admin',
        pemilik_id:       2, // staff1
        peminjam_id:      null,
        tanggal_peminjaman: null,
        harga_perolehan:  3500000,
        tanggal_masuk:    '2024-07-15',
        no_seri:          'HP-LJ-2024-002',
        masa_garansi:     '2026-07-15',
        catatan:          'Sedang diperbaiki — cartridge macet dan roll kertas aus.',
        foto_barang:      null,
        status_aset:      'Dalam Perbaikan',
        created_at:       now,
        updated_at:       now,
      },
      {
        // Item 3: Meja Rapat Oval — furnitur ruang rapat utama
        kode_inventaris:  'INV-2026-003',
        nama_barang:      'Meja Rapat Oval 12 Kursi',
        kategori_id:      2, // Furnitur
        deskripsi:        'Meja rapat berbentuk oval kapasitas 12 orang, bahan kayu jati premium dengan finishing natural.',
        kondisi:          'Baik',
        lokasi:           'Ruang Rapat',
        pemilik_id:       1, // admin1
        peminjam_id:      null,
        tanggal_peminjaman: null,
        harga_perolehan:  5000000,
        tanggal_masuk:    '2023-01-20',
        no_seri:          null,
        masa_garansi:     null,
        catatan:          null,
        foto_barang:      null,
        status_aset:      'Aktif',
        created_at:       now,
        updated_at:       now,
      },
      {
        // Item 4: Kursi Ergonomis — furnitur kantor standar
        kode_inventaris:  'INV-2026-004',
        nama_barang:      'Kursi Ergonomis Herman Miller',
        kategori_id:      2, // Furnitur
        deskripsi:        'Kursi ergonomis dengan penyangga lumbar dan sandaran kepala adjustable untuk kenyamanan kerja jangka panjang.',
        kondisi:          'Baik',
        lokasi:           'Ruang Staff',
        pemilik_id:       2, // staff1
        peminjam_id:      null,
        tanggal_peminjaman: null,
        harga_perolehan:  2500000,
        tanggal_masuk:    '2024-02-10',
        no_seri:          null,
        masa_garansi:     null,
        catatan:          'Roda kursi sudah diganti baru per Juni 2026.',
        foto_barang:      null,
        status_aset:      'Aktif',
        created_at:       now,
        updated_at:       now,
      },
      {
        // Item 5: Proyektor Epson — sedang DIPINJAM oleh staff1
        kode_inventaris:    'INV-2026-005',
        nama_barang:        'Proyektor Epson EB-X51',
        kategori_id:        4, // Meeting Equipment
        deskripsi:          'Proyektor XGA 3800 lumen untuk presentasi dan rapat. Dilengkapi remote dan kabel HDMI.',
        kondisi:            'Baik',
        lokasi:             'Ruang Rapat',
        pemilik_id:         1, // admin1
        peminjam_id:        2, // staff1 (sedang meminjam)
        tanggal_peminjaman: tanggalPinjamProyektor,
        harga_perolehan:    8000000,
        tanggal_masuk:      '2024-09-05',
        no_seri:            'EPSON-EB-X51-2024',
        masa_garansi:       '2027-09-05',
        catatan:            'Saat ini dipinjam oleh Staff Gudang untuk presentasi vendor.',
        foto_barang:        null,
        status_aset:        'Dipinjam',
        created_at:         now,
        updated_at:         now,
      },
      {
        // Item 6: Whiteboard — sudah dikembalikan setelah peminjaman sebelumnya
        kode_inventaris:  'INV-2026-006',
        nama_barang:      'Whiteboard Magnetic 120x240cm',
        kategori_id:      4, // Meeting Equipment
        deskripsi:        'Whiteboard magnetik double-sided ukuran besar, dilengkapi tray dan penghapus.',
        kondisi:          'Baik',
        lokasi:           'Ruang Rapat',
        pemilik_id:       1, // admin1
        peminjam_id:      null,
        tanggal_peminjaman: null,
        harga_perolehan:  1200000,
        tanggal_masuk:    '2023-06-01',
        no_seri:          null,
        masa_garansi:     null,
        catatan:          null,
        foto_barang:      null,
        status_aset:      'Aktif',
        created_at:       now,
        updated_at:       now,
      },
      {
        // Item 7: Kertas A4 — supplies habis pakai
        kode_inventaris:  'INV-2026-007',
        nama_barang:      'Kertas A4 80gsm (1 Rim)',
        kategori_id:      3, // Supplies
        deskripsi:        'Kertas A4 80gsm merk Sinar Dunia, isi 500 lembar per rim. Stok saat ini: 25 rim.',
        kondisi:          'Baik',
        lokasi:           'Ruang Admin',
        pemilik_id:       2, // staff1
        peminjam_id:      null,
        tanggal_peminjaman: null,
        harga_perolehan:  50000,
        tanggal_masuk:    '2026-06-01',
        no_seri:          null,
        masa_garansi:     null,
        catatan:          'Stok diperbarui setiap bulan. Reorder point: 5 rim.',
        foto_barang:      null,
        status_aset:      'Aktif',
        created_at:       now,
        updated_at:       now,
      },
      {
        // Item 8: Monitor LG — aktif di ruang IT
        kode_inventaris:  'INV-2026-008',
        nama_barang:      'Monitor LG 27" UltraGear IPS',
        kategori_id:      1, // Elektronik
        deskripsi:        'Monitor IPS 27 inci resolusi QHD (2560x1440), refresh rate 144Hz, cocok untuk desain dan produktivitas.',
        kondisi:          'Baik',
        lokasi:           'Ruang IT',
        pemilik_id:       1, // admin1
        peminjam_id:      null,
        tanggal_peminjaman: null,
        harga_perolehan:  4500000,
        tanggal_masuk:    '2025-01-15',
        no_seri:          'LG-27GP750-2025',
        masa_garansi:     '2028-01-15',
        catatan:          null,
        foto_barang:      null,
        status_aset:      'Aktif',
        created_at:       now,
        updated_at:       now,
      },
      {
        // Item 9: Lemari Arsip — kondisi rusak, perlu perhatian
        kode_inventaris:  'INV-2026-009',
        nama_barang:      'Lemari Arsip 4 Pintu',
        kategori_id:      2, // Furnitur
        deskripsi:        'Lemari besi untuk penyimpanan dokumen arsip kantor, kapasitas 4 laci besar.',
        kondisi:          'Rusak',
        lokasi:           'Ruang Admin',
        pemilik_id:       2, // staff1
        peminjam_id:      null,
        tanggal_peminjaman: null,
        harga_perolehan:  1800000,
        tanggal_masuk:    '2022-03-10',
        no_seri:          null,
        masa_garansi:     null,
        catatan:          'Engsel pintu nomor 3 patah, kunci tidak bisa dikunci. Perlu perbaikan segera.',
        foto_barang:      null,
        status_aset:      'Aktif', // Masih aktif dipakai meski rusak
        created_at:       now,
        updated_at:       now,
      },
      {
        // Item 10: Mic Set + Speaker — peralatan audio ruang rapat
        kode_inventaris:  'INV-2026-010',
        nama_barang:      'Mic Set + Speaker Portable',
        kategori_id:      4, // Meeting Equipment
        deskripsi:        'Sistem audio lengkap untuk rapat: 2 mic wireless + 1 speaker aktif 30W. Merk Yamaha.',
        kondisi:          'Baik',
        lokasi:           'Ruang Rapat',
        pemilik_id:       1, // admin1
        peminjam_id:      null,
        tanggal_peminjaman: null,
        harga_perolehan:  6000000,
        tanggal_masuk:    '2024-11-20',
        no_seri:          'YAMAHA-CLAM602-2024',
        masa_garansi:     '2027-11-20',
        catatan:          'Baterai mic perlu diganti setiap 6 bulan.',
        foto_barang:      null,
        status_aset:      'Aktif',
        created_at:       now,
        updated_at:       now,
      },
    ]);
  },

  /**
   * DOWN: Hapus semua inventaris seed berdasarkan kode unik.
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('inventaris', {
      kode_inventaris: [
        'INV-2026-001', 'INV-2026-002', 'INV-2026-003',
        'INV-2026-004', 'INV-2026-005', 'INV-2026-006',
        'INV-2026-007', 'INV-2026-008', 'INV-2026-009',
        'INV-2026-010',
      ],
    });
  },
};
