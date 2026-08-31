# PRD — Personal Finance Tracker (Web App)

**Status:** Draft v2
**Owner:** FlucLight
**Target:** Dipakai sebagai panduan implementasi untuk AI coding agent (Claude Code / Cursor / dsb), dikerjakan bertahap dengan review dari owner di setiap phase.

---

## 1. Ringkasan Produk

Website pencatatan keuangan pribadi. User mencatat transaksi (pengeluaran & pemasukan) berkali-kali sehari, lalu bisa melihat rekap per hari/bulan/tahun lewat dashboard visual. Arsitektur harus siap untuk dua kebutuhan masa depan tanpa perlu refactor besar:

1. **Integrasi bot Telegram** — bot akan mengirim data transaksi ke backend lewat API yang sama dengan yang dipakai frontend web, termasuk lewat teks natural language (lihat §6).
2. **Multi-user** — saat ini single-user (tanpa login), tapi skema data & struktur backend disiapkan agar penambahan auth/multi-tenancy nanti tidak mengubah struktur inti.

**Non-goals (di luar scope versi ini):**
- Bot Telegram itu sendiri (nanti, project terpisah, hanya konsumsi API — tapi parser-nya sudah disiapkan di backend sekarang, lihat §6)
- Sistem login/register (ditunda, tapi kolom `user_id` tetap ada dari awal — lihat §5)
- Integrasi otomatis ke mobile banking / e-wallet (mis. auto-sync mutasi rekening). User tetap input manual, hanya *mencatat* sumber dana yang dipakai (lihat §4.3)

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + Express (atau Fastify) + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma (rekomendasi — migration & type-safety cocok buat setup ini; boleh diganti Drizzle kalau owner lebih suka) |
| Charting | Recharts / Chart.js (untuk dashboard) |
| Deployment target | Perlu diputuskan owner (lihat §11 — Open Questions) |

---

## 3. User Roles

Untuk sekarang cuma **1 implicit user** (tidak ada login UI), tapi backend tetap merancang semua tabel dengan `user_id` yang mengarah ke satu baris default di tabel `users` (dibuat otomatis via seed/migration). Ini supaya nanti tinggal nyalain auth layer tanpa migrasi ulang skema.

---

## 4. Data Model (PostgreSQL)

### 4.1 `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| name | text | default "Owner" untuk seed awal |
| created_at | timestamptz | |

### 4.2 `categories`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users | |
| name | text | mis. "Makan", "Transport", "Gaji" |
| type | enum('expense','income') | kategori expense dan income dipisah |
| icon | text, nullable | opsional, buat UI |
| keywords | text[], nullable | daftar kata kunci buat auto-assign kategori dari parser (mis. `['nasi','goreng','makan','kopi']` → "Makan") |
| created_at | timestamptz | |

Seed default categories saat pertama kali dijalankan (makan, transport, hiburan, tagihan, belanja, kesehatan, lainnya untuk expense; gaji, bonus, lainnya untuk income), lengkap dengan keyword awal yang bisa diedit user — user bisa tambah/edit/hapus kategori & keyword-nya sendiri.

### 4.3 `payment_methods`
Menyimpan "dari mana" uangnya keluar/masuk — cash atau sumber cashless spesifik. Tabel ini juga berperan sebagai "account/wallet" untuk fitur transfer (§4.6).

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users | |
| name | text | mis. "Cash", "BRI", "Mandiri", "Dana", "ShopeePay", "OVO" |
| type | enum('cash','bank','ewallet') | |
| aliases | text[], nullable | nama alternatif buat parser (mis. "mandiri", "mdr" → payment_method "Mandiri") |
| current_balance | numeric(14,2), nullable | opsional — kalau owner mau lihat saldo per akun (dihitung dari transaksi + transfer, atau disimpan langsung; lihat §11 poin 5) |
| created_at | timestamptz | |

Seed default: Cash + beberapa contoh umum, user bebas tambah sendiri.

