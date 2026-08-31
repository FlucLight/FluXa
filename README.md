# FluXa

Personal finance tracker untuk mencatat pemasukan, pengeluaran, transfer antar akun, budget, dan transaksi berulang. FluXa menyediakan dashboard analitik, input transaksi berbasis teks, backup data, serta mode terang dan gelap.

## Fungsi Utama

- Mencatat pemasukan dan pengeluaran secara manual.
- Mencatat transaksi cepat melalui kalimat seperti `Nasi goreng 15rb mandiri`.
- Mengelompokkan transaksi berdasarkan kategori dan sumber dana.
- Melihat ringkasan arus kas berdasarkan periode tertentu.
- Mengatur budget bulanan per kategori.
- Mencatat transfer antar rekening, cash, atau e-wallet tanpa menghitungnya sebagai pemasukan/pengeluaran.
- Mengatur transaksi berulang seperti WiFi, Netflix, atau sewa.
- Menghapus transaksi secara aman menggunakan soft delete dan memulihkannya kembali.
- Mengekspor transaksi ke CSV dan backup data ke JSON.
- Mengimpor backup JSON tanpa menimpa data dengan ID yang sama.
- Menggunakan mode Light dan Dark dengan pilihan tema yang tersimpan di browser.

## Teknologi

- Frontend: React, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- Database migration: node-pg-migrate
- Validasi: Zod pada core CRUD dan shared types
- Monorepo: npm workspaces

## Prasyarat

- Node.js 22 atau lebih baru
- npm 10 atau lebih baru
- PostgreSQL 14 atau lebih baru

## Instalasi

Clone repository lalu masuk ke folder project:

```bash
git clone https://github.com/FlucLight/personal-finance-tracker.git
cd personal-finance-tracker
npm install
```

Buat file environment dari template:

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Isi `.env` sesuai konfigurasi PostgreSQL lokal:

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=password-postgres-kamu
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_management
```

`.env` berisi credential lokal dan tidak boleh di-commit. File tersebut sudah masuk `.gitignore`.

## Setup Database

Pastikan service PostgreSQL sedang berjalan, lalu jalankan:

```bash
npm run db:setup
npm run migrate
```

`db:setup` membuat database `financial_management` jika belum tersedia. `migrate` membuat seluruh tabel dan mengisi data awal:

- 1 user default bernama `Owner`
- 10 kategori pemasukan dan pengeluaran
- 6 payment method: Cash, BRI, Mandiri, Dana, ShopeePay, dan OVO

Untuk development, migration terakhir dapat dibatalkan dengan:

```bash
npm run migrate:down
```

Perintah tersebut bersifat destruktif terhadap migration terakhir. Jangan digunakan pada database production tanpa backup.

## Menjalankan Aplikasi

Buka dua terminal dari root project.

Terminal 1 — backend:

```bash
npm run dev
```

Backend berjalan di `http://localhost:5000`.

Terminal 2 — frontend:

```bash
npm run dev:client
```

Frontend biasanya tersedia di `http://localhost:5173`. Vite meneruskan request `/api` ke backend port 5000.

Health check backend:

```text
GET http://localhost:5000/health
```

## Cara Menggunakan

### Dashboard

Buka menu Dashboard untuk melihat:

- Total pemasukan
- Total pengeluaran
- Saldo bersih
- Rasio tabungan
- Tren transaksi
- Distribusi pengeluaran per kategori
- Aktivitas per metode pembayaran
- Status budget
- Sumber pemasukan

Filter dashboard mendukung:

- Hari ini
- 3 hari terakhir
- 7 hari terakhir
- Bulan ini
- 3 bulan terakhir
- Semua waktu
- Rentang tanggal kustom
- Kategori tertentu
- Metode pembayaran tertentu

### Input Transaksi Cepat

Gunakan kolom Quick di bagian atas aplikasi.

Contoh:

```text
Nasi goreng 15rb mandiri
```

Alur penggunaan:

1. Ketik teks transaksi.
2. Klik `Preview` atau tekan `Enter`.
3. Periksa jumlah, kategori, metode pembayaran, dan keterangan.
4. Klik `Simpan` atau tekan `Enter` lagi.
5. Jika parser kurang yakin, transaksi diberi tanda `review`.

Format nominal yang didukung antara lain:

```text
15000
15.000
15rb
15 ribu
15k
1.5jt
```

Jika kategori tidak ditemukan, parser menggunakan kategori `Lainnya` dengan confidence rendah. Metode pembayaran dan nominal tetap harus ditemukan agar transaksi cepat dapat disimpan.

