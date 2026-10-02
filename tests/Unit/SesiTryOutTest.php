<?php

namespace Tests\Unit;

use App\Services\SesiTryOut;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class SesiTryOutTest extends TestCase
{
    // Tiga subtes: A 30 menit, B 15 menit, C 25 menit.
    private const SUBTES = [['id' => 'A', 'menit' => 30.0], ['id' => 'B', 'menit' => 15.0], ['id' => 'C', 'menit' => 25.0]];

    private const JAWABAN = ['s1' => ['opsiIds' => ['o1'], 'jawabanIsian' => null]];

    public function test_subtes_pertama_aktif_sejak_pengerjaan_dimulai(): void
    {
        $posisi = $this->posisi([], $this->t(10));

        $this->assertSame('A', $posisi['aktif']);
        $this->assertSame($this->t(30)->toIso8601String(), $posisi['batas']->toIso8601String());
        $this->assertSame($this->t(0)->toIso8601String(), $posisi['catatan']['A']['mulai']);
        $this->assertFalse($posisi['selesai']);
    }

    public function test_kiriman_menutup_subtes_dan_memulai_berikutnya(): void
    {
        $posisi = $this->kirim([], $this->t(12), 'A', self::JAWABAN);

        $this->assertSame(self::JAWABAN, $posisi['catatan']['A']['jawaban']);
        $this->assertSame($this->t(12)->toIso8601String(), $posisi['catatan']['A']['selesai']);
        $this->assertSame('B', $posisi['aktif']);
        $this->assertSame($this->t(27)->toIso8601String(), $posisi['batas']->toIso8601String());
    }

    public function test_kiriman_subtes_terakhir_menyelesaikan_pengerjaan(): void
    {
        $catatan = $this->kirim([], $this->t(10), 'A', self::JAWABAN)['catatan'];
        $catatan = $this->kirim($catatan, $this->t(20), 'B', [])['catatan'];

        $posisi = $this->kirim($catatan, $this->t(30), 'C', self::JAWABAN);

        $this->assertTrue($posisi['selesai']);
        $this->assertNull($posisi['aktif']);
        $this->assertSame($this->t(30)->toIso8601String(), $posisi['waktuSelesai']->toIso8601String());
        $this->assertSame(self::JAWABAN, $posisi['catatan']['C']['jawaban']);
    }

    public function test_catatan_kosong_posisi_dihitung_dari_jam_dan_subtes_kedaluwarsa_ditutup_berantai(): void
    {
        // Session hilang di menit 50: A ditutup di menit 30, B di menit 45, C aktif sejak menit 45.
        $posisi = $this->posisi([], $this->t(50));

        $this->assertSame('C', $posisi['aktif']);
        $this->assertSame($this->t(30)->toIso8601String(), $posisi['catatan']['A']['selesai']);
        $this->assertSame($this->t(45)->toIso8601String(), $posisi['catatan']['B']['selesai']);
        $this->assertSame([], $posisi['catatan']['A']['jawaban']);
        $this->assertSame($this->t(70)->toIso8601String(), $posisi['batas']->toIso8601String());
    }

    public function test_semua_waktu_habis_pengerjaan_selesai(): void
    {
        $posisi = $this->posisi([], $this->t(120));

        $this->assertTrue($posisi['selesai']);
        $this->assertSame($this->t(70)->toIso8601String(), $posisi['waktuSelesai']->toIso8601String());
    }

    public function test_periode_memotong_subtes(): void
    {
        // Review Focus 4: periode berakhir di menit 20, saat A masih berjalan.
        $selesaiAt = $this->t(20);

        $berjalan = SesiTryOut::posisi(self::SUBTES, [], $this->t(0), $selesaiAt, $this->t(5));
        $this->assertSame($this->t(20)->toIso8601String(), $berjalan['batas']->toIso8601String());

        $lewat = SesiTryOut::posisi(self::SUBTES, [], $this->t(0), $selesaiAt, $this->t(25));
        $this->assertTrue($lewat['selesai']);
        $this->assertSame($this->t(20)->toIso8601String(), $lewat['waktuSelesai']->toIso8601String());
        $this->assertSame($this->t(20)->toIso8601String(), $lewat['catatan']['A']['selesai']);
        $this->assertArrayNotHasKey('B', $lewat['catatan']);
        $this->assertArrayNotHasKey('C', $lewat['catatan']);
    }

    public function test_kiriman_menjelang_akhir_periode_subtes_berikutnya_terpotong(): void
    {
        // A dikirim semenit sebelum periode berakhir: B tetap dimulai, tetapi batasnya akhir periode.
        $selesaiAt = $this->t(20);

        $posisi = SesiTryOut::terimaKiriman(self::SUBTES, [], $this->t(0), $selesaiAt, $this->t(19), 'A', self::JAWABAN);
        $this->assertSame('B', $posisi['aktif']);
        $this->assertSame($this->t(20)->toIso8601String(), $posisi['batas']->toIso8601String());

        $akhir = SesiTryOut::posisi(self::SUBTES, $posisi['catatan'], $this->t(0), $selesaiAt, $this->t(21));
        $this->assertTrue($akhir['selesai']);
        $this->assertSame($this->t(20)->toIso8601String(), $akhir['waktuSelesai']->toIso8601String());
        $this->assertSame(self::JAWABAN, $akhir['catatan']['A']['jawaban']);
        $this->assertArrayNotHasKey('C', $akhir['catatan']);
    }

    public function test_toleransi_tiga_puluh_detik_setelah_batas(): void
    {
        $diterima = $this->kirim([], $this->t(30, 30), 'A', self::JAWABAN);
        $this->assertSame(self::JAWABAN, $diterima['catatan']['A']['jawaban']);
        $this->assertSame($this->t(30)->toIso8601String(), $diterima['catatan']['A']['selesai']);
        $this->assertSame('B', $diterima['aktif']);

        $ditolak = $this->kirim([], $this->t(30, 31), 'A', self::JAWABAN);
        $this->assertSame([], $ditolak['catatan']['A']['jawaban']);
    }

    public function test_kiriman_untuk_subtes_yang_bukan_aktif_diabaikan(): void
    {
        // Review Focus 3: tab lama mengirim A lagi setelah A disimpan dan B berjalan.
        $catatan = $this->kirim([], $this->t(10), 'A', self::JAWABAN)['catatan'];
        $lain = ['s2' => ['opsiIds' => ['o9'], 'jawabanIsian' => null]];

        $posisi = $this->kirim($catatan, $this->t(15), 'A', $lain);

        $this->assertSame(self::JAWABAN, $posisi['catatan']['A']['jawaban']);
        $this->assertSame('B', $posisi['aktif']);
        // Kiriman untuk subtes yang belum dimulai juga diabaikan.
        $this->assertSame([], $this->kirim($catatan, $this->t(15), 'C', $lain)['catatan']['B']['jawaban']);
    }

    private function t(int $menit, int $detik = 0): CarbonImmutable
    {
        return CarbonImmutable::parse('2026-10-03 01:00:00', 'UTC')->addMinutes($menit)->addSeconds($detik);
    }

    private function posisi(array $catatan, CarbonImmutable $sekarang): array
    {
        return SesiTryOut::posisi(self::SUBTES, $catatan, $this->t(0), $this->t(60 * 24), $sekarang);
    }

    private function kirim(array $catatan, CarbonImmutable $sekarang, string $subtesId, array $jawaban): array
    {
        return SesiTryOut::terimaKiriman(self::SUBTES, $catatan, $this->t(0), $this->t(60 * 24), $sekarang, $subtesId, $jawaban);
    }
}
