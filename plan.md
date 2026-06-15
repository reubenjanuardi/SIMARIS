# PLAN.md — Sistem Manajemen Inventaris Kantor/Perusahaan

> **Dokumen ini adalah SOURCE OF TRUTH** untuk pengembangan aplikasi.
> Semua AI assistant (Claude, Copilot, dll) dan developer WAJIB mengikuti spesifikasi di dokumen ini.
> Jika ada perubahan scope, update dokumen ini TERLEBIH DAHULU sebelum mengubah kode.

---

## 1. RINGKASAN PROYEK

| Atribut | Detail |
|---|---|
| **Nama Proyek** | Sistem Manajemen Inventaris Kantor (SIMARIS / nama bebas) |
| **Tujuan** | Tugas Besar mata kuliah BBK3CAB3 - Komputasi Awan |
| **Tipe Aplikasi** | Web application (CRUD + Auth + Audit Log) |
| **Target Deploy** | AWS (EC2 multi-instance + Load Balancer + RDS) |
| **Deadline Pengumpulan** | 21 Juni 2026, 23:59 WIB |
| **Anggota Kelompok** | _(isi nama & NIM masing-masing anggota)_ |

### Konteks Bisnis
Aplikasi digunakan oleh kantor/perusahaan untuk mengelola **aset inventaris** (elektronik, furnitur, supplies, peralatan meeting). Mencakup pencatatan barang, peminjaman/pengembalian, maintenance, pengadaan, penghapusan aset, dan **activity log/audit trail** menyeluruh.

### Kriteria Wajib Tugas Besar (jangan dihapus dari scope)
1. **Webserver on Instance** — app berjalan di instance cloud
2. **Database Server on Instance** — database terpisah/managed (RDS)
3. **Load Balancer** — minimal 2 jalur instance, dengan indikator instance ID di response/log
4. Dokumentasi PDF: Halaman Utama, Daftar Isi, Pendahuluan & Persiapan, Alur Rencana & Pengujian, Konfigurasi, Hasil & Analisis, Kesimpulan

---

## 2. TECH STACK (FIXED — JANGAN DIGANTI TANPA DISKUSI)

| Layer | Teknologi | Versi/Catatan |
|---|---|---|
| Frontend | React.js + Vite | SPA, dibangun jadi static files |
| Backend | Node.js + Express.js | REST API, port 8081 |
| Database | PostgreSQL | Lokal: Docker, Production: AWS RDS |
| ORM | Sequelize | Migration & model |
| Auth | JWT + bcryptjs | Token disimpan di localStorage/cookie |
| Logging | Winston (file log) + tabel `activity_log` (DB log) | Dual logging |
| Upload File | Multer (lokal) → AWS S3 (production) | Foto barang |
| Deployment | AWS Elastic Beanstalk (opsi utama) ATAU Manual EC2 + ALB | 2 instance minimum |
| Region AWS | ap-southeast-1 (Singapore) | |

**Environment Variables yang dibutuhkan** (`.env` backend):
```
DATABASE_URL=postgresql://user:pass@host:5432/inventory_db
NODE_ENV=development|production
PORT=8081
JWT_SECRET=
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
INSTANCE_ID=    # diisi manual per instance untuk verifikasi load balancer
```

`.env` frontend:
```
VITE_API_URL=http://localhost:8081/api
```

---

## 3. STRUKTUR FOLDER PROYEK

