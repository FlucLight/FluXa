# PRD — Design System (Personal Finance Tracker)

**Status:** Draft v1
**Owner:** FlucLight
**Target:** Panduan visual/design token untuk AI coding agent saat membangun UI. Dipakai berdampingan dengan `finance-tracker.prd.md` (functional spec).

---

## 1. Brief & Prinsip Desain

Arahan dari owner:
- Profesional, minimalis, basis **hitam-putih**
- **Tanpa warna ungu** sama sekali
- Ruang kosong terisi rapi — bukan terlalu sesak, bukan juga terlalu kosong sampai terasa "hampa"
- Bound/border **tidak terlalu melengkung, tidak terlalu tajam**
- Warna kontras tapi tetap **sinkron**, tidak menyakitkan mata
- Layout rapi, tersusun baik, profesional
- Warna **tidak terlalu pucat**, tapi juga **tidak terlalu terang/menyala**

**Prinsip turunan yang dipakai untuk seluruh desain:**
1. **Grayscale sebagai fondasi.** Semua elemen struktural (background, card, teks, border, tombol default) memakai skala abu-abu netral — bukan hitam pekat pure `#000` atau putih pure `#FFF`, supaya tidak keras di mata.
2. **Warna hanya untuk makna, bukan dekorasi.** Satu-satunya tempat warna non-grayscale muncul adalah semantic color untuk data finansial (income = hijau, expense = merah, budget warning = kuning-emas) — karena di aplikasi finance, ini bukan hiasan tapi informasi yang harus cepat dibaca mata. Semua warna ini di-*desaturate* (tidak neon/terang menyala) supaya tetap terasa "hitam-putih profesional" dengan aksen fungsional, bukan aplikasi yang penuh warna.
3. **Radius medium, konsisten.** Tidak ada sudut 0 (kaku/tajam) dan tidak ada radius besar/pill-shape berlebihan (kesan childish/bouncy) — satu skala radius terbatas dipakai konsisten di semua komponen sejenis.
4. **Whitespace terukur, bukan asal luas.** Pakai spacing scale yang konsisten, bukan padding acak — halaman terasa "lega" bukan karena kosong, tapi karena grid & jarak antar elemen konsisten dan proporsional.

---

## 2. Color Tokens

| Token | Hex | Peran |
|---|---|---|
| `--color-ink` | `#1B1C1F` | Teks primer (bukan pure black — sedikit lebih lunak) |
| `--color-ink-muted` | `#5A5C61` | Teks sekunder/caption/label |
| `--color-ink-faint` | `#8B8D92` | Teks tersier (placeholder, disabled) |
| `--color-surface` | `#F5F5F3` | Background halaman utama |
| `--color-surface-raised` | `#FFFFFF` | Background card/panel yang perlu sedikit "naik" dari page |
| `--color-surface-sunken` | `#ECECE9` | Background elemen input/table-header, kesan "turun" |
| `--color-border` | `#DADAD6` | Hairline border default (antar section, table row) |
| `--color-border-strong` | `#B7B7B2` | Divider yang perlu lebih tegas (mis. outline input saat focus-adjacent, card penting) |
| `--color-positive` | `#2E7D5B` | Income, saldo positif, status aman/dalam budget |
| `--color-positive-soft` | `#E4EFE9` | Background badge/chip untuk konteks positive |
| `--color-negative` | `#B23A3A` | Expense, saldo negatif, over-budget |
| `--color-negative-soft` | `#F5E5E4` | Background badge/chip untuk konteks negative |
| `--color-warning` | `#A9782E` | Budget mendekati limit (mis. >80%) |
| `--color-warning-soft` | `#F1E7D6` | Background badge/chip untuk warning |
| `--color-focus` | `#2C2E33` | Outline/ring saat elemen difokus (near-black, bukan warna terang) |

**Kenapa begini:**
- Tidak ada ungu di mana pun, sesuai arahan.
- `--color-ink` bukan `#000000` murni dan `--color-surface` bukan `#FFFFFF` murni — kontrasnya tetap tinggi (aman untuk aksesibilitas teks), tapi tidak "menyilaukan" seperti hitam-putih pekat bersebelahan.
- Hijau/merah/kuning di atas semuanya di-*desaturate* (tone earthy/muted, bukan neon) — cukup jelas dibedakan mata tanpa jadi mencolok atau "murah".
- Tiga warna semantic ini **saling seimbang secara value** (kegelapan/terang mirip satu sama lain) supaya kalau dipasang berdampingan (mis. badge income vs badge expense) tidak ada yang terasa "berteriak" lebih dari yang lain — itu yang dimaksud "kontras tapi sinkron."

---

## 3. Typography

