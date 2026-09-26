<?php

use App\Http\Controllers\AdminSoalController;
use App\Http\Controllers\BattleController;
use App\Http\Controllers\JadwalController;
use App\Http\Controllers\LatihanSoalController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RiwayatController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [WelcomeController::class, 'index'])->name('welcome');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard/Siswa');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {

    // Rute Latihan Soal (Index)
    Route::get('/latihan', [LatihanSoalController::class, 'index'])->name('latihan.index');

    // Rute Latihan
    Route::prefix('latihan')->group(function () {
        Route::get('/persiapan', [LatihanSoalController::class, 'index'])->name('latihan.persiapan');
        Route::get('/ujian', [LatihanSoalController::class, 'ujian'])->name('latihan.ujian');
        // block(): request dengan session yang sama diproses bergantian, jadi klik ganda tidak saling timpa.
        Route::post('/ujian/cek-jawaban', [LatihanSoalController::class, 'cekJawaban'])
            ->middleware('throttle:30,1')
            ->block(10, 10)
            ->name('latihan.cek');
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
        Route::get('/pembahasan', [RiwayatController::class, 'pembahasan'])->name('riwayat.pembahasan');
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
});

Route::middleware('auth')->group(function () {
    Route::get('/biodata', function () {
        return Inertia::render('Auth/Biodata');
    })->name('biodata');

    Route::get('/akun/profil', function () {
        return Inertia::render('Akun/Profil');
    })->name('akun.profil');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
