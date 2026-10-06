<?php

namespace Tests\Unit;

use App\Services\RiwayatPoint;
use PHPUnit\Framework\TestCase;

class RiwayatPointTest extends TestCase
{
    public function test_keterangan_pembelian_avatar(): void
    {
        $this->assertSame('Beli avatar Mahasiswa FMIPA', RiwayatPoint::keterangan('avatar', null, null, null, 'Mahasiswa FMIPA'));
    }

    public function test_keterangan_try_out(): void
    {
        $this->assertSame('Try Out · Try Out Nasional 1', RiwayatPoint::keterangan('pengerjaan', null, null, 'Try Out Nasional 1', null));
    }

    public function test_keterangan_latihan_memakai_label_riwayat(): void
    {
        $this->assertSame('Latihan Soal Fleksibel · Penalaran Umum', RiwayatPoint::keterangan('pengerjaan', 'fleksibel', 'Penalaran Umum', null, null));
        $this->assertSame('Remedial · Penalaran Umum', RiwayatPoint::keterangan('pengerjaan', 'remedial', 'Penalaran Umum', null, null));
    }

    public function test_keterangan_tanpa_mode_dan_subtes(): void
    {
        $this->assertSame('Latihan', RiwayatPoint::keterangan('pengerjaan', null, null, null, null));
    }
}
