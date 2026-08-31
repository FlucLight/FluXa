<div align="center">

<img src="https://img.shields.io/badge/FluXa-Personal%20Finance-334155?style=for-the-badge&labelColor=1B1C1F&color=334155" alt="FluXa Personal Finance" height="40">

### Personal finance, clear and under control.

Web app pencatatan keuangan pribadi untuk memantau pemasukan, pengeluaran, transfer dana, budget, dan transaksi rutin — dalam satu tempat, tanpa spreadsheet yang berantakan.

<p>
  <img src="https://img.shields.io/github/last-commit/FlucLight/personal-finance-tracker?style=for-the-badge&label=updated&labelColor=5A5C61&color=2E7D5B" alt="Last update">
  <img src="https://img.shields.io/github/commit-activity/y/FlucLight/personal-finance-tracker?style=for-the-badge&label=activity&labelColor=5A5C61&color=A9782E" alt="Commit activity">
  <img src="https://img.shields.io/badge/status-active%20development-3D7C72?style=for-the-badge&labelColor=ECECE9" alt="Active development">
</p>

<p>
  <img src="https://img.shields.io/badge/React-19-4F7C8A?style=for-the-badge&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-6%2B-356B8C?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 6+">
  <img src="https://img.shields.io/badge/Express-5-3F454B?style=for-the-badge&logo=express&logoColor=white" alt="Express 5">
  <img src="https://img.shields.io/badge/PostgreSQL-14%2B-4B6F9E?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 14+">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-3A7887?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4">
</p>

<p>
  <img src="https://img.shields.io/badge/Responsive-3D7C72?style=flat-square&labelColor=E4EFE9" alt="Responsive">
  <img src="https://img.shields.io/badge/Dark%20%2F%20Light-A9782E?style=flat-square&labelColor=F1E7D6" alt="Dark and Light mode">
  <img src="https://img.shields.io/badge/REST%20API-59636E?style=flat-square&labelColor=ECECE9" alt="REST API">
</p>

<p>
  <a href="#quick-start"><b>Quick Start</b></a> ·
  <a href="#fitur"><b>Fitur</b></a> ·
  <a href="#cara-menggunakan"><b>Cara Pakai</b></a> ·
  <a href="#api"><b>API</b></a> ·
  <a href="#roadmap"><b>Roadmap</b></a> ·
  <a href="https://github.com/FlucLight/personal-finance-tracker"><b>Repository</b></a>
</p>

</div>

<br>

> [!NOTE]
> Bahasa yang digunakan pada FluXa dan dokumentasi ini adalah Bahasa Indonesia, disesuaikan dengan target pengguna utama.

## Tentang FluXa

FluXa membantu mencatat transaksi harian tanpa spreadsheet yang rumit. Data tersimpan di PostgreSQL, backend menyediakan REST API, dan frontend menampilkan ringkasan finansial dalam dashboard yang responsif — dengan desain minimalis hitam-putih yang bersih dan enak dilihat.

Fitur andalan: **Quick Input**, kolom input tunggal yang menerima kalimat natural dan langsung mem-parsingnya jadi transaksi terstruktur.

```text
Input:   Nasi goreng 15rb mandiri
Output:  Rp 15.000 · Kategori: Makanan · Metode: Mandiri · Confidence: high
```

Semua nominal, metode pembayaran, kategori, dan keterangan dibaca otomatis oleh parser rule-based (tanpa biaya LLM sama sekali), dan hasilnya selalu bisa ditinjau sebelum disimpan.

<br>

## Fitur

<table>
<tr>
<td width="50%" valign="top">

### Pencatatan

- CRUD pemasukan dan pengeluaran
- Soft delete & pemulihan transaksi
- Input tanggal dan waktu manual
- Format mata uang Rupiah (angka tabular)
- Kategori & payment method dari database

### Quick Input

- Parser rule-based, tanpa biaya LLM
- Mendukung `15000`, `15.000`, `15rb`, `15 ribu`, `15k`, `1.5jt`
- Pencocokan kategori via keyword
- Pencocokan payment method via nama & alias
- Preview parsing dengan confidence `high` / `low`
- Transaksi confidence rendah otomatis ditandai review

