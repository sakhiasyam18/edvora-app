<?php

use App\Http\Controllers\AdminSoalController;
use App\Http\Controllers\BattleController;
use App\Http\Controllers\BerandaController;
use App\Http\Controllers\BiodataController;
use App\Http\Controllers\JadwalController;
use App\Http\Controllers\LatihanSoalController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RiwayatController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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

        // Rute Jadwal
        Route::prefix('jadwal')->group(function () {
            Route::get('/', [JadwalController::class, 'index'])->name('jadwal.index');
            Route::post('/simpan', [JadwalController::class, 'simpan'])->name('jadwal.simpan');
        });

        // Rute Admin
        Route::prefix('admin')->group(function () {
            Route::get('/kelola-soal', [AdminSoalController::class, 'index'])->name('admin.soal.index');
            Route::post('/kelola-soal', [AdminSoalController::class, 'simpan'])->name('admin.soal.simpan');
        });

        // Rute Try Out
        Route::prefix('tryout')->group(function () {
            Route::get('/', function () {
                return Inertia::render('TryOut/Index');
            })->name('tryout.index');

            Route::get('/{id}/kerjakan', function ($id) {
                return Inertia::render('TryOut/Kerjakan', ['id' => $id]);
            })->name('tryout.kerjakan');
        });
    });
});

require __DIR__.'/auth.php';
