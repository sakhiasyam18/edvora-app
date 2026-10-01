<?php

namespace Tests\Unit;

use App\Services\Penguasaan;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class PenguasaanTest extends TestCase
{
    private int $nomorSoal = 0;

    public function test_contoh_bagian_8_dokumen_konsep(): void
    {
        $jendela = [
            ...$this->jawaban('mudah', 3, benar: 3),
            ...$this->jawaban('mudah', 1, benar: 1, hint: 1),
            ...$this->jawaban('mudah', 1, benar: 1),
            ...$this->jawaban('mudah', 1, benar: 0),
            ...$this->jawaban('mudah', 2, benar: 2),
            ...$this->jawaban('sedang', 2, benar: 2),
            ...$this->jawaban('sedang', 1, benar: 0),
            ...$this->jawaban('sedang', 1, benar: 1, hint: 1),
            ...$this->jawaban('sedang', 2, benar: 2),
            ...$this->jawaban('sedang', 1, benar: 0),
            ...$this->jawaban('sulit', 1, benar: 1),
            ...$this->jawaban('sulit', 1, benar: 0),
            ...$this->jawaban('sulit', 1, benar: 1),
            ...$this->jawaban('sulit', 1, benar: 1, hint: 1),
            ...$this->jawaban('sulit', 1, benar: 0),
        ];

        // Bobot 1/2/3: 100 × 23 / 37
        $this->assertSame(62.16, Penguasaan::skorJendela($jendela));
    }

    public function test_semua_benar_bernilai_100_di_tingkat_apa_pun(): void
    {
        $this->assertSame(100.0, Penguasaan::skorJendela($this->jawaban('mudah', 20, benar: 20)));
        $this->assertSame(100.0, Penguasaan::skorJendela($this->jawaban('sedang', 20, benar: 20)));
    }

    public function test_rumus_memberi_bobot_lebih_pada_soal_sulit(): void
    {
        // Sulit benar, mudah benar dengan hint, sedang salah: 100 × 3,5 / 6.
        $jawaban = [
            ...$this->jawaban('sulit', 1, benar: 1),
            ...$this->jawaban('mudah', 1, benar: 1, hint: 1),
            ...$this->jawaban('sedang', 1, benar: 0),
        ];

        $this->assertSame(58.33, Penguasaan::skor($jawaban));
    }

    public function test_nilai_jawaban(): void
    {
        $this->assertSame(1.0, Penguasaan::nilai(true, false));
        $this->assertSame(0.5, Penguasaan::nilai(true, true));
        $this->assertSame(0.0, Penguasaan::nilai(false, true));
    }

    public function test_tingkat_tidak_dikenal_ditolak(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Penguasaan::skor([['soal' => 'PM-001', 'tingkat' => 'esai', 'benar' => true]]);
    }

    public function test_belum_dinilai_sebelum_jendela_berisi_20_jawaban(): void
    {
        $jendela = $this->jawaban('mudah', 19, benar: 19);

        $skor = Penguasaan::skorJendela($jendela);

        $this->assertNull($skor);
        $this->assertNull(Penguasaan::isiLingkaran($skor));
        $this->assertSame('belum_cukup_data', Penguasaan::label(1, $skor));
        $this->assertSame(1, Penguasaan::tahapBerikutnya(1, $skor));
    }

    public function test_naik_bila_skor_mencapai_75(): void
    {
        $this->assertSame(2, Penguasaan::tahapBerikutnya(1, $this->skor('mudah', 20, benar: 15)));
        $this->assertSame(1, Penguasaan::tahapBerikutnya(1, $this->skor('mudah', 20, benar: 14)));
    }

    public function test_turun_bila_skor_di_bawah_35(): void
    {
        $this->assertSame(1, Penguasaan::tahapBerikutnya(2, $this->skor('sedang', 20, benar: 6)));
        $this->assertSame(2, Penguasaan::tahapBerikutnya(2, $this->skor('sedang', 20, benar: 7)));
    }

    public function test_tahap_1_tidak_bisa_turun(): void
    {
        $this->assertSame(1, Penguasaan::tahapBerikutnya(1, $this->skor('mudah', 20, benar: 0)));
    }

    public function test_tahap_3_dengan_skor_75_berarti_dikuasai(): void
    {
        $skor = $this->skor('sulit', 20, benar: 15);

        $this->assertSame(3, Penguasaan::tahapBerikutnya(3, $skor));
        $this->assertTrue(Penguasaan::dikuasai(3, $skor));
        $this->assertSame('dikuasai', Penguasaan::label(3, $skor));
        $this->assertSame(1.0, Penguasaan::isiLingkaran($skor));
    }

    public function test_label_dibaca_dari_tahap(): void
    {
        $skor = $this->skor('mudah', 20, benar: 20);

        $this->assertSame('belum_dikuasai', Penguasaan::label(1, $skor));
        $this->assertSame('berkembang', Penguasaan::label(2, $skor));
        $this->assertSame('berkembang', Penguasaan::label(3, $this->skor('sulit', 20, benar: 10)));
    }

    public function test_isi_lingkaran_menuju_batas_naik(): void
    {
        $this->assertSame(0.8, Penguasaan::isiLingkaran($this->skor('mudah', 20, benar: 12)));
    }

    public function test_jawaban_yang_tergeser_keluar_tidak_dihitung_lagi(): void
    {
        $sesi1 = $this->jawaban('mudah', 10, benar: 0);
        $sesi2 = $this->jawaban('mudah', 10, benar: 10);
        $sesi3 = $this->jawaban('mudah', 10, benar: 10);

        $jendela = [];
        foreach ([$sesi1, $sesi2, $sesi3] as $sesi) {
            $jendela = Penguasaan::geserJendela($jendela, $sesi);
        }

        $this->assertSame([...array_column($sesi2, 'soal'), ...array_column($sesi3, 'soal')], array_column($jendela, 'soal'));
        $this->assertSame(100.0, Penguasaan::skorJendela($jendela));
    }

    public function test_di_dalam_sesi_jawaban_masuk_mudah_sedang_sulit_lalu_kode_soal(): void
    {
        $sesi = [
            ['soal' => 'PM-003', 'tingkat' => 'sulit', 'benar' => true],
            ['soal' => 'PM-005', 'tingkat' => 'mudah', 'benar' => true],
            ['soal' => 'PM-001', 'tingkat' => 'sedang', 'benar' => false],
            ['soal' => 'PM-004', 'tingkat' => 'mudah', 'benar' => false],
            ['soal' => 'PM-002', 'tingkat' => 'sedang', 'benar' => true],
        ];

        $jendela = Penguasaan::geserJendela($this->jawaban('mudah', 18, benar: 18), $sesi);

        // Dua jawaban lama tergeser; dari sesi ini, yang masuk paling awal adalah soal mudah.
        $this->assertCount(20, $jendela);
        $this->assertSame(['PM-004', 'PM-005', 'PM-001', 'PM-002', 'PM-003'], array_column(array_slice($jendela, -5), 'soal'));
    }

    public function test_soal_yang_dijawab_ulang_memakai_jawaban_terbaru(): void
    {
        $lama = $this->jawaban('mudah', 20, benar: 0);
        $ulang = [['soal' => $lama[0]['soal'], 'tingkat' => 'mudah', 'benar' => true, 'hint' => false]];

        $jendela = Penguasaan::geserJendela($lama, $ulang);

        $this->assertCount(20, $jendela);
        $this->assertSame($lama[0]['soal'], end($jendela)['soal']);
        $this->assertSame(5.0, Penguasaan::skorJendela($jendela));
    }

    /**
     * Jejak lima sesi 10 soal dengan porsi tahap: tahap 1 semua mudah, tahap 2 4 mudah + 6 sedang,
     * tahap 3 2 mudah + 3 sedang + 5 sulit. Jendela tidak dikosongkan, jadi sesi 3 langsung naik lagi.
     */
    public function test_jejak_lima_sesi(): void
    {
        $sesiList = [
            $this->jawaban('mudah', 10, benar: 8),
            $this->jawaban('mudah', 10, benar: 8),
            [...$this->jawaban('mudah', 4, benar: 4), ...$this->jawaban('sedang', 6, benar: 5)],
            [...$this->jawaban('mudah', 2, benar: 2), ...$this->jawaban('sedang', 3, benar: 1), ...$this->jawaban('sulit', 5, benar: 1)],
            [...$this->jawaban('mudah', 2, benar: 1), ...$this->jawaban('sedang', 3, benar: 0), ...$this->jawaban('sulit', 5, benar: 0)],
        ];

        $tahap = 1;
        $nDiTahap = 0;
        $jendela = [];
        $jejak = [];

        foreach ($sesiList as $sesi) {
            $jendela = Penguasaan::geserJendela($jendela, $sesi);
            $hasil = Penguasaan::setelahSesi($tahap, $jendela, $nDiTahap + count($sesi));
            ['tahap' => $tahap, 'n_di_tahap' => $nDiTahap] = $hasil;
            $jejak[] = [$hasil['skor'], $tahap, $nDiTahap];
        }

        $this->assertSame([
            [null, 1, 10],   // baru 10 jawaban
            [80.0, 2, 0],    // 16 dari 20 mudah benar
            [84.62, 3, 0],   // 100 × 22 / 26
            [53.85, 3, 10],  // 100 × 21 / 39
            [17.39, 2, 0],   // 100 × 8 / 46
        ], $jejak);
    }

    public function test_jatah_soal_mengikuti_porsi_tahap(): void
    {
        $this->assertSame(['mudah' => 10], Penguasaan::jatahSoal(1, 10));
        $this->assertSame(['mudah' => 4, 'sedang' => 6], Penguasaan::jatahSoal(2, 10));
        $this->assertSame(['mudah' => 2, 'sedang' => 3, 'sulit' => 5], Penguasaan::jatahSoal(3, 10));
    }

    public function test_sisa_pembulatan_jatah_ke_pecahan_terbesar_lalu_tingkat_tersulit(): void
    {
        // 2,2 / 3,3 / 5,5: sisa satu soal ke sulit (pecahan 0,5).
        $this->assertSame(['mudah' => 2, 'sedang' => 3, 'sulit' => 6], Penguasaan::jatahSoal(3, 11));
        // 4,8 / 7,2: sisa satu soal ke mudah (pecahan 0,8).
        $this->assertSame(['mudah' => 5, 'sedang' => 7], Penguasaan::jatahSoal(2, 12));
        // 3 / 4,5 / 7,5: pecahan sedang dan sulit sama, sulit didahulukan.
        $this->assertSame(['mudah' => 3, 'sedang' => 4, 'sulit' => 8], Penguasaan::jatahSoal(3, 15));
    }

    public function test_jumlah_jatah_selalu_sama_dengan_jumlah_soal(): void
    {
        foreach ([1, 2, 3] as $tahap) {
            for ($jumlah = 10; $jumlah <= 25; $jumlah++) {
                $this->assertSame($jumlah, array_sum(Penguasaan::jatahSoal($tahap, $jumlah)), "tahap {$tahap}, {$jumlah} soal");
            }
        }
    }

    public function test_soal_di_tahap_bertambah_tiap_sesi_dan_kembali_nol_saat_tahap_berubah(): void
    {
        $sesi1 = Penguasaan::setelahSesi(1, $this->jawaban('mudah', 10, benar: 10), 10);
        $this->assertSame(['tahap' => 1, 'skor' => null, 'n_jendela' => 10, 'n_di_tahap' => 10, 'berubah' => false], $sesi1);

        $sesi2 = Penguasaan::setelahSesi(1, $this->jawaban('mudah', 20, benar: 20), 20);
        $this->assertSame(['tahap' => 2, 'skor' => 100.0, 'n_jendela' => 20, 'n_di_tahap' => 0, 'berubah' => true], $sesi2);
    }

    public function test_topik_prioritas_bila_belum_dikuasai_setelah_60_soal_di_tahap_yang_sama(): void
    {
        $skor = $this->skor('mudah', 20, benar: 10);

        $this->assertTrue(Penguasaan::prioritas(1, $skor, 60));
        $this->assertFalse(Penguasaan::prioritas(1, $skor, 59));
        // Belum cukup data tetap bisa jadi prioritas bila soalnya sudah banyak.
        $this->assertTrue(Penguasaan::prioritas(1, null, 60));
        $this->assertFalse(Penguasaan::prioritas(3, $this->skor('sulit', 20, benar: 16), 80));
    }

    public function test_rekomendasi_prioritas_dulu_lalu_tahap_lalu_skor(): void
    {
        $urut = Penguasaan::urutkanRekomendasi([
            ['topik' => 'A', 'tahap' => 2, 'skor' => 40.0, 'prioritas' => false],
            ['topik' => 'B', 'tahap' => 1, 'skor' => null, 'prioritas' => false],
            ['topik' => 'C', 'tahap' => 2, 'skor' => 60.0, 'prioritas' => true],
            ['topik' => 'D', 'tahap' => 1, 'skor' => 55.0, 'prioritas' => false],
            ['topik' => 'E', 'tahap' => 2, 'skor' => 38.0, 'prioritas' => false],
        ]);

        $this->assertSame(['C', 'D', 'B', 'E', 'A'], array_column($urut, 'topik'));
    }

    private function skor(string $tingkat, int $jumlah, int $benar): ?float
    {
        return Penguasaan::skorJendela($this->jawaban($tingkat, $jumlah, $benar));
    }

    /**
     * Membuat jawaban dengan kode soal unik: $benar jawaban pertama benar, $hint di antaranya memakai hint.
     *
     * @return array<int, array{soal: string, tingkat: string, benar: bool, hint: bool}>
     */
    private function jawaban(string $tingkat, int $jumlah, int $benar, int $hint = 0): array
    {
        $hasil = [];

        for ($i = 0; $i < $jumlah; $i++) {
            $hasil[] = [
                'soal' => sprintf('PK-%03d', ++$this->nomorSoal),
                'tingkat' => $tingkat,
                'benar' => $i < $benar,
                'hint' => $i < $hint,
            ];
        }

        return $hasil;
    }
}
