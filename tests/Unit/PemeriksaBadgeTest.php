<?php

namespace Tests\Unit;

use App\Services\PemeriksaBadge;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class PemeriksaBadgeTest extends TestCase
{
    // Statistik siswa baru dengan katalog 6 avatar; tiap test hanya mengubah yang perlu.
    private function statistik(array $ubah = []): array
    {
        return $ubah + [
            'soal_dijawab' => 0,
            'jawaban_benar' => 0,
            'sesi_sempurna' => 0,
            'soal_remedial' => 0,
            'simulasi_selesai' => 0,
            'try_out_selesai' => 0,
            'rata_skor_try_out' => null,
            'peringkat_try_out' => null,
            'avatar_dimiliki' => 0,
            'avatar_total' => 6,
        ];
    }

    public function test_jenis_hitungan_lolos_tepat_di_target(): void
    {
        foreach (['soal_dijawab', 'jawaban_benar', 'sesi_sempurna', 'soal_remedial', 'simulasi_selesai', 'try_out_selesai'] as $jenis) {
            $this->assertTrue(PemeriksaBadge::lolos($jenis, 10, $this->statistik([$jenis => 10])), $jenis);
            $this->assertFalse(PemeriksaBadge::lolos($jenis, 10, $this->statistik([$jenis => 9])), $jenis);
        }
    }

    public function test_lebih_dari_2000_soal_memakai_target_2001(): void
    {
        $this->assertFalse(PemeriksaBadge::lolos('soal_dijawab', 2001, $this->statistik(['soal_dijawab' => 2000])));
        $this->assertTrue(PemeriksaBadge::lolos('soal_dijawab', 2001, $this->statistik(['soal_dijawab' => 2001])));
    }

    public function test_peringkat_lolos_bila_tidak_lebih_buruk_dari_target(): void
    {
        $this->assertTrue(PemeriksaBadge::lolos('peringkat_try_out', 1, $this->statistik(['peringkat_try_out' => 1])));
        $this->assertFalse(PemeriksaBadge::lolos('peringkat_try_out', 1, $this->statistik(['peringkat_try_out' => 2])));
        $this->assertTrue(PemeriksaBadge::lolos('peringkat_try_out', 5, $this->statistik(['peringkat_try_out' => 5])));
        $this->assertFalse(PemeriksaBadge::lolos('peringkat_try_out', 5, $this->statistik(['peringkat_try_out' => 6])));
    }

    public function test_try_out_belum_dinilai_tidak_meloloskan_skor_dan_peringkat(): void
    {
        $this->assertFalse(PemeriksaBadge::lolos('peringkat_try_out', 5, $this->statistik()));
        $this->assertFalse(PemeriksaBadge::lolos('rata_skor_try_out', 600, $this->statistik()));
    }

    public function test_rata_skor_try_out(): void
    {
        $this->assertTrue(PemeriksaBadge::lolos('rata_skor_try_out', 600, $this->statistik(['rata_skor_try_out' => 600.0])));
        $this->assertFalse(PemeriksaBadge::lolos('rata_skor_try_out', 600, $this->statistik(['rata_skor_try_out' => 599.99])));
    }

    public function test_kolektor_avatar_butuh_semua_avatar_katalog(): void
    {
        $this->assertFalse(PemeriksaBadge::lolos('semua_avatar', null, $this->statistik(['avatar_dimiliki' => 5])));
        $this->assertTrue(PemeriksaBadge::lolos('semua_avatar', null, $this->statistik(['avatar_dimiliki' => 6])));
        // Katalog kosong tidak boleh membuat semua siswa langsung menjadi kolektor.
        $this->assertFalse(PemeriksaBadge::lolos('semua_avatar', null, $this->statistik(['avatar_total' => 0])));
    }

    public function test_jenis_tidak_dikenal_ditolak(): void
    {
        $this->expectException(InvalidArgumentException::class);

        PemeriksaBadge::lolos('streak', 7, $this->statistik());
    }
}
