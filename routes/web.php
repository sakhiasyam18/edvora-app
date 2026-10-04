<?php

use App\Http\Controllers\AdminSoalController;
use App\Http\Controllers\BattleController;
use App\Http\Controllers\BerandaController;
use App\Http\Controllers\BiodataController;
use App\Http\Controllers\GambarSoalController;
use App\Http\Controllers\JadwalController;
use App\Http\Controllers\LatihanSoalController;
use App\Http\Controllers\PerkembanganController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RiwayatController;
use App\Http\Controllers\TryOutController;
use App\Http\Controllers\UploadSoalController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

// ==========================================
// AKSES PUBLIK
// ==========================================
Route::get('/', [WelcomeController::class, 'index'])->name('welcome');

// ==========================================
// LEVEL 1: Wajib Login & Email Sudah Diverifikasi
// (Jika email belum diverifikasi, pengguna otomatis dicegat ke /verify-email)
// ==========================================
Route::middleware(['auth', 'verified'])->group(function () {

    // Di luar grup yang dijaga biodata.lengkap, agar tidak terjadi redirect loop.
    Route::get('/biodata', [BiodataController::class, 'index'])->name('biodata');
    Route::post('/biodata', [BiodataController::class, 'simpan'])->name('biodata.simpan');

    // ==========================================
    // LEVEL 2: Wajib Login, Email Verified, & Biodata Lengkap
    // (Akses ke aplikasi utama dan profil)
    // ==========================================
    Route::middleware(['biodata.lengkap'])->group(function () {

        // Dasbor Utama
        Route::get('/dashboard', [BerandaController::class, 'index'])->name('dashboard');

        // Manajemen Profil Akun
        Route::get('/akun/profil/utama', [ProfileController::class, 'profilUtama'])
            ->name('akun.profil.utama');

        Route::get('/akun/profil', [ProfileController::class, 'show'])
            ->name('akun.profil');

        Route::patch('/akun/profil', [ProfileController::class, 'updateBiodata'])
            ->name('akun.profil.update');

        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

        // Rute Latihan Soal (Index)
        Route::get('/latihan', [LatihanSoalController::class, 'index'])->name('latihan.index');

        // Rute Latihan
        Route::prefix('latihan')->group(function () {
            Route::get('/persiapan', [LatihanSoalController::class, 'index'])->name('latihan.persiapan');
            // Segmen subtes/ mencegah bentrok dengan /latihan/ujian dan /latihan/hasil; kode tak dikenal → 404.
            Route::get('/subtes/{subtes:kode_subtes}', [LatihanSoalController::class, 'pilihMode'])->name('latihan.mode');
            Route::get('/ujian', [LatihanSoalController::class, 'ujian'])->name('latihan.ujian');
            // block(): request dengan session yang sama diproses bergantian, jadi klik ganda tidak saling timpa.
            Route::post('/ujian/cek-jawaban', [LatihanSoalController::class, 'cekJawaban'])
                ->middleware('throttle:30,1')
                ->block(10, 10)
                ->name('latihan.cek');
            // Membuka hint dicatat di session supaya jawaban benar dengan hint bernilai 0,5.
            Route::post('/ujian/hint', [LatihanSoalController::class, 'bukaHint'])
                ->middleware('throttle:30,1')
                ->block(10, 10)
                ->name('latihan.hint');
            Route::post('/ujian/simpan', [LatihanSoalController::class, 'simpanJawaban'])->block(10, 10)->name('latihan.simpan');
            Route::get('/hasil', [LatihanSoalController::class, 'hasil'])->name('latihan.hasil');
        });

        // Rute Battle
        Route::prefix('battle')->group(function () {
            Route::get('/matchmaking', [BattleController::class, 'cariLawan'])->name('battle.matchmaking');
            Route::get('/arena', [BattleController::class, 'mulaiBattle'])->name('battle.arena');
            Route::get('/hasil', [BattleController::class, 'hasilBattle'])->name('battle.hasil');
        });

        // Rute Riwayat
        Route::prefix('riwayat')->group(function () {
            Route::get('/', [RiwayatController::class, 'index'])->name('riwayat.index');
            Route::get('/{pengerjaanId}/info', [RiwayatController::class, 'getModalInfo'])->name('riwayat.info');
            Route::get('/{pengerjaanId}/pembahasan', [RiwayatController::class, 'pembahasan'])->name('riwayat.detail');
        });

        // Perkembangan Belajar (UCS4, RANCANGAN-perkembangan.md)
        Route::get('/perkembangan', [PerkembanganController::class, 'index'])->name('perkembangan.index');

        // Rute Jadwal
        Route::prefix('jadwal')->group(function () {
            Route::get('/', [JadwalController::class, 'index'])->name('jadwal.index');
            Route::post('/simpan', [JadwalController::class, 'simpan'])->name('jadwal.simpan');
        });

        // Rute Admin (UCS6 Mengelola User): hanya role admin; role lain mendapat 403.
        Route::prefix('admin')->middleware('peran:admin')->group(function () {
            // Halaman template tujuan setelah admin login; belum butuh data dari server.
            Route::inertia('/', 'Dashboard/Admin')->name('admin.index');
            // Kelola User menyusul, dengan nama rute admin.user.*
        });

        // Rute Editor (UCS7 Bank Soal, UCS8 Paket Try Out, UCS9 Dashboard Analitik): hanya role admin_editor.
        Route::prefix('editor')->middleware('peran:admin_editor')->group(function () {
            Route::get('/', [AdminSoalController::class, 'dashboard'])->name('editor.dashboard');

            // Bank soal per subtes; kode subtes tak dikenal → 404.
            Route::get('/bank-soal/template', [UploadSoalController::class, 'template'])->name('editor.soal.template');
            Route::get('/bank-soal/{subtes:kode_subtes}', [AdminSoalController::class, 'index'])->name('editor.soal.index');
            Route::get('/bank-soal/{subtes:kode_subtes}/tambah', [AdminSoalController::class, 'tambah'])->name('editor.soal.tambah');
            Route::post('/bank-soal/{subtes:kode_subtes}', [AdminSoalController::class, 'simpan'])->name('editor.soal.simpan');
            // Upload Excel: periksa dulu, lalu kirim ulang file yang sama untuk disimpan (JSON, dipanggil dari modal).
            Route::post('/bank-soal/{subtes:kode_subtes}/upload/periksa', [UploadSoalController::class, 'periksa'])
                ->middleware('throttle:20,1')
                ->name('editor.soal.upload.periksa');
            Route::post('/bank-soal/{subtes:kode_subtes}/upload', [UploadSoalController::class, 'simpan'])
                ->middleware('throttle:20,1')
                ->block(60, 60)
                ->name('editor.soal.upload');
            // Unggah satu gambar dari formulir soal (JSON); link hasilnya diisi ke kolom URL gambar.
            Route::post('/bank-soal/{subtes:kode_subtes}/gambar', [GambarSoalController::class, 'unggah'])
                ->middleware('throttle:60,1')
                ->name('editor.soal.gambar');

            Route::get('/soal/{soal:kode_soal}/edit', [AdminSoalController::class, 'edit'])->name('editor.soal.edit');
            Route::put('/soal/{soal:kode_soal}', [AdminSoalController::class, 'ubah'])->name('editor.soal.ubah');
            Route::patch('/soal/{soal:kode_soal}/status', [AdminSoalController::class, 'ubahStatus'])->name('editor.soal.status');
        });

        // Rute Try Out (RANCANGAN-tryout.md 5.1). whereUuid: id yang bukan UUID langsung 404, bukan error query Postgres.
        Route::prefix('tryout')->group(function () {
            Route::get('/', [TryOutController::class, 'index'])->name('tryout.index');
            // block(): klik ganda dan kirim otomatis yang bersamaan diproses bergantian.
            Route::post('/{tryOut}/mulai', [TryOutController::class, 'mulai'])->whereUuid('tryOut')->block(10, 10)->name('tryout.mulai');
            Route::get('/{tryOut}/kerjakan', [TryOutController::class, 'kerjakan'])->whereUuid('tryOut')->name('tryout.kerjakan');
            Route::post('/{tryOut}/kirim', [TryOutController::class, 'kirim'])->whereUuid('tryOut')->block(10, 10)->name('tryout.kirim');
            Route::get('/{tryOut}/hasil', [TryOutController::class, 'hasil'])->whereUuid('tryOut')->name('tryout.hasil');
        });
    });
});

require __DIR__.'/auth.php';
