<?php

namespace Tests\Unit;

use App\Models\JawabanPengerjaan;
use PHPUnit\Framework\TestCase;

class JawabanPengerjaanTest extends TestCase
{
    public function test_pilihan_ganda_memakai_opsi_dipilih_id(): void
    {
        $this->assertSame(
            ['opsi_dipilih_id' => 'a', 'opsi_dipilih_ids' => null, 'jawaban_isian' => null],
            JawabanPengerjaan::kolomJawaban('pilihan_ganda', ['a'], null),
        );
    }

    public function test_benar_salah_memakai_literal_array_postgres(): void
    {
        $this->assertSame(
            ['opsi_dipilih_id' => null, 'opsi_dipilih_ids' => '{a,c}', 'jawaban_isian' => null],
            JawabanPengerjaan::kolomJawaban('benar_salah', ['a', 'c'], null),
        );
    }

    public function test_isian_hanya_mengisi_jawaban_isian(): void
    {
        $this->assertSame(
            ['opsi_dipilih_id' => null, 'opsi_dipilih_ids' => null, 'jawaban_isian' => 'delapan'],
            JawabanPengerjaan::kolomJawaban('isian_singkat', [], 'delapan'),
        );
    }
}
