<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * Memilih soal latihan untuk satu sesi.
 *
 * Soal hanya muncul sekali per siswa: soal yang sudah pernah dijawab di sesi yang selesai, dalam mode apa pun,
 * tidak disajikan lagi di mode fleksibel maupun simulasi. Soal yang dijawab salah nanti dikerjakan ulang
 * lewat mode remedial. Soal yang tampil tetapi tidak dijawab tidak tercatat, jadi tetap bisa muncul lagi.
 */
class PemilihSoal
{
    // Syarat "belum pernah dikerjakan" untuk baris tabel soal. Parameternya user_id.
    private const BELUM_DIKERJAKAN = <<<'SQL'
        not exists (
            select 1 from jawaban_pengerjaan j
            join pengerjaan p on p.id = j.pengerjaan_id
            where j.soal_id = soal.id and p.user_id = ? and p.status = 'selesai'
        )
        SQL;

    /**
     * Mode fleksibel: soal dari satu atau beberapa topik, sesuai tahap siswa di tiap topik.
     *
     * @param  string[]  $topikIds
     * @return string[] id soal dalam urutan tampil (acak); lebih sedikit dari $jumlahSoal bila stok habis
     */
    public function fleksibel(string $userId, array $topikIds, int $jumlahSoal): array
    {
        $tanda = implode(', ', array_fill(0, count($topikIds), '?'));

        // Satu query: soal yang belum pernah dikerjakan di topik terpilih, beserta tahap siswa di topiknya.
        $baris = DB::select(sprintf(<<<'SQL'
            select soal.id, soal.topik_id, soal.tingkat_kesulitan::text as tingkat,
                   (select pt.tahap from penguasaan_topik pt where pt.user_id = ? and pt.topik_id = soal.topik_id) as tahap
            from soal
            where soal.topik_id in (%s) and %s
            SQL, $tanda, self::BELUM_DIKERJAKAN), [$userId, ...$topikIds, $userId]);

        // Topik yang soalnya sudah habis tidak muncul di hasil query; tahapnya tidak berpengaruh.
        $tahap = array_fill_keys($topikIds, Penguasaan::TAHAP_AWAL);
        foreach ($baris as $b) {
            $tahap[$b->topik_id] = (int) ($b->tahap ?? Penguasaan::TAHAP_AWAL);
        }

        $kandidat = array_map(fn ($b) => ['id' => $b->id, 'topik_id' => $b->topik_id, 'tingkat' => $b->tingkat], $baris);

        return self::susun($kandidat, $tahap, $jumlahSoal);
    }

    /**
     * Mode simulasi: soal acak dari seluruh subtes, tanpa tahap.
     *
     * @return string[] id soal
     */
    public function simulasi(string $userId, string $subtesId, int $jumlahSoal): array
    {
        return array_column(DB::select(sprintf(<<<'SQL'
            select soal.id from soal
            where soal.subtes_id = ? and %s
            order by random()
            limit ?
            SQL, self::BELUM_DIKERJAKAN), [$subtesId, $userId, $jumlahSoal]), 'id');
    }

