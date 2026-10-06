<?php

namespace Tests\Unit;

use App\Services\PenilaianLatihan;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class PenilaianLatihanTest extends TestCase
{
    public function test_jawaban_benar_tanpa_hint_mendapat_nilai_penuh(): void
    {
        $this->assertSame(['xp' => 5, 'poin' => 3], PenilaianLatihan::hadiah('mudah', true, false));
        $this->assertSame(['xp' => 10, 'poin' => 5], PenilaianLatihan::hadiah('sedang', true, false));
        $this->assertSame(['xp' => 15, 'poin' => 8], PenilaianLatihan::hadiah('sulit', true, false));
    }

    public function test_jawaban_benar_dengan_hint_mendapat_setengah_dibulatkan_ke_bawah(): void
    {
        $this->assertSame(['xp' => 2, 'poin' => 1], PenilaianLatihan::hadiah('mudah', true, true));
        $this->assertSame(['xp' => 5, 'poin' => 2], PenilaianLatihan::hadiah('sedang', true, true));
        $this->assertSame(['xp' => 7, 'poin' => 4], PenilaianLatihan::hadiah('sulit', true, true));
    }

    public function test_jawaban_salah_tidak_mendapat_apa_pun(): void
    {
        foreach (['mudah', 'sedang', 'sulit'] as $tingkat) {
            foreach ([false, true] as $hint) {
                $this->assertSame(['xp' => 0, 'poin' => 0], PenilaianLatihan::hadiah($tingkat, false, $hint), "{$tingkat}, hint {$hint}");
            }
        }
    }

    public function test_tingkat_tidak_dikenal_ditolak(): void
    {
        $this->expectException(InvalidArgumentException::class);

        PenilaianLatihan::hadiah('esai', true, false);
    }
}