### Transaksi Manual

Buka menu Transaksi, lalu pilih `Catat Transaksi`. Form mendukung:

- Tipe pemasukan atau pengeluaran
- Jumlah
- Kategori
- Metode pembayaran
- Keterangan
- Tanggal dan waktu transaksi

Transaksi dapat diedit, dihapus, dan dipulihkan dari menu `Terhapus`.

### Transfer Dana

Buka menu Transfer untuk mencatat perpindahan dana antar payment method. Transfer tidak masuk ke total pemasukan maupun pengeluaran.

### Budget

Buka menu Budget, pilih kategori pengeluaran, lalu masukkan batas maksimal bulanan. Progress budget akan menampilkan status pemakaian:

- Di bawah 80%: aman
- 80% sampai kurang dari 100%: mendekati limit
- 100% atau lebih: melewati limit

### Transaksi Berulang

Buka menu Berulang untuk membuat template transaksi bulanan. Backend akan mengecek jadwal saat aplikasi dimulai dan pada pergantian hari ketika server aktif.

Untuk deployment, gunakan timezone process `Asia/Makassar` agar jadwal sesuai WITA.

### Export dan Import

Buka menu Export / Backup:

- `Download CSV`: mengunduh transaksi aktif.
- `Download JSON`: mengunduh backup kategori, payment method, transaksi, dan budget.
- `Pilih File JSON Backup`: memulihkan data dari backup.

Import melewati record yang memiliki ID sama untuk menghindari duplikasi.

## API Utama

Base URL development: `http://localhost:5000/api`

### Transactions

```text
GET    /transactions
POST   /transactions
GET    /transactions/:id
PATCH  /transactions/:id
DELETE /transactions/:id
POST   /transactions/:id/restore
POST   /transactions/parse
POST   /transactions/quick
```

Query filter transaksi:

```text
from
to
category_id
type
payment_method_id
deleted
```

### Categories

```text
GET    /categories
POST   /categories
GET    /categories/:id
PATCH  /categories/:id
DELETE /categories/:id
```

`GET /categories?type=expense` dapat digunakan untuk memfilter tipe kategori.

### Payment Methods

```text
GET    /payment-methods
POST   /payment-methods
GET    /payment-methods/:id
PATCH  /payment-methods/:id
DELETE /payment-methods/:id
```

### Fitur Lain

```text
GET    /transfers
POST   /transfers
DELETE /transfers/:id

GET    /budgets
POST   /budgets
PATCH  /budgets/:id
DELETE /budgets/:id

GET    /recurring-transactions
POST   /recurring-transactions
PATCH  /recurring-transactions/:id
DELETE /recurring-transactions/:id
POST   /recurring-transactions/trigger

GET    /export/csv
GET    /export/json
POST   /export/json
```

## Struktur Project

```text
.
├─ client/
│  └─ src/
│     ├─ components/
│     ├─ pages/
│     ├─ api.ts
│     └─ utils.ts
├─ server/
│  ├─ migrations/
│  ├─ scripts/
│  └─ src/
│     ├─ config/
│     ├─ controllers/
│     ├─ middleware/
│     ├─ parser/
│     ├─ repositories/
│     └─ routes/
├─ shared/
│  └─ src/index.ts
├─ .env.example
├─ .gitignore
├─ package.json
└─ package-lock.json
```

## Pemeriksaan Kode

Lint frontend:

```bash
npm run lint --workspace client
```

Build frontend sekaligus memeriksa TypeScript client:

```bash
npm run build --workspace client
```

Typecheck server dan shared:

```bash
npm run typecheck
```

## Status Pengembangan

Fitur core, parser, dashboard, budget, transfer, recurring transaction, export CSV/JSON, tema Light/Dark, custom modal, custom dropdown, dan custom date picker sudah tersedia.

Pekerjaan mobile responsive tersedia di branch `feat/mobile-responsive` dan belum digabung ke `main`.

Fitur yang masih direncanakan:

- Bot Telegram
- Login dan multi-user
- Export PDF
- Pengelolaan kategori dan payment method melalui halaman frontend khusus
- Deployment production

## Keamanan

- Jangan commit `.env` atau credential database.
- Gunakan password database berbeda untuk production.
- Tambahkan autentikasi sebelum API dibuka ke internet.
- Batasi akses endpoint bot menggunakan API key dan allowlist chat ID saat integrasi Telegram dibuat.
- Backup JSON harus diperlakukan sebagai data sensitif karena berisi riwayat keuangan.
