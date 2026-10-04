<?php

namespace Tests\Unit;

use App\Services\MajemukTabel;
use PHPUnit\Framework\TestCase;

class MajemukTabelTest extends TestCase
{
    private const KOLOM = ['Benar', 'Salah', 'Tidak Bisa Ditentukan'];

    public function test_kolom_kosong_berarti_benar_salah(): void
    {
        $this->assertSame(['Benar', 'Salah'], MajemukTabel::kolom(null));
        $this->assertSame(self::KOLOM, MajemukTabel::kolom('Benar | Salah|Tidak Bisa Ditentukan'));
    }

    public function test_kolom_harus_dua_sampai_empat_dan_tidak_kembar(): void
    {
        $this->assertNull(MajemukTabel::masalahKolom(self::KOLOM));
        $this->assertStringContainsString('2–4 judul kolom', MajemukTabel::masalahKolom(['Benar']));
        $this->assertStringContainsString('2–4 judul kolom', MajemukTabel::masalahKolom(['A', 'B', 'C', 'D', 'E']));
        $this->assertStringContainsString('kosong', MajemukTabel::masalahKolom(['Benar', '']));
        $this->assertStringContainsString('sama', MajemukTabel::masalahKolom(['Benar', 'benar']));
    }

    public function test_kunci_huruf_awal_dan_nomor_kolom(): void
    {
        $this->assertSame([[3, 1, 3, 2], null], MajemukTabel::kunci('T,B,T,S', self::KOLOM));
        $this->assertSame([[3, 1, 3, 2], null], MajemukTabel::kunci('t, b ,3,2', self::KOLOM));
    }

    public function test_kunci_yang_tidak_cocok_menyebut_pilihannya(): void
    {
        [$nomor, $pesan] = MajemukTabel::kunci('T,X', self::KOLOM);

        $this->assertNull($nomor);
        $this->assertStringContainsString('"X" tidak cocok', $pesan);
        $this->assertStringContainsString('B (Benar), S (Salah), T (Tidak Bisa Ditentukan), atau nomor 1–3', $pesan);
        $this->assertNotNull(MajemukTabel::kunci('4', self::KOLOM)[1]);
    }

    public function test_huruf_awal_kembar_harus_memakai_nomor(): void
    {
        $kolom = ['Tepat', 'Tidak Tepat'];

        $this->assertStringContainsString('tulis kunci dengan nomor kolom', MajemukTabel::kunci('T,T', $kolom)[1]);
        $this->assertSame([[1, 2], null], MajemukTabel::kunci('1,2', $kolom));
    }

    public function test_penilaian_semua_atau_nol(): void
    {
        $kunci = ['a' => 3, 'b' => 1, 'c' => 2];

        $this->assertTrue(MajemukTabel::benar($kunci, ['a' => 3, 'b' => 1, 'c' => 2]));
        $this->assertFalse(MajemukTabel::benar($kunci, ['a' => 3, 'b' => 1, 'c' => 1]));
        // Baris yang tidak dijawab dihitung salah.
        $this->assertFalse(MajemukTabel::benar($kunci, ['a' => 3, 'b' => 1]));
        $this->assertFalse(MajemukTabel::benar([], []));
        $this->assertFalse(MajemukTabel::benar(['a' => null], ['a' => 1]));
    }
}
