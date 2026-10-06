<?php

namespace Tests\Unit;

use App\Services\TeksMatematika;
use PHPUnit\Framework\TestCase;

/**
 * Aturan tanda $. Kasus yang sama juga harus berlaku untuk pecahTeksMatematika() di resources/js/lib/teksMatematika.ts.
 */
class TeksMatematikaTest extends TestCase
{
    public function test_rumus_di_antara_sepasang_dolar(): void
    {
        $this->assertSame([
            ['rumus' => false, 'isi' => 'Jika '],
            ['rumus' => true, 'isi' => '3x - 5 = 16'],
            ['rumus' => false, 'isi' => ', maka '],
            ['rumus' => true, 'isi' => '2x + 1'],
            ['rumus' => false, 'isi' => ' adalah ...'],
        ], TeksMatematika::pecah('Jika $3x - 5 = 16$, maka $2x + 1$ adalah ...'));
        $this->assertNull(TeksMatematika::masalah('Jika $3x - 5 = 16$, maka $2x + 1$ adalah ...'));
    }

    public function test_dolar_biasa_ditulis_dengan_garis_miring(): void
    {
        $teks = 'Harga buku \$5 dan pensil \$2.';

        $this->assertSame([['rumus' => false, 'isi' => 'Harga buku $5 dan pensil $2.']], TeksMatematika::pecah($teks));
        $this->assertSame([], TeksMatematika::rumus($teks));
        $this->assertNull(TeksMatematika::masalah($teks));
    }

    public function test_garis_miring_dolar_di_dalam_rumus_tidak_menutup_rumus(): void
    {
        $this->assertSame(['\$5 + \$3 = \$8'], TeksMatematika::rumus('Totalnya $\$5 + \$3 = \$8$.'));
    }

    public function test_garis_miring_ganda_di_dalam_rumus_tetap_utuh(): void
    {
        $rumus = '\begin{array}{cc} a & b \\\\ c & d \end{array}';

        $this->assertSame([$rumus], TeksMatematika::rumus("Matriks \${$rumus}\$."));
    }

    public function test_dolar_tanpa_pasangan_ditolak_dan_tampil_apa_adanya(): void
    {
        $teks = 'Hasilnya $\frac{1}{2';

        $this->assertSame([['rumus' => false, 'isi' => $teks]], TeksMatematika::pecah($teks));
        $this->assertStringStartsWith('Tanda $ tidak berpasangan', TeksMatematika::masalah($teks));
    }

    public function test_dolar_ganda_dan_rumus_kosong_ditolak(): void
    {
        $this->assertStringStartsWith('Ada $$ atau rumus kosong', TeksMatematika::masalah('Rumus besar $$x^2$$'));
        $this->assertStringStartsWith('Ada $$ atau rumus kosong', TeksMatematika::masalah('Kosong $ $ di sini'));
    }

    public function test_karakter_unicode_di_sekitar_rumus_tetap_utuh(): void
    {
        $this->assertSame([
            ['rumus' => true, 'isi' => '3 \times 3'],
            ['rumus' => false, 'isi' => ' m² ≠ 6 m²'],
        ], TeksMatematika::pecah('$3 \times 3$ m² ≠ 6 m²'));
    }

    public function test_dua_dolar_biasa_yang_terbaca_rumus_dikenali(): void
    {
        $rumus = TeksMatematika::rumus('Harga $5 dan $10.');

        $this->assertSame(['5 dan '], $rumus);
        $this->assertTrue(TeksMatematika::miripDolarBiasa($rumus[0]));
        $this->assertFalse(TeksMatematika::miripDolarBiasa('x + 1'));
        $this->assertFalse(TeksMatematika::miripDolarBiasa(' x + 1 '));
    }
}
