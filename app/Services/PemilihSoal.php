<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * Memilih soal latihan fleksibel (satu atau beberapa topik, sesuai tahap siswa) dan simulasi.
 *
 * Hanya soal yang belum pernah dijawab siswa yang boleh muncul: soal yang dijawab benar tidak muncul lagi,
 * dan soal yang dijawab salah hanya dikerjakan ulang lewat remedial (RANCANGAN-dashboard-topik-remedial.md, K4).
 */
class PemilihSoal
{
    // Komposisi soal mode simulasi dalam persen (UCS1).
    public const PORSI_SIMULASI = ['mudah' => 30, 'sedang' => 40, 'sulit' => 30];

    /**
     * Fleksibel. Jumlah soal dibagi rata ke topik yang dipilih, lalu soal tiap topik dibagi per tingkat
     * menurut tahap siswa di topik itu. Stok satu topik yang kurang diisi dari topik lain, dengan tingkat
     * yang boleh di tahap topik pemberinya.
     *
     * @param  string[]  $topikIds
     * @return string[] id soal dalam urutan tampil (acak, topik bercampur)
     */
    public function pilih(string $userId, array $topikIds, int $jumlahSoal, ?int $seed = null): array
    {
        $tanda = implode(', ', array_fill(0, count($topikIds), '?'));
        $baris = $topikIds === [] ? [] : $this->kandidat($userId, "q.topik_id in ({$tanda})", $topikIds);

        $perTopik = [];
        foreach ($baris as $b) {
            $perTopik[$b->topik_id]['tahap'] = (int) ($b->tahap ?? Penguasaan::TAHAP_AWAL);
            $perTopik[$b->topik_id]['kandidat'][] = [
                'id' => $b->id,
                'kode' => $b->kode_soal,
                'tingkat' => $b->tingkat,
                'benar' => null,
                'waktu' => null,
            ];
        }

        $acak = new Randomizer($seed === null ? null : new Mt19937($seed));
        $terpilih = [];
        $kurang = 0;

        foreach (self::bagiRata($topikIds, $jumlahSoal, $seed) as $topikId => $jumlah) {
            $topik = $perTopik[$topikId] ?? null;
            $ambil = $topik ? self::susun($topik['kandidat'], Penguasaan::jatahSoal($topik['tahap'], $jumlah), $seed) : [];

            array_push($terpilih, ...$ambil);
            $kurang += $jumlah - count($ambil);
        }

        if ($kurang > 0) {
            $sudah = array_flip($terpilih);
            $cadangan = [];
            foreach ($perTopik as $topik) {
                $boleh = Penguasaan::PORSI_PER_TAHAP[$topik['tahap']];
                foreach ($topik['kandidat'] as $k) {
                    if (isset($boleh[$k['tingkat']]) && ! isset($sudah[$k['id']])) {
                        $cadangan[] = $k['id'];
                    }
                }
            }

            array_push($terpilih, ...array_slice($cadangan ? $acak->shuffleArray($cadangan) : [], 0, $kurang));
        }

        return $terpilih ? $acak->shuffleArray($terpilih) : [];
    }

    /**
     * Simulasi: semua topik subtes, komposisi 30% mudah, 40% sedang, 30% sulit, tanpa tahap.
     * Tiap tingkat disebar bergiliran ke semua topik. Giliran berlanjut antar tingkat, jadi total per topik
     * berselisih paling banyak 1. Stok satu tingkat yang kurang diisi dari sisa tingkat lain.
     *
     * @return string[] id soal dalam urutan tampil (acak)
     */
    public function pilihSimulasi(string $userId, string $subtesId, int $jumlahSoal, ?int $seed = null): array
    {
        $acak = new Randomizer($seed === null ? null : new Mt19937($seed));
        $baris = $this->kandidat($userId, 'q.subtes_id = ?', [$subtesId]);

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

            array_push($terpilih, ...array_slice($sisa ? $acak->shuffleArray($sisa) : [], 0, $kurang));
        }

