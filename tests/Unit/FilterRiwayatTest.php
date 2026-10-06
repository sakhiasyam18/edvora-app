<?php

namespace Tests\Unit;

use App\Services\FilterRiwayat;
use PHPUnit\Framework\TestCase;

class FilterRiwayatTest extends TestCase
{
    public function test_kata_dicocokkan_ke_label_jenis_sesi(): void
    {
        $this->assertSame(['simulasi'], FilterRiwayat::jenisDariKata('simulasi'));
        $this->assertSame(['remedial'], FilterRiwayat::jenisDariKata('Remedial'));
        $this->assertSame(['fleksibel'], FilterRiwayat::jenisDariKata('soal fleksibel'));
    }

    public function test_try_out_dikenali_dengan_atau_tanpa_spasi(): void
    {
        $this->assertSame(['tryout'], FilterRiwayat::jenisDariKata('try out'));
        $this->assertSame(['tryout'], FilterRiwayat::jenisDariKata('TRYOUT'));
        $this->assertSame(['tryout'], FilterRiwayat::jenisDariKata('  Try   Out '));
    }

    public function test_satu_kata_bisa_cocok_dengan_beberapa_jenis(): void
    {
        $this->assertSame(['fleksibel', 'simulasi'], FilterRiwayat::jenisDariKata('latihan'));
    }

    public function test_kata_yang_tidak_cocok_atau_kosong_tidak_menghasilkan_jenis(): void
    {
        $this->assertSame([], FilterRiwayat::jenisDariKata('Penalaran Umum'));
        $this->assertSame([], FilterRiwayat::jenisDariKata('   '));
    }
}
