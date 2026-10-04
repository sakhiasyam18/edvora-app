<?php

namespace Tests\Unit;

use App\Models\OpsiJawaban;
use App\Models\Soal;
use App\Services\FormulirSoal;
use PHPUnit\Framework\TestCase;

/**
 * Formulir soal di halaman editor diubah menjadi nilai kolom Excel, supaya diperiksa dengan aturan import yang sama.
 */
class FormulirSoalTest extends TestCase
{
    private function opsi(array $teks, array $gambar = []): array
    {
        return array_map(fn ($i) => ['teks' => $teks[$i] ?? '', 'gambar' => $gambar[$i] ?? ''], range(0, 4));
    }

    private function kolom(array $isian): array
    {
        return FormulirSoal::keKolom($isian + ['opsi' => $this->opsi([])], 'PU', 'PU-631', 'Penalaran Deduktif');
    }

    public function test_pilihan_ganda_kunci_huruf_dan_opsi_kosong_jadi_null(): void
    {
        $kolom = $this->kolom([
            'tipe' => 'pilihan_ganda',
            'teksSoal' => "  Soal\r\nbaris dua  ",
            'tingkatKesulitan' => 'sedang',
            'opsi' => $this->opsi(['Satu', ' Dua ', ''], [2 => 'PU/PU-631-C.png']),
            'kunciPg' => 'B',
            'hint' => '   ',
        ]);

        $this->assertSame('PU', $kolom['nama_subtes']);
        $this->assertSame('Penalaran Deduktif', $kolom['topik']);
        $this->assertSame('PU-631', $kolom['kode_soal']);
        $this->assertSame("Soal\r\nbaris dua", $kolom['teks_soal']);
        $this->assertSame('B', $kolom['kunci']);
        $this->assertSame('Dua', $kolom['opsi_b_teks']);
        $this->assertNull($kolom['opsi_c_teks']);
        $this->assertSame('PU/PU-631-C.png', $kolom['opsi_c_gambar']);
        $this->assertNull($kolom['hint']);
        $this->assertNull($kolom['kolom_tabel']);
    }

    public function test_benar_salah_kunci_hanya_untuk_pernyataan_yang_terisi(): void
    {
        $kolom = $this->kolom([
            'tipe' => 'benar_salah',
            'opsi' => $this->opsi(['P1', '', 'P3', 'P4']),
            'kunciBenar' => [true, true, false, true, false],
        ]);

        // Opsi B kosong: kuncinya tidak ikut, jadi jumlah kunci tetap sama dengan pernyataan yang terisi.
        $this->assertSame('B,S,B', $kolom['kunci']);
        $this->assertNull($this->kolom(['tipe' => 'benar_salah'])['kunci']);
    }

    public function test_majemuk_tabel_kunci_nomor_kolom_dan_judul_kolom(): void
    {
        $isian = [
            'tipe' => 'majemuk_tabel',
            'opsi' => $this->opsi(['P1', 'P2', 'P3']),
            'kolomTabel' => [' Benar ', 'Salah', 'Tidak Bisa Ditentukan'],
            'kunciKolom' => [3, 1, 2, null, null],
        ];

        $kolom = $this->kolom($isian);
        $this->assertSame('Benar|Salah|Tidak Bisa Ditentukan', $kolom['kolom_tabel']);
        $this->assertSame('3,1,2', $kolom['kunci']);

        // Ada pernyataan tanpa kunci: kunci dianggap belum diisi.
        $isian['kunciKolom'] = [3, null, 2, null, null];
        $this->assertNull($this->kolom($isian)['kunci']);
    }

    public function test_isian_singkat_mengabaikan_opsi_dan_menggabungkan_jawaban(): void
    {
        $kolom = $this->kolom([
            'tipe' => 'isian_singkat',
            'opsi' => $this->opsi(['tertinggal dari tipe sebelumnya']),
            'kunciPg' => 'A',
            'jawabanIsian' => [' 12 ', '', 'dua belas|12,0', '|'],
        ]);

        $this->assertNull($kolom['opsi_a_teks']);
        $this->assertSame('12|dua belas|12,0', $kolom['kunci']);
        $this->assertNull($this->kolom(['tipe' => 'isian_singkat', 'jawabanIsian' => ['', ' ']])['kunci']);
    }

    public function test_nama_field_dari_kunci_kolom(): void
    {
        $this->assertSame('opsi.0.teks', FormulirSoal::namaField('opsi_a_teks'));
        $this->assertSame('opsi.4.gambar', FormulirSoal::namaField('opsi_e_gambar'));
        $this->assertSame('teksSoal', FormulirSoal::namaField('teks_soal'));
        $this->assertSame('topikId', FormulirSoal::namaField('topik'));
        $this->assertSame('umum', FormulirSoal::namaField('kode_soal'));
        $this->assertSame('umum', FormulirSoal::namaField(''));
    }

