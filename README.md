<div align="center">

# FluXa

### Personal finance, clear and under control.

Web app pencatatan keuangan pribadi untuk memantau pemasukan, pengeluaran, transfer dana, budget, dan transaksi rutin dalam satu tempat.

<p>
  <img src="https://img.shields.io/github/last-commit/FlucLight/personal-finance-tracker?style=for-the-badge" alt="Last commit">
  <img src="https://img.shields.io/github/commit-activity/y/FlucLight/personal-finance-tracker?style=for-the-badge" alt="Commit activity">
  <img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-6%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 6 or newer">
  <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express 5">
  <img src="https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 14 or newer">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4">
</p>

<p>
  <a href="https://github.com/FlucLight/personal-finance-tracker">Repository</a>
  ·
  <a href="#quick-start">Quick start</a>
  ·
  <a href="#fitur">Fitur</a>
  ·
  <a href="#api">API</a>
</p>

</div>

---

## Tentang FluXa

FluXa membantu mencatat transaksi harian tanpa spreadsheet yang rumit. Data tersimpan di PostgreSQL, backend menyediakan REST API, dan frontend menampilkan ringkasan finansial dalam dashboard yang responsif.

Quick Input juga menerima kalimat natural:

```text
Nasi goreng 15rb mandiri
```

FluXa membaca nominal, metode pembayaran, kategori, dan keterangan secara otomatis. Hasil parsing selalu dapat ditinjau sebelum disimpan.

## Fitur

### Pencatatan

- CRUD pemasukan dan pengeluaran.
- Soft delete dan pemulihan transaksi.
- Input tanggal serta waktu transaksi secara manual.
- Format mata uang Rupiah dengan angka tabular.
- Kategori dan payment method dari database.

### Quick Input

- Parser rule-based tanpa biaya LLM.
- Mendukung `15000`, `15.000`, `15rb`, `15 ribu`, `15k`, dan `1.5jt`.
- Pencocokan kategori melalui keyword.
- Pencocokan payment method melalui nama dan alias.
- Preview parsing dengan confidence `high` atau `low`.
- Transaksi dengan confidence rendah diberi tanda review.

### Dashboard

- Total pemasukan.
- Total pengeluaran.
- Saldo bersih.
- Rasio tabungan.
- Tren pemasukan dan pengeluaran.
- Breakdown pengeluaran per kategori.
- Ringkasan berdasarkan sumber dana.
- Status budget dan progress pemakaian.
- Filter periode, kategori, dan payment method.

### Pengelolaan Dana

- Transfer antar cash, bank, dan e-wallet.
- Budget bulanan per kategori.
- Transaksi berulang dengan jadwal tanggal 1–28.
- Auto-generate transaksi rutin saat server aktif.

### Backup dan Tampilan

- Export transaksi ke CSV.
- Backup penuh ke JSON.
- Import JSON dengan pencegahan duplikasi ID.
- Mode Light dan Dark.
- Custom modal, toast, dropdown, dan calendar picker.
- Layout responsif untuk desktop, tablet, dan mobile.
- Sidebar desktop berubah menjadi drawer pada layar kecil.

## Teknologi

| Layer | Teknologi |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4, CSS variables |
| Data fetching | TanStack Query |
| Charts | Recharts |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL |
| Migration | node-pg-migrate |
| Validation | Zod |
| Monorepo | npm workspaces |

## Arsitektur

```text
Browser
  │
  ├── React + Vite + TanStack Query
  │       └── /api proxy
  │
  └── Express REST API
          ├── Controllers
          ├── Repositories
          ├── Rule-based parser
          └── PostgreSQL
```

Semua tabel inti memiliki `user_id` sejak awal agar auth dan multi-user dapat ditambahkan tanpa mengubah struktur utama.

## Quick Start

### Prasyarat

- Node.js 22 atau lebih baru.
- npm 10 atau lebih baru.
- PostgreSQL 14 atau lebih baru.

### Instalasi

```bash
git clone https://github.com/FlucLight/personal-finance-tracker.git
cd personal-finance-tracker
npm install
```

Buat file environment:

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Isi `.env`:

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=password-postgres-kamu
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_management
```

Jalankan setup database:

```bash
npm run db:setup
npm run migrate
```

`db:setup` membuat database jika belum tersedia. `migrate` membuat tabel dan data default.

### Jalankan Development Server

Gunakan dua terminal dari root project.

Terminal backend:

```bash
npm run dev
```

Terminal frontend:

```bash
npm run dev:client
```

Frontend tersedia di `http://localhost:5173` dan backend di `http://localhost:5000`.

