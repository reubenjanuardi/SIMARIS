# PANDUAN DEPLOYMENT AWS — SIMARIS

Dokumen ini adalah panduan lengkap langkah-demi-langkah (step-by-step) untuk men-deploy aplikasi SIMARIS (Sistem Manajemen Inventaris) ke infrastruktur AWS (Amazon Web Services).

---

## 1. Persiapan Database: AWS RDS PostgreSQL

Sebelum men-deploy backend, database PostgreSQL harus siap diakses. Kita akan menggunakan layanan database managed **AWS RDS**.

### Langkah Konfigurasi RDS di AWS Console:
1. Masuk ke **AWS Management Console** dan buka layanan **RDS**.
2. Klik tombol **Create database**.
3. Pilih metode pembuatan **Standard create**.
4. Pilih **Engine type**: **PostgreSQL**.
5. Pilih **Templates**: **Free Tier** (untuk menghindari biaya tambahan selama uji coba).
6. Di bawah **Settings**:
   - **DB instance identifier**: `simaris-db`
   - **Master username**: `postgres` (sesuaikan dengan config)
   - **Master password**: Tulis password yang kuat, misalnya `password123` (simpan password ini).
7. Di bawah **Connectivity**:
   - **Virtual private cloud (VPC)**: Pilih VPC default Anda.
   - **Public access**: Pilih **Yes** (agar dapat diakses untuk migrasi database dari lokal/pengujian, pastikan Security Group dikonfigurasi dengan aman).
   - **VPC security group**: Pilih **Create new** dan beri nama `simaris-db-sg`.
8. Klik **Create database** (proses pembuatan memakan waktu 3–10 menit).
9. Setelah status database berubah menjadi **Available**, buka detail database tersebut dan salin **Endpoint** (misal: `simaris-db.xxxx.ap-southeast-1.rds.amazonaws.com`).

### Mengatur Inbound Security Group RDS:
1. Klik pada Security Group database yang baru dibuat (`simaris-db-sg`).
2. Pilih tab **Inbound rules** -> **Edit inbound rules**.
3. Tambahkan rule baru:
   - **Type**: PostgreSQL (Port 5432)
   - **Source**: **Anywhere-IPv4** (atau custom IP EC2 / IP kantor Anda untuk keamanan maksimum).
4. Klik **Save rules**.

### Menjalankan Migrasi & Seeding Database:
Dari komputer lokal Anda (atau instance deploy), jalankan migrasi database ke RDS menggunakan parameter `DATABASE_URL` rds Anda:
```bash
# Ganti endpoint_rds dan password dengan milik Anda
DATABASE_URL=postgresql://postgres:password123@endpoint_rds:5432/inventory_db npm run db:migrate
DATABASE_URL=postgresql://postgres:password123@endpoint_rds:5432/inventory_db npm run db:seed
```

---

## OPSI A — Deployment Menggunakan AWS Elastic Beanstalk (Pilihan Utama)

AWS Elastic Beanstalk adalah layanan Platform-as-a-Service (PaaS) yang mengelola otomatisasi load balancing, auto-scaling, dan deployment container.

### Langkah-Langkah Deployment:
1. **Prasyarat**: Pastikan Anda telah menginstal **AWS CLI** dan **EB CLI** di komputer lokal Anda, serta mengonfigurasi credentials AWS (`aws configure`).
2. **Inisialisasi Project**:
   Di direktori root project SIMARIS, jalankan perintah:
   ```bash
   eb init
   ```
   - Pilih region: `ap-southeast-1` (ap-southeast-1 : Singapore).
   - Pilih aplikasi: *[Create new Application]* -> beri nama `simaris-app`.
   - Pilih platform: **Docker**.
   - Pilih platform branch: **Docker running on 64bit Amazon Linux 2023** (versi terbaru).
   - Setup SSH key jika Anda ingin melakukan debug ke instance.
3. **Membuat Environment**:
   Jalankan perintah berikut untuk membuat environment load-balanced dengan minimal 2 instance:
   ```bash
   eb create simaris-prod-env --tier WebServer --cname simaris-app-prod --scale 2
   ```
   *Catatan: Parameter `--scale 2` akan memastikan Elastic Beanstalk otomatis membuat 2 instance EC2 di balik AWS Application Load Balancer.*
