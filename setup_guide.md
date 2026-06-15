# Setup Backend SIMARIS — Panduan Lengkap

## File yang Baru Dibuat

| Path | Keterangan |
|------|------------|
| `backend/package.json` | Dependencies & scripts npm |
| `backend/.env.example` | Template environment variables |
| `backend/.sequelizerc` | Konfigurasi path Sequelize CLI |
| `backend/.gitignore` | Mengecualikan node_modules, .env, logs |
| `backend/server.js` | Entry point — jalankan di sini |
| `backend/src/app.js` | Setup Express + semua middleware + routes |
| `backend/src/config/database.js` | Koneksi Sequelize → PostgreSQL |
| `backend/src/config/logger.js` | Winston (console + error.log + combined.log) |
| `backend/src/config/sequelize-cli.config.js` | Config DB khusus Sequelize CLI |
| `backend/src/utils/activityLogger.js` | Helper `logActivity()` — wajib dipanggil tiap mutasi |
| `backend/src/middleware/auth.middleware.js` | `authenticate` + `authorize(...roles)` |
| `backend/src/middleware/activityLogger.middleware.js` | Set header `X-Instance-Id` tiap response |
| `backend/src/routes/*.routes.js` | 8 file router (placeholder, siap diisi controller) |
| `backend/logs/.gitignore` | Buat folder logs/ tetap ada di git |

---

## Langkah Menjalankan di Lokal

### Step 1 — Masuk ke folder backend

```powershell
cd c:\laragon\www\SIMARIS\inventory-system\backend
```

### Step 2 — Salin dan isi file `.env`

```powershell
copy .env.example .env
```

Lalu buka `.env` dan sesuaikan minimal bagian ini:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/inventory_db
JWT_SECRET=isi_dengan_string_random_panjang_minimal_32_karakter
INSTANCE_ID=local-dev
```

### Step 3 — Install dependencies

```powershell
npm install
```

### Step 4 — Setup PostgreSQL dengan Docker

> Lewati step ini jika sudah punya PostgreSQL berjalan (Laragon, dll)

```powershell
# Jalankan PostgreSQL via Docker (sekali saja)
docker run --name simaris-db `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=password `
  -e POSTGRES_DB=inventory_db `
  -p 5432:5432 `
  -d postgres:15-alpine
```

Verifikasi container berjalan:
```powershell
docker ps
```

### Step 5 — Jalankan server development

```powershell
npm run dev
```

---

## Verifikasi Server Berjalan

Buka browser atau Postman, akses endpoint berikut:

| URL | Yang Diharapkan |
|-----|----------------|
| `GET http://localhost:8081/health` | `{ status: "OK", instance: "local-dev" }` |
| `GET http://localhost:8081/api/auth/ping` | `{ success: true, data: { module: "auth" } }` |
| `GET http://localhost:8081/api/inventaris/ping` | `{ success: true, data: { module: "inventaris" } }` |
| `GET http://localhost:8081/api/dashboard/ping` | `{ success: true, data: { module: "dashboard" } }` |

Cek header `X-Instance-Id` di DevTools → Network → Response Headers — harus ada `X-Instance-Id: local-dev`.

---

## Langkah Selanjutnya (Fase 2)

Setelah server berjalan, lanjut ke:

1. **Buat Sequelize Models** — `User.js`, `KategoriBarang.js`, `Inventaris.js`, dst (sesuai plan.md section 4)
2. **Buat Migrations** — satu migration per tabel
3. **Buat Seeders** — 3 user, 4 kategori, 10 inventaris, dll (sesuai plan.md section 8)
4. **Jalankan** `npm run db:migrate && npm run db:seed`
