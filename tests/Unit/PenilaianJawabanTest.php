<?php

namespace Tests\Unit;

use App\Services\PenilaianJawaban;
use PHPUnit\Framework\TestCase;

class PenilaianJawabanTest extends TestCase
{
    private const OPSI = ['o-a', 'o-b', 'o-c', 'o-d', 'o-e'];

    public function test_pilihan_ganda_benar_dan_salah(): void
    {
        $this->assertSame(
            ['opsiIds' => ['o-c'], 'jawabanIsian' => null, 'benar' => true],
            PenilaianJawaban::nilai('pilihan_ganda', self::OPSI, ['o-c'], null, ['o-c'], null),
        );
        $this->assertFalse(PenilaianJawaban::nilai('pilihan_ganda', self::OPSI, ['o-c'], null, ['o-a'], null)['benar']);
    }

    public function test_benar_salah_semua_atau_nol_dan_urutan_centang_tidak_berpengaruh(): void
    {
        $kunci = ['o-a', 'o-d', 'o-e'];

        $this->assertTrue(PenilaianJawaban::nilai('benar_salah', self::OPSI, $kunci, null, ['o-e', 'o-a', 'o-d'], null)['benar']);
        $this->assertFalse(PenilaianJawaban::nilai('benar_salah', self::OPSI, $kunci, null, ['o-a', 'o-d'], null)['benar']);
        $this->assertFalse(PenilaianJawaban::nilai('benar_salah', self::OPSI, $kunci, null, ['o-a', 'o-b', 'o-d', 'o-e'], null)['benar']);
        // Kiriman ganda dan tidak urut disimpan unik dan terurut.
        $this->assertSame(['o-a', 'o-d', 'o-e'], PenilaianJawaban::nilai('benar_salah', self::OPSI, $kunci, null, ['o-e', 'o-a', 'o-d', 'o-a'], null)['opsiIds']);
    }

    public function test_opsi_milik_soal_lain_diabaikan(): void
    {
        $hasil = PenilaianJawaban::nilai('pilihan_ganda', self::OPSI, ['o-c'], null, ['o-c', 'opsi-asing'], null);

        $this->assertSame(['o-c'], $hasil['opsiIds']);
        $this->assertTrue($hasil['benar']);
        $this->assertNull(PenilaianJawaban::nilai('pilihan_ganda', self::OPSI, ['o-c'], null, ['opsi-asing'], null));
    }

    public function test_jawaban_kosong_tidak_dicatat(): void
    {
        $this->assertNull(PenilaianJawaban::nilai('pilihan_ganda', self::OPSI, ['o-c'], null, [], null));
        $this->assertNull(PenilaianJawaban::nilai('benar_salah', self::OPSI, ['o-a'], null, [], null));
        // Review Focus 5: spasi dan non-breaking space saja dianggap kosong, bukan salah.
        $this->assertNull(PenilaianJawaban::nilai('isian_singkat', [], [], '12', [], "  \u{00A0} "));
        $this->assertNull(PenilaianJawaban::nilai('isian_singkat', [], [], '12', [], null));
    }

    public function test_isian_dirapikan_lalu_dicocokkan(): void
    {
        $this->assertSame(
            ['opsiIds' => [], 'jawabanIsian' => '12', 'benar' => true],
            PenilaianJawaban::nilai('isian_singkat', [], [], '12|dua belas', [], "  12\u{00A0}"),
        );
        $this->assertFalse(PenilaianJawaban::nilai('isian_singkat', [], [], '12', [], '13')['benar']);
    }

    public function test_soal_tanpa_kunci_tidak_pernah_benar(): void
    {
        $this->assertFalse(PenilaianJawaban::nilai('pilihan_ganda', self::OPSI, [], null, ['o-a'], null)['benar']);
        $this->assertFalse(PenilaianJawaban::nilai('isian_singkat', [], [], null, [], 'apa saja')['benar']);
    }
}