```
inventory-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── logger.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── KategoriBarang.js
│   │   │   ├── Inventaris.js
│   │   │   ├── PeminjamanBarang.js
│   │   │   ├── MaintenanceBarang.js
│   │   │   ├── PengadaanBarang.js
│   │   │   ├── PenghapusanAset.js
│   │   │   ├── ActivityLog.js
│   │   │   └── index.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── inventaris.routes.js
│   │   │   ├── peminjaman.routes.js
│   │   │   ├── maintenance.routes.js
│   │   │   ├── pengadaan.routes.js
│   │   │   ├── penghapusan.routes.js
│   │   │   ├── activitylog.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── controllers/
│   │   │   └── (1 file per modul, sama nama dgn routes)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # verifikasi JWT + role
│   │   │   └── activityLogger.middleware.js
│   │   └── app.js
│   ├── migrations/
│   ├── seeders/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/ (Navbar, Sidebar, Footer)
│   │   │   ├── common/ (Table, Modal, Badge, FilterBar)
│   │   ├── pages/
│   │   │   ├── auth/ (Login)
│   │   │   ├── dashboard/ (Dashboard)
│   │   │   ├── inventaris/ (List, Detail, Form)
│   │   │   ├── peminjaman/ (List, Form)
│   │   │   ├── maintenance/ (List, Form)
│   │   │   ├── pengadaan/ (List, Form)
│   │   │   ├── penghapusan/ (List, Form)
│   │   │   └── activitylog/ (List)
│   │   ├── services/
│   │   │   └── api.js (axios instance + interceptor JWT)
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
└── docs/
    ├── database-schema.sql
    ├── ERD.png
    ├── DEPLOYMENT_GUIDE.md
    └── TUGAS_BESAR_REPORT.pdf (final deliverable)
```

---

## 4. DATABASE SCHEMA (SOURCE OF TRUTH)

> Semua nama tabel & kolom **snake_case**. Primary key selalu `id` (UUID atau SERIAL — gunakan SERIAL untuk kemudahan).

### 4.1 `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | |
| username | VARCHAR(50) UNIQUE | |
| password | VARCHAR(255) | hashed bcrypt |
| nama | VARCHAR(100) | |
| email | VARCHAR(100) | |
| departemen | VARCHAR(50) | |
| role | ENUM('admin','staff','viewer') | default 'staff' |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 4.2 `kategori_barang`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | |
| nama_kategori | VARCHAR(50) | Elektronik, Furnitur, Supplies, Meeting Equipment |
| deskripsi | TEXT | |

### 4.3 `inventaris`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | |
| kode_inventaris | VARCHAR(20) UNIQUE | format: INV-YYYY-XXX |
| nama_barang | VARCHAR(100) | |
| kategori_id | FK → kategori_barang.id | |
| deskripsi | TEXT | |
| kondisi | ENUM('Baik','Rusak','Perbaikan','Hilang') | default 'Baik' |
| lokasi | VARCHAR(100) | |
| pemilik_id | FK → users.id, nullable | pemilik/PIC |
| peminjam_id | FK → users.id, nullable | terisi jika sedang dipinjam |
| tanggal_peminjaman | TIMESTAMP, nullable | |
| harga_perolehan | DECIMAL(15,2) | |
| tanggal_masuk | DATE | |
| no_seri | VARCHAR(50), nullable | |
| masa_garansi | DATE, nullable | |
| catatan | TEXT, nullable | |
| foto_barang | VARCHAR(255), nullable | path/URL S3 |
| status_aset | ENUM('Aktif','Dipinjam','Dalam Perbaikan','Dihapus') | default 'Aktif' |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 4.4 `peminjaman_barang`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | |
| barang_id | FK → inventaris.id | |
| peminjam_id | FK → users.id | |
| tanggal_peminjaman | TIMESTAMP | |
| tanggal_rencana_kembali | TIMESTAMP | |
| tanggal_kembali_aktual | TIMESTAMP, nullable | |
| kondisi_saat_kembali | VARCHAR(50), nullable | |
| status | ENUM('Pending','Approved','Rejected','Dikembalikan') | default 'Pending' |
| approved_by | FK → users.id, nullable | |
| catatan | TEXT, nullable | |
| created_at | TIMESTAMP | |

### 4.5 `maintenance_barang`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | |
| barang_id | FK → inventaris.id | |
| tanggal_maintenance | TIMESTAMP | |
| deskripsi_masalah | TEXT | |
| teknisi_id | FK → users.id, nullable | |
| biaya_perbaikan | DECIMAL(15,2), nullable | |
| tanggal_selesai | TIMESTAMP, nullable | |
| status | ENUM('Diajukan','Dalam Perbaikan','Selesai','Batal') | default 'Diajukan' |
| foto_sebelum | VARCHAR(255), nullable | |
| foto_sesudah | VARCHAR(255), nullable | |
| created_at | TIMESTAMP | |

