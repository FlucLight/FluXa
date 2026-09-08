# FluXa Client (Frontend Documentation)

Dokumentasi teknis komprehensif untuk aplikasi web frontend **FluXa Personal Finance Tracker**. Frontend ini dirancang dengan antarmuka yang bersih, minimalis, dan sangat responsif, mengutamakan kemudahan navigasi serta kejelasan informasi finansial pengguna di desktop maupun perangkat mobile.

---

## Daftar Isi

1. [Teknologi & Library](#teknologi--library)
2. [Struktur Direktori](#struktur-direktori)
3. [Arsitektur & State Management](#arsitektur--state-management)
4. [Dokumentasi Halaman](#dokumentasi-halaman)
5. [Desain Sistem & Komponen Kunci](#desain-sistem--komponen-kunci)
6. [Format Angka & Mata Uang](#format-angka--mata-uang)
7. [Sistem Notifikasi & Dialog Modal](#sistem-notifikasi--dialog-modal)
8. [Panduan Menjalankan & Membangun Proyek](#panduan-menjalankan--membangun-proyek)

---

## Teknologi & Library

Frontend FluXa menggunakan stack modern berbasis ekosistem React 19 dan TypeScript:

* **React 19:** Library antarmuka komponen utama dengan performa tinggi dan rendering efisien.
* **Vite 6:** Build tool dan development server berkecepatan tinggi dengan Hot Module Replacement (HMR).
* **TypeScript 5:** Memberikan keamanan tipe data statis di seluruh komponen, hook, dan model API.
* **Tailwind CSS 4:** Utility-first CSS framework yang dipadukan dengan variabel CSS untuk mendukung tema Gelap (Dark Mode) dan Terang (Light Mode).
* **TanStack Query v5 (React Query):** Manajemen server state, caching otomatis, background refetching, serta invalidasi data transaksi.
* **Recharts:** Library visualisasi data modular untuk grafik tren area, batang, dan diagram lingkaran kategori.
* **React Router v7:** Manajemen routing client-side dengan proteksi halaman berbasis sesi login (`RequireAuth` dan `RequireGuest`).
* **@simplewebauthn/browser:** Library klien WebAuthn untuk autentikasi biometrik Passkey (Touch ID, Face ID, Windows Hello).

---

## Struktur Direktori

```text
client/
├── index.html                      # Template HTML utama
├── vite.config.ts                  # Konfigurasi Vite & proxy backend API
├── package.json                    # Dependency & skrip frontend
├── src/
│   ├── main.tsx                    # Titik masuk aplikasi (mounting React root)
│   ├── App.tsx                     # Definisi rute, layout navigasi, & provider global
│   ├── api.ts                      # Client HTTP fetch wrapper untuk seluruh endpoint REST API
│   ├── utils.ts                    # Utilitas format mata uang, tanggal WITA, dan filter
│   ├── index.css                   # Keyframes animasi, styling token & variabel CSS
│   ├── pages/                      # Halaman antarmuka aplikasi
│   │   ├── Dashboard.tsx           # Ringkasan finansial, grafik tren, & evaluasi budget
│   │   ├── Transactions.tsx        # Tabel riwayat transaksi, filter dinamis, & aksi massal
│   │   ├── Accounts.tsx            # Manajemen rekening bank, e-wallet, & saldo berjalan
│   │   ├── Transfers.tsx           # Pencatatan transfer internal antar akun
│   │   ├── Budgets.tsx             # Target budget bulanan & arsip riwayat bulan lampau
│   │   ├── Recurring.tsx           # Manajemen tagihan rutin berulang
│   │   ├── Export.tsx              # Unduh CSV, Excel, backup JSON, & restore data
│   │   ├── RecentlyDeleted.tsx     # Penampungan transaksi terhapus (soft-delete) & restore
│   │   ├── Auth.tsx                # Halaman autentikasi login & registrasi
│   │   ├── ForgotPassword.tsx      # Halaman permintaan reset kata sandi
│   │   └── ResetPassword.tsx       # Halaman input kata sandi baru via token email
│   └── components/                 # Komponen UI modular & konteks
│       ├── QuickInput.tsx          # Bar pencatatan cepat bergaya percakapan alami
│       ├── TransactionForm.tsx     # Modal form tambah & edit transaksi
│       ├── Modal.tsx               # Komponen modal dialog accessible dengan focus trap
│       ├── ConfirmModal.tsx        # Modal dialog konfirmasi aksi penting
│       ├── Toast.tsx               # Provider notifikasi modal interaktif di tengah layar
│       ├── toast-context.ts        # Tipe data & konteks notifikasi toast
│       ├── Form.tsx                # Input, Field, Textarea, dan CurrencyInput
│       ├── CustomSelect.tsx        # Dropdown select interaktif dengan pencarian
│       ├── DatePicker.tsx          # Pemilih tanggal & waktu lokal
│       ├── FilterBar.tsx           # Bar penyaring transaksi (tanggal, kategori, akun, sort)
│       ├── Pagination.tsx          # Kontrol paginasi data tabel
│       ├── PasskeyManager.tsx      # Komponen pendaftaran & manajemen passkey biometrik
│       ├── TelegramLink.tsx        # Widget integrasi akun dengan bot Telegram
│       ├── AvatarEditor.tsx        # Pengunggah & pemotong foto profil pengguna
│       ├── Sidebar.tsx             # Navigasi samping desktop & drawer mobile
│       ├── ThemeToggle.tsx         # Tombol pengalih tema gelap / terang
│       └── Icons.tsx               # Koleksi ikon SVG mandiri
```

---

## Arsitektur & State Management

### 1. Server State & Cache Invalidation
Aplikasi menggunakan **TanStack Query** untuk memisahkan data server dari state lokal UI:
* **Query Keys:** Data dikelompokkan secara terstruktur, misalnya `['transactions', filters]`, `['budgets', month, year]`, `['summary-balances']`, `['payment-methods']`.
* **Invalidasi Otomatis:** Setiap kali terjadi mutasi (menambah transaksi, transfer, mengubah saldo awal, menghapus data), aplikasi secara otomatis memanggil `invalidateQueries()` untuk memperbarui ringkasan saldo, dashboard, dan tabel terkait secara instan tanpa perlu reload halaman.

### 2. Konteks Global
* **`ThemeProvider`:** Mengelola tema antarmuka (Dark/Light) yang tersimpan di `localStorage` dan tersinkronisasi dengan atribut `html.dark`.
* **`ToastProvider`:** Mengelola antrean notifikasi feedback aksi yang muncul di tengah layar.
* **`AuthProvider`:** Mengelola state login pengguna, sesi, serta data profil aktif.
* **`ProfileProvider`:** Mengelola avatar dan foto profil pengguna.

---

## Dokumentasi Halaman

### 1. Dashboard (`Dashboard.tsx`)
Halaman utama yang memberikan wawasan menyeluruh terhadap kondisi keuangan pengguna:
* **Kartu Ringkasan:** Menampilkan total pemasukan, pengeluaran, saldo bersih (*net income*), dan persentase rasio tabungan (*saving rate*).
* **Grafik Tren:** Visualisasi interaktif pengeluaran dan pemasukan berdasarkan waktu (per jam, per hari, per minggu, atau per bulan) yang dapat dialihkan antara model grafik batang (*Bar Chart*) dan grafik area (*Area Chart*).
* **Distribusi Kategori:** Diagram lingkaran (*Pie/Donut Chart*) yang memperlihatkan proporsi alokasi pengeluaran terbesar.
* **Saldo Akun Realtime:** Widget yang memantau saldo berjalan setiap rekening bank, e-wallet, dan uang tunai.
* **Pencapaian Budget:** Progress bar yang memantau sisa limit anggaran bulan berjalan secara *real-time*.

### 2. Quick Input Bar (`QuickInput.tsx`)
Bar pencatatan di bagian atas aplikasi untuk mencatat transaksi dengan mengetik teks bebas:
* Menggunakan teknik *debounce* 350ms untuk mengirim teks ke parser lokal backend.
* Hasil deteksi nominal, kategori, metode bayar, dan tanggal langsung muncul di bawah bar sebagai preview sebelum pengguna menekan tombol *Simpan* atau tombol *Enter*.
* Mendukung tombol pintas contoh pengeluaran yang umum (makan, transportasi, belanja, tagihan).

### 3. Akun & Saldo (`Accounts.tsx`)
Pusat kendali seluruh rekening, dompet digital, dan kas fisik:
* **Penambahan Rekening Bebas:** Pengguna dapat menambahkan rekening bank (seperti Bank Kaltimtara, BCA, Mandiri, BRI), dompet digital / QRIS (DANA, GoPay, OVO, ShopeePay), kartu kredit (Visa, Mastercard), atau uang tunai.
* **Saldo Awal:** Mengatur nominal saldo yang sudah ada sebelum pencatatan dimulai.
* **Kata Kunci / Alias Bot:** Menentukan kata kunci panggilan (contoh: `kaltimtara`, `dg`, `qris`, `dana`) agar bot Telegram dan Quick Chat mengenali akun tersebut secara otomatis.
* **Ringkasan Kekayaan Bersih:** Menghitung total akumulasi dana dan merinci saldo yang berada di Bank, E-Wallet, dan Tunai.

### 4. Transaksi (`Transactions.tsx`)
Buku besar seluruh riwayat pencatatan transaksi:
* **Filter Dinamis:** Menyaring data berdasarkan rentang tanggal (Hari Ini, 7 Hari, Bulan Ini, Kustom), kategori, metode pembayaran, tipe transaksi (Pemasukan / Pengeluaran), dan kata kunci pencarian.
* **Aksi Massal (*Bulk Actions*):** Memilih beberapa baris transaksi sekaligus (*multi-select*) untuk dihapus bersamaan melalui dialog konfirmasi aman.
* **Edit & Hapus:** Mengubah detail transaksi yang salah catat melalui modal form.

### 5. Transfer Dana (`Transfers.tsx`)
Khusus mencatat pergeseran dana internal antar kantong sendiri:
* Mengalihkan saldo dari satu rekening/dompet ke rekening/dompet lain (misalnya tarik tunai dari ATM Mandiri ke Kas Tunai, atau transfer saldo BCA ke DANA).
* Transaksi transfer bersifat netral terhadap laporan laba/rugi (*cash flow neutral*).

### 6. Budget Bulanan & Arsip (`Budgets.tsx`)
Sistem perencanaan batas pengeluaran per kategori:
* **Navigator Bulan & Tahun:** Dilengkapi tombol navigasi sebelumnya/berikutnya serta pemilih bulan dan tahun untuk meninjau performa budget pada bulan-bulan lampau.
* **Indikator Otomatis:** Menampilkan status *Hemat (Sisa Rp...)* jika pengeluaran terkendali, atau *Overbudget (+Rp...)* jika pengeluaran melampaui batas yang ditentukan.
* **Manajemen Limit:** Pengguna dapat menentukan limit baru atau menyesuaikan limit yang sudah ada kapan saja.

### 7. Tagihan Berulang (`Recurring.tsx`)
Otomatisasi pencatatan tagihan dan pengeluaran berkala:
* Mendaftarkan pengeluaran rutin seperti sewa tempat tinggal, tagihan internet, langganan aplikasi, atau pemasukan gaji bulanan.
* Pilihan interval fleksibel: harian, mingguan, atau tanggal tertentu setiap bulan.
* Dilengkapi status jeda/aktifkan kembali tanpa perlu menghapus template jadwal.

### 8. Export & Backup (`Export.tsx`)
Pusat pencadangan dan portabilitas data:
* **Spreadsheet CSV:** Mengunduh seluruh transaksi aktif dalam format baris dan kolom tabel standar.
* **Excel (XLSX):** Mengunduh data transaksi yang rapi dan terformat untuk dibuka di Microsoft Excel atau Google Sheets.
* **Backup JSON Penuh:** Mengunduh salinan utuh seluruh database (transaksi, kategori, akun, budget, transfer).
* **Restore Data:** Mengunggah file backup JSON dengan algoritma perlindungan anti-duplikasi data.

### 9. Terhapus (`RecentlyDeleted.tsx`)
Sistem recycle bin untuk keamanan data:
* Menampung transaksi yang dihapus (*soft-delete*).
* Transaksi dapat dipulihkan (*restore*) sewaktu-waktu kembali ke daftar aktif dengan posisi dan saldo yang disesuaikan kembali.

---

## Desain Sistem & Komponen Kunci

### 1. Format Angka `CurrencyInput`
Terletak pada `src/components/Form.tsx`. Komponen ini menggantikan input angka standar:
* Secara otomatis menyisipkan pemisah ribuan titik (`.`) saat pengguna mengetik angka nominal (contoh: input `50000` otomatis ditampilkan sebagai `Rp 50.000`).
* Mengirimkan nilai angka murni (*raw number*) ke fungsi penangan form induk sehingga tidak memerlukan konversi manual.
* Menampilkan badge `Rp` di sisi kiri input dan mengaktifkan keyboard numerik di perangkat mobile (`inputMode="numeric"`).

### 2. Modal Notifikasi Tengah Interaktif (`Toast.tsx`)
Sistem notifikasi modern yang menggantikan toast konvensional:
* Notifikasi sukses dan gagal muncul di posisi tengah layar dengan lapisan *backdrop* gelap dan efek *blur*.
* Dilengkapi ikon status animasi pop, judul, pesan penjelasan yang jelas, serta tombol aksi interaktif (misalnya tombol *Tutup* atau *Undo*).
* Menghitung durasi tayang otomatis dengan fitur jeda (*pause*) saat kursor berada di atas modal atau saat modal difokuskan.
* Dapat ditutup kapan saja menggunakan tombol *Escape*, tombol *Tutup*, atau klik pada area latar belakang.

### 3. Modal Konfirmasi Aksi (`ConfirmModal.tsx`)
Digunakan untuk mencegah kesalahan operasional pada aksi-aksi penting dan destruktif:
* Menampilkan dialog konfirmasi dengan judul, deskripsi konsekuensi aksi, tombol batal, dan tombol eksekusi dengan varian bahaya (*danger*) atau primer (*primary*).
* Diterapkan pada penghapusan transaksi, penghapusan rekening, penghapusan limit budget, penghapusan passkey, pelepasan tautan Telegram, proses impor data, dan logout.

---

## Panduan Menjalankan & Membangun Proyek

Semua perintah dijalankan dari root repository workspace:

```bash
# Menjalankan server pengembangan frontend (Vite) di port default 5173
npm run dev:client
# atau
npm run dev --workspace client

# Memvalidasi tipe TypeScript dan mengompilasi bundle produksi ke folder client/dist
npm run build -w client

# Menjalankan linter ESLint untuk memeriksa standar kode
npm run lint -w client
```

Untuk petunjuk konfigurasi backend API, koneksi database PostgreSQL, dan integrasi bot Telegram, silakan pelajari dokumentasi di [**`server/README.md`**](../server/README.md).
