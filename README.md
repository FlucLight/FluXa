<div align="center">

<img src="https://img.shields.io/badge/FluXa-Personal%20Finance-334155?style=for-the-badge&labelColor=1B1C1F&color=334155" alt="FluXa Personal Finance" height="40">

### Catat, pantau, dan kendalikan keuangan pribadimu — cukup lewat chat.

FluXa adalah aplikasi pencatatan keuangan pribadi **modern, gratis, dan multi-pengguna** dengan dua pintu masuk utama: **Aplikasi Web** yang responsif dan **Bot Telegram**. Tanpa kerumitan spreadsheet manual dan tanpa biaya token AI/LLM — seluruh pemrosesan teks percakapan ditangani secara lokal oleh parser berbasis aturan (*rule-based NLP*) berkecepatan tinggi.

</div>

---

## Coba Langsung (Production)

| Layanan | Tautan Akses & Keterangan |
|:---|:---|
| Website Aplikasi | [https://fluclight.my.id](https://fluclight.my.id) — Akses via browser (desktop & smartphone) |
| Bot Telegram | [@fluclight_finance_bot](https://t.me/fluclight_finance_bot) — Catat transaksi langsung dari aplikasi chat |
| Tautan Cepat | Buka bot lalu kirim `/start` untuk menu; tautkan ke akunmu via kode dari web |

> **Petunjuk Menghubungkan Akun ke Telegram:**
> 1. Daftar atau login di web [https://fluclight.my.id](https://fluclight.my.id).
> 2. Buka menu **Akun -> "Hubungkan Telegram"**, lalu klik tombol **"Buat kode tautan"**.
> 3. Klik tombol **"Buka bot & kirim kode"**. Dalam hitungan detik chat Telegram kamu otomatis terhubung dan siap mencatat transaksi ke akunmu secara instan.

---

## Tangkapan Layar Aplikasi

<div align="center">
<img src="docs/screenshot-dashboardv2.png" width="820" alt="Dashboard FluXa">
<p><i>Dashboard Utama — ringkasan bulanan, tren pengeluaran/pemasukan, breakdown kategori, saldo berjalan per akun, dan target budget.</i></p>
</div>

<br>

<table>
<tr>
<td width="50%" align="center">
<img src="docs/screenshot-quick-input.png" width="380" alt="Quick Input">
<p><i>Quick Input — ketik transaksi bergaya percakapan alami, hasil parsing terdeteksi otomatis sebelum disimpan</i></p>
</td>
<td width="50%" align="center">
<img src="docs/screenshot-telegram-chat.png" width="380" alt="Bot Telegram">
<p><i>Bot Telegram — catat transaksi dari chat lengkap dengan konfirmasi dan perekaman jam realtime</i></p>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshot-transactions.png" width="380" alt="Halaman Transaksi">
<p><i>Halaman Transaksi — tabel data lengkap, filter multi-kriteria, pencarian teks, dan aksi hapus massal</i></p>
</td>
<td width="50%" align="center">
<img src="docs/screenshot-dashboard.png" width="380" alt="Dashboard Alternatif">
<p><i>Dashboard — tampilan alternatif ringkasan keuangan dan visualisasi alokasi pengeluaran</i></p>
</td>
</tr>
</table>

---

## Panduan Menjalankan Aplikasi & Dokumentasi Direktori

FluXa dibangun menggunakan arsitektur **Monorepo (npm workspaces)** yang memisahkan aplikasi antarmuka pengguna frontend dan backend API secara modular.

Untuk instruksi menjalankan, panduan arsitektur, dan dokumentasi detail masing-masing komponen, **silakan pelajari dokumentasi spesifik pada masing-masing folder**:

| Modul | Dokumen Panduan | Cakupan Penjelasan & Instruksi |
|:---|:---|:---|
| **Frontend Web App** | [**`client/README.md`**](client/README.md) | Panduan lengkap menjalankan React 19 + Vite, daftar seluruh halaman (Dashboard, Transaksi, Akun Kustom, Transfer, Budget Arsip, Tagihan, Export), sistem modal interaktif, komponen `CurrencyInput` pemisah ribuan titik, dan perintah build frontend. |
| **Backend & Bot Engine** | [**`server/README.md`**](server/README.md) | Panduan lengkap menjalankan Node.js Express 5 + PostgreSQL, sistem autentikasi JWT/OAuth/Passkey, mesin NLP parser kalimat bahasa Indonesia, mesin bot Telegram polling, daftar 10 file migrasi database, dan environment variables. |
| **Shared Schema** | `shared/src/index.ts` | Definisi tipe data TypeScript bersama dan skema validasi Zod untuk transaksi, akun pembayaran, kategori, dan budget. |

---

## Mengenal FluXa

FluXa lahir dari kebutuhan pencatatan keuangan pribadi yang cepat tanpa gesekan (*frictionless*). Seringkali orang malas mencatat pengeluaran karena harus membuka aplikasi yang berat, memilih form yang rumit, atau mengetik di spreadsheet yang berantakan.

### Konsep Utama:
1. **Pencatatan Secepat Mengobrol:** Tulis kalimat seperti biasa (misalnya `Nasi padang 25rb cash kemarin` atau `Bensin 50rb kaltimtara`), dan sistem otomatis mengekstrak nominal uang, kategori pengeluaran, metode pembayaran, serta tanggal transaksi.
2. **Tanpa Ketergantungan LLM/AI Berbayar:** Menggunakan algoritma tokenizer dan regex rule-based cerdas yang berjalan dalam hitungan milidetik secara lokal di server tanpa biaya API token.
3. **Penyimpanan Terpusat PostgreSQL:** Data transaksi tersimpan aman di database relasional terstruktur dengan dukungan multi-user dan isolasi data per pengguna.
4. **Dua Pintu Masuk:** Pengguna dapat mencatat saat santai lewat dashboard web atau saat sedang di jalan lewat bot Telegram di smartphone.

---

## Fitur Unggulan

* **Integrasi Bot Telegram Penuh:** Catat transaksi via chat atau tombol terpandu, ringkasan berkala, cek saldo, batalkan transaksi terakhir (`/undo`), edit transaksi (`/edit`), dan backup database langsung ke ruang chat.
* **Perekaman Waktu Realtime:** Jam, menit, dan detik transaksi dari Telegram bot tercatat akurat sesuai waktu pengiriman pesan (Zona Waktu WITA / `Asia/Makassar`).
* **Quick Input Bar:** Auto-parse kalimat transaksi saat mengetik dengan mekanisme *debounce* dan tombol konfirmasi cepat.
* **Kustomisasi Akun & Rekening Bebas:** Tambahkan rekening bank (BCA, Mandiri, Kaltimtara, BRI), e-wallet/QRIS (DANA, Gopay, OVO, ShopeePay), kartu kredit (Visa), hingga uang tunai lengkap dengan alias kata kunci bot.
* **Budget Bulanan & Arsip Riwayat:** Tentukan target limit pengeluaran per kategori, evaluasi status overbudget vs hemat, dan jelajahi arsip riwayat bulan-bulan lampau via navigator bulan/tahun.
* **Transfer Antar Akun:** Catat mutasi pemindahan dana antar rekening/dompet sendiri tanpa mempengaruhi laporan cash flow.
* **Tagihan Berulang:** Penjadwalan tagihan rutin per hari, minggu, atau bulan dengan tombol aktif/jeda.
* **Pemisah Ribuan Titik Otomatis:** Input nominal uang otomatis terformat titik (`10.000` -> `Rp 10.000`) di seluruh modal dan form.
* **Modal Notifikasi Tengah Interaktif:** Setiap aksi menghasilkan umpan balik modal di tengah layar yang jelas dan interaktif.
* **Multi-User & Keamanan Lengkap:** Login email/password (bcrypt), Google OAuth 2.0, Passkeys (WebAuthn), dan cookie HTTP-only JWT.
* **Backup & Restore Portabel:** Ekspor transaksi ke format Spreadsheet CSV, Excel (XLSX), serta unduh/restore file backup database JSON utuh.

---

## Arsitektur Sistem

```text
Telegram App (User Chat) ─────────────┐
  │ Long Polling (getUpdates)          │
  └─────────────────────────────┐      │
                                ▼      ▼
Browser (Web Client) ──── React 19 + TanStack Query ──> /api/ ──┐
                                                                ▼
                                                     Express REST API (Server)
                                                         │  Middleware Auth
                                                         │  (JWT HttpOnly Cookie)
                                      ┌───────────┬──────┴────┬───────────┬──────────┐
                                      ▼           ▼           ▼           ▼          ▼
                                 Controllers Repositories NLP Parser Google OAuth Passkey
                                      │           │           │           │          │
                                      └───────────┴─────┬─────┴───────────┴──────────┘
                                                        ▼
                                             PostgreSQL 14+ Database
                                                        │
                                            Automated Scheduled Backup
                                            (JSON files in server/backups)
```

---

## Quick Start (Menjalankan Monorepo Lokal)

### Prasyarat Sistem
* **Node.js** versi 22+
* **npm** versi 10+
* **PostgreSQL** versi 14+

### 1. Clone Repository & Install Dependency
```bash
git clone https://github.com/FlucLight/FluXa.git
cd FluXa
npm install
```

### 2. Konfigurasi Environment (`.env`)
Salin file template `.env.example` menjadi `.env` di root project:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi database PostgreSQL dan kunci rahasia:
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
# 1. Jalankan seluruh migrasi database PostgreSQL ke versi terbaru
npm run migrate

# 2. Jalankan server backend dan frontend client secara bersamaan
npm run dev
```

* Backend REST API aktif di: `http://localhost:5000`
* Frontend Web App aktif di: `http://localhost:5173`

> **Instruksi Khusus:**
> * Untuk menjalankan atau mengonfigurasi **Frontend saja**, buka panduan di [**`client/README.md`**](client/README.md).
> * Untuk menjalankan atau mengonfigurasi **Backend & Bot Telegram saja**, buka panduan di [**`server/README.md`**](server/README.md).

---

## Daftar Perintah Kerja Monorepo

| Perintah | Fungsi |
|:---|:---|
| `npm run dev` | Menjalankan backend server dan frontend client secara bersamaan (monorepo) |
| `npm run dev:client` | Menjalankan hanya development server frontend Vite |
| `npm run migrate` | Menjalankan seluruh migrasi skema database PostgreSQL ke versi terbaru |
| `npm run migrate:down` | Melakukan rollback 1 langkah migrasi skema database |
| `npm run test:parser` | Menjalankan unit test pengujian mandiri NLP rule-based parser |
| `npm run build -w client` | Memvalidasi tipe dan mengompilasi bundle produksi frontend ke `client/dist` |
| `npm run typecheck` | Memvalidasi tipe data TypeScript di seluruh workspace |

---

## Panduan Deploy ke Server Produksi (VPS)

Berikut langkah-langkah memperbarui atau mendeploy aplikasi pada server VPS (Ubuntu/Debian) yang menggunakan PM2 dan Nginx:

```bash
# 1. Masuk ke direktori aplikasi di server
cd /home/superadmin/FluXa

# 2. Ambil pembaruan kode terbaru dari repositori GitHub
git pull

# 3. Jalankan migrasi database jika ada perubahan skema baru
npm run migrate

# 4. Restart service backend via PM2
pm2 restart fluxa-backend --update-env
```

Untuk detail konfigurasi Nginx reverse proxy dan systemd service, silakan pelajari panduan deployment di [**`server/README.md`**](server/README.md).

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