### 4.6 `pengadaan_barang`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | |
| nomor_po | VARCHAR(30) UNIQUE | |
| nama_barang | VARCHAR(100) | barang yang diajukan (belum tentu ada di inventaris) |
| kategori_id | FK → kategori_barang.id | |
| qty | INTEGER | |
| vendor | VARCHAR(100) | |
| harga_satuan | DECIMAL(15,2) | |
| total_harga | DECIMAL(15,2) | computed: qty * harga_satuan |
| tanggal_order | DATE, nullable | |
| tanggal_estimasi_tiba | DATE, nullable | |
| tanggal_terima | DATE, nullable | |
| status | ENUM('Draft','Approved','Ordered','Arrived','Rejected') | default 'Draft' |
| approved_by | FK → users.id, nullable | |
| created_by | FK → users.id | |
| created_at | TIMESTAMP | |

### 4.7 `penghapusan_aset`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | |
| barang_id | FK → inventaris.id | |
| alasan_penghapusan | TEXT | |
| tanggal_penghapusan | DATE | |
| nilai_sisa | DECIMAL(15,2), nullable | |
| approved_by | FK → users.id, nullable | |
| catatan | TEXT, nullable | |
| created_at | TIMESTAMP | |

### 4.8 `activity_log` ⭐ (MODUL UTAMA)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | |
| user_id | FK → users.id, nullable | nullable untuk log sistem |
| tipe_aktivitas | VARCHAR(50) | lihat daftar di bawah |
| tabel_target | VARCHAR(50), nullable | nama tabel yg terdampak |
| id_target | INTEGER, nullable | id record yg terdampak |
| nilai_lama | JSON/TEXT, nullable | snapshot sebelum |
| nilai_baru | JSON/TEXT, nullable | snapshot sesudah |
| deskripsi_perubahan | TEXT | human-readable |
| ip_address | VARCHAR(45), nullable | |
| instance_id | VARCHAR(50), nullable | dari env INSTANCE_ID — **untuk demo load balancer** |
| timestamp | TIMESTAMP | default now() |

**Daftar `tipe_aktivitas` (gunakan konsisten, UPPER_SNAKE_CASE):**
```
LOGIN, LOGOUT,
TAMBAH_BARANG, UBAH_BARANG, HAPUS_BARANG, UBAH_KONDISI, UBAH_LOKASI,
PINJAM_BARANG_REQUEST, PINJAM_BARANG_APPROVE, PINJAM_BARANG_REJECT, KEMBALI_BARANG,
MAINTENANCE_REQUEST, MAINTENANCE_START, MAINTENANCE_SELESAI,
PENGADAAN_CREATE, PENGADAAN_APPROVE, PENGADAAN_ARRIVED,
PENGHAPUSAN_REQUEST, PENGHAPUSAN_APPROVE
```

---

## 5. ENDPOINT API (KONTRAK — JANGAN UBAH PATH/METHOD TANPA UPDATE DOKUMEN INI)

### Auth
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| POST | `/api/auth/register` | admin only | buat user baru |
| POST | `/api/auth/login` | public | return JWT, log LOGIN |
| POST | `/api/auth/logout` | authenticated | log LOGOUT |
| GET | `/api/auth/me` | authenticated | profil user login |

### Inventaris
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/inventaris` | all roles | list + filter (kategori, kondisi, status, search) |
| GET | `/api/inventaris/:id` | all roles | detail + history log barang ini |
| POST | `/api/inventaris` | admin, staff | tambah barang → log TAMBAH_BARANG |
| PUT | `/api/inventaris/:id` | admin, staff | update → log UBAH_BARANG/UBAH_LOKASI/UBAH_KONDISI |
| DELETE | `/api/inventaris/:id` | admin only | soft delete → log HAPUS_BARANG |

### Peminjaman
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/peminjaman` | all roles | list, filter status |
| POST | `/api/peminjaman` | all roles | request pinjam → log PINJAM_BARANG_REQUEST |
| PUT | `/api/peminjaman/:id/approve` | admin | → log PINJAM_BARANG_APPROVE, update inventaris.status_aset |
| PUT | `/api/peminjaman/:id/reject` | admin | → log PINJAM_BARANG_REJECT |
| PUT | `/api/peminjaman/:id/return` | peminjam, admin | → log KEMBALI_BARANG, update kondisi & status_aset |

