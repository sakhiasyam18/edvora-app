<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Penilaian IRT Try Out yang sudah ditutup (RANCANGAN-irt.md 5.5). Lokal: php artisan schedule:work.
// Kunci tumpang tindih kedaluwarsa 10 menit (bawaan 24 jam): kalau scheduler dimatikan saat perintah berjalan,
// kuncinya tertinggal dan penilaian berhenti diam-diam. Penilaian ganda tetap dicegah lockForUpdate + dinilai_at.
Schedule::command('edvora:nilai-tryout')->everyMinute()->withoutOverlapping(10);
