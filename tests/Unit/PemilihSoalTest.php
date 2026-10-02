<?php

namespace Tests\Unit;

use App\Services\PemilihSoal;
use App\Services\Penguasaan;
use PHPUnit\Framework\TestCase;
use Random\Engine\Mt19937;
use Random\Randomizer;

class PemilihSoalTest extends TestCase
{
    public function test_kuota_dibagi_rata_dan_totalnya_tepat(): void
    {
        foreach ([[10, 1], [10, 3], [20, 3], [20, 7], [12, 4]] as [$jumlah, $banyakTopik]) {
            $topik = array_map(fn ($i) => "topik-{$i}", range(1, $banyakTopik));

            $kuota = PemilihSoal::bagiKuota($topik, $jumlah, new Randomizer(new Mt19937(3)));

            $this->assertSame($topik, array_keys($kuota));
            $this->assertSame($jumlah, array_sum($kuota));
            foreach ($kuota as $n) {
                $this->assertContains($n, [intdiv($jumlah, $banyakTopik), intdiv($jumlah, $banyakTopik) + 1]);
            }
        }
    }

    public function test_sisa_kuota_jatuh_ke_topik_acak(): void
    {
        // 20 soal untuk 3 topik: masing-masing 6, sisa 2 diberikan ke dua topik acak.
        $pola = [];
        foreach (range(1, 30) as $seed) {
            $kuota = PemilihSoal::bagiKuota(['a', 'b', 'c'], 20, new Randomizer(new Mt19937($seed)));
            $urut = array_values($kuota);
            sort($urut);
            $this->assertSame([6, 7, 7], $urut);
            $pola[] = implode('/', $kuota);
        }

        $this->assertGreaterThan(1, count(array_unique($pola)));
    }

    public function test_porsi_tiap_topik_mengikuti_tahapnya(): void
    {
        // 18 soal untuk 3 topik: tepat 6 per topik, jadi tidak ada sisa yang diacak.
        $terpilih = PemilihSoal::susun($this->tigaTopik(), ['a' => 1, 'b' => 2, 'c' => 3], 18, seed: 1);

        $this->assertSame([
            'a' => ['mudah' => 6],
            'b' => ['mudah' => 2, 'sedang' => 4],
            'c' => ['mudah' => 2, 'sedang' => 2, 'sulit' => 2],
        ], $this->hitung($terpilih, $this->tigaTopik()));
    }

    public function test_dua_puluh_soal_tiga_topik(): void
    {
        $tahap = ['a' => 1, 'b' => 2, 'c' => 3];

        $terpilih = PemilihSoal::susun($this->tigaTopik(), $tahap, 20, seed: 5);
        $per = $this->hitung($terpilih, $this->tigaTopik());

        $this->assertCount(20, $terpilih);
        foreach ($tahap as $topik => $t) {
            $n = array_sum($per[$topik]);
            $this->assertContains($n, [6, 7]);
            $this->assertSame(array_filter(Penguasaan::jatahSoal($t, $n)), $per[$topik]);
        }
    }

    public function test_stok_tingkat_kurang_diisi_dari_tingkat_terdekat(): void
    {
        // Tahap 3, 10 soal: jatah 3 mudah, 4 sedang, 3 sulit. Soal sulit hanya ada 2,
        // jadi kekurangan 1 soal diambil dari sedang (terdekat dengan sulit), bukan dari mudah.
        $kandidat = [...$this->soal('a', 'mudah', 10), ...$this->soal('a', 'sedang', 10), ...$this->soal('a', 'sulit', 2)];

        $terpilih = PemilihSoal::susun($kandidat, ['a' => 3], 10, seed: 1);

        $this->assertSame(['a' => ['mudah' => 3, 'sedang' => 5, 'sulit' => 2]], $this->hitung($terpilih, $kandidat));
    }

    public function test_stok_tingkat_tengah_kurang_diisi_dari_yang_lebih_sulit_dulu(): void
    {
        // Sedang sama jauhnya dari mudah dan sulit; yang lebih sulit didahulukan.
        $kandidat = [...$this->soal('a', 'mudah', 10), ...$this->soal('a', 'sedang', 1), ...$this->soal('a', 'sulit', 10)];

        $terpilih = PemilihSoal::susun($kandidat, ['a' => 3], 10, seed: 1);

        $this->assertSame(['a' => ['mudah' => 3, 'sedang' => 1, 'sulit' => 6]], $this->hitung($terpilih, $kandidat));
    }

    public function test_topik_yang_kurang_diisi_dari_topik_lain_di_sesi_itu(): void
    {
        // Kuota 5/5. Topik a tinggal 2 soal mudah, jadi 3 soal sisanya diambil dari topik b.
        $kandidat = [...$this->soal('a', 'mudah', 2), ...$this->soal('b', 'mudah', 20)];

        $terpilih = PemilihSoal::susun($kandidat, ['a' => 1, 'b' => 1], 10, seed: 1);

        $this->assertSame(['a' => ['mudah' => 2], 'b' => ['mudah' => 8]], $this->hitung($terpilih, $kandidat));
    }

    public function test_topik_yang_soalnya_habis_digantikan_topik_lain(): void
    {
        $kandidat = $this->soal('b', 'mudah', 20);

        $terpilih = PemilihSoal::susun($kandidat, ['a' => 1, 'b' => 1], 10, seed: 1);

        $this->assertSame(['b' => ['mudah' => 10]], $this->hitung($terpilih, $kandidat));
    }