### Maintenance
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/maintenance` | all roles | list, filter status |
| POST | `/api/maintenance` | all roles | ajukan → log MAINTENANCE_REQUEST |
| PUT | `/api/maintenance/:id/start` | admin/teknisi | → log MAINTENANCE_START, update inventaris.kondisi='Perbaikan' |
| PUT | `/api/maintenance/:id/complete` | admin/teknisi | → log MAINTENANCE_SELESAI, update kondisi='Baik' |

### Pengadaan
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/pengadaan` | admin, staff | list |
| POST | `/api/pengadaan` | admin, staff | → log PENGADAAN_CREATE |
| PUT | `/api/pengadaan/:id/approve` | admin | → log PENGADAAN_APPROVE |
| PUT | `/api/pengadaan/:id/arrived` | admin, staff | → log PENGADAAN_ARRIVED, opsional auto-create inventaris |

### Penghapusan
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/penghapusan` | admin | list |
| POST | `/api/penghapusan` | admin, staff | ajukan → log PENGHAPUSAN_REQUEST |
| PUT | `/api/penghapusan/:id/approve` | admin | → log PENGHAPUSAN_APPROVE, update inventaris.status_aset='Dihapus' |

### Activity Log
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/activitylog` | admin, viewer | filter: user_id, tipe_aktivitas, tanggal_mulai, tanggal_akhir, search |
| GET | `/api/activitylog/export` | admin | export CSV/PDF |

### Dashboard
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/dashboard/summary` | all roles | total aset, total nilai, breakdown kondisi & kategori |
| GET | `/api/dashboard/recent-activity` | all roles | 10 log terbaru |
| GET | `/api/dashboard/low-stock` | all roles | N/A untuk aset (ganti: "barang butuh perhatian" — kondisi rusak/garansi habis) |

### Health Check (WAJIB untuk Load Balancer)
| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/health` | public | return `{status, timestamp, instance: process.env.INSTANCE_ID}` |

---

## 6. ROLE & PERMISSION MATRIX

| Fitur | Admin | Staff | Viewer |
|---|---|---|---|
| Lihat inventaris | ✅ | ✅ | ✅ |
| Tambah/edit barang | ✅ | ✅ | ❌ |
| Hapus barang | ✅ | ❌ | ❌ |
| Request peminjaman | ✅ | ✅ | ✅ |
| Approve/reject peminjaman | ✅ | ❌ | ❌ |
| Ajukan maintenance | ✅ | ✅ | ✅ |
| Start/complete maintenance | ✅ | ✅ (jika teknisi) | ❌ |
| Pengadaan barang | ✅ | ✅ | ❌ |
| Approve pengadaan | ✅ | ❌ | ❌ |
| Penghapusan aset | ✅ | ✅ (ajukan saja) | ❌ |
| Approve penghapusan | ✅ | ❌ | ❌ |
| Lihat activity log | ✅ | ❌ | ✅ (read-only) |
| Export log | ✅ | ❌ | ❌ |
| Manage user | ✅ | ❌ | ❌ |

---

## 7. KONVENSI KODE

- **Bahasa response/error API**: Bahasa Indonesia (`{ "message": "Barang tidak ditemukan" }`)
- **Format response sukses**: `{ "success": true, "data": {...} }`
- **Format response error**: `{ "success": false, "message": "..." }`
- **Penamaan file**: `camelCase.js` untuk file JS, `kebab-case` untuk folder
- **Commit message**: `feat:`, `fix:`, `docs:`, `chore:` (conventional commits)
- **Setiap endpoint yang mengubah data WAJIB memanggil helper `logActivity()`** — jangan duplikasi logic logging di setiap controller, buat satu helper di `src/utils/activityLogger.js`
- **Setiap response dari backend disarankan menyertakan header `X-Instance-Id`** (dari `process.env.INSTANCE_ID`) untuk mempermudah verifikasi load balancer di browser DevTools

