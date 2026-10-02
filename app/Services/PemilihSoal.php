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
    // Komposisi soal mode simulasi dalam persen (UCS1).
    public const PORSI_SIMULASI = ['mudah' => 30, 'sedang' => 40, 'sulit' => 30];

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
     * Mode simulasi: semua topik subtes, tanpa tahap. Bila proporsi UTBK subtes lengkap (kuotaLengkap()),
     * kuota tiap topik = jumlah_soal_simulasi dan di dalam topik dibagi 30% mudah, 40% sedang, 30% sulit
     * (SDD 5.3.2.3). Bila belum lengkap, pembagian rata ke semua topik (simulasiRata()).
     *
     * @return string[] id soal dalam urutan tampil (acak)
     */
    public function simulasi(string $userId, string $subtesId, int $jumlahSoal, ?int $seed = null): array
    {
        $acak = new Randomizer($seed === null ? null : new Mt19937($seed));

        $baris = DB::select(sprintf(<<<'SQL'
            select soal.id, soal.topik_id, soal.tingkat_kesulitan::text as tingkat
            from soal
            where soal.subtes_id = ? and %s
            SQL, self::BELUM_DIKERJAKAN), [$subtesId, $userId]);

        $kuota = DB::table('topik')->where('subtes_id', $subtesId)->pluck('jumlah_soal_simulasi', 'id')->all();

        if (! self::kuotaLengkap($kuota, $jumlahSoal)) {
            return self::simulasiRata($baris, $jumlahSoal, $acak);
        }

        $kandidat = array_map(fn ($b) => ['id' => $b->id, 'topik_id' => $b->topik_id, 'tingkat' => $b->tingkat], $baris);
        $jatah = array_map(fn ($n) => Penguasaan::bagiPorsi(self::PORSI_SIMULASI, (int) $n), $kuota);

        return self::susunJatah($kandidat, $jatah, $acak);
    }

    /**
     * Simulasi tanpa proporsi: 30% mudah, 40% sedang, 30% sulit dari total, lalu tiap tingkat disebar
     * bergiliran ke semua topik. Giliran berlanjut antar tingkat, jadi total per topik berselisih paling
     * banyak 1. Stok satu tingkat yang kurang diisi dari sisa tingkat lain.
     *
     * @param  array<int, object>  $baris  soal yang belum pernah dikerjakan: id, topik_id, tingkat
     * @return string[] id soal dalam urutan tampil (acak)
     */
    private static function simulasiRata(array $baris, int $jumlahSoal, Randomizer $acak): array
    {
        // tingkat => topik_id => id soal (acak)
        $stok = [];
        foreach ($baris as $b) {
            $stok[$b->tingkat][$b->topik_id][] = $b->id;
        }
        foreach ($stok as $tingkat => $perTopik) {
            foreach ($perTopik as $topikId => $soal) {
                $stok[$tingkat][$topikId] = $acak->shuffleArray($soal);
            }
        }

        $topikIds = array_values(array_unique(array_column($baris, 'topik_id')));
        if ($topikIds === []) {
            return [];
        }
        $topikIds = $acak->shuffleArray($topikIds);

        $terpilih = [];
        $kurang = 0;
        $giliran = 0;

        foreach (Penguasaan::bagiPorsi(self::PORSI_SIMULASI, $jumlahSoal) as $tingkat => $jumlah) {
            $diambil = 0;
            $gagal = 0;

            // Berhenti bila semua topik sudah dicoba berturut-turut tanpa stok di tingkat ini.
            while ($diambil < $jumlah && $gagal < count($topikIds)) {
                $topikId = $topikIds[$giliran % count($topikIds)];
                $giliran++;

                if (empty($stok[$tingkat][$topikId])) {
                    $gagal++;

                    continue;
                }

                $terpilih[] = array_shift($stok[$tingkat][$topikId]);
                $diambil++;
                $gagal = 0;
            }

            $kurang += $jumlah - $diambil;
        }

        if ($kurang > 0) {
            $sisa = [];
            foreach ($stok as $perTopik) {
                foreach ($perTopik as $soal) {
                    array_push($sisa, ...$soal);
                }
            }

            array_push($terpilih, ...array_slice($sisa === [] ? [] : $acak->shuffleArray($sisa), 0, $kurang));
        }

        return $terpilih === [] ? [] : $acak->shuffleArray($terpilih);
    }

    /**
     * Pemilihan fleksibel, tanpa database: jumlah soal dibagi rata ke topik (bagiKuota()), lalu kuota tiap topik
     * dibagi ke tingkat sesuai tahap siswa di topik itu. Sisanya dikerjakan susunJatah().
     *
     * @param  array<int, array{id: string, topik_id: string, tingkat: string}>  $kandidat  soal yang belum pernah dikerjakan
     * @param  array<string, int>  $tahap  topik_id => tahap siswa, untuk setiap topik yang dipilih
     * @return string[] id soal
     */
    public static function susun(array $kandidat, array $tahap, int $jumlahSoal, ?int $seed = null): array
    {
        $acak = new Randomizer($seed === null ? null : new Mt19937($seed));
        $kuota = self::bagiKuota(array_keys($tahap), $jumlahSoal, $acak);

        $jatah = [];
        foreach ($tahap as $topikId => $t) {
            $jatah[$topikId] = Penguasaan::jatahSoal($t, $kuota[$topikId]);
        }

        return self::susunJatah($kandidat, $jatah, $acak);
    }

    /**
     * Inti pemilihan, tanpa database. Dipakai fleksibel (jatah dari tahap) dan simulasi (jatah dari proporsi UTBK).
     *
     * 1. Setiap topik mengambil soal sesuai jatah per tingkat.
     * 2. Tingkat yang stoknya kurang diisi dari tingkat lain di jatah topik itu: yang terdekat dulu, dan bila
     *    sama jauh, yang lebih sulit. Topik yang tetap kurang diisi dari sisa soal topik lain di sesi ini.
     *    Stok yang tetap kurang membuat sesi lebih pendek.
     * 3. Urutan tampil diacak, sehingga topik bercampur.
     *
     * @param  array<int, array{id: string, topik_id: string, tingkat: string}>  $kandidat
     * @param  array<string, array<string, int>>  $jatah  topik_id => [tingkat => jumlah soal], urut mudah ke sulit
     * @return string[] id soal
     */
    public static function susunJatah(array $kandidat, array $jatah, ?Randomizer $acak = null): array
    {
        $acak ??= new Randomizer;

        $terpilih = [];
        $cadangan = [];
        $kurang = 0;
        foreach ($jatah as $topikId => $perTingkat) {
            $milikTopik = array_filter($kandidat, fn ($k) => $k['topik_id'] === $topikId);
            [$ambil, $sisa] = self::susunTopik($milikTopik, $perTingkat, $acak);
            array_push($terpilih, ...$ambil);
            array_push($cadangan, ...$sisa);
            $kurang += array_sum($perTingkat) - count($ambil);
        }

        if ($kurang > 0 && $cadangan !== []) {
            array_push($terpilih, ...array_slice($acak->shuffleArray($cadangan), 0, $kurang));
        }

        return array_column($terpilih === [] ? [] : $acak->shuffleArray($terpilih), 'id');
    }

    /**
     * Proporsi simulasi dipakai hanya bila setiap topik subtes sudah diisi dan totalnya sama dengan
     * jumlah soal simulasi subtes; selain itu simulasi memakai pembagian rata.
     *
     * @param  array<string, int|string|null>  $kuota  topik_id => jumlah_soal_simulasi
     */
    public static function kuotaLengkap(array $kuota, int $jumlahSoal): bool
    {
        return $kuota !== [] && ! in_array(null, $kuota, true) && array_sum($kuota) === $jumlahSoal;
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