### 4.4 `transactions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users | |
| category_id | uuid, FK → categories | |
| payment_method_id | uuid, FK → payment_methods | |
| type | enum('expense','income') | harus konsisten sama `category.type` |
| amount | numeric(14,2) | jangan pakai float, wajib numeric/decimal |
| description | text, nullable | nama barang/catatan bebas — diisi manual (web) atau otomatis dari parser (bot) |
| raw_input | text, nullable | teks mentah asli sebelum di-parse (mis. `"Nasi goreng 15rb mandiri"`) — disimpan buat audit/debug parser, dan buat re-parse kalau logic parser diperbaiki |
| occurred_at | timestamptz | tanggal & jam transaksi (bukan `created_at`, biar user bisa input transaksi mundur) |
| source | enum('web','telegram_bot','recurring') default 'web' | asal transaksi — `recurring` dipakai transaksi yang dibuat otomatis dari `recurring_transactions` |
| is_deleted | boolean, default false | soft delete — jangan hapus permanen |
| deleted_at | timestamptz, nullable | diisi saat soft-delete dilakukan |
| created_at | timestamptz | |

> Semua query listing/summary WAJIB filter `is_deleted = false` secara default.

### 4.5 `budgets`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users | |
| category_id | uuid, FK → categories | |
| month | int (1–12) | |
| year | int | |
| limit_amount | numeric(14,2) | |
| created_at | timestamptz | |

Unique constraint: (`user_id`, `category_id`, `month`, `year`).

### 4.6 `account_transfers`
Mencatat perpindahan dana antar `payment_methods` (mis. tarik tunai, top-up e-wallet) — **bukan** expense/income, jadi tidak boleh ikut kehitung di total pengeluaran/pemasukan maupun budget.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users | |
| from_payment_method_id | uuid, FK → payment_methods | |
| to_payment_method_id | uuid, FK → payment_methods | |
| amount | numeric(14,2) | |
| description | text, nullable | mis. "Tarik tunai ATM" |
| occurred_at | timestamptz | |
| is_deleted | boolean, default false | |
| deleted_at | timestamptz, nullable | |
| created_at | timestamptz | |

### 4.7 `recurring_transactions`
Template transaksi berulang (tagihan bulanan dsb) yang otomatis nge-generate baris baru di `transactions` tiap periode.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users | |
| category_id | uuid, FK → categories | |
| payment_method_id | uuid, FK → payment_methods | |
| type | enum('expense','income') | |
| amount | numeric(14,2) | |
| description | text | mis. "WiFi Indihome", "Netflix", "Kost" |
| day_of_month | int (1–28) | tanggal eksekusi tiap bulan (dibatasi max 28 biar aman buat semua bulan) |
| is_active | boolean, default true | |
| last_generated_at | date, nullable | buat cek apakah bulan ini sudah di-generate |
| created_at | timestamptz | |

### 4.8 `quick_actions`
Shortcut transaksi rutin (satu klik langsung tercatat).

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users | |
| label | text | mis. "Kopi ShopeePay" |
| category_id | uuid, FK → categories | |
| payment_method_id | uuid, FK → payment_methods | |
| amount | numeric(14,2) | |
| description | text | |
| created_at | timestamptz | |

---

## 5. Kesiapan Multi-User & Bot (Arsitektur)

- Semua tabel utama sudah punya `user_id` sejak awal — walau di versi ini cuma ada 1 baris `users`, jadi saat auth ditambahkan nanti, tinggal filter query pakai `user_id` dari session, bukan hardcode.
- Endpoint transaksi (`POST /api/transactions`) dirancang generik & stateless (terima payload JSON standar), supaya bot Telegram nanti tinggal panggil endpoint yang sama dengan `source: 'telegram_bot'` — tidak perlu endpoint terpisah.
- Modul parser (§6) berdiri sendiri (pure function: teks → structured data), dipanggil baik dari endpoint parser khusus (dipakai quick input bar web) maupun nanti dari handler bot Telegram — logic parsing-nya jangan digabung ke controller/route, biar reusable.
- Autentikasi API untuk konsumen non-browser (bot) bisa disiapkan pakai API key sederhana di level backend (env var), jangan didesain dulu detailnya — cukup pastikan middleware auth gampang ditambahkan di layer terpisah tanpa nyentuh business logic.

---

## 6. Parser Logic & Command Handler

Modul backend yang mengubah teks bebas jadi data transaksi terstruktur. Dipakai oleh dua konsumen: quick input bar di web (§7.3), dan nanti bot Telegram.

**Contoh input:** `"Nasi goreng 15rb mandiri"`
**Output yang diharapkan:**
```json
{
  "amount": 15000,
  "description": "Nasi goreng",
  "payment_method": "Mandiri",
  "category": "Makan",
  "confidence": "high | low"
}
```

