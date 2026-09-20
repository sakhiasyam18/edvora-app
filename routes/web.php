<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Dashboard/Siswa');
});

// Rute Dummy untuk Tim UI/UX (Agar bisa melihat hasil slicing lewat browser)
Route::get('/admin', function () { return Inertia::render('Dashboard/Admin'); });
Route::get('/latihan', function () { return Inertia::render('Latihan/PilihPaket'); });
Route::get('/ujian', function () { return Inertia::render('Latihan/ArenaUjian'); });
Route::get('/hasil', function () { return Inertia::render('Latihan/HasilUjian'); });
Route::get('/lobby', function () { return Inertia::render('Battle/LobbyWaiting'); });
Route::get('/battle', function () { return Inertia::render('Battle/ArenaBattle'); });
Route::get('/kelola-soal', function () { return Inertia::render('MasterData/KelolaSoal'); });

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
