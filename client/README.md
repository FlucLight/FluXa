# FluXa Client (Frontend)

Frontend web application untuk **FluXa Personal Finance Tracker**, dibangun dengan arsitektur modern, minimalis, dan responsif untuk desktop maupun perangkat mobile.

---

## Teknologi

* **Framework & Tooling:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
* **Styling & UI:** [Tailwind CSS 4](https://tailwindcss.com/) dengan CSS Variables & Dark/Light Mode
* **Data Fetching & Cache:** [TanStack Query v5](https://tanstack.com/query)
* **Visualisasi & Grafik:** [Recharts](https://recharts.org/)
* **Biometrik / Passkey:** [@simplewebauthn/browser](https://simplewebauthn.dev/)
* **Routing:** [React Router v7](https://reactrouter.com/)

---

## Struktur Folder

```text
client/
├── index.html
├── vite.config.ts
├── src/
│   ├── App.tsx                     # Routing utama & layout wrapper
│   ├── main.tsx                    # Entry point React
│   ├── api.ts                      # HTTP client & endpoint API
│   ├── utils.ts                    # Helper tanggal WITA, format rupiah, dan parsing angka
│   ├── index.css                   # Keyframes animasi, styling token & variables
│   ├── pages/                      # Halaman aplikasi
│   │   ├── Dashboard.tsx           # Ringkasan finansial, grafik tren, & budget
│   │   ├── Transactions.tsx        # Tabel transaksi, filter, pencarian, & hapus massal
│   │   ├── Accounts.tsx            # Manajemen rekening bank, e-wallet, & saldo
│   │   ├── Transfers.tsx           # Pencatatan transfer internal antar akun
│   │   ├── Budgets.tsx             # Target budget bulanan & arsip riwayat bulan lalu
│   │   ├── Recurring.tsx           # Tagihan & pemasukan rutin berulang
│   │   ├── Export.tsx              # Ekspor CSV/Excel/JSON & import backup
│   │   ├── RecentlyDeleted.tsx     # Recycle bin transaksi terhapus & restore
│   │   ├── Auth.tsx                # Halaman login & register
│   │   ├── ForgotPassword.tsx      # Form minta reset password
│   │   └── ResetPassword.tsx       # Form input password baru via token
│   └── components/                 # Komponen UI & Context
│       ├── QuickInput.tsx          # Bar input chat cepat dengan auto-parse
│       ├── TransactionForm.tsx     # Modal tambah/edit transaksi
│       ├── Modal.tsx               # Komponen modal dialog accessible dengan backdrop blur
│       ├── ConfirmModal.tsx        # Modal dialog konfirmasi aksi destruktif
│       ├── Toast.tsx               # Provider notifikasi sukses/gagal di tengah layar
│       ├── Form.tsx                # Komponen Field, Input, Textarea, & CurrencyInput
│       ├── CustomSelect.tsx        # Dropdown select kustom dengan pencarian & badge
│       ├── DatePicker.tsx          # Pemilih tanggal & waktu lokal
│       ├── FilterBar.tsx           # Bar filter transaksi (periode, kategori, akun, sort)
│       ├── Pagination.tsx          # Paginasi tabel & limit per halaman
│       ├── PasskeyManager.tsx      # Manajemen biometrik / passkey akun
│       ├── TelegramLink.tsx        # Widget penghubung akun ke bot Telegram
│       ├── AvatarEditor.tsx        # Pengubah & penghapus foto profil
│       ├── Sidebar.tsx             # Navigasi samping & menu profil pengguna
│       ├── ThemeToggle.tsx         # Pengalih tema gelap / terang
│       └── Icons.tsx               # Koleksi ikon SVG
```

---

## Fitur & Modul Halaman

### 1. Dashboard (`Dashboard.tsx`)
* **Ringkasan Finansial:** Total pemasukan, pengeluaran, saldo bersih, dan rasio tabungan (*saving rate*).
* **Grafik Interaktif:**
  * Tren pengeluaran/pemasukan berbasis waktu (per jam, hari, minggu, bulan) dalam model Bar Chart atau Line/Area Chart.
  * Breakdown pengeluaran per kategori (Donut / Pie Chart).
* **Saldo Akun Realtime:** Menampilkan saldo berjalan tiap rekening bank, dompet digital, dan kas tunai.
* **Progress Budget:** Bar status budget bulan berjalan yang langsung memperingatkan jika mendekati batas atau *overbudget*.
* **Transaksi Terbaru:** List transaksi teranyar dengan akses langsung ke paginasi.

### 2. Quick Input Bar (`QuickInput.tsx`)
* Input transaksi dengan gaya percakapan alami (contoh: `Makan siang 25rb dana kemarin`).
* Auto-parse otomatis (debounce 350ms) mendeteksi nominal, kategori, metode pembayaran, dan waktu transaksi sebelum disimpan.
* Memberikan notifikasi modal interaktif di tengah layar begitu data berhasil dicatat.

### 3. Akun & Saldo (`Accounts.tsx`)
* **Kustomisasi Akun:** Tambahkan rekening bank (BCA, Mandiri, Kaltimtara, BRI), E-Wallet (DANA, Gopay, OVO, ShopeePay, Visa), atau Tunai secara mandiri.
* **Atur Saldo Awal:** Input saldo awal yang dimiliki sebelum mulai pencatatan.
* **Kata Kunci / Alias Bot:** Tentukan kata kunci unik (misal: `kaltimtara, dg`) agar bot Telegram dan Quick Chat langsung mengenali rekening tersebut.
* **Statistik Akun:** Ringkasan total kekayaan bersih + rincian total dana di Bank, E-Wallet, dan Tunai.

### 4. Transaksi (`Transactions.tsx`)
* Tabel data transaksi lengkap dengan filter dinamis (periode preset/kustom, tipe pengeluaran/pemasukan, kategori, akun pembayaran, pencarian teks).
* Fitur seleksi transaksi massal (*multi-select*) untuk menghapus banyak data sekaligus dengan `ConfirmModal`.
* Aksi edit dan hapus per baris transaksi.

### 5. Transfer Dana (`Transfers.tsx`)
* Khusus mencatat pemindahan saldo antar kantong sendiri (misal: tarik tunai ATM dari Mandiri ke Cash, atau top-up dari BCA ke DANA).
* Tidak mempengaruhi laporan pemasukan/pengeluaran (*net neutral*).

### 6. Budget Bulanan & Arsip (`Budgets.tsx`)
* **Navigator Bulan & Tahun:** Tombol `<` dan `>` serta dropdown pemilih bulan dan tahun untuk melihat kembali performa budget di bulan-bulan lampau.
* **Status Evaluasi:** Menampilkan status *Hemat (Sisa Rp...)* atau *Overbudget (+Rp...)* secara otomatis.
* **Kelola Limit:** Ubah batas limit kapan saja dengan modal form dan pemisah ribuan otomatis.

### 7. Tagihan Berulang (`Recurring.tsx`)
* Kelola template tagihan rutin (WiFi, sewa kost, gaji bulanan, langganan).
* Interval fleksibel: harian, mingguan, atau bulanan.
* Tombol jeda/aktifkan kembali dengan modal konfirmasi.

### 8. Export & Backup (`Export.tsx`)
* Unduh data transaksi dalam format **Spreadsheet CSV** atau **Excel (XLSX)**.
* Unduh salinan database penuh dalam format **JSON**.
* Fitur **Restore JSON** dengan proteksi anti-duplikasi data.

### 9. Terhapus (`RecentlyDeleted.tsx`)
* Tempat penampungan transaksi yang di-*soft-delete*.
* Transaksi dapat dipulihkan (*restore*) sewaktu-waktu kembali ke daftar aktif.

---

## Komponen Kunci & Desain Sistem

### 1. CurrencyInput (Format Pemisah Ribuan Titik)
Komponen input nominal uang otomatis memformat angka dengan tanda titik (`.`) secara *real-time* saat pengguna mengetik (contoh: ketik `25000` tampil `Rp 25.000`). Dilengkapi badge `Rp` dan mode keyboard numerik pada smartphone.

### 2. Modal Notifikasi Tengah Interaktif (`Toast.tsx`)
Notifikasi sukses dan gagal muncul di tengah layar dengan backdrop gelap + blur, ikon animasi *pop*, pesan jelas, dan tombol interaktif (seperti *Tutup* atau *Undo*).

### 3. ConfirmModal
Dialog konfirmasi aman untuk seluruh aksi penting (hapus transaksi, hapus rekening, hapus budget, logout, import data, lepas tautan Telegram, dan toggle tagihan).

---

## Perintah Development & Menjalankan Frontend

Jalankan perintah berikut dari root repository:

```bash
# Menjalankan server dev frontend (Vite) di http://localhost:5173
npm run dev:client
# atau
npm run dev --workspace client

# Memvalidasi tipe TypeScript & build bundle produksi ke client/dist
npm run build -w client

# Menjalankan linter ESLint
npm run lint -w client
```

Untuk petunjuk konfigurasi backend, database, dan Telegram bot, silakan baca dokumentasi di [**`server/README.md`**](../server/README.md).
