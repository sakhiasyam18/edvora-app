<?php

namespace Tests\Unit;

use App\Services\EstimasiIrt;
use PHPUnit\Framework\TestCase;

class EstimasiIrtTest extends TestCase
{
    // ===== Penilaian (SDD 5.3.5) =====

    public function test_grid_81_titik_dari_minus_4_sampai_4(): void
    {
        $grid = EstimasiIrt::grid();

        $this->assertCount(81, $grid);
        $this->assertEqualsWithDelta(-4.0, $grid[0], 1e-12);
        $this->assertEqualsWithDelta(0.0, $grid[40], 1e-12);
        $this->assertEqualsWithDelta(4.0, $grid[80], 1e-12);
    }

    public function test_semua_kosong_skor_nol(): void
    {
        $this->assertNull(EstimasiIrt::eap([]));
        $this->assertSame(0.0, EstimasiIrt::skor([]));
    }

    public function test_satu_benar_satu_salah_pada_soal_identik_memberi_skor_500(): void
    {
        $respons = [['a' => 1.0, 'b' => 0.0, 'u' => 1], ['a' => 1.0, 'b' => 0.0, 'u' => 0]];

        $this->assertEqualsWithDelta(0.0, EstimasiIrt::eap($respons), 1e-9);
        $this->assertSame(500.0, EstimasiIrt::skor($respons));
    }

    public function test_nilai_acuan_satu_soal_benar(): void
    {
        // Dihitung terpisah saat brainstorming (RANCANGAN-irt.md 7.1 #3).
        $respons = [['a' => 1.0, 'b' => 0.0, 'u' => 1]];

        $this->assertEqualsWithDelta(0.413051, EstimasiIrt::eap($respons), 1e-6);
        $this->assertSame(551.63, EstimasiIrt::skor($respons));
    }

    public function test_menambah_jawaban_benar_tidak_menurunkan_skor(): void
    {
        $dasar = [
            ['a' => 1.2, 'b' => -1.0, 'u' => 1],
            ['a' => 0.8, 'b' => 0.0, 'u' => 0],
            ['a' => 1.5, 'b' => 0.5, 'u' => 1],
            ['a' => 1.0, 'b' => 1.0, 'u' => 0],
        ];
        $lebihBaik = $dasar;
        $lebihBaik[1]['u'] = 1;

        $this->assertGreaterThan(EstimasiIrt::skor($dasar), EstimasiIrt::skor($lebihBaik));
    }

    public function test_skor_selalu_di_dalam_0_sampai_1000(): void
    {
        $benarSemua = array_fill(0, 30, ['a' => 4.0, 'b' => 4.0, 'u' => 1]);
        $salahSemua = array_fill(0, 30, ['a' => 4.0, 'b' => -4.0, 'u' => 0]);

        foreach ([$benarSemua, $salahSemua] as $respons) {
            $skor = EstimasiIrt::skor($respons);
            $this->assertGreaterThanOrEqual(0.0, $skor);
            $this->assertLessThanOrEqual(1000.0, $skor);
        }
    }

    public function test_bobot_soal_berasal_dari_a_bukan_b(): void
    {
        // Sifat 2PL (RANCANGAN-irt.md 3.1): dengan soal dijawab yang sama, θ hanya bergantung pada Σ a·u.
        // a sama: benar di soal mudah atau di soal sulit memberi skor yang sama.
        $mudah = ['a' => 1.0, 'b' => -1.0];
        $sulit = ['a' => 1.0, 'b' => 1.0];
        $benarMudah = [$mudah + ['u' => 1], $sulit + ['u' => 0]];
        $benarSulit = [$mudah + ['u' => 0], $sulit + ['u' => 1]];
        $this->assertEqualsWithDelta(EstimasiIrt::eap($benarMudah), EstimasiIrt::eap($benarSulit), 1e-9);

        // a berbeda: satu soal a=2 benar setara dengan dua soal a=1 benar.
        $s1 = ['a' => 2.0, 'b' => 0.0];
        $s2 = ['a' => 1.0, 'b' => -1.0];
        $s3 = ['a' => 1.0, 'b' => 1.0];
        $polaA = [$s1 + ['u' => 1], $s2 + ['u' => 0], $s3 + ['u' => 0]];
        $polaB = [$s1 + ['u' => 0], $s2 + ['u' => 1], $s3 + ['u' => 1]];
        $this->assertEqualsWithDelta(EstimasiIrt::eap($polaA), EstimasiIrt::eap($polaB), 1e-9);
    }

    // ===== Kalibrasi (RANCANGAN-irt.md 5.2) =====

    public function test_kalibrasi_tanpa_peserta_memakai_parameter_label(): void
    {
        $hasil = EstimasiIrt::kalibrasi([], ['s1' => 'mudah', 's2' => 'sedang', 's3' => 'sulit']);

        $this->assertSame(['s1' => ['a' => 1.0, 'b' => -1.0], 's2' => ['a' => 1.0, 'b' => 0.0], 's3' => ['a' => 1.0, 'b' => 1.0]], $hasil['parameter']);
        $this->assertSame(0, $hasil['iterasi']);
        $this->assertTrue($hasil['konvergen']);
    }