---

## 8. SEED DATA AWAL (untuk development & demo)

- 3 user: `admin1` (role admin), `staff1` (role staff), `viewer1` (role viewer) — password default `password123` (hash dengan bcrypt)
- 4 kategori: Elektronik, Furnitur, Supplies, Meeting Equipment
- Minimal 10 item inventaris dengan kode `INV-2026-001` s/d `INV-2026-010`, sebar di berbagai kategori & kondisi
- Minimal 3 record peminjaman (1 pending, 1 approved, 1 dikembalikan)
- Minimal 2 record maintenance (1 selesai, 1 dalam perbaikan)
- Minimal 15 record activity_log dengan variasi `instance_id` ('instance-1' dan 'instance-2') untuk demo load balancer

---

## 9. RENCANA TAHAPAN DEVELOPMENT

| Fase | Deliverable | Target |
|---|---|---|
| 1 | Setup repo, struktur folder, koneksi DB lokal (Docker Postgres) | Minggu 1 |
| 2 | Model + migration semua tabel + seeder | Minggu 1 |
| 3 | Auth (register/login/JWT) + middleware role | Minggu 1-2 |
| 4 | CRUD Inventaris + activity logger middleware | Minggu 2 |
| 5 | Modul Peminjaman + Maintenance | Minggu 2-3 |
| 6 | Modul Pengadaan + Penghapusan | Minggu 3 |
| 7 | Dashboard + Activity Log page + export | Minggu 3 |
| 8 | Frontend semua halaman (React) | Minggu 2-4 (parallel) |
| 9 | Setup AWS: RDS, EC2 x2, ALB, S3 | Minggu 4 |
| 10 | Deploy & testing load balancer + log instance | Minggu 4 |
| 11 | Dokumentasi PDF lengkap + presentasi | Minggu 4-5 |
| **Deadline final** | | **21 Juni 2026, 23:59** |

---

## 10. TESTING CHECKLIST (untuk verifikasi sebelum demo)

- [ ] `/health` mengembalikan instance_id yang berbeda saat hit berkali-kali (load balancer round-robin)
- [ ] Login dengan 3 role berbeda, verifikasi permission matrix
- [ ] CRUD inventaris tercatat di `activity_log` dengan `instance_id` yang benar
- [ ] Flow peminjaman end-to-end: request → approve → return → status_aset berubah
- [ ] Flow maintenance end-to-end: request → start → selesai → kondisi barang berubah
- [ ] Flow pengadaan: create → approve → arrived
- [ ] Flow penghapusan: request → approve → status_aset = 'Dihapus'
- [ ] Filter & search di activity log berfungsi
- [ ] Export activity log ke CSV/PDF
- [ ] Dashboard menampilkan summary yang akurat sesuai data di DB
- [ ] RDS dapat diakses dari kedua EC2 instance
- [ ] Upload foto barang ke S3 berhasil dan bisa ditampilkan

---

## 11. HAL YANG BELUM DIPUTUSKAN / TODO DISKUSI TIM

- [ ] Nama final aplikasi
- [ ] Nama & NIM lengkap anggota kelompok untuk halaman utama dokumen
- [ ] Apakah pakai AWS Elastic Beanstalk atau manual EC2+ALB (rekomendasi: EB untuk kemudahan)
- [ ] Apakah upload foto barang wajib (jika waktu terbatas, bisa dibuat opsional/placeholder)
- [ ] Pembagian tugas per anggota (siapa kerjakan modul apa)

---

## CATATAN UNTUK AI ASSISTANT

Ketika diminta membuat kode untuk proyek ini:
1. **Selalu rujuk ke dokumen ini** untuk nama tabel, kolom, endpoint, dan konvensi
2. Jangan menambah/menghapus tabel atau field tanpa konfirmasi — jika perlu, **usulkan dulu** dan update dokumen ini
3. Setiap fitur baru yang mengubah data harus terintegrasi dengan `activity_log`
4. Prioritaskan kode yang mudah dijelaskan saat presentasi (readable > overly clever)
5. Pastikan setiap modul punya health check / instance indicator yang konsisten untuk demo load balancer