### Dashboard

- Total pemasukan, pengeluaran, saldo bersih
- Rasio tabungan
- Tren pemasukan & pengeluaran
- Breakdown pengeluaran per kategori
- Ringkasan berdasarkan sumber dana
- Status & progress budget
- Filter periode, kategori, payment method

</td>
<td width="50%" valign="top">

### Pengelolaan Dana

- Transfer antar cash, bank, dan e-wallet
- Budget bulanan per kategori
- Transaksi berulang, jadwal tanggal 1–28
- Auto-generate transaksi rutin saat server aktif

### Backup & Import

- Export transaksi ke CSV
- Backup penuh ke JSON
- Import JSON dengan pencegahan duplikasi ID

### Tampilan

- Mode Light & Dark
- Custom modal, toast, dropdown, calendar picker
- Layout responsif — desktop, tablet, mobile
- Sidebar desktop → drawer di layar kecil

</td>
</tr>
</table>

<br>

## Teknologi

<div align="center">

| Layer | Teknologi |
|:--|:--|
| **Frontend** | React 19 · TypeScript · Vite |
| **Styling** | Tailwind CSS 4 · CSS Variables |
| **Data Fetching** | TanStack Query |
| **Charts** | Recharts |
| **Backend** | Node.js · Express 5 · TypeScript |
| **Database** | PostgreSQL |
| **Migration** | node-pg-migrate |
| **Validation** | Zod |
| **Monorepo** | npm workspaces |

</div>

<br>

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

> [!TIP]
> Semua tabel inti sudah memiliki kolom `user_id` sejak awal, jadi auth dan multi-user bisa ditambahkan nanti tanpa mengubah struktur utama database.

<br>

## Quick Start

### Prasyarat

| Tool | Versi minimum |
|:--|:--|
| Node.js | 22+ |
| npm | 10+ |
| PostgreSQL | 14+ |

### 1. Clone & Install

```bash
git clone https://github.com/FlucLight/personal-finance-tracker.git
cd personal-finance-tracker
npm install
```

### 2. Environment

<details>
<summary><b>Windows (PowerShell)</b></summary>

```powershell
Copy-Item .env.example .env
```

</details>

<details>
<summary><b>macOS / Linux</b></summary>

```bash
cp .env.example .env
```

</details>

Isi `.env`:

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=password-postgres-kamu
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_management
```

### 3. Setup Database

```bash
npm run db:setup   # membuat database jika belum ada
npm run migrate    # membuat tabel & data default
```

### 4. Jalankan Development Server

Butuh dua terminal dari root project:

```bash
# Terminal 1 — backend
npm run dev

# Terminal 2 — frontend
npm run dev:client
```

| Service | URL |
|:--|:--|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:5000` |
| Health check | `GET http://localhost:5000/health` |

<br>

## Cara Menggunakan

<details>
<summary><b>Dashboard</b></summary>
<br>

1. Buka menu **Dashboard**.
2. Pilih preset periode: Hari Ini, 3 Hari Terakhir, 7 Hari, Bulan Ini, 3 Bulan, atau Semua Waktu.
3. Gunakan filter kategori dan metode pembayaran bila diperlukan.
4. Pilih **Kustom** untuk menentukan tanggal mulai dan selesai sendiri.

</details>

<details>
<summary><b>Quick Input</b></summary>
<br>

1. Ketik transaksi pada kolom Quick.
2. Klik **Preview** atau tekan `Enter`.
3. Periksa nominal, kategori, metode pembayaran, dan keterangan.
4. Tekan `Enter` lagi atau klik **Simpan**.
5. Jika hasil kurang yakin, cek transaksi bertanda `review`.

**Contoh:**
```text
Kopi 18rb dana
Bensin 100k cash
Gaji 5jt mandiri
```

</details>

<details>
<summary><b>Transaksi Manual</b></summary>
<br>

1. Buka menu **Transaksi**.
2. Klik **Catat Transaksi**.
3. Isi tipe, nominal, kategori, metode pembayaran, keterangan, serta tanggal.
4. Simpan transaksi.
5. Gunakan filter untuk mencari data tertentu.

