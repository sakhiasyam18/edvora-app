<?php

namespace Tests\Unit;

use App\Services\PembahasanPengerjaan;
use PHPUnit\Framework\TestCase;

class PembahasanPengerjaanTest extends TestCase
{
    public function test_urutan_mengikuti_daftar_soal_sesi_termasuk_yang_kosong(): void
    {
        $urutan = PembahasanPengerjaan::urutanSoal(['s3', 's1', 's2'], ['s1' => '2026-10-02 10:00:00']);

        $this->assertSame(['s3', 's1', 's2'], $urutan);
    }

    public function test_sesi_lama_tanpa_daftar_soal_urut_waktu_menjawab_lalu_id(): void
    {
        $dijawab = ['b' => '2026-10-02 10:05:00', 'a' => '2026-10-02 10:05:00', 'c' => '2026-10-02 10:01:00'];

        $this->assertSame(['c', 'a', 'b'], PembahasanPengerjaan::urutanSoal([], $dijawab));
    }

    public function test_status_dari_hasil_jawaban(): void
    {
        $this->assertSame('benar', PembahasanPengerjaan::status(true));
        $this->assertSame('salah', PembahasanPengerjaan::status(false));
        // Soal kosong tidak punya baris jawaban.
        $this->assertSame('kosong', PembahasanPengerjaan::status(null));
    }

    public function test_kunci_pilihan_ganda_berisi_label_dan_teks(): void
    {
        $opsi = [$this->opsi('A', 'Vierzna', true), $this->opsi('B', 'Paramita', false)];

        $this->assertSame('A. Vierzna', PembahasanPengerjaan::teksKunci('pilihan_ganda', $opsi, null));
    }

    public function test_kunci_benar_salah_menggabungkan_pernyataan_yang_benar(): void
    {
        $this->assertSame('Vierzna dan Dewi', PembahasanPengerjaan::teksKunci('benar_salah', [
            $this->opsi('A', 'Vierzna', true),
            $this->opsi('B', 'Paramita', false),
            $this->opsi('C', 'Dewi', true),
        ], null));
        $this->assertSame('P, Q dan R', PembahasanPengerjaan::teksKunci('benar_salah', [
            $this->opsi('A', 'P', true),
            $this->opsi('B', 'Q', true),
            $this->opsi('C', 'R', true),
        ], null));
        $this->assertSame('P', PembahasanPengerjaan::teksKunci('benar_salah', [$this->opsi('A', 'P', true)], null));
    }

    public function test_kunci_isian_memakai_alternatif_pertama_yang_tidak_kosong(): void
    {
        $this->assertSame('delapan', PembahasanPengerjaan::teksKunci('isian_singkat', [], 'delapan|8'));
        $this->assertSame('8', PembahasanPengerjaan::teksKunci('isian_singkat', [], ' |8'));
    }

    public function test_kunci_yang_tidak_ada_ditampilkan_strip(): void
    {
        $this->assertSame('-', PembahasanPengerjaan::teksKunci('pilihan_ganda', [$this->opsi('A', 'X', false)], null));
        $this->assertSame('-', PembahasanPengerjaan::teksKunci('isian_singkat', [], null));
    }

    private function opsi(string $label, string $teks, bool $kunci): array
    {
        return ['id' => $label, 'label' => $label, 'teks_opsi' => $teks, 'is_kunci' => $kunci];
    }
}