**Langkah parsing (rule-based, bukan LLM — biar cepat & gratis):**
1. **Extract amount** — regex cari pola angka + suffix (`15rb`, `15ribu`, `15k`, `15.000`, `15000`) → normalize ke integer rupiah.
2. **Extract payment method** — cocokkan kata di sisa teks ke `payment_methods.name` atau `payment_methods.aliases` (case-insensitive).
3. **Extract category** — cocokkan sisa kata ke `categories.keywords`. Kalau tidak ada match → fallback ke kategori "Lainnya" dengan `confidence: "low"`.
4. **Sisa teks** (setelah amount & payment method dibuang) jadi `description`.
5. Simpan `raw_input` apa adanya buat audit, dan kalau `confidence: "low"`, tetap simpan transaksinya tapi tandai supaya nanti gampang di-review/dikoreksi user (bisa lewat flag di response, tidak perlu kolom DB tambahan — cukup dikembalikan di API response saat create).

**Catatan implementasi:** parser ini rule-based sederhana dulu (regex + keyword matching), bukan NLP/LLM-based — cukup buat kasus pemakaian pribadi yang polanya predictable. Kalau nanti akurasinya kurang, baru dipertimbangkan upgrade ke LLM-assisted parsing (opsional, di luar scope versi ini).

---

## 7. Fitur MVP (Versi Web, Fase 1)

1. **CRUD Transaksi** — tambah/edit/hapus (soft delete)/lihat transaksi (expense & income), dengan kategori & payment method.
2. **Manajemen Kategori** — CRUD kategori custom per tipe (expense/income), termasuk keyword buat auto-assign.
3. **Manajemen Payment Method** — CRUD sumber dana (cash/bank/e-wallet), termasuk alias buat parser.
4. **Dashboard** — ringkasan bulan berjalan: total expense, total income, net balance, breakdown per kategori (chart pie/bar), tren harian dalam sebulan (line/bar chart).
5. **Rekap per Periode** — filter & lihat transaksi per hari/bulan/tahun, dengan total per periode.
6. **Budget per Kategori** — set limit bulanan per kategori, tampilkan progress (dipakai vs limit) di dashboard, warning kalau lewat/dekat limit.
7. **Export & Import Data** — export transaksi ke CSV & PDF; export/import JSON penuh (buat backup & restore, termasuk kategori/payment method/budget).
8. **Quick Input Bar** — input command-style di atas web (mis. ketik `"Kopi 18rb dana"` lalu Enter), pakai parser yang sama dengan §6.
9. **Quick Action Buttons** — tombol sekali klik buat transaksi rutin (dari `quick_actions`).
10. **Currency Formatting** — auto-format Rupiah (`Rp 15.000`) dan input mask di semua field amount.
11. **Recurring Transactions** — setup tagihan bulanan otomatis, auto-generate transaksi tiap tanggal yang ditentukan.
12. **Account Transfer** — catat perpindahan dana antar payment method tanpa mempengaruhi total expense/income.
13. **Soft Delete & Recovery** — transaksi/transfer yang dihapus bisa direstore (minimal lewat halaman "Recently Deleted" atau sejenis).

---

## 8. API Endpoints (Draft)

```
GET    /api/transactions              ?from=&to=&category_id=&type=&payment_method_id=
POST   /api/transactions
GET    /api/transactions/:id
PATCH  /api/transactions/:id
DELETE /api/transactions/:id          -> soft delete (set is_deleted=true, deleted_at=now)
POST   /api/transactions/:id/restore  -> undo soft delete

POST   /api/transactions/parse        -> body: { text }, return hasil parsing TANPA menyimpan (dipakai quick input bar buat preview sebelum submit)
POST   /api/transactions/quick        -> body: { text }, parse SEKALIGUS simpan langsung (dipakai bot & quick input bar mode cepat)

GET    /api/categories                ?type=expense|income
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id

GET    /api/payment-methods
POST   /api/payment-methods
PATCH  /api/payment-methods/:id
DELETE /api/payment-methods/:id

GET    /api/transfers                 ?from=&to=
POST   /api/transfers
DELETE /api/transfers/:id

GET    /api/budgets                   ?month=&year=
POST   /api/budgets
PATCH  /api/budgets/:id
DELETE /api/budgets/:id

GET    /api/recurring-transactions
POST   /api/recurring-transactions
PATCH  /api/recurring-transactions/:id
DELETE /api/recurring-transactions/:id

GET    /api/quick-actions
POST   /api/quick-actions
DELETE /api/quick-actions/:id
POST   /api/quick-actions/:id/trigger -> langsung buat transaksi dari template quick action

GET    /api/dashboard/summary         ?month=&year=   -> total income/expense/net, breakdown per kategori
GET    /api/export/csv                ?from=&to=
GET    /api/export/pdf                ?from=&to=
GET    /api/export/json               -> full backup (transaksi, kategori, payment methods, budget)
POST   /api/import/json               -> restore dari backup
```