</details>

<details>
<summary><b>Transfer Dana</b></summary>
<br>

Gunakan menu **Transfer** untuk memindahkan catatan dana dari satu payment method ke payment method lain. Transfer **tidak** menambah pemasukan dan **tidak** mengurangi pengeluaran pada dashboard.

</details>

<details>
<summary><b>Budget</b></summary>
<br>

1. Buka menu **Budget**.
2. Klik **Set Budget Kategori**.
3. Pilih kategori pengeluaran dan nominal batas bulanan.
4. Pantau progress bar pemakaian.

| Progress | Status |
|:--|:--|
| < 80% | Aman |
| 80% – 99% | Mendekati limit |
| ≥ 100% | Melebihi limit |

</details>

<details>
<summary><b>Transaksi Berulang</b></summary>
<br>

1. Buka menu **Berulang**.
2. Buat template tagihan atau pemasukan rutin.
3. Tentukan tanggal eksekusi antara 1 dan 28.
4. Aktifkan atau nonaktifkan template sesuai kebutuhan.

</details>

<details>
<summary><b>Export & Backup</b></summary>
<br>

Buka menu **Export / Backup**:

- Download **CSV** untuk daftar transaksi aktif.
- Download **JSON** untuk backup kategori, payment method, transaksi, dan budget.
- Pilih **File JSON Backup** untuk memulihkan data.

</details>

<br>

## API

Base URL development:

```text
http://localhost:5000/api
```

<details>
<summary><b>Transactions</b></summary>

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

Filter yang tersedia: `from` · `to` · `category_id` · `type` · `payment_method_id` · `deleted`

</details>

<details>
<summary><b>Categories</b></summary>

```text
GET    /categories
POST   /categories
GET    /categories/:id
PATCH  /categories/:id
DELETE /categories/:id
```

Gunakan `GET /categories?type=expense` atau `GET /categories?type=income` untuk memfilter tipe kategori.

</details>

<details>
<summary><b>Payment Methods</b></summary>

```text
GET    /payment-methods
POST   /payment-methods
GET    /payment-methods/:id
PATCH  /payment-methods/:id
DELETE /payment-methods/:id
```

</details>

<details>
<summary><b>Dana & Budget</b></summary>

```text
GET    /transfers
POST   /transfers
DELETE /transfers/:id

GET    /budgets
POST   /budgets
PATCH  /budgets/:id
DELETE /budgets/:id
```

</details>

<details>
<summary><b>Transaksi Berulang</b></summary>

```text
GET    /recurring-transactions
POST   /recurring-transactions
PATCH  /recurring-transactions/:id
DELETE /recurring-transactions/:id
POST   /recurring-transactions/trigger
```

</details>

<details>
<summary><b>Export & Import</b></summary>

```text
GET    /export/csv
GET    /export/json
POST   /export/json
```

</details>

<br>

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

<br>

## Perintah Development

| Perintah | Fungsi |
|:--|:--|
| `npm run lint --workspace client` | Lint frontend |
| `npm run build --workspace client` | Build frontend |
| `npm run typecheck` | Typecheck server & shared |
| `npm run migrate:down` | Batalkan migration terakhir (dev only) |

> [!WARNING]
> Jangan menjalankan `migrate:down` pada production tanpa backup.

<br>

## Roadmap

- [ ] Integrasi bot Telegram
- [ ] Login dan multi-user
- [ ] Export PDF
- [ ] Halaman pengelolaan kategori dan payment method
- [ ] Endpoint dashboard summary khusus untuk konsumen eksternal
- [ ] Deployment production

<br>

## Keamanan

- `.env` tidak boleh di-commit.
- Backup JSON berisi data sensitif dan harus disimpan dengan aman.
- Gunakan password database khusus production.
- Tambahkan autentikasi sebelum API dibuka ke internet.
- Integrasi bot Telegram harus memakai API key dan allowlist chat ID.

<br>

<div align="center">

## License

Belum ditentukan.

<br>

<sub>Dibuat oleh <a href="https://github.com/FlucLight">FlucLight</a></sub>

</div>