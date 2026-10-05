<?php

namespace Tests\Unit;

use App\Services\AnalitikSoal;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\TestCase;


class AnalitikSoalTest extends TestCase
{
    public function test_topik_kurang_bila_salah_satu_tingkat_di_bawah_target(): void
    {
        $stok = [
            ['kodeSubtes' => 'PU', 'topik' => 'Logika', 'mudah' => 25, 'sedang' => 20, 'sulit' => 15],
            ['kodeSubtes' => 'PU', 'topik' => 'Pola', 'mudah' => 10, 'sedang' => 9, 'sulit' => 0],
        ];

        $this->assertSame(
            [['kodeSubtes' => 'PU', 'topik' => 'Pola', 'kurang' => ['sedang' => 1, 'sulit' => 10]]],
            AnalitikSoal::kekuranganTopik($stok),
        );
    }

    public function test_rata_penguasaan_hanya_dari_siswa_yang_punya_skor(): void
    {
        $topik = ['S1' => ['T1', 'T2']];
        $baris = [
            // Siswa A: T1 tahap 3 skor 75 (100%), T2 belum ada baris (0%) => 50%.
            ['user_id' => 'A', 'subtes_id' => 'S1', 'topik_id' => 'T1', 'tahap' => 3, 'skor' => 75.0],
            // Siswa B: T1 tahap 1 skor 37,5 (setengah sepertiga = 16,7%), T2 0% => 8,4%; rata-rata dengan A = 29,2%.
            ['user_id' => 'B', 'subtes_id' => 'S1', 'topik_id' => 'T1', 'tahap' => 1, 'skor' => 37.5],
            // Siswa C baru mulai: jendela belum penuh, jadi tidak ikut dirata-rata.
            ['user_id' => 'C', 'subtes_id' => 'S1', 'topik_id' => 'T2', 'tahap' => 1, 'skor' => null],
        ];

        $this->assertSame(['S1' => ['persen' => 29.2, 'siswa' => 2]], AnalitikSoal::rataPenguasaan($topik, $baris));
    }

    public function test_subtes_tanpa_siswa_berskor_tidak_ada(): void
    {
        $baris = [['user_id' => 'C', 'subtes_id' => 'S1', 'topik_id' => 'T1', 'tahap' => 1, 'skor' => null]];

        $this->assertSame([], AnalitikSoal::rataPenguasaan(['S1' => ['T1']], $baris));
    }

    public function test_data_harian_dihitung_ulang_setelah_tengah_malam_wib(): void
    {
        // 6 Okt 00.30 WIB = 5 Okt 17.30 UTC.
        $sekarang = Carbon::parse('2026-10-05 17:30', 'UTC');

        $this->assertTrue(AnalitikSoal::perluDihitungUlang(null, $sekarang));
        // Dihitung 5 Okt 23.59 WIB: sudah basi.
        $this->assertTrue(AnalitikSoal::perluDihitungUlang(Carbon::parse('2026-10-05 16:59', 'UTC'), $sekarang));
        // Dihitung tepat 6 Okt 00.00 WIB: masih berlaku.
        $this->assertFalse(AnalitikSoal::perluDihitungUlang(Carbon::parse('2026-10-05 17:00', 'UTC'), $sekarang));
    }
}
