<?php

namespace Tests\Unit;

use App\Models\TryOut;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class TryOutTest extends TestCase
{
    public function test_status_dihitung_dari_periode(): void
    {
        $mulai = CarbonImmutable::parse('2026-10-03 01:00:00', 'UTC');
        $selesai = CarbonImmutable::parse('2026-10-10 16:59:00', 'UTC');

        $this->assertSame(TryOut::DRAFT, TryOut::statusPada($mulai, $selesai, $mulai->subSecond()));
        $this->assertSame(TryOut::DIBUKA, TryOut::statusPada($mulai, $selesai, $mulai));
        $this->assertSame(TryOut::DIBUKA, TryOut::statusPada($mulai, $selesai, $selesai->subSecond()));
        $this->assertSame(TryOut::DITUTUP, TryOut::statusPada($mulai, $selesai, $selesai));
    }

    public function test_peraturan_dipecah_per_baris_tanpa_nomor_dan_baris_kosong(): void
    {
        $this->assertSame(
            ['Aturan satu.', 'Aturan dua.', 'Aturan tiga.'],
            TryOut::pecahPeraturan("1. Aturan satu.\r\n\n2) Aturan dua.\n   Aturan tiga.  "),
        );
        $this->assertSame([], TryOut::pecahPeraturan(null));
    }
}
