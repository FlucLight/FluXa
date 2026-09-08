<div align="center">

<img src="https://img.shields.io/badge/FluXa-Personal%20Finance-334155?style=for-the-badge&labelColor=1B1C1F&color=334155" alt="FluXa Personal Finance" height="40">

### Catat, pantau, dan kendalikan keuangan pribadimu — cukup lewat chat.

FluXa adalah aplikasi pencatatan keuangan pribadi **modern, gratis, dan multi-pengguna** dengan dua pintu masuk: **Web App** yang responsif dan **Bot Telegram**. Tanpa spreadsheet berantakan, tanpa biaya token AI/LLM — semua pemahaman transaksi ditangani oleh parser rule-based lokal berkecepatan tinggi.

</div>

---

## Coba Langsung (Production)

| Layanan | Tautan & Keterangan |
|:---|:---|
| Website | [https://fluclight.my.id](https://fluclight.my.id) — Akses via browser (desktop & smartphone) |
| Bot Telegram | [@fluclight_finance_bot](https://t.me/fluclight_finance_bot) — Catat transaksi langsung dari aplikasi chat |
| Tautan Cepat | Buka bot lalu kirim `/start` untuk menu; tautkan ke akunmu via kode di web |

> **Petunjuk Menghubungkan Akun ke Telegram:**
> 1. Daftar atau login di web [https://fluclight.my.id](https://fluclight.my.id).
> 2. Buka menu **Akun -> "Hubungkan Telegram"**, lalu klik **"Buat kode tautan"**.
> 3. Klik **"Buka bot & kirim kode"**. Dalam hitungan detik chat Telegram kamu otomatis terhubung dan siap mencatat transaksi ke akunmu.

---

## Tangkapan Layar

<div align="center">
<img src="docs/screenshot-dashboardv2.png" width="820" alt="Dashboard FluXa">
<p><i>Dashboard — ringkasan bulanan, tren pengeluaran/pemasukan, breakdown kategori, saldo per akun, dan target budget.</i></p>
</div>

<br>

<table>
<tr>
<td width="50%" align="center">
<img src="docs/screenshot-quick-input.png" width="380" alt="Quick Input">
<p><i>Quick Input — ketik transaksi alami, hasil parsing terdeteksi otomatis</i></p>
</td>
<td width="50%" align="center">
<img src="docs/screenshot-telegram-chat.png" width="380" alt="Bot Telegram">
<p><i>Bot Telegram — catat transaksi dari chat lengkap dengan jam realtime</i></p>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshot-transactions.png" width="380" alt="Halaman Transaksi">
<p><i>Halaman Transaksi — tabel data, filter multi-kriteria, dan hapus massal</i></p>
</td>
<td width="50%" align="center">
<img src="docs/screenshot-dashboard.png" width="380" alt="Dashboard Alternatif">
<p><i>Dashboard — tampilan alternatif ringkasan keuangan</i></p>
</td>
</tr>
</table>

---

## Panduan Menjalankan Aplikasi & Dokumentasi Terpisah

FluXa dibangun menggunakan arsitektur **Monorepo (npm workspaces)** yang memisahkan client frontend dan server backend.

Untuk instruksi menjalankan, konfigurasi mendalam, dan arsitektur spesifik tiap folder, **silakan baca dokumentasi masing-masing folder berikut**:

| Modul | Dokumen Panduan | Cakupan Penjelasan |
|:---|:---|:---|
| **Frontend Web App** | [**`client/README.md`**](client/README.md) | Panduan menjalankan React 19 + Vite, daftar seluruh halaman (Dashboard, Transaksi, Akun Kustom, Transfer, Budget Arsip, Tagihan, Export), sistem modal interaktif, komponen `CurrencyInput` pemisah ribuan titik, dan perintah build frontend. |
| **Backend & Bot Engine** | [**`server/README.md`**](server/README.md) | Panduan menjalankan Node.js Express 5 + PostgreSQL, sistem autentikasi JWT/OAuth/Passkey, mesin NLP parser kalimat bahasa Indonesia, mesin bot Telegram polling, daftar 10 file migrasi database, dan environment variables. |
| **Shared Schema** | `shared/src/index.ts` | Definisi tipe TypeScript bersama dan skema validasi Zod untuk transaksi, akun, kategori, dan budget. |

---

## Fitur Utama

* **Bot Telegram Terintegrasi:** Catat transaksi via chat atau tombol terpandu, ringkasan berkala, cek saldo, undo transaksi terakhir, dan backup JSON langsung ke chat dengan pencatatan waktu realtime (WITA / Asia/Makassar).
* **Quick Input Bar (NLP Rule-Based):** Auto-parse kalimat seperti `Makan siang 25rb cash kemarin` secara instan tanpa biaya token AI / LLM.
* **Manajemen Akun & Rekening Kustom:** Tambahkan rekening bank (BCA, Mandiri, Kaltimtara, BRI), e-wallet/QRIS (DANA, Gopay, OVO, ShopeePay), kartu kredit (Visa), hingga uang tunai lengkap dengan alias kata kunci bot.
* **Budget Bulanan & Arsip Riwayat:** Atur batas anggaran per kategori dan telusuri arsip performa budget bulan-bulan lampau via navigator bulan/tahun.
* **Transfer Antar Akun:** Catat mutasi pemindahan dana antar rekening/dompet sendiri tanpa merusak kalkulasi cash flow.
* **Tagihan Berulang:** Penjadwalan tagihan rutin per hari, minggu, atau bulan dengan tombol aktif/jeda.
* **Pemisah Ribuan Titik Otomatis:** Input nominal uang otomatis terformat titik (`10.000` -> `Rp 10.000`) di seluruh modal dan form.
* **Modal Notifikasi Tengah Interaktif:** Setiap aksi menghasilkan umpan balik modal di tengah layar yang jelas dan interaktif.
* **Multi-User & Keamanan Lengkap:** Login email/password (bcrypt), Google OAuth 2.0, Passkeys (WebAuthn), dan cookie HTTP-only JWT.
* **Backup & Restore:** Ekspor ke CSV, Excel (XLSX), serta unduh/restore file backup database JSON.

---

## Quick Start (Development Monorepo)

### Prasyarat
* Node.js v22+
* npm v10+
* PostgreSQL v14+

### 1. Clone & Install Dependency
```bash
git clone https://github.com/FlucLight/FluXa.git
cd FluXa
npm install
```

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env` di root project:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi database PostgreSQL lokal kamu:
```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=password_postgres_kamu
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_management
JWT_SECRET=buat_string_rahasia_acak_minimal_32_karakter
COOKIE_SECURE=0
```

### 3. Migrasi Database & Menjalankan Monorepo
```bash
# 1. Jalankan migrasi database PostgreSQL
npm run migrate

# 2. Jalankan backend server & frontend client secara bersamaan
npm run dev
```

* Backend REST API berjalan di: `http://localhost:5000`
* Frontend Web App berjalan di: `http://localhost:5173`

> Untuk petunjuk menjalankan client atau server secara terpisah, silakan baca [**`client/README.md`**](client/README.md) dan [**`server/README.md`**](server/README.md).

---

## Perintah Penting Monorepo

| Perintah | Fungsi |
|:---|:---|
| `npm run dev` | Menjalankan backend server dan frontend client secara bersamaan |
| `npm run dev:client` | Menjalankan hanya frontend Vite dev server |
| `npm run migrate` | Menjalankan migrasi database PostgreSQL ke versi terbaru |
| `npm run test:parser` | Menjalankan unit test untuk NLP rule-based parser |
| `npm run build -w client` | Membangun bundle produksi frontend ke `client/dist` |
| `npm run typecheck` | Memvalidasi tipe TypeScript di seluruh workspace |

---

## Deploy ke Server Produksi (VPS)

```bash
# 1. Masuk ke folder project di server
cd /home/superadmin/FluXa

# 2. Ambil pembaruan kode terbaru dari GitHub
git pull

# 3. Jalankan migrasi jika ada skema database baru
npm run migrate

# 4. Restart backend via PM2
pm2 restart fluxa-backend --update-env
```

---

<br>

<div align="center">

<img src="https://img.shields.io/badge/FluXa-334155?style=for-the-badge&labelColor=1B1C1F&color=334155" alt="FluXa" height="28">

<br>

### Dibuat oleh [Rahmat Alfarizi](https://github.com/FlucLight)

<br>

<a href="https://fluclight.my.id" target="_blank">
  <img src="https://img.shields.io/badge/Website-fluclight.my.id-334155?style=for-the-badge&logo=googlechrome&logoColor=white&labelColor=1B1C1F" alt="Website">
</a>
<a href="https://t.me/fluclight_finance_bot" target="_blank">
  <img src="https://img.shields.io/badge/Bot-Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white&labelColor=1B1C1F" alt="Bot Telegram">
</a>
<a href="https://github.com/FlucLight" target="_blank">
  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white&labelColor=1B1C1F" alt="GitHub">
</a>
<a href="https://wa.me/6287721685155" target="_blank">
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white&labelColor=1B1C1F" alt="WhatsApp">
</a>
<a href="https://www.instagram.com/mat_rhmat03" target="_blank">
  <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white&labelColor=1B1C1F" alt="Instagram">
</a>

<br>
<br>

<sub>Dilindungi di bawah lisensi MIT License</sub>

</div>
