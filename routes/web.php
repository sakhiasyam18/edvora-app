<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\AdminSoalController;
use App\Http\Controllers\BattleController;
use App\Http\Controllers\JadwalController;
use App\Http\Controllers\LatihanController;
use App\Http\Controllers\RiwayatController;

use App\Http\Controllers\WelcomeController;

Route::get('/', [WelcomeController::class, 'index'])->name('welcome');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard/Siswa');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    
    // Rute Latihan
    Route::prefix('latihan')->group(function () {
        Route::get('/persiapan', [LatihanController::class, 'persiapan'])->name('latihan.persiapan');
        Route::get('/ujian', [LatihanController::class, 'mulaiUjian'])->name('latihan.ujian');
        Route::post('/ujian/simpan', [LatihanController::class, 'simpanJawaban'])->name('latihan.simpan');
        Route::get('/hasil', [LatihanController::class, 'hasil'])->name('latihan.hasil');
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