| Role | Font | Alasan |
|---|---|---|
| Heading/Display | **Space Grotesk** | Karakter geometris-modern, tegas tapi tetap bersih — cocok untuk judul & angka besar (mis. total saldo di dashboard) tanpa kesan generic seperti Inter-untuk-semuanya |
| Body/UI | **Inter** | Sangat legible di ukuran kecil (table, form, label), punya tabular figures — penting untuk angka rupiah yang harus rapi sejajar di kolom |

**Aturan skala tipografi:**
- Line length body text: maksimal ~80 karakter per baris.
- Angka finansial (amount di tabel/list) **wajib** pakai `font-variant-numeric: tabular-nums` supaya kolom angka rapi sejajar — ini penting banget untuk web finance.
- Hindari all-caps untuk label (sesuai prinsip umum desain yang baik) — pakai sentence case, bedakan hierarchy lewat ukuran/weight, bukan lewat kapital semua.

---

## 4. Shape Language — Border Radius

Skala terbatas, dipakai konsisten (jangan campur radius berbeda untuk komponen sejenis):

| Token | Value | Dipakai untuk |
|---|---|---|
| `--radius-sm` | `6px` | Input, badge/chip, tombol kecil |
| `--radius-md` | `10px` | Card, modal, tombol utama |
| `--radius-lg` | `14px` | Container besar (mis. panel dashboard), dipakai jarang, hanya untuk elemen paling luar |

Tidak ada `0px` (kesan tajam/keras) dan tidak ada radius besar (>16px) atau pill-shape (`9999px`) kecuali untuk elemen kecil spesifik seperti avatar/status-dot bulat.

---

## 5. Layout & Spacing

**Spacing scale (dipakai untuk semua padding/margin/gap):**
`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64` (px)

**Prinsip layout:**
- Struktur utama: sidebar navigasi tetap (kiri) + area konten utama — bukan navbar horizontal penuh, biar dashboard finance terasa seperti tool kerja, bukan landing page marketing.
- Dashboard pakai grid, bukan tumpukan card seragam identik (hindari "SaaS card kit" — semua card radius sama tanpa hierarki). Elemen paling penting (net balance bulan ini) dapat porsi visual lebih besar; chart & breakdown kategori di bawahnya dengan hierarki yang jelas.
- Tabel transaksi: baris dipisah hairline border (`--color-border`), bukan zebra-stripe warna-warni — tetap dalam nuansa grayscale, hanya angka amount yang boleh berwarna (hijau/merah sesuai tipe).
- Ruang kosong diisi lewat **proporsi & grouping yang jelas**, bukan elemen dekoratif tambahan (ilustrasi, gradient, dsb) — jarak antar section yang cukup lega (pakai `32`/`48`) sudah cukup membuat halaman terasa "bernapas" tanpa terasa kosong.

---

## 6. Komponen — Catatan Spesifik

- **Tombol primer**: background `--color-ink` (bukan warna cerah), teks putih, radius `--radius-sm`/`--radius-md`. Hover: sedikit lebih terang dari ink, bukan berubah warna.
- **Tombol destructive** (mis. hapus transaksi): outline/text pakai `--color-negative`, tidak full-fill merah kecuali untuk konfirmasi akhir modal — biar "merah" tetap terasa sebagai sinyal, bukan dekorasi yang sering muncul.
- **Badge kategori**: background `-soft` variant dari warna semantic terkait (kalau kategori expense → netral abu-abu; badge status income/expense/warning baru pakai warna soft).
- **Chart** (dashboard): palette chart tetap grayscale untuk kategori netral, hijau/merah hanya untuk membedakan income vs expense di chart tren — jangan pakai palet warna-warni random per kategori (itu yang bikin "pusing", sesuai arahan owner).
- **Focus state**: ring `--color-focus` 2px, bukan warna terang — tetap terlihat jelas untuk aksesibilitas tanpa mencolok.
- **Empty state** (mis. belum ada transaksi bulan ini): teks singkat + 1 CTA jelas ("Tambah transaksi pertama"), tanpa ilustrasi besar — konsisten dengan nuansa minimalis-profesional, bukan playful.

---

## 7. Aksesibilitas & Kenyamanan Visual

- Kontras teks vs background dicek minimal WCAG AA (`--color-ink` di atas `--color-surface`/`--color-surface-raised` sudah jauh di atas ambang ini).
- Warna semantic (hijau/merah/kuning) **tidak jadi satu-satunya penanda** — selalu didampingi ikon arah (↑/↓) atau label teks ("Income"/"Expense"), supaya tetap jelas untuk user dengan color blindness.
- Hindari elemen dengan gerakan otomatis (auto-playing animation/transition tanpa trigger user) — kalau ada motion, hanya untuk merespons aksi user (buka modal, submit form), bukan hiasan halaman.

---

*Dokumen ini dipakai bersama `finance-tracker.prd.md`. Kalau ada bentrok antara kebutuhan fungsional dan estetika, prioritaskan keterbacaan data finansial di atas estetika murni.*
