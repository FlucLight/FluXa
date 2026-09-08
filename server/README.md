# FluXa Server (Backend & Telegram Bot Engine)

Backend REST API dan Telegram Bot Engine untuk **FluXa Personal Finance Tracker**, dibangun di atas Node.js, Express, PostgreSQL, dan TypeScript.

---

## Teknologi

* **Runtime & Framework:** [Node.js 22+](https://nodejs.org/) + [Express 5](https://expressjs.com/) + [TypeScript](https://www.typescriptlang.org/)
* **Database & Driver:** [PostgreSQL 14+](https://www.postgresql.org/) + `pg` (Connection Pooling)
* **Database Migrations:** [node-pg-migrate](https://salsita.github.io/node-pg-migrate/)
* **Autentikasi & Kriptografi:**
  * JWT (Access & Refresh tokens with HTTP-only cookies)
  * Bcrypt (Password hashing)
  * [openid-client](https://github.com/panva/node-openid-client) (Google OAuth 2.0 / OpenID Connect)
  * [@simplewebauthn/server](https://simplewebauthn.dev/) (Passkeys / WebAuthn)
* **Telegram Bot:** Long polling native via `fetch` (tanpa library bot pihak ketiga & tanpa webhook)
* **Validasi Skema:** [Zod](https://zod.dev/)

---

## Struktur Folder

```text
server/
├── scripts/
│   ├── migrate.ts                  # Runner migrasi DB (up / down)
│   └── setup-db.ts                 # Inisialisasi database lokal
├── migrations/                     # File migrasi skema database
│   ├── 001_create_schema.ts
│   ├── 002_seed_defaults.ts
│   ├── 003_recurring_interval.ts
│   ├── 004_local_hardening.ts
│   ├── 005_performance_indexes.ts
│   ├── 006_auth.ts
│   ├── 007_google_sub.ts
│   ├── 008_passkeys.ts
│   ├── 009_telegram_links.ts
│   └── 010_seed_defaults_for_users.ts
├── src/
│   ├── index.ts                    # Entry point server Express & inisialisasi bot
│   ├── app.ts                      # Konfigurasi middleware Express & router
│   ├── config/
│   │   ├── env.ts                  # Parsing & validasi environment variables
│   │   └── db.ts                   # Inisialisasi PostgreSQL connection pool
│   ├── controllers/                # Handler logika endpoint REST API
│   │   ├── auth.ts                 # Register, login, logout, refresh, pass
│   │   ├── oauth.ts                # Google OAuth callback & redirect
│   │   ├── webauthn.ts             # Registrasi & autentikasi passkey biometrik
│   │   ├── transactions.ts         # CRUD transaksi & quick input
│   │   ├── categories.ts           # CRUD kategori pengeluaran & pemasukan
│   │   ├── paymentMethods.ts       # CRUD akun & rekening pembayaran
│   │   ├── transfers.ts            # CRUD transfer dana internal
│   │   ├── budgets.ts              # CRUD target budget bulanan
│   │   ├── recurring.ts            # CRUD jadwal tagihan berulang
│   │   ├── summary.ts              # Perhitungan total, tren, & saldo realtime
│   │   ├── telegram.ts             # Status tautan & pembuatan kode Telegram
│   │   └── export.ts               # Ekspor CSV, Excel XLSX, & backup JSON
│   ├── repositories/               # Query layer interaksi database PostgreSQL
│   ├── parser/                     # Natural Language Parser (NLP rule-based)
│   │   ├── index.ts                # Tokenizer & matcher teks transaksi
│   │   ├── date.ts                 # Parser frasa waktu bahasa Indonesia
│   │   └── self-check.ts           # Unit test lokal untuk parser
│   ├── telegram/
│   │   └── bot.ts                  # Engine Telegram Bot (polling, state, wizards)
│   ├── services/                   # Service layer pendukung
│   │   ├── auth.ts                 # Hashing password, issue session, verify JWT
│   │   ├── identity.ts             # AsyncLocalStorage konteks user per request
│   │   ├── backup.ts               # Generator & pembersih file backup JSON
│   │   └── mailer.ts               # Pengirim email reset kata sandi (SMTP)
│   └── routes/                     # Definisi rute Express
```

---

## Modul Utama

### 1. Natural Language Parser (NLP Rule-Based)
Membedah kalimat transaksi bahasa Indonesia tanpa biaya LLM/AI eksternal:
* **Nominal:** Memahami format `15rb`, `1.5jt`, `15k`, `150.000`, `15,000`, `150rb`.
* **Metode Pembayaran:** Mencocokkan nama akun dan seluruh alias yang didaftarkan pengguna (misal: `kaltimtara`, `dg`, `qris`, `dana`, `cash`).
* **Kategori:** Mencocokkan kata kunci kategori (misal: `nasi goreng` -> Makan, `bensin` -> Transport).
* **Frasa Tanggal:** Memahami `kemarin`, `2 hari lalu`, `minggu kemarin`, `senin lalu`, `hari ini`, `sekarang`.

### 2. Telegram Bot Engine (`bot.ts`)
* Berjalan mandiri via **Long Polling** tanpa perlu konfigurasi Webhook publik atau SSL cert.
* **Perekaman Waktu Realtime:** Jam, menit, dan detik transaksi dicatat sesuai waktu pengiriman pesan pengguna (Zona Waktu WITA / `Asia/Makassar`).
* **Multi-User Linking:** Pengguna menautkan chat Telegram ke akun web via kode `/link KODE` yang kedaluwarsa dalam 10 menit.
* **Perintah:**
  * `/start` / `/help`: Tampilkan menu dan bantuan.
  * `/ringkasan [hari|minggu|bulan|semua]`: Menampilkan laporan pemasukan, pengeluaran, dan saldo bersih.
  * `/saldo`: Saldo realtime tiap akun dan rekening.
  * `/undo`: Batalkan transaksi terakhir.
  * `/edit`: Edit transaksi terakhir.
  * `/backup`: Kirim file JSON backup langsung ke chat.
  * `/id`: Tampilkan Chat ID.

### 3. Autentikasi & Multi-User
* **Isolasi Data Penuh:** Setiap baris di database memiliki `user_id` yang diekstrak dari session/token.
* **JWT Access Token:** Masa berlaku pendek (default 15 menit) disimpan dalam cookie HTTP-only aman (`COOKIE_SECURE`).
* **Refresh Token Rotation:** Token refresh di-hash (`token_hash`) di tabel `sessions` dan dirotasi setiap kali access token diperbarui.
* **Google OAuth & Passkey:** Pilihan login cepat dengan akun Google atau biometrik sidik jari / Face ID.

---

## Database & Daftar Migrasi

FluXa menggunakan `node-pg-migrate` untuk migrasi skema database terstruktur:

| No | File Migrasi | Penjelasan |
|---|---|---|
| `001` | `001_create_schema.ts` | Membuat tabel awal: `users`, `categories`, `payment_methods`, `transactions`, `budgets`, `account_transfers`, `recurring_transactions`. |
| `002` | `002_seed_defaults.ts` | Seed kategori & payment method default untuk akun owner. |
| `003` | `003_recurring_interval.ts` | Penyesuaian interval tagihan berulang (harian, mingguan, bulanan). |
| `004` | `004_local_hardening.ts` | Penambahan kolom `initial_balance` pada `payment_methods`. |
| `005` | `005_performance_indexes.ts` | Penambahan index komposit pada query filter transaksi. |
| `006` | `006_auth.ts` | Penambahan kolom `email`, `password_hash`, serta tabel `sessions` dan `password_reset_tokens`. |
| `007` | `007_google_sub.ts` | Penambahan kolom `google_sub` untuk integrasi Google OAuth. |
| `008` | `008_passkeys.ts` | Tabel `passkeys` untuk autentikasi WebAuthn / biometrik. |
| `009` | `009_telegram_links.ts` | Tabel `telegram_links` untuk sistem tautan multi-user Telegram. |
| `010` | `010_seed_defaults_for_users.ts` | Auto-seed kategori & metode pembayaran default untuk setiap pengguna baru. |

---

## Environment Variables (`.env`)

```env
# Server & Port
PORT=5000

# Database PostgreSQL
DB_USER=postgres
DB_PASSWORD=password_kamu
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_management

# Autentikasi & Sesi
JWT_SECRET=buat_string_acak_panjang_dan_rahasia
JWT_ACCESS_TTL_MINUTES=15
AUTH_SESSION_DAYS=60
COOKIE_SECURE=0 # Set 1 jika di server produksi HTTPS

# Telegram Bot (Opsional jika ingin mengaktifkan bot)
TELEGRAM_BOT_TOKEN=token_bot_dari_botfather
TELEGRAM_ALLOWED_CHAT_IDS=chat_id_owner

# Google OAuth (Opsional jika ingin fitur login Google)
GOOGLE_CLIENT_ID=client_id_google
GOOGLE_CLIENT_SECRET=client_secret_google
PUBLIC_BASE=https://fluclight.my.id

# SMTP Email Reset Password (Opsional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@domain.com
SMTP_PASS=app_password_email
SMTP_FROM=FluXa Finance <no-reply@domain.com>

# Otomatisasi Backup
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_COUNT=14
```

---

## Perintah Development & Operasional

```bash
# Menjalankan server dev dengan auto-reload (tsx watch)
npm run dev --workspace server

# Menjalankan migrasi database UP
npm run migrate --workspace server

# Melakukan rollback migrasi database DOWN
npm run migrate:down --workspace server

# Menjalankan self-check unit test parser bahasa
npm run test:parser --workspace server

# Melakukan typecheck TypeScript backend
npm run typecheck --workspace server
```
