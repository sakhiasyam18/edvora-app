<?php

namespace Tests\Unit;

use App\Services\PeringkatTryOut;
use PHPUnit\Framework\TestCase;

class PeringkatTryOutTest extends TestCase
{
    public function test_jenis_selain_khusus_dianggap_umum(): void
    {
        $this->assertSame('khusus', PeringkatTryOut::bacaJenis('khusus'));
        $this->assertSame('umum', PeringkatTryOut::bacaJenis('umum'));
        $this->assertSame('umum', PeringkatTryOut::bacaJenis(null));
        $this->assertSame('umum', PeringkatTryOut::bacaJenis('lain'));
        $this->assertSame('umum', PeringkatTryOut::bacaJenis(['khusus']));
    }

    public function test_halaman_hanya_bilangan_bulat_positif(): void
    {
        $this->assertSame(3, PeringkatTryOut::bacaHalaman('3'));
        $this->assertSame(1, PeringkatTryOut::bacaHalaman(null));
        $this->assertSame(1, PeringkatTryOut::bacaHalaman('0'));
        $this->assertSame(1, PeringkatTryOut::bacaHalaman('-2'));
        $this->assertSame(1, PeringkatTryOut::bacaHalaman('abc'));
        $this->assertSame(1, PeringkatTryOut::bacaHalaman('2.5'));
        $this->assertSame(1, PeringkatTryOut::bacaHalaman(['2']));
    }

    public function test_halaman_terakhir_10_peserta_per_halaman(): void
    {
        $this->assertSame(1, PeringkatTryOut::halamanTerakhir(0));
        $this->assertSame(1, PeringkatTryOut::halamanTerakhir(1));
        $this->assertSame(1, PeringkatTryOut::halamanTerakhir(10));
        $this->assertSame(2, PeringkatTryOut::halamanTerakhir(11));
        $this->assertSame(3, PeringkatTryOut::halamanTerakhir(25));
    }

    public function test_halaman_pertama_podium_3_dan_daftar_7(): void
    {
        $this->assertSame(['podium' => [1, 3], 'daftar' => [4, 10]], PeringkatTryOut::rentang(1));
    }

    public function test_halaman_berikutnya_daftar_10_tanpa_podium(): void
    {
        $this->assertSame(['podium' => null, 'daftar' => [11, 20]], PeringkatTryOut::rentang(2));
        $this->assertSame(['podium' => null, 'daftar' => [21, 30]], PeringkatTryOut::rentang(3));
    }
}
