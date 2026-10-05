<?php

namespace Tests\Unit;

use App\Services\AnalitikSoal;
use PHPUnit\Framework\TestCase;

/**
 * Aturan butir bermasalah di Dashboard Analitik editor.
 */
class AnalitikSoalTest extends TestCase
{
    public function test_butir_wajar_tidak_bermasalah(): void
    {
        $this->assertNull(AnalitikSoal::alasanBermasalah(0.517, null));
        $this->assertNull(AnalitikSoal::alasanBermasalah(0.10, 1.2));
        $this->assertNull(AnalitikSoal::alasanBermasalah(0.95, AnalitikSoal::IRT_A_RENDAH));
    }

    public function test_hampir_semua_salah_atau_benar(): void
    {
        $this->assertSame('Hampir semua siswa salah (5,0% benar). Cek kuncinya.', AnalitikSoal::alasanBermasalah(0.05, null));
        $this->assertSame('Hampir semua siswa benar (98,0% benar). Soal terlalu mudah.', AnalitikSoal::alasanBermasalah(0.98, 1.0));
    }

    public function test_daya_beda_irt_rendah(): void
    {
        $this->assertSame('Daya beda rendah (a = 0,30).', AnalitikSoal::alasanBermasalah(0.6, 0.3));
    }
}