        return $terpilih ? $acak->shuffleArray($terpilih) : [];
    }

    /**
     * Bagi jumlah soal rata ke topik: masing-masing floor(n / k), sisanya +1 ke topik yang dipilih acak.
     * Hanya bilangan bulat, jadi totalnya selalu tepat $jumlahSoal.
     *
     * @param  string[]  $topikIds
     * @return array<string, int> topik_id => jumlah soal
     */
    public static function bagiRata(array $topikIds, int $jumlahSoal, ?int $seed = null): array
    {
        $topikIds = array_values(array_unique($topikIds));

        if ($topikIds === []) {
            return [];
        }

        $acak = new Randomizer($seed === null ? null : new Mt19937($seed));
        $kuota = array_fill_keys($topikIds, intdiv($jumlahSoal, count($topikIds)));

        foreach (array_slice($acak->shuffleArray($topikIds), 0, $jumlahSoal % count($topikIds)) as $topikId) {
            $kuota[$topikId]++;
        }

        return $kuota;
    }

    /**
     * Soal yang belum pernah dijawab siswa (pengerjaan selesai, mode apa pun), beserta tahap siswa di topiknya.
     * $syarat hanya diisi dari dalam kelas ini, bukan dari input pengguna.
     *
     * @return array<int, object{id: string, topik_id: string, kode_soal: string, tingkat: string, tahap: ?int}>
     */
    private function kandidat(string $userId, string $syarat, array $nilai): array
    {
        return DB::select(<<<SQL
            select q.id, q.topik_id, q.kode_soal, q.tingkat_kesulitan::text as tingkat, pt.tahap
            from soal q
            left join penguasaan_topik pt on pt.topik_id = q.topik_id and pt.user_id = ?
            where {$syarat}
              and not exists (
                  select 1
                  from jawaban_pengerjaan j
                  join pengerjaan p on p.id = j.pengerjaan_id
                  where j.soal_id = q.id and p.user_id = ? and p.status = 'selesai'
              )
            SQL, [$userId, ...$nilai, $userId]);
    }

    /**
     * Inti pemilihan, tanpa database.
     *
     * Di tiap tingkat: soal yang belum pernah dijawab (acak), lalu yang pernah salah, lalu yang pernah benar,
     * masing-masing yang terlama dulu. Bila stok satu tingkat kurang dari jatahnya, sisanya diambil dari
     * tingkat lain yang boleh di tahap itu: yang terdekat dulu, dan bila sama jauh, yang lebih sulit.
     * Stok yang tetap kurang membuat sesi lebih pendek. Hasilnya diacak untuk urutan tampil.
     * pilih() hanya mengirim soal yang belum pernah dijawab (K4), jadi kelompok "pernah salah/benar" kosong.
     *
     * @param  array<int, array{id: string, kode: string, tingkat: string, benar: ?bool, waktu: ?string}>  $kandidat
     * @param  array<string, int>  $jatah  tingkat => jumlah soal, dari Penguasaan::jatahSoal()
     * @return string[] id soal
     */
    public static function susun(array $kandidat, array $jatah, ?int $seed = null): array
    {
        $acak = new Randomizer($seed === null ? null : new Mt19937($seed));
        $posisi = array_flip(array_keys(Penguasaan::BOBOT));

        $antrean = [];
        foreach (array_keys($jatah) as $tingkat) {
            $kelompok = array_filter($kandidat, fn ($k) => $k['tingkat'] === $tingkat);
            $belum = array_values(array_filter($kelompok, fn ($k) => $k['benar'] === null));
            $pernah = array_values(array_filter($kelompok, fn ($k) => $k['benar'] !== null));
            // false (salah) sebelum true (benar), lalu yang terlama dijawab dulu.
            usort($pernah, fn ($a, $b) => [$a['benar'], $a['waktu'], $a['kode']] <=> [$b['benar'], $b['waktu'], $b['kode']]);
            $antrean[$tingkat] = [...($belum ? $acak->shuffleArray($belum) : []), ...$pernah];
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

        return array_column($terpilih ? $acak->shuffleArray($terpilih) : [], 'id');
    }
}