4. **Konfigurasi Environment Variables di AWS Console**:
   - Masuk ke AWS Console -> **Elastic Beanstalk** -> pilih aplikasi `simaris-app` -> pilih environment `simaris-prod-env`.
   - Klik menu **Configuration** di sidebar kiri.
   - Gulir ke bawah ke bagian **Updates, monitoring, and logging** -> klik **Edit**.
   - Cari bagian **Environment properties** (di paling bawah), dan masukkan key-value berikut:
     - `DATABASE_URL` = `postgresql://postgres:password123@endpoint_rds:5432/inventory_db`
     - `NODE_ENV` = `production`
     - `PORT` = `8081`
     - `JWT_SECRET` = `[secret_key_anda_yang_sangat_panjang]`
     - `JWT_EXPIRES_IN` = `8h`
     - `AWS_REGION` = `ap-southeast-1`
     - `AWS_S3_BUCKET` = `simaris-uploads`
     - `AWS_ACCESS_KEY_ID` = `[Access_Key_IAM_Anda]`
     - `AWS_SECRET_ACCESS_KEY` = `[Secret_Key_IAM_Anda]`
   - Klik **Apply** di bagian bawah halaman. Beanstalk akan melakukan konfigurasi ulang otomatis.
5. **Deployment Ulang**:
   Jika Anda membuat perubahan kode lokal, deploy ulang dengan perintah:
   ```bash
   eb deploy
   ```

---

## OPSI B — Deployment Manual EC2 + Application Load Balancer (ALB)

Metode ini melibatkan pembuatan instansi EC2 secara manual, konfigurasi load balancer secara manual, dan proses deployment step-by-step per instance.

```mermaid
graph TD
    Client[Client Browser] -->|HTTP / HTTPS| ALB[Application Load Balancer]
    ALB -->|Port 8081| EC2_A[EC2 Instance 1: instance-1]
    ALB -->|Port 8081| EC2_B[EC2 Instance 2: instance-2]
    EC2_A -->|SQL Port 5432| RDS[(AWS RDS PostgreSQL)]
    EC2_B -->|SQL Port 5432| RDS
```

### Langkah 1: Membuat & Meluncurkan 2 Instance EC2
1. Buka dashboard **EC2 Console** -> **Instances** -> klik **Launch instances**.
2. Berikan nama instance pertama: `simaris-instance-1`.
3. Pilih OS Image (AMI): **Ubuntu Server 24.04 LTS (HVM)**.
4. Instance type: `t3.small` (atau `t2.micro` untuk free tier).
5. Pilih/buat Key pair untuk SSH login.
6. Pada bagian **Network settings**:
   - Centang **Allow SSH traffic**
   - Centang **Allow HTTP traffic from the internet**
7. Klik **Launch instance**.
8. Ulangi langkah di atas untuk instance kedua dengan nama `simaris-instance-2`.

### Langkah 2: Instalasi Environment pada Tiap EC2 Instance
Lakukan SSH login ke kedua instance satu-per-satu, dan jalankan perintah instalasi berikut:
```bash
# Update OS
sudo apt update && sudo apt upgrade -y

# Instal Node Version Manager (NVM) & Node.js 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

# Verifikasi Node & NPM
node -v
npm -v
```

### Langkah 3: Setup Kode Aplikasi SIMARIS di EC2
Di masing-masing instance:
1. Clone repositori proyek Anda:
   ```bash
   git clone <url_repo_simaris> /home/ubuntu/SIMARIS
   cd /home/ubuntu/SIMARIS/backend
   ```
2. Instal dependensi backend:
   ```bash
   npm install --production
   ```
