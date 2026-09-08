<div align="center">

<img src="https://img.shields.io/badge/FluXa-Personal%20Finance-334155?style=for-the-badge&labelColor=1B1C1F&color=334155" alt="FluXa Personal Finance" height="40">

### Catat, pantau, dan kendalikan keuangan pribadimu — cukup lewat chat.

FluXa adalah aplikasi pencatatan keuangan pribadi **modern, gratis, dan multi-pengguna** dengan dua pintu masuk: **Web App** yang responsif dan **Bot Telegram**. Tanpa spreadsheet berantakan, tanpa biaya LLM — semua pemahaman transaksi ditangani parser rule-based lokal.

</div>

---

## Coba Langsung (Production)

| Layanan | Tautan & Keterangan |
|:---|:---|
| 🌐 **Website** | [https://fluclight.my.id](https://fluclight.my.id) — Akses via browser (desktop & HP) |
| 🤖 **Bot Telegram** | [@fluclight_finance_bot](https://t.me/fluclight_finance_bot) — Catat transaksi langsung dari chat |
| 🔗 **Tautan Cepat** | Buka bot lalu kirim `/start` untuk menu; tautkan ke akunmu via kode di web |

> [!TIP]
> **Cara Menghubungkan Telegram:** Daftar/login di web, buka menu **Akun → "Hubungkan Telegram"**, buat kode, lalu klik **"Buka bot & kirim kode"**. Dalam hitungan detik kamu bisa mencatat keuangan langsung dari chat Telegram.

---

## Tangkapan Layar

<div align="center">
<img src="docs/screenshot-dashboardv2.png" width="820" alt="Dashboard FluXa">
<p><i>Dashboard — ringkasan bulanan, tren pengeluaran, breakdown kategori, saldo per akun, dan target budget.</i></p>
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

## Fitur Utama

* 🤖 **Bot Telegram Terintegrasi:** Catat transaksi via chat atau tombol terpandu, ringkasan, cek saldo, undo transaksi terakhir, dan backup JSON langsung ke chat.
* ⚡ **Quick Input Bar (NLP Rule-Based):** Auto-parse kalimat seperti `Makan siang 25rb cash kemarin` secara instan tanpa biaya token AI / LLM.
* 💳 **Manajemen Akun & Rekening Kustom:** Tambahkan rekening bank (BCA, Mandiri, Kaltimtara), e-wallet/QRIS (DANA, Gopay), kartu kredit (Visa), hingga uang tunai lengkap dengan alias bot.
* 📊 **Budget Bulanan & Arsip Riwayat:** Atur batas anggaran per kategori dan telusuri arsip performa budget bulan-bulan lampau via navigator bulan/tahun.
* 🔄 **Transfer Antar Akun:** Catat mutasi pemindahan dana antar rekening/dompet sendiri tanpa merusak kalkulasi cash flow.
* ⏰ **Tagihan Berulang:** Penjadwalan tagihan otomatis per hari, minggu, atau bulan dengan tombol aktif/jeda.
* 💰 **Pemisah Ribuan Titik Otomatis:** Input nominal uang otomatis terformat titik (`10.000` -> `Rp 10.000`) di seluruh modal dan form.
* 🔔 **Modal Notifikasi Tengah Interaktif:** Setiap aksi menghasilkan umpan balik modal di tengah layar yang jelas dan interaktif.
* 🔒 **Multi-User & Keamanan Lengkap:** Login email/password (bcrypt), Google OAuth 2.0, Passkeys (WebAuthn), dan cookie HTTP-only JWT.
* 💾 **Backup & Restore:** Ekspor ke CSV, Excel (XLSX), serta unduh/restore file backup database JSON.

---

## Dokumentasi Terpisah (Monorepo)

Untuk penjelasan teknis mendalam dan arsitektur tiap modul, silakan baca dokumentasi di masing-masing folder:

| Modul | Lokasi Dokumen | Deskripsi |
|:---|:---|:---|
| 🎨 **Frontend Web App** | [**`client/README.md`**](client/README.md) | Panduan lengkap React 19, Vite, Tailwind CSS 4, TanStack Query, daftar komponen UI, sistem modal, formatting angka, dan state. |
| ⚙️ **Backend & Bot Engine** | [**`server/README.md`**](server/README.md) | Panduan lengkap Node.js, Express 5, PostgreSQL, sistem autentikasi, database migrations (001-010), NLP parser, dan Telegram bot. |
| 📦 **Shared Schema & Types** | `shared/src/index.ts` | Definisi tipe TypeScript bersama dan skema validasi Zod untuk transaksi, akun, budget, dan user. |

---

## Quick Start (Development)

### Prasyarat
* **Node.js** v22+
* **npm** v10+
* **PostgreSQL** v14+

### 1. Clone & Install
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
Sesuaikan koneksi database PostgreSQL dan JWT Secret:
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

### 3. Migrasi Database & Menjalankan Aplikasi
```bash
# 1. Jalankan migrasi database PostgreSQL
npm run migrate

# 2. Jalankan backend & frontend secara bersamaan
npm run dev
```

* Backend API berjalan di: `http://localhost:5000`
* Frontend Web App berjalan di: `http://localhost:5173`

---

## Perintah Penting

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

# 2. Ambil update terbaru dari GitHub
git pull

# 3. Jalankan migrasi jika ada skema database baru
npm run migrate

# 4. Restart backend via PM2
pm2 restart fluxa-backend --update-env
```

---

## Lisensi & Pembuat

Dibuat dengan ❤️ oleh **Rahmat Alfarizi** ([@FlucLight](https://github.com/FlucLight)).  
Dilindungi di bawah lisensi [MIT License](LICENSE).