    public function test_peserta_yang_mengosongkan_semua_soal_tidak_dihitung(): void
    {
        $hasil = EstimasiIrt::kalibrasi(['p1' => [], 'p2' => []], ['s1' => 'sedang']);

        $this->assertSame(['s1' => ['a' => 1.0, 'b' => 0.0]], $hasil['parameter']);
    }

    public function test_soal_tanpa_penjawab_tetap_memakai_parameter_label(): void
    {
        [$jawaban, $label] = $this->simulasi(50, 7);
        $label['tidak_dijawab'] = 'sulit';

        $hasil = EstimasiIrt::kalibrasi($jawaban, $label);

        $this->assertSame(['a' => 1.0, 'b' => 1.0], $hasil['parameter']['tidak_dijawab']);
    }

    public function test_jawaban_untuk_soal_di_luar_label_diabaikan(): void
    {
        $hasil = EstimasiIrt::kalibrasi(['p1' => ['asing' => 1]], ['s1' => 'mudah']);

        $this->assertSame(['s1'], array_keys($hasil['parameter']));
        $this->assertSame(['a' => 1.0, 'b' => -1.0], $hasil['parameter']['s1']);
    }

    public function test_peserta_sedikit_parameter_tetap_dekat_label(): void
    {
        [$jawaban, $label] = $this->simulasi(10, 11);

        $hasil = EstimasiIrt::kalibrasi($jawaban, $label);

        $geser = array_map(fn ($id) => abs($hasil['parameter'][$id]['b'] - EstimasiIrt::B_AWAL[$label[$id]]), array_keys($label));
        $this->assertLessThan(0.8, array_sum($geser) / count($geser));
        $this->assertTrue($hasil['konvergen']);
    }

    public function test_300_peserta_parameter_mendekati_nilai_asli(): void
    {
        [$jawaban, $label, $asli] = $this->simulasi(300, 5);

        $hasil = EstimasiIrt::kalibrasi($jawaban, $label);

        $galatA = $galatB = 0.0;
        foreach ($asli as $id => $p) {
            $galatA += ($hasil['parameter'][$id]['a'] - $p['a']) ** 2;
            $galatB += ($hasil['parameter'][$id]['b'] - $p['b']) ** 2;
        }
        $this->assertLessThan(0.35, sqrt($galatA / count($asli)));
        $this->assertLessThan(0.35, sqrt($galatB / count($asli)));
        $this->assertTrue($hasil['konvergen']);
    }

    public function test_soal_dijawab_benar_semua_peserta_tetap_berhingga(): void
    {
        [$jawaban, $label] = $this->simulasi(50, 3);
        foreach ($jawaban as $peserta => $isi) {
            $jawaban[$peserta]['s0'] = 1;
        }

        $b = EstimasiIrt::kalibrasi($jawaban, $label)['parameter']['s0']['b'];

        $this->assertTrue(is_finite($b));
        $this->assertGreaterThanOrEqual(-4.0, $b);
        $this->assertLessThanOrEqual(4.0, $b);
    }

    /**
     * Data simulasi 2PL dengan seed tetap (RANCANGAN-irt.md 3): 30 soal (9 mudah, 12 sedang, 9 sulit), a asli acak
     * 0,5–2,0, b asli = nilai label + galat editor N(0; 0,7²), θ ~ N(0; 1), tiap peserta mengosongkan 0–40% soal.
     *
     * @return array{0: array<string, array<string, int>>, 1: array<string, string>, 2: array<string, array{a: float, b: float}>}
     */
    private function simulasi(int $peserta, int $seed): array
    {
        mt_srand($seed);
        $label = [];
        $asli = [];
        for ($i = 0; $i < 30; $i++) {
            $tingkat = $i < 9 ? 'mudah' : ($i < 21 ? 'sedang' : 'sulit');
            $label["s{$i}"] = $tingkat;
            $asli["s{$i}"] = ['a' => $this->seragam(0.5, 2.0), 'b' => EstimasiIrt::B_AWAL[$tingkat] + 0.7 * $this->normal()];
        }

        $jawaban = [];
        for ($j = 0; $j < $peserta; $j++) {
            $theta = $this->normal();
            $peluangKosong = $this->seragam(0.0, 0.4);
            $jawaban["p{$j}"] = [];
            foreach ($asli as $id => $p) {
                if ($this->seragam(0.0, 1.0) < $peluangKosong) {
                    continue;
                }
                $jawaban["p{$j}"][$id] = $this->seragam(0.0, 1.0) < 1 / (1 + exp(-$p['a'] * ($theta - $p['b']))) ? 1 : 0;
            }
        }

        return [$jawaban, $label, $asli];
    }

    private function seragam(float $min, float $maks): float
    {
        return $min + ($maks - $min) * mt_rand() / mt_getrandmax();
    }

    // Box-Muller.
    private function normal(): float
    {
        $u = 1 - mt_rand() / mt_getrandmax();
        $v = mt_rand() / mt_getrandmax();

        return sqrt(-2 * log($u)) * cos(2 * M_PI * $v);
    }
}
