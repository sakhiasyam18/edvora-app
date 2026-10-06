<?php

namespace App\Services;

use Carbon\CarbonInterface;

/**
 * Aturan Dashboard Analitik editor (UCS9 Melihat Analitik Soal): stok soal per topik, rata-rata penguasaan siswa
 * per subtes, dan kapan data harian dihitung ulang. Fungsi murni; query-nya ada di DataAnalitik.
 */
class AnalitikSoal
{
    // UCS9: data diproses setiap hari pukul 00.00 waktu Indonesia, sedangkan aplikasi berjalan di UTC.
    public const ZONA_WAKTU = 'Asia/Jakarta';

    // Target stok soal published per tingkat kesulitan di setiap topik; di bawahnya topik perlu tambahan soal.
    public const TARGET_TINGKAT = 10;

    public const TINGKAT = ['mudah', 'sedang', 'sulit'];

    // Heatmap: akurasi jawaban dalam sekian hari terakhir, hanya topik dengan jawaban sebanyak ini atau lebih.
    public const HARI_HEATMAP = 30;

    public const MIN_JAWABAN_TOPIK = 5;

    public const MAKS_TOPIK_HEATMAP = 12;

    /**
     * Topik yang stok soal published-nya kurang dari target di salah satu tingkat, beserta kekurangannya.
     *
     * @param  array<int, array{kodeSubtes: string, topik: string, mudah: int, sedang: int, sulit: int}>  $stokTopik
     * @return array<int, array{kodeSubtes: string, topik: string, kurang: array<string, int>}> kurang: tingkat => jumlah soal yang masih dibutuhkan
     */
    public static function kekuranganTopik(array $stokTopik): array
    {
        $hasil = [];
        foreach ($stokTopik as $t) {
            $kurang = [];
            foreach (self::TINGKAT as $tingkat) {
                if ($t[$tingkat] < self::TARGET_TINGKAT) {
                    $kurang[$tingkat] = self::TARGET_TINGKAT - $t[$tingkat];
                }
            }

            if ($kurang !== []) {
                $hasil[] = ['kodeSubtes' => $t['kodeSubtes'], 'topik' => $t['topik'], 'kurang' => $kurang];
            }
        }

        return $hasil;
    }

    /**
     * Rata-rata persen penguasaan per subtes dari siswa yang sudah punya skor di subtes itu. Persen satu siswa sama
     * dengan lingkaran subtes di Beranda (Penguasaan::persenSubtes). Siswa tanpa skor tidak dihitung, supaya
     * rata-ratanya tidak tertarik ke 0 oleh siswa yang belum pernah berlatih.
     *
     * @param  array<string, array<int, string>>  $topikPerSubtes  subtes_id => id topik yang punya soal published
     * @param  array<int, array{user_id: string, subtes_id: string, topik_id: string, tahap: int, skor: float|null}>  $baris  isi penguasaan_topik
     * @return array<string, array{persen: float, siswa: int}> subtes_id => rata-rata; subtes tanpa siswa tidak ada
     */
    public static function rataPenguasaan(array $topikPerSubtes, array $baris): array
    {
        $perSiswa = [];
        foreach ($baris as $b) {
            $perSiswa[$b['subtes_id']][$b['user_id']][$b['topik_id']] = $b;
        }

        $hasil = [];
        foreach ($perSiswa as $subtesId => $siswaList) {
            $persen = [];
            foreach ($siswaList as $milikSiswa) {
                $topikList = array_map(fn (string $topikId) => [
                    'adaSoal' => true,
                    'tahap' => (int) ($milikSiswa[$topikId]['tahap'] ?? Penguasaan::TAHAP_AWAL),
                    'skor' => $milikSiswa[$topikId]['skor'] ?? null,
                ], $topikPerSubtes[$subtesId] ?? []);

                $ringkas = Penguasaan::persenSubtes($topikList);
                if ($ringkas['adaData']) {
                    $persen[] = $ringkas['persen'];
                }
            }

            if ($persen !== []) {
                $hasil[$subtesId] = ['persen' => round(array_sum($persen) / count($persen), 1), 'siswa' => count($persen)];
            }
        }

        return $hasil;
    }

    /**
     * Data harian sudah basi bila belum pernah dihitung atau dihitung sebelum pukul 00.00 hari ini (WIB).
     * Scheduler menghitungnya tepat pukul 00.00; ini cadangan bila scheduler sempat mati.
     */
    public static function perluDihitungUlang(?CarbonInterface $dihitungPada, CarbonInterface $sekarang): bool
    {
        return $dihitungPada === null || $dihitungPada->lt($sekarang->copy()->setTimezone(self::ZONA_WAKTU)->startOfDay());
    }
}