    public function test_pengisian_tetap_menghormati_tingkat_yang_boleh(): void
    {
        // Topik b di tahap 1 hanya boleh soal mudah, jadi soal sedang b tidak dipakai untuk mengisi kekurangan a.
        $kandidat = [...$this->soal('a', 'mudah', 2), ...$this->soal('b', 'mudah', 4), ...$this->soal('b', 'sedang', 10)];

        $terpilih = PemilihSoal::susun($kandidat, ['a' => 1, 'b' => 1], 10, seed: 1);

        $this->assertSame(['a' => ['mudah' => 2], 'b' => ['mudah' => 4]], $this->hitung($terpilih, $kandidat));
    }

    public function test_stok_yang_kurang_membuat_sesi_lebih_pendek(): void
    {
        $terpilih = PemilihSoal::susun($this->soal('a', 'mudah', 6), ['a' => 1], 10, seed: 1);

        $this->assertCount(6, $terpilih);
    }

    public function test_tanpa_soal_hasilnya_kosong(): void
    {
        $this->assertSame([], PemilihSoal::susun([], ['a' => 1, 'b' => 2], 10, seed: 1));
    }

    public function test_tidak_ada_soal_ganda_dan_hasilnya_bisa_diulang_dengan_seed(): void
    {
        $tahap = ['a' => 3, 'b' => 3, 'c' => 3];

        $terpilih = PemilihSoal::susun($this->tigaTopik(), $tahap, 20, seed: 7);

        $this->assertSame($terpilih, array_values(array_unique($terpilih)));
        $this->assertSame($terpilih, PemilihSoal::susun($this->tigaTopik(), $tahap, 20, seed: 7));
    }

    public function test_simulasi_per_topik_memakai_proporsi_dan_30_40_30(): void
    {
        // PK: Bilangan 5, Aljabar dan Fungsi 6, Geometri 4, Statistika 5 (SDD 5.3.2.3).
        $kuota = ['bil' => 5, 'alj' => 6, 'geo' => 4, 'sta' => 5];
        $kandidat = [];
        foreach (array_keys($kuota) as $topik) {
            foreach (['mudah', 'sedang', 'sulit'] as $tingkat) {
                array_push($kandidat, ...$this->soal($topik, $tingkat, 10));
            }
        }
        $jatah = array_map(fn ($n) => Penguasaan::bagiPorsi(PemilihSoal::PORSI_SIMULASI, $n), $kuota);

        $terpilih = PemilihSoal::susunJatah($kandidat, $jatah, new Randomizer(new Mt19937(1)));

        $this->assertCount(20, $terpilih);
        $this->assertSame([
            'alj' => ['mudah' => 2, 'sedang' => 2, 'sulit' => 2],
            'bil' => ['mudah' => 1, 'sedang' => 2, 'sulit' => 2],
            'geo' => ['mudah' => 1, 'sedang' => 2, 'sulit' => 1],
            'sta' => ['mudah' => 1, 'sedang' => 2, 'sulit' => 2],
        ], $this->hitung($terpilih, $kandidat));
    }

    public function test_simulasi_stok_kurang_diisi_dari_tingkat_terdekat(): void
    {
        // Jatah 2/2/2, tetapi topik a tidak punya soal sulit: 2 soal diambil dari sedang.
        $kandidat = [...$this->soal('a', 'mudah', 5), ...$this->soal('a', 'sedang', 5)];
        $jatah = ['a' => Penguasaan::bagiPorsi(PemilihSoal::PORSI_SIMULASI, 6)];

        $terpilih = PemilihSoal::susunJatah($kandidat, $jatah, new Randomizer(new Mt19937(1)));

        $this->assertSame(['a' => ['mudah' => 2, 'sedang' => 4]], $this->hitung($terpilih, $kandidat));
    }

    public function test_proporsi_simulasi_hanya_dipakai_bila_lengkap(): void
    {
        $this->assertTrue(PemilihSoal::kuotaLengkap(['a' => 10, 'b' => 10, 'c' => 10], 30));
        // Ada topik yang belum diisi.
        $this->assertFalse(PemilihSoal::kuotaLengkap(['a' => 10, 'b' => null, 'c' => 10], 30));
        // Review Focus 4: total tidak sama dengan jumlah soal subtes.
        $this->assertFalse(PemilihSoal::kuotaLengkap(['a' => 10, 'b' => 10, 'c' => 9], 30));
        $this->assertFalse(PemilihSoal::kuotaLengkap([], 30));
    }

    /**
     * Jumlah soal terpilih per topik per tingkat; tingkat yang kosong dibuang.
     *
     * @return array<string, array<string, int>>
     */
    private function hitung(array $terpilih, array $kandidat): array
    {
        $info = array_column($kandidat, null, 'id');
        $hasil = [];
        foreach ($terpilih as $id) {
            $hasil[$info[$id]['topik_id']][$info[$id]['tingkat']] = ($hasil[$info[$id]['topik_id']][$info[$id]['tingkat']] ?? 0) + 1;
        }
        ksort($hasil);

        // Urutan kunci tetap mudah, sedang, sulit agar bisa dibandingkan dengan assertSame.
        return array_map(fn ($n) => array_filter(array_replace(['mudah' => 0, 'sedang' => 0, 'sulit' => 0], $n)), $hasil);
    }

    // Tiga topik dengan 10 soal di setiap tingkat.
    private function tigaTopik(): array
    {
        $soal = [];
        foreach (['a', 'b', 'c'] as $topik) {
            foreach (['mudah', 'sedang', 'sulit'] as $tingkat) {
                array_push($soal, ...$this->soal($topik, $tingkat, 10));
            }
        }

        return $soal;
    }

    /** @return array<int, array{id: string, topik_id: string, tingkat: string}> */
    private function soal(string $topik, string $tingkat, int $jumlah): array
    {
        return array_map(fn ($i) => ['id' => sprintf('%s-%s-%02d', $topik, $tingkat, $i), 'topik_id' => $topik, 'tingkat' => $tingkat], range(1, $jumlah));
    }
}
