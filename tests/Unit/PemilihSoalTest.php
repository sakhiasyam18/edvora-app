<?php

namespace Tests\Unit;

use App\Services\PemilihSoal;
use App\Services\Penguasaan;
use PHPUnit\Framework\TestCase;

class PemilihSoalTest extends TestCase
{
    public function test_jumlah_per_tingkat_mengikuti_porsi_tahap(): void
    {
        $kandidat = [...$this->soal('mudah', 10), ...$this->soal('sedang', 10), ...$this->soal('sulit', 10)];

        $terpilih = PemilihSoal::susun($kandidat, Penguasaan::jatahSoal(3, 10), seed: 1);

        $this->assertSame(['mudah' => 2, 'sedang' => 3, 'sulit' => 5], $this->hitungTingkat($terpilih, $kandidat));
    }

    public function test_tahap_1_hanya_soal_mudah(): void
    {
        $kandidat = [...$this->soal('mudah', 12), ...$this->soal('sedang', 12)];

        $terpilih = PemilihSoal::susun($kandidat, Penguasaan::jatahSoal(1, 10), seed: 1);

        $this->assertSame(['mudah' => 10], $this->hitungTingkat($terpilih, $kandidat));
    }

    public function test_belum_pernah_dijawab_dulu_lalu_salah_lalu_benar_yang_terlama(): void
    {
        $kandidat = [
            $this->satu('m-benar-lama', 'mudah', true, '2026-10-01 08:00:00'),
            $this->satu('m-salah-baru', 'mudah', false, '2026-10-01 09:00:00'),
            $this->satu('m-salah-lama', 'mudah', false, '2026-10-01 07:00:00'),
            $this->satu('m-belum', 'mudah'),
            $this->satu('m-benar-baru', 'mudah', true, '2026-10-01 10:00:00'),
        ];

        // Jatah 4 dari 5: yang tidak terpilih adalah soal benar yang paling baru dijawab.
        $terpilih = PemilihSoal::susun($kandidat, ['mudah' => 4], seed: 1);
        $this->assertEqualsCanonicalizing(['m-belum', 'm-salah-lama', 'm-salah-baru', 'm-benar-lama'], $terpilih);

        // Jatah 2: soal yang belum pernah dijawab, lalu soal salah yang paling lama.
        $terpilih = PemilihSoal::susun($kandidat, ['mudah' => 2], seed: 1);
        $this->assertEqualsCanonicalizing(['m-belum', 'm-salah-lama'], $terpilih);
    }

    public function test_stok_kurang_diisi_dari_tingkat_terdekat(): void
    {
        // Tahap 3, 10 soal: jatah 2 mudah, 3 sedang, 5 sulit. Soal sulit hanya ada 2,
        // jadi kekurangan 3 soal diambil dari sedang (terdekat dengan sulit), bukan dari mudah.
        $kandidat = [...$this->soal('mudah', 10), ...$this->soal('sedang', 10), ...$this->soal('sulit', 2)];

        $terpilih = PemilihSoal::susun($kandidat, Penguasaan::jatahSoal(3, 10), seed: 1);

        $this->assertSame(['mudah' => 2, 'sedang' => 6, 'sulit' => 2], $this->hitungTingkat($terpilih, $kandidat));
    }

    public function test_stok_kurang_di_tingkat_tengah_diisi_dari_yang_lebih_sulit_dulu(): void
    {
        // Sedang sama jauhnya dari mudah dan sulit; yang lebih sulit didahulukan.
        $kandidat = [...$this->soal('mudah', 10), ...$this->soal('sedang', 1), ...$this->soal('sulit', 10)];

        $terpilih = PemilihSoal::susun($kandidat, Penguasaan::jatahSoal(3, 10), seed: 1);

        $this->assertSame(['mudah' => 2, 'sedang' => 1, 'sulit' => 7], $this->hitungTingkat($terpilih, $kandidat));
    }

    public function test_soal_yang_ada_kurang_membuat_sesi_lebih_pendek(): void
    {
        $kandidat = $this->soal('mudah', 6);

        $terpilih = PemilihSoal::susun($kandidat, Penguasaan::jatahSoal(1, 10), seed: 1);

        $this->assertCount(6, $terpilih);
    }

    public function test_tidak_ada_soal_yang_terpilih_dua_kali(): void
    {
        $kandidat = [...$this->soal('mudah', 3), ...$this->soal('sedang', 3), ...$this->soal('sulit', 3)];

        $terpilih = PemilihSoal::susun($kandidat, Penguasaan::jatahSoal(3, 25), seed: 7);

        $this->assertCount(9, $terpilih);
        $this->assertSame($terpilih, array_values(array_unique($terpilih)));
    }

    /** @return array<string, int> */
    private function hitungTingkat(array $terpilih, array $kandidat): array
    {
        $tingkat = array_column($kandidat, 'tingkat', 'id');
        $jumlah = array_count_values(array_map(fn ($id) => $tingkat[$id], $terpilih));

        // Urutan kunci tetap mudah, sedang, sulit agar bisa dibandingkan dengan assertSame; tingkat kosong dibuang.
        return array_filter(array_replace(['mudah' => 0, 'sedang' => 0, 'sulit' => 0], $jumlah));
    }

    /** @return array<int, array{id: string, kode: string, tingkat: string, benar: ?bool, waktu: ?string}> */
    private function soal(string $tingkat, int $jumlah): array
    {
        return array_map(fn ($i) => $this->satu(sprintf('%s-%02d', $tingkat, $i), $tingkat), range(1, $jumlah));
    }

    private function satu(string $id, string $tingkat, ?bool $benar = null, ?string $waktu = null): array
    {
        return ['id' => $id, 'kode' => $id, 'tingkat' => $tingkat, 'benar' => $benar, 'waktu' => $waktu];
    }
}
