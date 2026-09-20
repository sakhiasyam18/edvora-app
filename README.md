<div align="center">
  
  # 🚀 EDVORA
  **Platform UTBK Gamifikasi**
  
  [![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Inertia.js](https://img.shields.io/badge/Inertia.js-9553E9?style=for-the-badge&logo=inertia&logoColor=white)](https://inertiajs.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
</div>

---

> Repositori ini berisi kode sumber untuk pengembangan antarmuka dan logika sistem **EDVORA** menggunakan arsitektur modern untuk performa dan interaktivitas maksimal.
> Saat ini, pengembangan masih menggunakan basis data **MySQL lokal (XAMPP)** untuk keperluan *slicing* UI/UX. Transisi ke **Supabase** akan dilakukan pada fase selanjutnya.

---

## 📑 Daftar Isi
- [📋 Prasyarat Sistem](#-prasyarat-sistem)
- [🛠️ Langkah Instalasi (Bebas Glitch)](#️-langkah-instalasi-bebas-glitch)
- [💻 Cara Menjalankan Aplikasi (Dua Terminal)](#-cara-menjalankan-aplikasi-dua-terminal)
- [🏗️ Aturan Main & Pembagian Direktori (Tempat Ngoding)](#️-aturan-main--pembagian-direktori-tempat-ngoding)
- [🤝 Alur Kerja Tim (Git Workflow)](#-alur-kerja-tim-git-workflow)

---

## 📋 Prasyarat Sistem

Pastikan komputermu sudah terinstal perangkat lunak berikut sebelum melakukan penarikan kode:

| Perangkat Lunak | Versi Minimal | Keterangan |
| :--- | :--- | :--- |
| **PHP** | `8.2.x` | Bawaan XAMPP terbaru |
| **Composer** | `2.x` | Manajer paket PHP |
| **Node.js & npm** | `18.x` / `20.x` | Manajer paket JavaScript |
| **Git** | - | - |
| **XAMPP** | - | Untuk menjalankan Apache dan MySQL lokal |

---

## 🛠️ Langkah Instalasi (Bebas Glitch)

Ikuti langkah-langkah di bawah ini secara berurutan saat pertama kali mengunduh proyek ini.

### 1. Kloning Repositori
```bash
git clone https://github.com/USERNAME_KAMU/edvora-app.git
cd edvora-app
```

### 2. Instalasi Dependensi (Backend & Frontend)
```bash
# Untuk dependensi PHP / Laravel
composer install

# Untuk dependensi Node / React
npm install
```

### 3. Konfigurasi Lingkungan
Gandakan fail `.env.example` menjadi `.env`.
```bash
# Windows CMD / PowerShell
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

### 4. Pembuatan Kunci Keamanan
```bash
php artisan key:generate
```

### 5. Pengaturan Basis Data Lokal (XAMPP)
1. Buka **XAMPP Control Panel**, nyalakan **Apache** dan **MySQL**.
2. Akses `http://localhost/phpmyadmin` di peramban.
3. Buat basis data baru bernama: **`edvora_db`**.
4. Buka fail `.env`, sesuaikan konfigurasi berikut:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=edvora_db
   DB_USERNAME=root
   DB_PASSWORD=
   ```

### 6. Migrasi Tabel Basis Data
```bash
php artisan migrate
```

---

## 💻 Cara Menjalankan Aplikasi (Dua Terminal)

Aplikasi ini menggunakan [Vite](https://vitejs.dev/) dengan *Hot Module Replacement* (HMR), sehingga **wajib** menjalankan dua terminal secara bersamaan saat tahap pengembangan.

<details>
<summary><b>🔥 Terminal 1: Menjalankan Mesin Laravel (Backend)</b></summary>
<br>

```bash
php artisan serve
```
*Akses aplikasi di: `http://localhost:8000`*
</details>

<details>
<summary><b>⚛️ Terminal 2: Menjalankan Vite (Frontend React & Tailwind)</b></summary>
<br>

Buka tab terminal baru (biarkan terminal 1 tetap menyala), lalu jalankan:
```bash
npm run dev
```
</details>

---

## 🏗️ Aturan Main & Pembagian Direktori (Tempat Ngoding)

Karena proyek ini menggunakan arsitektur **Laravel + Inertia + React**, harap perhatikan pembagian kerja berikut:

### 🎨 1. Tim UI/UX & Frontend 
> **Fokus di direktori:** 📂 `resources/js/`

*Jangan mencari fail `.blade.php`. Semua tampilan antarmuka (View) kita menggunakan **React (TSX)** dan **Tailwind CSS**.*

- 📄 **`Pages/`** $\rightarrow$ Tempat membuat halaman utama.
- 🧩 **`Components/`** $\rightarrow$ Tempat membuat potongan UI yang bisa dipakai berulang kali.

#### 🗂️ Struktur Folder Frontend (Sudah Tersedia)
Agar tim UI/UX tidak kebingungan harus meletakkan kodenya di mana, kerangka folder dan fail kosong (*placeholder*) sudah dibuatkan. Silakan bagi tugas dan langsung kerjakan fail masing-masing!

**1. Kerangka Halaman (Di dalam `resources/js/Pages/`)**
Ini adalah fail-fail yang akan dipanggil langsung oleh *Controller* Laravel melalui Inertia.

* 📁 **`Dashboard/`**
  * `Index.tsx` *(Halaman utama Dasbor Siswa/Admin)*
* 📁 **`Latihan/`**
  * `Persiapan.tsx` *(Pilih Mode Simulasi / Fleksibel)*
  * `Ujian.tsx` *(Layar saat ujian berlangsung)*
  * `Hasil.tsx` *(Skor dan perolehan poin/XP)*
* 📁 **`Riwayat/`**
  * `Index.tsx` *(Daftar paket yang sudah dikerjakan)*
  * `Pembahasan.tsx` *(Review jawaban benar/salah)*
* 📁 **`Battle/`**
  * `Matchmaking.tsx` *(Mencari lawan)*
  * `Arena.tsx` *(Pertandingan real-time)*
  * `Hasil.tsx` *(Hasil Head-to-head)*
* 📁 **`Akun/`**
  * `Profil.tsx` *(Avatar, biodata, dan lencana)*
* 📁 **`Jadwal/`**
  * `Index.tsx` *(Kalender dan tabel jadwal belajar)*
* 📁 **`Admin/`**
  * `KelolaSoal.tsx` *(Formulir tambah soal baru)*

**2. Kerangka Komponen Reusable (Di dalam `resources/js/Components/`)**
Ini adalah fail-fail UI yang tidak dipanggil oleh Laravel, melainkan dipanggil oleh fail di folder `Pages` agar desainnya konsisten.

* 📁 **`Layouts/`**
  * `MainLayout.tsx` *(Navbar utama aplikasi dengan navigasi antar menu)*
* 📁 **`Ujian/`**
  * `ArenaPengerjaan.tsx` *(Layout grid navigasi soal di kiri, area pengerjaan di kanan)*
  * `KartuSoal.tsx` *(Bungkus kotak berisi teks pertanyaan dan gambar)*

**3. URL Akses Sementara (Untuk Preview)**
> [!WARNING]
> Seluruh halaman di bawah ini sekarang **dilindungi oleh sistem Autentikasi** bawaan Laravel Breeze (`auth`). Sebelum mengakses *link* di bawah, pastikan Anda **membuat akun (Register) atau Login** terlebih dahulu di halaman awal.

Tim UI/UX dapat menjalankan `npm run dev` dan melihat pratinjau halaman melalui tautan berikut:

- [`/`](http://localhost:8000/) $\rightarrow$ Dasbor Utama
- [`/latihan/persiapan`](http://localhost:8000/latihan/persiapan) $\rightarrow$ Persiapan Latihan
- [`/latihan/ujian`](http://localhost:8000/latihan/ujian) $\rightarrow$ Arena Ujian
- [`/latihan/hasil`](http://localhost:8000/latihan/hasil) $\rightarrow$ Rekap Hasil Latihan
- [`/riwayat`](http://localhost:8000/riwayat) $\rightarrow$ Daftar Riwayat Ujian
- [`/riwayat/pembahasan`](http://localhost:8000/riwayat/pembahasan) $\rightarrow$ Mode Pembahasan/Review
- [`/battle/matchmaking`](http://localhost:8000/battle/matchmaking) $\rightarrow$ Cari Lawan Battle
- [`/battle/arena`](http://localhost:8000/battle/arena) $\rightarrow$ Arena Battle
- [`/battle/hasil`](http://localhost:8000/battle/hasil) $\rightarrow$ Hasil Head-to-head
- [`/profil`](http://localhost:8000/profil) $\rightarrow$ Profil Akun & Lencana
- [`/jadwal`](http://localhost:8000/jadwal) $\rightarrow$ Jadwal Belajar
- [`/admin/kelola-soal`](http://localhost:8000/admin/kelola-soal) $\rightarrow$ Halaman Tambah Soal (Admin)


### 🧠 2. Tim Logika & Backend 
> **Fokus di direktori:** 📂 `app/Http/Controllers/`

*Ini adalah "Otak" aplikasi. Di sinilah tempat menulis logika perhitungan nilai, rumus IRT, dan sistem matchmaking.*

- **Contoh:** `SoalController.php`.
- **Tugas:** Mengambil data, memproses logika, dan melempar *response* via Inertia:
  ```php
  return Inertia::render('NamaHalaman', ['data' => $data]);
  ```

### 🗄️ 3. Tim Database
> **Fokus di direktori:** 📂 `app/Models/`

*Fail model bertugas mendefinisikan relasi antar-tabel (*hasMany*, *belongsTo*).*

- **Contoh:** `Siswa.php`, `Soal.php`.

### 🛣️ 4. Pengatur Rute
> **Fokus di direktori:** 📂 `routes/web.php`

*Setiap ada halaman baru yang membutuhkan URL, **wajib** didaftarkan di sini.*

- **Contoh:** 
  ```php
  Route::get('/ujian', [SoalController::class, 'tampilkanUjian']);
  ```

---

## 🤝 Alur Kerja Tim (Git Workflow)

Untuk menghindari bentrok kode (conflict) dan *error* saat menyatukan pekerjaan:

1. **⬇️ Tarik Kode Terbaru (Pull)**
   Selalu jalankan perintah ini sebelum mulai *ngoding*:
   ```bash
   git pull origin main
   ```
2. **📦 Perbarui Dependensi**
   Jika temanmu menambahkan *library* baru, jalankan ulang:
   ```bash
   composer install
   npm install
   ```
3. **⬆️ Simpan dan Unggah (Push)**
   Setelah pekerjaan selesai:
   ```bash
   git add .
   git commit -m "fitur: membuat halaman dashboard siswa"
   git push origin main
   ```

<div align="center">
  <br>
  <i>Mari bersama-sama membangun platform UTBK yang luar biasa! 🚀</i>
</div>
