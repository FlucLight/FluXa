# FluXa Server (Backend & Telegram Bot Engine Documentation)

Dokumentasi teknis komprehensif untuk backend REST API dan mesin Telegram Bot **FluXa Personal Finance Tracker**. Backend ini bertanggung jawab atas integritas data, sistem autentikasi multi-pengguna, pemrosesan bahasa alami (NLP parser) untuk transaksi, integrasi bot Telegram, serta otomatisasi pencadangan database.

---

## Daftar Isi

1. [Teknologi & Infrastruktur](#teknologi--infrastruktur)
2. [Struktur Direktori](#struktur-direktori)
3. [Sistem Autentikasi & Keamanan Multi-User](#sistem-autentikasi--keamanan-multi-user)
4. [Mesin Pemroses Bahasa Alami (NLP Rule-Based Parser)](#mesin-pemroses-bahasa-alami-nlp-rule-based-parser)
5. [Mesin Bot Telegram](#mesin-bot-telegram)
6. [Skema Database & Daftar Migrasi](#skema-database--daftar-migrasi)
7. [Referensi Endpoint REST API](#referensi-endpoint-rest-api)
8. [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
9. [Otomatisasi Backup Database](#otomatisasi-backup-database)
10. [Panduan Menjalankan & Deployment Produksi](#panduan-menjalankan--deployment-produksi)

---

## Teknologi & Infrastruktur

* **Runtime:** [Node.js 22 LTS](https://nodejs.org/) dengan dukungan ES Modules dan AsyncLocalStorage.
* **Web Framework:** [Express 5](https://expressjs.com/) dengan arsitektur modular (Controllers, Repositories, Services, Routes).
* **Bahasa:** [TypeScript 5](https://www.typescriptlang.org/) dengan konfigurasi strict type safety.
* **Database Relasional:** [PostgreSQL 14+](https://www.postgresql.org/) dengan koneksi pooling via library `pg`.
* **Database Migrations:** [node-pg-migrate](https://salsita.github.io/node-pg-migrate/) untuk eksekusi skema database terstruktur dan terversi.
* **Autentikasi & Keamanan:**
  * JWT (JSON Web Tokens) dengan mekanisme rotasi refresh token dan penyimpanan cookie HttpOnly.
  * Bcrypt untuk enkripsi satu arah kata sandi.
  * `openid-client` untuk integrasi Google OAuth 2.0 / OpenID Connect.
  * `@simplewebauthn/server` untuk autentikasi biometrik Passkey berbasis standar FIDO2 / WebAuthn.
* **Bot Telegram:** Menggunakan mekanisme HTTP Long Polling native berbasis `fetch` bawaan Node.js tanpa dependensi framework bot eksternal.
* **Validasi Skema:** [Zod](https://zod.dev/) untuk validasi ketat payload request masuk.

---

## Struktur Direktori

```text
server/
├── package.json                    # Dependency backend & skrip npm
├── tsconfig.json                   # Konfigurasi TypeScript backend
├── scripts/                        # Skrip pemeliharaan database
│   ├── migrate.ts                  # Runner eksekusi migrasi skema (up / down)
│   └── setup-db.ts                 # Skrip pembuatan database lokal
├── backups/                        # Direktori penyimpanan arsip backup JSON otomatis
├── migrations/                     # File migrasi skema database terurut
│   ├── 001_create_schema.ts        # Tabel dasar: users, categories, payment_methods, dll.
│   ├── 002_seed_defaults.ts        # Seed kategori & metode bayar awal
│   ├── 003_recurring_interval.ts   # Penyesuaian interval tagihan berulang
│   ├── 004_local_hardening.ts      # Penambahan saldo awal pada payment methods
│   ├── 005_performance_indexes.ts  # Penambahan indeks komposit performa query
│   ├── 006_auth.ts                 # Penambahan email, password_hash, dan tabel sessions
│   ├── 007_google_sub.ts           # Penambahan kolom google_sub untuk Google OAuth
│   ├── 008_passkeys.ts             # Tabel passkeys untuk autentikasi biometrik
│   ├── 009_telegram_links.ts       # Tabel telegram_links untuk multi-user Telegram
│   └── 010_seed_defaults_for_users.ts # Auto-seed kategori default untuk user baru
└── src/
    ├── index.ts                    # Entry point server Express & inisialisasi background service
    ├── app.ts                      # Inisialisasi Express, middleware global, & routing API
    ├── config/                     # Konfigurasi aplikasi
    │   ├── env.ts                  # Parsing & validasi konfigurasi variabel .env
    │   └── db.ts                   # Inisialisasi pool koneksi PostgreSQL
    ├── controllers/                # Logika penanganan request REST API
    │   ├── auth.ts                 # Registrasi, login, logout, refresh session, ganti password
    │   ├── oauth.ts                # Alur autentikasi Google OAuth 2.0
    │   ├── webauthn.ts             # Registrasi & verifikasi kredensial Passkey
    │   ├── transactions.ts         # Endpoint transaksi, parsing cepat, & riwayat
    │   ├── categories.ts           # Endpoint kategori pemasukan & pengeluaran
    │   ├── paymentMethods.ts       # Endpoint akun & rekening pembayaran
    │   ├── transfers.ts            # Endpoint mutasi transfer dana internal
    │   ├── budgets.ts              # Endpoint target budget bulanan
    │   ├── recurring.ts            # Endpoint jadwal tagihan berulang
    │   ├── summary.ts              # Endpoint kalkulasi ringkasan, tren, & saldo realtime
    │   ├── telegram.ts             # Endpoint manajemen kode tautan Telegram
    │   ├── export.ts               # Endpoint ekspor CSV, Excel, & impor backup JSON
    │   └── profile.ts              # Endpoint upload foto profil pengguna
    ├── repositories/               # Layer query database PostgreSQL terisolasi
    │   ├── users.ts
    │   ├── sessions.ts
    │   ├── passwords.ts
    │   ├── passkeys.ts
    │   ├── telegramLinks.ts
    │   ├── transactions.ts
    │   ├── categories.ts
    │   ├── paymentMethods.ts
    │   ├── transfers.ts
    │   ├── budgets.ts
    │   ├── recurring.ts
    │   └── summary.ts
    ├── parser/                     # Natural Language Processing (Rule-based)
    │   ├── index.ts                # Tokenizer nominal, metode bayar, & kategori
    │   ├── date.ts                 # Parser tanggal alami bahasa Indonesia
    │   └── self-check.ts           # Pengujian mandiri (unit test) logika parser
    ├── telegram/                   # Mesin Bot Telegram
    │   └── bot.ts                  # Long polling, state wizard, konfirmasi transaksi
    ├── middleware/                 # Express middleware
    │   ├── auth.ts                 # Verifikasi JWT cookie & identifikasi pengguna
    │   ├── validate.ts             # Validasi request payload menggunakan Zod
    │   └── errorHandler.ts         # Penanganan error global terpusat
    ├── services/                   # Service layer pendukung
    │   ├── auth.ts                 # Manajemen hashing kata sandi & pembuatan JWT
    │   ├── identity.ts             # Pengelolaan konteks AsyncLocalStorage user_id
    │   ├── backup.ts               # Pembuatan file backup JSON & manajemen retensi
    │   ├── mailer.ts               # Integrasi pengiriman email SMTP untuk reset password
    │   └── oauth.ts                # Alur OpenID Connect klien Google
    └── routes/                     # Definisi rute Express per modul
```

---

## Sistem Autentikasi & Keamanan Multi-User

FluXa dirancang dengan prinsip isolasi data penuh antar pengguna (*multi-tenant per-user*). Setiap tabel transaksi, kategori, rekening, budget, dan tagihan memiliki kolom `user_id`.

### 1. Sesi & Token JWT
* **Access Token:** Ditandatangani dengan rahasia `JWT_SECRET` dengan masa berlaku pendek (default 15 menit) dan dikirimkan ke klien melalui cookie `HttpOnly` bernama `access_token`.
* **Refresh Token Rotation:** Token refresh disimpan dalam cookie `HttpOnly` bernama `refresh_token`. Setiap kali refresh token digunakan untuk memperpanjang sesi, token lama langsung dicabut (*revoked*) dan digantikan dengan pasangan token baru yang tercatat pada tabel `sessions`.
* **Keamanan Cookie:** Variabel `COOKIE_SECURE=1` memastikan cookie hanya dapat ditransmisikan melalui protokol aman HTTPS di lingkungan produksi.

### 2. Pilihan Masuk (Multi-Auth Provider)
* **Email & Kata Sandi:** Kata sandi di-hash menggunakan algoritma Bcrypt dengan salt cost standar industri.
* **Google OAuth 2.0 (OpenID Connect):** Pengguna dapat masuk langsung menggunakan akun Google mereka. Sistem mencocokkan subjek unik Google (`google_sub`) atau alamat email yang terverifikasi.
* **Passkey / WebAuthn:** Menggunakan standar FIDO2 modern yang memungkinkan pengguna login menggunakan sidik jari (Touch ID / Fingerprint), pengenalan wajah (Face ID), atau kunci keamanan hardware tanpa memerlukan kata sandi.

### 3. Konteks Identitas Terisolasi (`identity.ts`)
Menggunakan fitur bawaan Node.js `AsyncLocalStorage`. Setelah middleware `authenticate` memverifikasi token JWT, ID pengguna (`userId`) dimasukkan ke dalam konteks asinkron request sehingga seluruh query di layer repository secara otomatis menyertakan filter `WHERE user_id = $1`.

---

## Mesin Pemroses Bahasa Alami (NLP Rule-Based Parser)

Terletak di folder `src/parser/`. Parser ini dirancang khusus untuk membedah kalimat transaksi berbahasa Indonesia sehari-hari secara cepat tanpa ketergantungan pada model AI / LLM eksternal:

### 1. Ekstraksi Nominal Uang
Mendukung berbagai ragam penulisan angka dan singkatan satuan:
* `25rb`, `25ribu`, `25k` -> 25.000
* `1.5jt`, `1,5juta`, `2m` -> 1.500.000 / 2.000.000
* `150.000` (pemisah titik) -> 150.000
* `150,000` (pemisah koma) -> 150.000
* `350 ratus` -> 35.000

### 2. Ekstraksi Metode Pembayaran
Mencocokkan nama rekening akun serta daftar alias kata kunci kustom yang didaftarkan oleh pengguna (contoh: `kaltimtara`, `dg`, `bpd`, `qris`, `dana`, `cash`, `tunai`, `mandiri`).

### 3. Ekstraksi Kategori
Mencocokkan kata kunci kategori (contoh: `nasi padang`, `kopi`, `ayam geprek` dicocokkan ke kategori *Makan*; `bensin`, `pertalite`, `ojek` ke kategori *Transport*).

### 4. Ekstraksi Waktu Relatif
Membedah frasa waktu relatif dalam zona waktu WITA (`Asia/Makassar`):
* `hari ini`, `sekarang` -> waktu saat ini secara realtime
* `kemarin`, `hari kemarin` -> waktu saat ini pada 1 hari sebelumnya
* `kemarin lusa` -> 2 hari sebelumnya
* `2 minggu lalu`, `3 hari yang lalu` -> kalkulasi offset waktu otomatis
* `senin lalu`, `minggu kemarin` -> mencocokkan hari spesifik pada minggu sebelumnya

---

## Mesin Bot Telegram

Terletak di `src/telegram/bot.ts`. Bot Telegram FluXa berjalan mandiri sebagai service internal:

### 1. Polling Tanpa Webhook
Menggunakan mekanisme **HTTP Long Polling** yang memanggil endpoint `getUpdates` Telegram API secara berkala. Hal ini membuat bot dapat berjalan di balik firewall, NAT, atau server internal tanpa memerlukan domain publik HTTPS terpisah untuk bot.

### 2. Perekaman Jam & Menit Realtime
Setiap transaksi yang dicatat via bot mengambil timestamp waktu pesan dikirimkan oleh pengguna (`message.date`) dan dikonversi ke zona waktu WITA (`Asia/Makassar`), memastikan waktu yang tersimpan bukan jam 00:00.

### 3. Sistem Tautan Multi-User
Pengguna menghubungkan chat Telegram mereka dengan akun FluXa melalui kode unik:
1. Pengguna meminta kode di web aplikasi (menu Akun -> "Hubungkan Telegram").
2. Backend menghasilkan kode unik 8 karakter acak (tanpa karakter ambigu seperti `0`, `O`, `1`, `I`) yang di-hash di tabel `telegram_links` dengan masa berlaku 10 menit.
3. Pengguna mengirimkan kode ke bot melalui perintah `/link KODE` atau tautan deep link `/start KODE`.
4. Chat ID Telegram secara otomatis terikat ke akun pengguna tersebut.

### 4. Daftar Perintah Bot

| Perintah | Deskripsi Fungsi |
|:---|:---|
| `/start` atau `/help` | Menampilkan menu utama dan bantuan navigasi |
| `/ringkasan [periode]` | Menampilkan total pemasukan, pengeluaran, dan saldo bersih (hari, minggu, bulan, atau semua) |
| `/saldo` | Menampilkan saldo berjalan setiap rekening bank, e-wallet, dan kas tunai |
| `/undo` | Membatalkan transaksi terakhir yang dicatat via Telegram |
| `/edit` | Mengubah nominal atau keterangan transaksi terakhir via Telegram |
| `/backup` | Menghasilkan dan mengirimkan file backup JSON database langsung ke chat |
| `/link KODE` | Menautkan chat Telegram aktif ke akun web FluXa |
| `/unlink` | Melepaskan tautan akun dari chat Telegram aktif |
| `/id` | Menampilkan ID chat Telegram pengguna |

---

## Skema Database & Daftar Migrasi

Daftar seluruh file migrasi pada folder `migrations/`:

| Versi | Nama File Migrasi | Deskripsi Perubahan Skema |
|:---|:---|:---|
| `001` | `001_create_schema.ts` | Membuat tabel awal: `users`, `categories`, `payment_methods`, `transactions`, `budgets`, `account_transfers`, `recurring_transactions`. |
| `002` | `002_seed_defaults.ts` | Memasukkan kategori default (Makan, Transportasi, Belanja, Tagihan, Gaji, dll.) dan metode pembayaran default untuk akun owner. |
| `003` | `003_recurring_interval.ts` | Menambahkan dukungan interval tagihan berulang berbasis hari, minggu, dan bulan. |
| `004` | `004_local_hardening.ts` | Menambahkan kolom `initial_balance` pada tabel `payment_methods`. |
| `005` | `005_performance_indexes.ts` | Menambahkan indeks database komposit untuk mempercepat filter transaksi. |
| `006` | `006_auth.ts` | Menambahkan kolom `email`, `password_hash`, serta membuat tabel `sessions` dan `password_reset_tokens`. |
| `007` | `007_google_sub.ts` | Menambahkan kolom `google_sub` pada tabel `users` untuk integrasi Google OAuth. |
| `008` | `008_passkeys.ts` | Membuat tabel `passkeys` untuk menyimpan public key biometrik WebAuthn. |
| `009` | `009_telegram_links.ts` | Membuat tabel `telegram_links` untuk penautan chat ID multi-user Telegram. |
| `010` | `010_seed_defaults_for_users.ts` | Mengisi otomatis kategori dan metode pembayaran default ke setiap pengguna baru yang mendaftar. |

---

## Referensi Endpoint REST API

Semua rute API diawali dengan prefix `/api`:

### 1. Autentikasi (`/api/auth`)
* `POST /auth/register` : Mendaftarkan akun baru (nama, email, password).
* `POST /auth/login` : Masuk menggunakan email dan password.
* `POST /auth/logout` : Menghapus sesi dan mencabut cookie autentikasi.
* `POST /auth/refresh` : Memperbarui access token menggunakan refresh token yang valid.
* `GET /auth/me` : Mendapatkan profil pengguna yang sedang login.
* `POST /auth/change-password` : Mengubah kata sandi pengguna aktif.
* `POST /auth/forgot` : Mengirim email instruksi reset kata sandi via SMTP.
* `POST /auth/reset` : Mengatur ulang kata sandi menggunakan token reset.
* `GET /auth/providers` : Memeriksa ketersediaan penyedia login (Google, Passkey).
* `GET /auth/google/login` : Mengalihkan pengguna ke halaman autentikasi Google.
* `GET /auth/google/callback` : Menerima authorization code dari Google OAuth.
* `POST /auth/webauthn/register/start` : Memulai pembuatan opsi pendaftaran Passkey.
* `POST /auth/webauthn/register/verify` : Memverifikasi dan menyimpan kunci publik Passkey.
* `POST /auth/webauthn/login/start` : Memulai proses tantangan (*challenge*) login Passkey.
* `POST /auth/webauthn/login/verify` : Memverifikasi respons biometrik dan menerbitkan sesi login.

### 2. Transaksi (`/api/transactions`)
* `GET /transactions` : Mengambil daftar transaksi dengan filter tanggal, kategori, akun, dan pencarian.
* `POST /transactions` : Membuat transaksi baru secara manual.
* `POST /transactions/quick` : Membuat transaksi instan dari kalimat percakapan alami.
* `POST /transactions/parse` : Menguji hasil parsing kalimat tanpa menyimpannya ke database.
* `PATCH /transactions/:id` : Memperbarui data transaksi yang sudah ada.
* `DELETE /transactions/:id` : Menghapus transaksi (*soft-delete*).
* `POST /transactions/:id/restore` : Memulihkan kembali transaksi yang berada di recycle bin.

### 3. Akun Pembayaran (`/api/payment-methods`)
* `GET /payment-methods` : Mengambil seluruh daftar rekening bank, e-wallet, dan kas tunai.
* `POST /payment-methods` : Menambahkan rekening/akun pembayaran baru.
* `PATCH /payment-methods/:id` : Memperbarui nama, tipe, alias kata kunci, atau saldo awal akun.
* `DELETE /payment-methods/:id` : Menghapus akun pembayaran.

### 4. Kategori (`/api/categories`)
* `GET /categories` : Mengambil daftar kategori pemasukan dan pengeluaran.
* `POST /categories` : Menambahkan kategori baru.
* `PATCH /categories/:id` : Mengubah nama, tipe, atau kata kunci kategori.
* `DELETE /categories/:id` : Menghapus kategori.

### 5. Transfer Dana (`/api/transfers`)
* `GET /transfers` : Mengambil riwayat perpindahan dana antar akun.
* `POST /transfers` : Mencatat transfer dana baru dari satu akun ke akun lain.
* `DELETE /transfers/:id` : Menghapus catatan transfer.

### 6. Budget Bulanan (`/api/budgets`)
* `GET /budgets` : Mengambil daftar limit budget untuk bulan dan tahun tertentu.
* `POST /budgets` : Menetapkan limit budget baru untuk suatu kategori di bulan tertentu.
* `PATCH /budgets/:id` : Memperbarui batas limit budget.
* `DELETE /budgets/:id` : Menghapus limit budget.

### 7. Tagihan Berulang (`/api/recurring`)
* `GET /recurring` : Mengambil daftar template jadwal tagihan rutin.
* `POST /recurring` : Membuat jadwal tagihan rutin baru.
* `PATCH /recurring/:id` : Memperbarui detail tagihan atau mengubah status aktif/jeda.
* `DELETE /recurring/:id` : Menghapus jadwal tagihan.

### 8. Ringkasan Finansial (`/api/summary`)
* `GET /summary/totals` : Mengambil total pemasukan, pengeluaran, dan net income pada rentang tanggal.
* `GET /summary/balances` : Mengambil saldo berjalan realtime dari setiap akun pembayaran.
* `GET /summary/trends` : Mengambil data agregasi tren keuangan untuk grafik.

### 9. Integrasi Telegram (`/api/telegram`)
* `GET /telegram/link` : Memeriksa status penautan chat Telegram akun aktif.
* `POST /telegram/link/start` : Membuat kode 8 karakter unik untuk ditautkan ke bot Telegram.
* `DELETE /telegram/link` : Memutuskan hubungan chat Telegram dari akun aktif.

### 10. Ekspor & Backup (`/api/export`)
* `GET /export/csv` : Mengunduh file spreadsheet CSV seluruh transaksi.
* `GET /export/xlsx` : Mengunduh file Microsoft Excel XLSX seluruh transaksi.
* `GET /export/json` : Mengunduh file backup JSON database utuh.
* `POST /export/json` : Mengunggah dan merestore data dari file backup JSON.

---

## Konfigurasi Environment Variables

Buat file `.env` di direktori root repository dengan parameter berikut:

```env
# Port server Express
PORT=5000

# Konfigurasi Database PostgreSQL
DB_USER=postgres
DB_PASSWORD=password_database_anda
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_management

# Konfigurasi Kunci Rahasia Sesi (Gunakan string acak minimal 32 karakter)
JWT_SECRET=rahasia_jwt_sangat_panjang_dan_acak_123456789
JWT_ACCESS_TTL_MINUTES=15
AUTH_SESSION_DAYS=60

# Pengaturan Keamanan Cookie (Set 0 untuk HTTP lokal, Set 1 untuk HTTPS produksi)
COOKIE_SECURE=0

# Konfigurasi Telegram Bot (Opsional)
TELEGRAM_BOT_TOKEN=token_bot_dari_botfather
TELEGRAM_ALLOWED_CHAT_IDS=chat_id_owner

# Konfigurasi Google OAuth 2.0 (Opsional)
GOOGLE_CLIENT_ID=client_id_dari_google_cloud
GOOGLE_CLIENT_SECRET=client_secret_dari_google_cloud
PUBLIC_BASE=https://fluclight.my.id

# Konfigurasi Pengiriman Email SMTP (Opsional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@domain.com
SMTP_PASS=app_password_email
SMTP_FROM=FluXa Finance <no-reply@domain.com>

# Pengaturan Retensi Backup Otomatis
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_COUNT=14
```

---

## Otomatisasi Backup Database

Terletak di `src/services/backup.ts`. Server FluXa memiliki penjadwal backup bawaan yang bekerja secara otomatis:
* **Jadwal Eksekusi:** Berjalan otomatis setiap interval tertentu (default setiap 24 jam berdasarkan `BACKUP_INTERVAL_HOURS`).
* **Format File:** File JSON lengkap berisi seluruh data transaksi, kategori, akun, transfer, dan budget disimpan di folder `server/backups/`.
* **Rotasi & Retensi:** Menjaga jumlah file backup maksimal sesuai `BACKUP_RETENTION_COUNT` (default 14 file) dan menghapus file backup terlama secara otomatis untuk menghemat ruang disk.
* **On-Demand:** Pengguna dapat meminta file backup dikirimkan langsung ke aplikasi chat Telegram kapan saja menggunakan perintah `/backup`.

---

## Panduan Menjalankan & Deployment Produksi

### 1. Perintah Pengembangan Lokal
Jalankan perintah ini dari root repository workspace:

```bash
# Menjalankan server backend dalam mode pengembangan dengan auto-reload (tsx watch)
npm run dev --workspace server

# Menjalankan seluruh migrasi skema database PostgreSQL ke versi terbaru
npm run migrate --workspace server

# Melakukan rollback (down) 1 langkah migrasi skema database
npm run migrate:down --workspace server

# Menjalankan pengujian logika parser bahasa alami
npm run test:parser --workspace server

# Memeriksa validasi tipe TypeScript backend
npm run typecheck --workspace server
```

### 2. Deployment ke Server VPS Produksi (Ubuntu/Debian)

#### Langkah 1: Clone & Konfigurasi
```bash
cd /home/superadmin/FluXa
git pull
cp .env.example .env
# Edit .env dan pastikan COOKIE_SECURE=1
nano .env
```

#### Langkah 2: Migrasi Database & Build Frontend
```bash
npm install
npm run migrate
npm run build -w client
```

#### Langkah 3: Konfigurasi Process Manager (PM2)
```bash
# Menjalankan server backend via PM2
pm2 start "npm run start --workspace server" --name fluxa-backend

# Menyimpan status service PM2 agar otomatis berjalan saat VPS reboot
pm2 save
pm2 startup
```

#### Langkah 4: Konfigurasi Nginx Web Server
Konfigurasi Nginx untuk menyajikan file static frontend dari `client/dist` dan mem-proxy request `/api` ke Express di port 5000:

```nginx
server {
    server_name fluclight.my.id;

    # Frontend Static Files
    root /home/superadmin/FluXa/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend REST API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 80;
}
```

Untuk petunjuk antarmuka pengguna web frontend, silakan pelajari dokumentasi di [**`client/README.md`**](../client/README.md).