Health check:

```text
GET http://localhost:5000/health
```

## Cara Menggunakan

### Dashboard

1. Buka menu Dashboard.
2. Pilih preset periode seperti Hari Ini, 3 Hari Terakhir, 7 Hari, Bulan Ini, 3 Bulan, atau Semua Waktu.
3. Gunakan filter kategori dan metode pembayaran bila diperlukan.
4. Pilih Kustom untuk menentukan tanggal mulai dan selesai.

### Quick Input

1. Ketik transaksi pada kolom Quick.
2. Klik Preview atau tekan `Enter`.
3. Periksa nominal, kategori, metode pembayaran, dan keterangan.
4. Tekan Enter lagi atau klik Simpan.
5. Jika hasil kurang yakin, periksa transaksi bertanda `review`.

Contoh:

```text
Kopi 18rb dana
Bensin 100k cash
Gaji 5jt mandiri
```

### Transaksi Manual

1. Buka menu Transaksi.
2. Klik Catat Transaksi.
3. Isi tipe, nominal, kategori, metode pembayaran, keterangan, serta tanggal.
4. Simpan transaksi.
5. Gunakan filter untuk mencari data tertentu.

### Transfer Dana

Gunakan menu Transfer untuk memindahkan catatan dana dari satu payment method ke payment method lain. Transfer tidak menambah pemasukan dan tidak mengurangi pengeluaran pada dashboard.

### Budget

1. Buka menu Budget.
2. Klik Set Budget Kategori.
3. Pilih kategori pengeluaran dan nominal batas bulanan.
4. Pantau progress bar pemakaian.

Status budget:

- Di bawah 80%: aman.
- 80% hingga kurang dari 100%: mendekati limit.
- 100% atau lebih: melewati limit.

### Transaksi Berulang

1. Buka menu Berulang.
2. Buat template tagihan atau pemasukan rutin.
3. Tentukan tanggal eksekusi antara 1 dan 28.
4. Aktifkan atau nonaktifkan template sesuai kebutuhan.

### Export dan Backup

Buka menu Export / Backup:

- Download CSV untuk daftar transaksi aktif.
- Download JSON untuk backup kategori, payment method, transaksi, dan budget.
- Pilih File JSON Backup untuk memulihkan data.

## API

Base URL development:

```text
http://localhost:5000/api
```

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

Filter yang tersedia:

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

Gunakan `GET /categories?type=expense` atau `GET /categories?type=income` untuk memfilter tipe kategori.

### Payment Methods

```text
GET    /payment-methods
POST   /payment-methods
GET    /payment-methods/:id
PATCH  /payment-methods/:id
DELETE /payment-methods/:id
```

### Dana dan Budget

```text
GET    /transfers
POST   /transfers
DELETE /transfers/:id

GET    /budgets
POST   /budgets
PATCH  /budgets/:id
DELETE /budgets/:id
```

### Transaksi Berulang

```text
GET    /recurring-transactions
POST   /recurring-transactions
PATCH  /recurring-transactions/:id
DELETE /recurring-transactions/:id
POST   /recurring-transactions/trigger
```

### Export dan Import

```text
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
├─ package-lock.json
└─ README.md
```

## Perintah Development

Lint frontend:

```bash
npm run lint --workspace client
```

Build frontend:

```bash
npm run build --workspace client
```

Typecheck server dan shared:

```bash
npm run typecheck
```

Batalkan migration terakhir pada database development:

```bash
npm run migrate:down
```

Jangan menjalankan `migrate:down` pada production tanpa backup.

## Roadmap

- Integrasi bot Telegram.
- Login dan multi-user.
- Export PDF.
- Halaman pengelolaan kategori dan payment method.
- Endpoint dashboard summary khusus untuk konsumen eksternal.
- Deployment production.

## Keamanan

- `.env` tidak boleh di-commit.
- Backup JSON berisi data sensitif dan harus disimpan dengan aman.
- Gunakan password database khusus production.
- Tambahkan autentikasi sebelum API dibuka ke internet.
- Integrasi bot Telegram harus memakai API key dan allowlist chat ID.

## License

Belum ditentukan.