---

## 9. Background Job — Recurring Transactions

Setiap hari (cron job, atau dicek saat aplikasi start/tiap request pertama hari itu — pilih salah satu sesuai target deploy di §11), sistem cek semua `recurring_transactions` yang `is_active=true` dan `day_of_month` == tanggal hari ini, lalu:
1. Cek `last_generated_at` supaya tidak generate dobel di bulan yang sama.
2. Insert baris baru ke `transactions` dengan `source='recurring'`.
3. Update `last_generated_at`.

Kalau target deploy platform-nya tidak support cron job native (mis. serverless), pertimbangkan pakai cron eksternal (mis. cron-job.org / GitHub Actions scheduled workflow) yang hit endpoint internal.

---

## 10. Non-Functional Requirements

- **Deployable**: bisa di-deploy (target platform belum diputuskan — lihat §11).
- **Type-safe end-to-end**: TypeScript di frontend & backend, tipe request/response idealnya di-share (mis. lewat package `shared-types` kalau monorepo).
- **Validasi input**: pakai Zod (atau sejenis) di backend untuk semua endpoint POST/PATCH.
- **Timezone**: semua `occurred_at` disimpan sebagai `timestamptz`, tapi pastikan konsisten timezone Asia/Makassar (WITA) di level aplikasi.
- **Currency**: default IDR, tanpa desimal di UI (tapi tetap simpan sebagai numeric(14,2) di DB untuk fleksibilitas). Format tampilan pakai locale `id-ID`.
- **Data integrity**: semua query read (list, summary, export) default exclude `is_deleted=true`, kecuali endpoint khusus (mis. "Recently Deleted").

---

## 11. Open Questions (perlu keputusan owner sebelum/selagi development)

1. Target hosting untuk deploy: VPS sendiri, Vercel+Railway/Render, atau lainnya? (Ini juga menentukan cara jalanin cron job recurring transaction di §9.)
2. Struktur repo: monorepo (frontend+backend satu repo) atau dipisah?
3. Prisma vs Drizzle vs raw SQL — ada preferensi?
4. Export PDF pakai library apa di backend (mis. Puppeteer/PDFKit) — atau generate di frontend saja?
5. `current_balance` di `payment_methods` (§4.3): mau dihitung on-the-fly dari SUM transaksi+transfer tiap kali dibutuhkan, atau disimpan sebagai running balance yang di-update tiap ada transaksi (lebih cepat baca, tapi risiko drift kalau ada bug)?

---

## 12. Fase Pengerjaan (Rekomendasi Urutan)

1. **Setup**: repo structure, PostgreSQL schema + migration (semua tabel §4), seed data (default categories+keywords & payment methods+aliases)
2. **Backend core**: CRUD transaksi (dengan soft delete) + kategori + payment method (tanpa auth)
3. **Frontend core**: form input transaksi, list/table transaksi dengan filter, halaman "Recently Deleted"
4. **Parser module**: implementasi §6 (amount/payment method/category extraction), endpoint `/parse` & `/quick`
5. **Quick Input Bar & Quick Actions**: UI di web yang konsumsi parser + quick actions
6. **Account Transfer**: CRUD transfer, exclude dari perhitungan expense/income
7. **Dashboard**: summary endpoint + chart di frontend
8. **Budget**: CRUD budget + progress indicator di dashboard
9. **Recurring Transactions**: CRUD template + background job
10. **Export & Import**: CSV, PDF, JSON backup/restore
11. **Polish & deploy**

---

*Dokumen ini adalah panduan hidup — update sesuai keputusan yang diambil selama development, terutama bagian §11.*