    public function test_pesan_error_disesuaikan_untuk_formulir(): void
    {
        $pesan = FormulirSoal::pesanError([
            'topik' => ['Wajib diisi.'],
            'kunci' => ['Wajib diisi.'],
            'teks_soal' => ['Wajib diisi.', 'Rumus "$x$" tidak bisa ditampilkan.'],
            'kolom_tabel' => ['Ada judul kolom kosong di antara tanda |.'],
            'opsi_c_teks' => ['Opsi C kosong padahal Opsi D terisi. Isi opsi berurutan dari A.'],
            '' => ['Rumus tidak bisa diperiksa.'],
        ], 'pilihan_ganda');

        $this->assertSame('Pilih topik.', $pesan['topikId']);
        $this->assertSame('Pilih satu opsi sebagai kunci jawaban.', $pesan['kunci']);
        $this->assertSame('Wajib diisi. Rumus "$x$" tidak bisa ditampilkan.', $pesan['teksSoal']);
        $this->assertSame('Judul kolom tidak boleh kosong.', $pesan['kolomTabel']);
        $this->assertSame('Opsi C kosong padahal Opsi D terisi. Isi opsi berurutan dari A.', $pesan['opsi.2.teks']);
        $this->assertSame('Rumus tidak bisa diperiksa.', $pesan['umum']);

        // benar_salah tanpa pernyataan: cukup pesan "Minimal 2 pernyataan" di opsi.
        $this->assertArrayNotHasKey('kunci', FormulirSoal::pesanError(['kunci' => ['Wajib diisi.']], 'benar_salah'));
        $this->assertSame('Pilih kolom kunci untuk setiap pernyataan.', FormulirSoal::pesanError(['kunci' => ['Wajib diisi.']], 'majemuk_tabel')['kunci']);
    }

    public function test_soal_tersimpan_menjadi_isi_awal_formulir(): void
    {
        $soal = new Soal([
            'topik_id' => 't-1',
            'tipe' => 'majemuk_tabel',
            'tingkat_kesulitan' => 'sulit',
            'teks_soal' => 'Teks',
            'pembahasan' => 'Bahas',
            'kolom_tabel' => ['Benar', 'Salah', 'Tidak Tahu'],
        ]);
        $soal->setRelation('opsiJawaban', collect([
            new OpsiJawaban(['label' => 'A', 'teks_opsi' => 'P1', 'is_kunci' => false, 'kunci_kolom' => 3, 'urutan' => 1]),
            new OpsiJawaban(['label' => 'B', 'teks_opsi' => 'P2', 'gambar_opsi' => 'https://x/PU/PU-1-B.png', 'is_kunci' => false, 'kunci_kolom' => 1, 'urutan' => 2]),
        ]));

        $isian = FormulirSoal::dariSoal($soal);

        $this->assertSame('t-1', $isian['topikId']);
        $this->assertCount(5, $isian['opsi']);
        $this->assertSame(['teks' => 'P2', 'gambar' => 'https://x/PU/PU-1-B.png'], $isian['opsi'][1]);
        $this->assertSame(['teks' => '', 'gambar' => ''], $isian['opsi'][4]);
        $this->assertSame([3, 1, null, null, null], $isian['kunciKolom']);
        $this->assertSame(['Benar', 'Salah', 'Tidak Tahu'], $isian['kolomTabel']);
        $this->assertSame('', $isian['kunciPg']);
        $this->assertSame([''], $isian['jawabanIsian']);
        $this->assertSame('', $isian['hint']);
    }

    public function test_soal_pilihan_ganda_dan_isian_menjadi_isi_awal_formulir(): void
    {
        $pg = new Soal(['tipe' => 'pilihan_ganda', 'teks_soal' => 'T', 'pembahasan' => 'P']);
        $pg->setRelation('opsiJawaban', collect([
            new OpsiJawaban(['label' => 'A', 'teks_opsi' => 'a', 'is_kunci' => false]),
            new OpsiJawaban(['label' => 'B', 'teks_opsi' => 'b', 'is_kunci' => true]),
        ]));

        $this->assertSame('B', FormulirSoal::dariSoal($pg)['kunciPg']);
        $this->assertSame([false, true, false, false, false], FormulirSoal::dariSoal($pg)['kunciBenar']);
        // Kolom tabel bawaan disiapkan bila editor mengganti tipenya ke majemuk_tabel.
        $this->assertSame(['Benar', 'Salah'], FormulirSoal::dariSoal($pg)['kolomTabel']);

        $isian = new Soal(['tipe' => 'isian_singkat', 'teks_soal' => 'T', 'pembahasan' => 'P', 'kunci_jawaban' => '12|dua belas']);
        $isian->setRelation('opsiJawaban', collect());

        $this->assertSame(['12', 'dua belas'], FormulirSoal::dariSoal($isian)['jawabanIsian']);
    }
}