3. Konfigurasi file `.env` di backend:
   ```bash
   nano .env
   ```
   Isi file `.env` dengan kredensial RDS database dan variabel AWS S3 Anda.
   
   > [!IMPORTANT]
   > Berikan nilai **`INSTANCE_ID`** yang unik untuk tiap instance guna mengidentifikasi instance mana yang sedang melayani request saat diuji melalui Load Balancer:
   > - Di **`simaris-instance-1`**, set: `INSTANCE_ID=instance-1`
   > - Di **`simaris-instance-2`**, set: `INSTANCE_ID=instance-2`

### Langkah 4: Migrasi Database & Menjalankan PM2
1. Di **salah satu instance** (cukup jalankan sekali saja), jalankan migrasi database:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
2. Instal **PM2** secara global untuk menjalankan server di background secara permanen:
   ```bash
   sudo npm install -m -g pm2
   ```
3. Jalankan aplikasi backend menggunakan PM2 dari folder `backend/`:
   ```bash
   pm2 start server.js --name simaris-api
   ```
4. Pastikan aplikasi berjalan otomatis ketika server reboot:
   ```bash
   pm2 startup systemd
   # Copy & paste output perintah di atas ke terminal, lalu jalankan:
   pm2 save
   ```

### Langkah 5: Konfigurasi Target Group & Application Load Balancer (ALB)
1. Buka dashboard **EC2 Console** -> bagian sidebar kiri cari **Load Balancing** -> pilih **Target Groups**.
2. Klik **Create target group**.
3. Pilih target type: **Instances**.
4. **Target group name**: `simaris-backend-tg`.
5. Protocol: **HTTP**, Port: **8081** (port default backend Node.js).
6. **Health checks**:
   - Protocol: **HTTP**
   - Path: `/health` (Endpoint ini mengembalikan data instance ID dan status server)
7. Klik **Next**.
8. Centang `simaris-instance-1` dan `simaris-instance-2` di tabel, isi port **8081** di bawahnya, klik **Include as pending below**.
9. Klik **Create target group**.
10. Masuk ke **Load Balancers** -> klik **Create load balancer**.
11. Pilih **Application Load Balancer** -> klik **Create**.
12. **Load balancer name**: `simaris-alb`.
13. **Network mapping**: Pilih VPC default Anda dan centang minimal 2 Availability Zones.
14. **Listeners and routing**:
    - Listener: Protocol **HTTP**, Port **80**.
    - Forward to: Pilih Target Group `simaris-backend-tg` yang baru saja dibuat.
15. Klik **Create load balancer**.

---

## 3. Cara Pengujian Round-Robin Load Balancer (Verifikasi)

Setelah ALB selesai dibuat dan statusnya berubah menjadi **Active**, salin **DNS name** dari load balancer tersebut (misalnya: `simaris-alb-12345678.ap-southeast-1.elb.amazonaws.com`).

Aplikasi backend SIMARIS menyematkan header HTTP khusus **`X-Instance-Id`** pada setiap response. Kita dapat menguji perputaran distribusi request (Round-Robin) load balancer menggunakan command line.

### Melalui Bash (Linux / macOS / Git Bash):
Jalankan loop script cURL berikut sebanyak 5 kali:
```bash
for i in {1..5}; do 
  echo "--- Request ke-$i ---"
  curl -sI http://<DNS_NAME_LOAD_BALANCER_ANDA>/health | grep -i x-instance-id
done
```

**Contoh Output yang Diharapkan:**
```text
--- Request ke-1 ---
X-Instance-Id: instance-1
--- Request ke-2 ---
X-Instance-Id: instance-2
--- Request ke-3 ---
X-Instance-Id: instance-1
--- Request ke-4 ---
X-Instance-Id: instance-2
--- Request ke-5 ---
X-Instance-Id: instance-1
```

### Melalui PowerShell (Windows):
```powershell
for ($i=1; $i -le 5; $i++) {
    Write-Host "--- Request ke-$i ---"
    (Invoke-WebRequest -Uri "http://<DNS_NAME_LOAD_BALANCER_ANDA>/health" -Method Head).Headers."X-Instance-Id"
}
```

Jika output `X-Instance-Id` bergantian secara konsisten, maka konfigurasi Application Load Balancer AWS Anda sudah **100% berjalan dengan sukses dan seimbang (load-balanced)**!
