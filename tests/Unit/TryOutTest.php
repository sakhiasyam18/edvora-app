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

    public function test_jam_di_form_editor_dibaca_sebagai_wib_lalu_disimpan_dalam_utc(): void
    {
        // Editor mengisi 17.10 WIB; tanpa konversi, nilai ini tersimpan sebagai 17.10 UTC (00.10 WIB besok).
        $waktu = TryOut::dariInputForm('2026-10-06T17:10');

        $this->assertSame('2026-10-06 10:10:00', $waktu->format('Y-m-d H:i:s'));
        $this->assertSame('UTC', $waktu->getTimezone()->getName());
    }

    public function test_jam_wib_dini_hari_mundur_ke_tanggal_sebelumnya_dalam_utc(): void
    {
        $this->assertSame('2026-10-06 17:30:00', TryOut::dariInputForm('2026-10-07T00:30')->format('Y-m-d H:i:s'));
    }

    public function test_jam_tersimpan_ditampilkan_kembali_dalam_wib_di_form(): void
    {
        $this->assertSame('2026-10-06T17:10', TryOut::keInputForm(CarbonImmutable::parse('2026-10-06 10:10:00', 'UTC')));
        $this->assertSame('2026-10-07T00:30', TryOut::keInputForm(TryOut::dariInputForm('2026-10-07T00:30')));
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
