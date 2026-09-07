<div align="center">

<img src="https://img.shields.io/badge/FluXa-Personal%20Finance-334155?style=for-the-badge&labelColor=1B1C1F&color=334155" alt="FluXa Personal Finance" height="40">

### Catat, pantau, dan kendalikan keuangan pribadimu — cukup lewat chat.

FluXa adalah aplikasi pencatatan keuangan pribadi **modern, gratis, dan multi-pengguna** dengan dua pintu masuk: **web app** yang responsif dan **bot Telegram**. Tanpa spreadsheet berantakan, tanpa biaya LLM — semua pemahaman transaksi ditangani parser rule-based lokal.

</div>

---

## Coba Langsung (Production)

| | |
|:--|:--|
| 🌐 **Website** | [https://fluclight.my.id](https://fluclight.my.id) — akses via browser (desktop & HP) |
| 🤖 **Bot Telegram** | [@fluclight_finance_bot](https://t.me/fluclight_finance_bot) — catat transaksi dari chat |
| 🔗 **Tautan cepat** | Buka bot lalu kirim `/start` untuk panel menu; hubungkan ke akunmu lewat kode dari web |

> [!TIP]
> Bagi pengguna baru: daftar/login di web, lalu buka menu **Akun → "Hubungkan Telegram"**, buat kode, klik **"Buka bot & kirim kode"** — dalam hitungan detik kamu bisa mencatat keuangan langsung dari chat Telegram.

---

## Daftar Isi

- [Tentang FluXa](#tentang-fluxa)
- [Fitur Unggulan](#fitur-unggulan)
- [Bot Telegram](#bot-telegram)
- [Autentikasi & Multi-User](#autentikasi--multi-user)
- [Teknologi](#teknologi)
- [Arsitektur](#arsitektur)
- [Quick Start (Development)](#quick-start-development)
- [Cara Menggunakan](#cara-menggunakan)
- [API](#api)
- [Deploy Produksi (VPS)](#deploy-produksi-vps)
- [Struktur Project](#struktur-project)
- [Perintah Development](#perintah-development)
- [Keamanan](#keamanan)
- [Roadmap](#roadmap)

<br>

## Tentang FluXa

FluXa menyimpan semua data di **PostgreSQL**. Backend menyediakan **REST API** aman dengan autentikasi (cookie + JWT access token, refresh token), dan frontend tersusun rapi dalam dashboard minimalis hitam-putih beraksen hijau/merah untuk pemasukan/pengeluaran.

Inti FluXa adalah **Quick Input**: tulis transaksi seperti sedang mengobrol, dan sistem mem-parsing-nya menjadi data terstruktur — di web maupun di Telegram, **tanpa biaya LLM sama sekali**.

```text
Input:   Nasi goreng 15rb mandiri kemarin
Output:  Rp 15.000 · Kategori: Makanan · Metode: Mandiri · Tanggal: kemarin (WITA) · Confidence: high
```

Nominal, metode pembayaran, kategori, tanggal, dan keterangan dibaca otomatis oleh **parser rule-based**. Hasil selalu ditinjau dulu sebelum disimpan; transaksi yang tidak yakin otomatis diberi tanda `review`.

Setiap **akun baru otomatis di-seed** dengan kategori & payment method default milik akun owner — jadi langsung bisa mengetik `makan 25k cash`, `bensin 50rb`, dst. dan hasil parsingnya sama di semua akun.

<br>

## Tangkapan Layar

<div align="center">
<img src="docs/screenshot-dashboardv2.png" width="820" alt="Dashboard FluXa">
<p><i>Dashboard — ringkasan bulanan, tren, breakdown kategori, saldo per akun, dan progress budget</i></p>
</div>

<br>

<table>
<tr>
<td width="50%" align="center">
<img src="docs/screenshot-quick-input.png" width="380" alt="Quick Input">
<p><i>Quick Input — ketik transaksi, hasil parsing muncul otomatis sebelum disimpan</i></p>
</td>
<td width="50%" align="center">
<img src="docs/screenshot-telegram-chat.png" width="380" alt="Bot Telegram">
<p><i>Bot Telegram — catat transaksi dari chat dengan konfirmasi</i></p>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshot-transactions.png" width="380" alt="Halaman Transaksi">
<p><i>Halaman Transaksi — tabel, filter, dan hapus massal</i></p>
</td>
<td width="50%" align="center">
<img src="docs/screenshot-dashboard.png" width="380" alt="Dashboard (tampilan lain)">
<p><i>Dashboard — tampilan lain dari ringkasan keuangan</i></p>
</td>
</tr>
</table>

## Fitur Unggulan

| # | Fitur | Keunggulan |
|:-:|:--|:--|
| 1 | **Bot Telegram** | Catat transaksi langsung dari chat, ringkasan & saldo satu ketukan, undo/edit, backup ke chat, tautkan ke akun mana pun via kode — berjalan lokal via long polling, tanpa server publik. |
| 2 | **Autentikasi & multi-user** | Register/login email + password, **Login dengan Google (OAuth)**, **Passkey (WebAuthn)**, session cookie HTTP-only + refresh token. Setiap akun punya data sendiri-sendiri. |
| 3 | **Quick Input otomatis** | Auto-parse saat mengetik (debounce 350ms) di web — cukup satu tombol **Simpan**. Mendukung `15rb`, `1.5jt`, `15.000`, `15k` dan frasa tanggal `kemarin`, `senin lalu`, `2 minggu lalu`. |
| 4 | **Dashboard bulanan** | Ringkasan total, rasio tabungan, tren, breakdown kategori, saldo per akun, progress budget — navigasi antar bulan `‹ ›`. |
| 5 | **Manajemen akun & saldo** | Saldo awal, saldo berjalan per akun, transfer antar cash/bank/e-wallet. |
| 6 | **Transaksi berulang** | Template tagihan/pemasukan rutin dengan interval fleksibel, progress, dan pengingat jatuh tempo di dashboard. |
| 7 | **Backup otomatis** | Backup JSON lengkap terjadwal (default tiap 24 jam, retensi 14 file) + backup on-demand dari bot Telegram. |
| 8 | **Zona waktu WITA** | Semantik hari & waktu konsisten dalam `Asia/Makassar` (UTC+8): dari parser, dashboard, hingga bot. |

<br>

## Bot Telegram

> Fitur andalan FluXa. Semua interaksi lewat chat — tanpa membuka browser.

Berjalan sebagai **local bot** menggunakan Telegram **long polling** (native `fetch`, tanpa dependency eksternal). Cukup jalan di mesin yang sama dengan server — **tidak perlu webhook, HTTPS publik, atau server bot terpisah**.

### Menghubungkan chat ke akunmu (kode tautan)

Bot bisa digunakan oleh **banyak orang**, masing-masing mencatat ke akunnya sendiri. Cara menghubungkannya:

1. Login di web [https://fluclight.my.id](https://fluclight.my.id) → menu **Akun → "Hubungkan Telegram"**.
2. Klik **"Buat kode tautan"** — kode 8 karakter muncul (hanya berlaku **10 menit**). Ikuti countdown di panel.
3. Klik **"Buka bot & kirim kode"** — kode terkirim otomatis ke bot lewat deep link `https://t.me/fluclight_finance_bot?start=<KODE>`.
4. Bot membalas **"Berhasil ditautkan!"** — panel web berubah menjadi "terhubung".
5. Selesai. Semua transaksi dari chat itu masuk ke akunmu.

Alternatif kirim manual: ketik `/link KODE`, `/start KODE`, atau cukup kode polosnya (`CPV9DVMV`) — semua diterima.

> [!NOTE]
> Chat yang **belum** tertaut hanya bisa mengirim kode tautan; perintah lain dibalas dengan petunjuk menghubungkan. Akun owner dapat memakai `TELEGRAM_ALLOWED_CHAT_IDS` untuk akses langsung sebelum fitur tautan dipakai.

### Perintah

| Perintah | Fungsi |
|:--|:--|
| `/start` atau `/help` | Tampilkan bantuan & panel menu |
| `/ringkasan [hari\|minggu\|bulan\|semua]` | Ringkasan keuangan (default: bulan berjalan) |
| `/saldo` | Saldo setiap akun |
| `/undo` | Batalkan transaksi Telegram terakhir |
| `/edit` | Edit transaksi Telegram terakhir |
| `/backup` | Kirim file backup JSON lengkap ke chat |
| `/link KODE` | Tautkan chat ke akun FluXa |
| `/unlink` | Lepas chat dari akun FluXa |
| `/id` | Tampilkan chat ID kamu |
| `/batal` | Batalkan proses yang sedang berjalan |

### Panel Menu

```text
[ Makan ]          [ Transportasi ]
[ Belanja ]        [ Tagihan ]
[ Gaji ]           [ Lainnya ]
[ Ringkasan ]      [ Saldo akun ]
[ Undo terakhir ]  [ Edit terakhir ]
[ Backup ]         [ Bantuan ]
```

**Pencatatan terpandu** dibimbing langkah demi langkah lewat tombol:

1. Pilih **kategori** (Makan, Transportasi, Belanja, Tagihan, Gaji, Lainnya)
2. Pilih **nominal** (tombol cepat `10rb`/`25rb`/`100rb`) atau ketik custom (`35rb`, `1.5jt`)
3. Pilih **metode pembayaran** (dari database, dengan alias)
4. Pilih **tanggal** (`Hari ini`, `Kemarin`, atau `YYYY-MM-DD`)
5. Ketik **keterangan** (opsional)
6. Tinjau preview, tekan **Simpan** atau **Batal**

Atau langsung **ketik kalimat bebas**:

```text
Input:  wifi 300rb mandiri
Output:
  Pengeluaran
  Rp 300.000 · Kategori: Tagihan · Metode: Mandiri
  Keterangan: wifi · Confidence: high
  [ Simpan ] [ Batal ]
```

Contoh lain yang valid: `Kopi 18rb dana`, `Bensin 100k cash`, `Gaji 5jt mandiri`, `Listrik 250rb bca kemarin`, `Internet 300rb mandiri 2 minggu yang lalu`.

### Keamanan bot

- Chat **tertaut** = punya akun pemilik transaksinya; `/undo` & `/edit` hanya menyentuh transaksi dari chat tersebut.
- Kode tautan di-hash saat disimpan (`code_hash`), angka sah (tidak ada `0`, `O`, `I`, `1`) dan kedaluwarsa 10 menit.
- Bot tidak pernah mengirim data ke pihak lain; backup hanya dikirim ke chat yang memintanya.

<br>

## Autentikasi & Multi-User

FluXa kini **multi-user penuh**:

- **Register & login** email + password (password di-hash `bcrypt`).
- **Login dengan Google** via OAuth 2.0 (OpenID Connect, library `openid-client`) — cukup satu klik.
- **Passkey / WebAuthn** untuk login tanpa kata sandi di perangkat pendukung.
- **Sesi**: access token JWT berumur pendek (`JWT_ACCESS_TTL_MINUTES`, default 15 menit) via cookie HTTP-only + refresh/rotate, session otomatis dibersihkan.
- **Lupa kata sandi**: token sekali pakai dikirim via SMTP.
- **Rate limiting** khusus `login` & `register` untuk menahan brute-force.

Semua data (kategori, metode, transaksi, budget, transfer, berulang, backup) di-scope per-user lewat kolom `user_id`.

> [!NOTE]
> Akun pertama yang login mengklaim akun owner. Akun baru berikutnya otomatis di-seed dengan kategori & payment method default agar langsung bisa dipakai.

<br>

## Teknologi

| Layer | Teknologi |
|:--|:--|
| **Frontend** | React 19 · TypeScript · Vite |
| **Styling** | Tailwind CSS 4 · CSS Variables |
| **Data Fetching** | TanStack Query |
| **Charts** | Recharts |
| **Backend** | Node.js · Express 5 · TypeScript |
| **Auth** | JWT · Bcrypt · openid-client (Google) · @simplewebauthn/server |
| **Bot Telegram** | Long polling native (`fetch`) — tanpa dependency eksternal |
| **Database** | PostgreSQL |
| **Migration** | node-pg-migrate |
| **Validation** | Zod |
| **Test** | `node:test` + `tsx` |
| **Monorepo** | npm workspaces: `client` / `server` / `shared` |

<br>

## Arsitektur

```text
Telegram ──────────────────────────────┐
  │ long polling /api                 │
  └─────────────────────────────┐      │
                                ▼      ▼
Browser ── React + Vite + TanStack Query ── /api ──┐
                                                   ▼
                                        Express REST API
                                            │  middleware auth
                                            │  (JWT cookie + refresh)
                         ┌───────────┬────────┼───────────┬──────────┐
                         ▼           ▼        ▼           ▼          ▼
                    Controllers  Repositories  Parser    OAuth/      Passkey
                                               rule-based WebAuthn
                         │           │         │
                         └───────────┴────┬────┘
                                          ▼
                                 PostgreSQL (per-user)
                                          │
                                         WebAuthn
                                         OAuth
                              Backups (JSON, terjadwal
                              + on-demand via Telegram)
```

<br>

## Quick Start (Development)

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

Isi `.env` di root project:

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=password-postgres-kamu
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_management

# Auth
JWT_SECRET=ganti-dengan-string-acak-panjang
JWT_ACCESS_TTL_MINUTES=15
AUTH_SESSION_DAYS=30
COOKIE_SECURE=0          # HTTP lokal; di produksi HTTPS = 1

# URL publik untuk OAuth & link
PUBLIC_BASE=http://localhost:5000
CLIENT_ORIGIN=http://localhost:5173

# Google OAuth (kosongkan untuk menonaktifkan tombol Google)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SMTP untuk fitur lupa kata sandi (kosongkan untuk menonaktifkan)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=FluXa <no-reply@fluclight.my.id>

# Bot Telegram (opsional, untuk fitur bot)
TELEGRAM_BOT_TOKEN=
TELEGRAM_ALLOWED_CHAT_IDS=

# Backup otomatis
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_COUNT=14
```

> [!NOTE]
> `COOKIE_SECURE` harus `0` saat dev via `http://localhost`, dan `1` (default) di produksi HTTPS.

### 3. Setup Database

```bash
npm run db:setup   # membuat database jika belum ada
npm run migrate    # membuat tabel, data default, seed user
```

### 4. Jalankan Development Server

Butuh dua terminal aktif dari root project:

```bash
# Terminal 1 — backend (REST API + auth + backup + bot Telegram)
npm run dev

# Terminal 2 — frontend (Vite, proxy /api otomatis)
npm run dev:client
```

| Service | URL |
|:--|:--|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:5000` |
| Health check | `GET http://localhost:5000/health` |

> [!WARNING]
> Menjalankan `npm run dev:client` tanpa backend membuat semua permintaan `/api/*` gagal. Kedua terminal harus aktif.

### 5. Menyalakan Bot Telegram (pengembangan)

1. Bikin bot lewat [@BotFather](https://t.me/BotFather) → salin token ke `TELEGRAM_BOT_TOKEN`.
2. Restart server — bot langsung mulai long polling:
   ```text
   [telegram] Polling aktif untuk @NamaBotKamu
   ```
3. Untuk **ujian multi-user**: daftar akun di web, buat kode tautan, kirim `/link KODE` ke bot dari chat Telegram kamu. Tanpa kode, chat belum tertaut hanya bisa mengirim kode tautan.

> [!NOTE]
> `TELEGRAM_ALLOWED_CHAT_IDS` (opsional): daftar chat ID (pisah koma) yang boleh memakai bot sebagai akun owner tanpa perlu tautan. Saat kosong, bot tetap berjalan (mode "butuh tautan").

<br>

## Cara Menggunakan

<details>
<summary><b>Bot Telegram — menautkan & mencatat</b></summary>
<br>

**Tautkan chat ke akunmu:**

1. Login di web → menu **Akun → "Hubungkan Telegram"** → **Buat kode tautan**.
2. Klik **"Buka bot & kirim kode"** (atau buka bot dan ketik kodenya) dalam 10 menit.
3. Chat berhasil tertaut → kirim transaksi apa pun.

**Catat cepat:** ketik langsung, misalnya `Salon 120rb dana kemarin` → cek preview → **Simpan**.

**Catat terpandu:** `/start` → pilih kategori di panel menu → ikuti alur tombol.

**Cek kondisi keuangan:** `/ringkasan bulan`, `/ringkasan semua`, atau tap **Ringkasan**.

**Cek saldo per akun:** `/saldo` atau tap **Saldo akun**.

**Koreksi kesalahan:** `/undo` batal transaksi terakhir, `/edit` ubah transaksi terakhir.

**Backup:** `/backup` — file JSON dikirim ke chat kamu.

**Lepas chat:** `/unlink`.

</details>

<details>
<summary><b>Autentikasi</b></summary>
<br>

- **Daftar**: email + password, atau tombol **Google**. Akun baru langsung di-seed kategori & metode default.
- **Masuk**: email + password, Google, atau passkey (perangkat dengan keamanan biometrik/TPM).
- **Lupa kata sandi**: ketik email → link reset terkirim (butuh SMTP aktif).
- **Ubah kata sandi**: menu Akun → *Ubah kata sandi*.
- Sesi bertahan lintas browser via cookie; log out di menu.

</details>

<details>
<summary><b>Dashboard</b></summary>
<br>

1. Buka menu **Dashboard**.
2. Gunakan `‹ ›` untuk berpindah bulan, atau preset periode (Hari Ini, 3 Hari, 7 Hari, Bulan Ini, dst).
3. Gunakan filter kategori / metode bila perlu.
4. Pilih **Kustom** untuk tanggal mulai–selesai sendiri.
5. Perhatikan pengingat transaksi rutin yang jatuh tempo.

</details>

<details>
<summary><b>Quick Input</b></summary>
<br>

1. Ketik transaksi pada kolom Quick di **Dashboard** atau **Transaksi**.
2. Hasil parsing tampil otomatis (debounce 350ms).
3. Klik **Simpan**.
4. Hasil kurang yakin? Cek transaksi bertanda `review`.

Contoh:
```text
Kopi 18rb dana
Bensin 100k cash
Gaji 5jt mandiri
Listrik 250rb bca kemarin
Internet 300rb mandiri 2 minggu yang lalu
```

</details>

<details>
<summary><b>Transaksi</b></summary>
<br>

1. Buka menu **Transaksi** — kartu (mobile) / tabel (desktop).
2. **Catat Transaksi** untuk input manual.
3. Filter: periode, kategori, tipe, metode, kata kunci.
4. Atur jumlah item per halaman (5/10/20/50/Semua).
5. Checkbox untuk hapus massal + **Undo** lewat toast bila salah.

</details>

<details>
<summary><b>Akun & Saldo</b></summary>
<br>

1. Buka menu **Akun** untuk menambah/mengelola payment method.
2. Atur saldo awal — saldo berjalan dihitung otomatis dari transaksi.
3. Pantau saldo di Dashboard dan via bot `/saldo`.
4. Panel **Hubungkan Telegram** untuk menautkan bot ke akunmu.

</details>

<details>
<summary><b>Transfer Dana</b></summary>
<br>

Menu **Transfer** memindahkan dana antar akun. Transfer tidak menambah pemasukan/reduksi pengeluaran di dashboard — hanya menggeser saldo antar akun.

</details>

<details>
<summary><b>Budget</b></summary>
<br>

1. **Budget → Set Budget Kategori**.
2. Pilih kategori pengeluaran & batas nominal bulanan.
3. Pantau progress bar.

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
2. Buat template rutin (interval harian/mingguan/bulanan, tanggal 1–28).
3. Pantau progress & badge jatuh tempo di dashboard.
4. Aktif/nonaktifkan template.

</details>

<details>
<summary><b>Export & Backup</b></summary>
<br>

Buka menu **Export / Backup**:

- Download **CSV** daftar transaksi aktif.
- Download **JSON (v2)** backup menyeluruh.
- Pilih **File JSON Backup** untuk memulihkan data (duplikasi ID dicegah).

Backup juga berjalan otomatis sesuai `BACKUP_INTERVAL_HOURS` (default 24 jam) dengan retensi `BACKUP_RETENTION_COUNT` (default 14 file) di `server/backups/`.

</details>

<details>
<summary><b>Terhapus Baru-baru Ini</b></summary>
<br>

1. Buka menu **Terhapus**.
2. Lihat transaksi soft-delete.
3. **Pulihkan** untuk mengembalikan transaksi beserta nominalnya.

</details>

<br>

## API

Base URL production: `https://fluclight.my.id/api` · Development: `http://localhost:5000/api`

Semua route di bawah `/api` (kecuali `/api/auth/*` yang publik) butuh autentikasi (cookie session otomatis dari browser).

<details>
<summary><b>Autentikasi</b></summary>

```text
GET    /auth/providers              # provider tersedia (google, passkey, email)
POST   /auth/register               # daftar (email + password)
POST   /auth/login                  # login
POST   /auth/logout
POST   /auth/refresh                # rotasi access token
GET    /auth/me                     # profil saat ini
POST   /auth/change-password
POST   /auth/forgot                 # kirim email reset (butuh SMTP)
POST   /auth/reset                  # pakai token reset
GET    /auth/google/login           # mulai OAuth Google
GET    /auth/google/callback        # callback OAuth Google
GET    /auth/webauthn/login/start   # opsi passkey utk login
POST   /auth/webauthn/login/verify
POST   /auth/webauthn/register/start
POST   /auth/webauthn/register/verify
GET    /auth/webauthn/credentials
DELETE /auth/webauthn/credentials/:id
```

</details>

<details>
<summary><b>Tautan Telegram</b></summary>

```text
POST   /telegram/link/start         # buat kode tautan (8 karakter, TTL 10 menit)
GET    /telegram/link               # status tautan saat ini
DELETE /telegram/link               # lepas tautan
```

</details>

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

Filter: `from` · `to` · `category_id` · `type` · `payment_method_id` · `deleted` · `q` · `page` · `limit` · `sort_by` · `sort_dir`

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

`GET /categories?type=expense|income` untuk filter tipe.

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

Mendukung `type` (`cash|bank|ewallet`), alias, dan `initial_balance`.

</details>

<details>
<summary><b>Ringkasan</b></summary>

```text
GET    /summary/totals?from=...&to=...
GET    /summary/balances
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

## Deploy Produksi (VPS)

> Tahap untuk menjalankan FluXa di server sungguhan — persis seperti `fluclight.my.id`.

### Prasyarat server

| Tool | Versi minimum | Fungsi |
|:--|:--|:--|
| Ubuntu / Debian | 22.04+ | OS server |
| Node.js | 22+ | Runtime |
| PostgreSQL | 14+ | Database |
| nginx | 1.18+ | Reverse proxy + sertifikat SSL |
| pm2 | 5+ | Proses manager |
| Domain + DNS | A record → IP server | Nama situs |

### 1. Siapkan database

```bash
sudo -u postgres createuser --pwprompt fluxa
sudo -u postgres createdb -O fluxa financial_management
```

### 2. Clone & install

```bash
mkdir -p ~/FluXa && cd ~/FluXa
git clone https://github.com/FlucLight/personal-finance-tracker.git .
npm install
```

### 3. Environment production

Salin `.env.example` → `.env` dan isi:

```env
PORT=5000
DATABASE_URL=postgres://fluxa:password@localhost:5432/financial_management

PUBLIC_BASE=https://fluclight.my.id
CLIENT_ORIGIN=https://fluclight.my.id

JWT_SECRET=ganti-dengan-string-100-karakter-acak
JWT_ACCESS_TTL_MINUTES=15
AUTH_SESSION_DAYS=30
COOKIE_SECURE=1

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
SMTP_HOST=...                 # opsional, utk lupa kata sandi
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=FluXa <no-reply@fluclight.my.id>

TELEGRAM_BOT_TOKEN=123456:ABC-DEF
TELEGRAM_ALLOWED_CHAT_IDS=   # opsional
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_COUNT=14
```

**Google OAuth**: buat project di [Google Cloud Console](https://console.cloud.google.com/), buat **OAuth client ID** (Web), dan daftarkan **Authorized redirect URI**:

```
https://fluclight.my.id/api/auth/google/callback
```

**Bot Telegram**: bikin via [@BotFather](https://t.me/BotFather) → `/newbot` → salin token ke `TELEGRAM_BOT_TOKEN`. Tidak perlu webhook — bot memakai long polling internal.

### 4. Migrate & jalankan

```bash
npm run db:setup     # create DB bila belum ada
npm run migrate      # skema + seed default (owner, kategori, metode)

# PM2 (server berjalan via tsx langsung — tanpa build step backend)
pm2 start npm --name fluxa-backend -- run start --workspace server
pm2 save
pm2 startup
```

Verifikasi:

```bash
curl -s http://localhost:5000/health
# {"status":"ok",...}
pm2 logs fluxa-backend --lines 20   # cek "[telegram] Polling aktif..."
```

### 5. Build frontend & pasang nginx

```bash
npm run build -w client    # hasil: client/dist
```

Contoh konfigurasi nginx untuk `fluclight.my.id` (pakai `certbot --nginx` untuk SSL):

```nginx
server {
  listen 80;
  server_name fluclight.my.id;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name fluclight.my.id;

  root /home/superadmin/FluXa/client/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location = /health {
    proxy_pass http://127.0.0.1:5000;
  }

  location / {
    try_files $uri /index.html;
  }
}
```

Reload: `sudo nginx -t && sudo systemctl reload nginx`.

### 6. Alur update aplikasi (deploy berikutnya)

```bash
cd ~/FluXa
git pull
git --no-pager log -1 --oneline     # cek commit terbaru
npm run migrate                     # jika ada migration baru — WAJIB
npm run build -w client             # jika ada perubahan frontend
pm2 restart fluxa-backend --update-env
```

> [!WARNING]
> Jangan lupa `npm run migrate` tiap deploy. Migration yang belum jalan bisa menyebabkan error (kolom/tabel belum ada).

<br>

## Struktur Project

```text
.
├─ client/                     # Frontend (React + Vite)
│  ├─ src/
│  │  ├─ components/           # QuickInput, FilterBar, Pagination, Toast, TelegramLink, Icons, dll
│  │  ├─ pages/                # Dashboard, Transaksi, Akun, Budget, Berulang, Transfer, Login, Register, dll
│  │  ├─ api.ts                # Klien API (TanStack Query)
│  │  ├─ App.tsx               # Routing + code-splitting
│  │  └─ utils.ts              # Format Rupiah, WITA, dll
│  └─ package.json
├─ server/                     # Backend (Express 5)
│  ├─ migrations/              # node-pg-migrate (schema, seed, users, auth, telegram_links)
│  ├─ scripts/                 # setup-db, migrate
│  ├─ backups/                 # File backup otomatis
│  └─ src/
│     ├─ config/               # env, db (PostgreSQL)
│     ├─ controllers/          # transactions, summary, export, auth, oauth, webauthn, telegram, dll
│     ├─ middleware/           # requireAuth, validate, errorHandler
│     ├─ parser/               # Rule-based parser + deteksi frasa tanggal
│     ├─ repositories/         # Akses data per-user (users, sessions, telegramLinks, dll)
│     ├─ routes/               # REST API (transactions, auth, telegram, dll)
│     ├─ services/             # auth (JWT), backup otomatis, identity (ALS user context)
│     ├─ telegram/             # Bot Telegram (long polling)
│     └─ index.ts              # Entry server + starter bot
├─ shared/
│  └─ src/index.ts             # Tipe & konstanta bersama (Zod schema)
├─ docs/                       # Screenshot dokumentasi
├─ .env.example
└─ README.md
```

<br>

## Perintah Development

| Perintah | Fungsi |
|:--|:--|
| `npm run dev` | Jalankan backend: REST API + auth + bot Telegram + backup |
| `npm run dev:client` | Jalankan frontend (Vite) |
| `npm run db:setup` | Buat database jika belum ada |
| `npm run migrate` | Jalankan migration |
| `npm run migrate:down` | Batalkan migration terakhir (dev only) |
| `npm run typecheck` | Typecheck semua workspace |
| `npm run lint --workspace client` | Lint frontend |
| `npm run build --workspace client` | Build frontend → `client/dist` |
| `npm run test:parser` | Self-check parser server |
| `npm run test:utils` | Test utilitas frontend |

> [!WARNING]
> Jangan menjalankan `migrate:down` pada production tanpa backup.

<br>

## Keamanan

- `.env` tidak boleh di-commit; `JWT_SECRET` pakai string acak panjang.
- Password di-hash `bcrypt`; token JWT pendek + refresh & cookie `HttpOnly` (opsi `SameSite`, `Secure` di produksi).
- Rate limit di semua `/api` (500/15 menit) + khusus `login`/`register` (20/15 menit).
- Bot Telegram: chat hanya bisa dioperasikan via **kode tautan** (10 menit, di-hash) — data akun lain tidak bisa diakses dari chat sembarang.
- File backup JSON sensitif — jaga akses `server/backups/`.
- Gunakan password database production yang kuat & HTTPS (nginx + certbot).
- `COOKIE_SECURE=1` wajib di produksi (HTTPS).

<br>

## Roadmap

- [x] Login & multi-user (kolom `user_id` sudah sejak awal — kini lengkap dengan auth cookie/JWT)
- [x] Google OAuth & Passkey (WebAuthn)
- [x] Mode produksi & deployment VPS (nginx + pm2 + long polling bot)
- [x] Tautan bot Telegram per-akun via kode
- [ ] Halaman pengelolaan kategori & payment method yang lebih canggih (susun ulang, bulk)
- [ ] Export PDF
- [ ] Webhook URL opsional untuk bot (alternatif long polling)
- [ ] Dashboard ringkasan publik/konsumen eksternal
- [ ] Notifikasi Telegram real-time (pengingat budget hampir limit)

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

<sub>License belum ditentukan</sub>

</div>