    /**
     * Inti pemilihan fleksibel, tanpa database.
     *
     * 1. Jumlah soal dibagi rata ke topik (bagiKuota()).
     * 2. Kuota tiap topik dibagi ke tingkat sesuai porsi tahap siswa di topik itu.
     * 3. Tingkat yang stoknya kurang diisi dari tingkat lain yang boleh di tahap itu: yang terdekat dulu, dan bila
     *    sama jauh, yang lebih sulit. Topik yang tetap kurang diisi dari sisa soal topik lain di sesi ini.
     *    Stok yang tetap kurang membuat sesi lebih pendek.
     * 4. Urutan tampil diacak, sehingga topik bercampur.
     *
     * @param  array<int, array{id: string, topik_id: string, tingkat: string}>  $kandidat  soal yang belum pernah dikerjakan
     * @param  array<string, int>  $tahap  topik_id => tahap siswa, untuk setiap topik yang dipilih
     * @return string[] id soal
     */
    public static function susun(array $kandidat, array $tahap, int $jumlahSoal, ?int $seed = null): array
    {
        $acak = new Randomizer($seed === null ? null : new Mt19937($seed));
        $kuota = self::bagiKuota(array_keys($tahap), $jumlahSoal, $acak);

        $terpilih = [];
        $cadangan = [];
        $kurang = 0;
        foreach ($tahap as $topikId => $t) {
            $milikTopik = array_filter($kandidat, fn ($k) => $k['topik_id'] === $topikId);
            [$ambil, $sisa] = self::susunTopik($milikTopik, Penguasaan::jatahSoal($t, $kuota[$topikId]), $acak);
            array_push($terpilih, ...$ambil);
            array_push($cadangan, ...$sisa);
            $kurang += $kuota[$topikId] - count($ambil);
        }

        if ($kurang > 0 && $cadangan !== []) {
            array_push($terpilih, ...array_slice($acak->shuffleArray($cadangan), 0, $kurang));
        }

        return array_column($terpilih === [] ? [] : $acak->shuffleArray($terpilih), 'id');
    }

    /**
     * Bagi jumlah soal rata ke topik. Sisa pembagian diberikan +1 ke topik yang dipilih acak,
     * jadi setiap topik mendapat floor(n/k) atau floor(n/k) + 1 dan totalnya selalu tepat n.
     *
     * @param  string[]  $topikIds
     * @return array<string, int> topik_id => jumlah soal, dalam urutan $topikIds
     */
    public static function bagiKuota(array $topikIds, int $jumlahSoal, ?Randomizer $acak = null): array
    {
        if ($topikIds === []) {
            return [];
        }

        $kuota = array_fill_keys($topikIds, intdiv($jumlahSoal, count($topikIds)));
        $sisa = $jumlahSoal % count($topikIds);

        if ($sisa > 0) {
            foreach (($acak ?? new Randomizer)->pickArrayKeys($kuota, $sisa) as $topikId) {
                $kuota[$topikId]++;
            }
        }

        return $kuota;
    }

    /**
     * Soal satu topik sesuai jatah per tingkat.
     *
     * @param  array<string, int>  $jatah  tingkat => jumlah soal, dari Penguasaan::jatahSoal()
     * @return array{0: array, 1: array} soal terpilih, dan sisa soal di tingkat yang boleh untuk tahap ini
     */
    private static function susunTopik(array $kandidat, array $jatah, Randomizer $acak): array
    {
        $posisi = array_flip(array_keys(Penguasaan::BOBOT));

        $antrean = [];
        foreach (array_keys($jatah) as $tingkat) {
            $kelompok = array_values(array_filter($kandidat, fn ($k) => $k['tingkat'] === $tingkat));
            $antrean[$tingkat] = $kelompok === [] ? [] : $acak->shuffleArray($kelompok);
        }

        $terpilih = [];
        $kurang = [];
        foreach ($jatah as $tingkat => $jumlah) {
            $ambil = array_splice($antrean[$tingkat], 0, $jumlah);
            array_push($terpilih, ...$ambil);
            $kurang[$tingkat] = $jumlah - count($ambil);
        }

        foreach ($kurang as $tingkat => $sisa) {
            $lain = array_values(array_filter(array_keys($jatah), fn ($t) => $t !== $tingkat));
            usort($lain, fn ($a, $b) => [abs($posisi[$a] - $posisi[$tingkat]), -$posisi[$a]]
                <=> [abs($posisi[$b] - $posisi[$tingkat]), -$posisi[$b]]);

            foreach ($lain as $t) {
                if ($sisa === 0) {
                    break;
                }
                $ambil = array_splice($antrean[$t], 0, $sisa);
                array_push($terpilih, ...$ambil);
                $sisa -= count($ambil);
            }
        }

        return [$terpilih, array_merge(...array_values($antrean))];
    }
}
