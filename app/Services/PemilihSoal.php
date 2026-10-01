<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * Memilih soal latihan fleksibel dari satu topik, sesuai tahap siswa dan porsi tingkat soalnya.
 */
class PemilihSoal
{
    /**
     * @return array{tahap: int, soal_ids: string[]} soal_ids dalam urutan tampil (acak)
     */
    public function pilih(string $userId, string $topikId, int $jumlahSoal): array
    {
        // Satu query: semua soal topik, jawaban terakhir siswa untuk tiap soal (mode apa pun), dan tahap siswa di topik ini.
        $baris = DB::select(<<<'SQL'
            select q.id, q.kode_soal, q.tingkat_kesulitan::text as tingkat,
                   terakhir.is_correct as benar, terakhir.finished_at as waktu,
                   (select pt.tahap from penguasaan_topik pt where pt.user_id = ? and pt.topik_id = q.topik_id) as tahap
            from soal q
            left join lateral (
                select j.is_correct, p.finished_at
                from jawaban_pengerjaan j
                join pengerjaan p on p.id = j.pengerjaan_id
                where j.soal_id = q.id and p.user_id = ? and p.status = 'selesai'
                order by p.finished_at desc, j.id desc
                limit 1
            ) terakhir on true
            where q.topik_id = ?
            SQL, [$userId, $userId, $topikId]);

        $tahap = (int) ($baris[0]->tahap ?? Penguasaan::TAHAP_AWAL);
        $kandidat = array_map(fn ($b) => [
            'id' => $b->id,
            'kode' => $b->kode_soal,
            'tingkat' => $b->tingkat,
            'benar' => $b->benar,
            'waktu' => $b->waktu,
        ], $baris);

        return [
            'tahap' => $tahap,
            'soal_ids' => self::susun($kandidat, Penguasaan::jatahSoal($tahap, $jumlahSoal)),
        ];
    }

    /**
     * Inti pemilihan, tanpa database.
     *
     * Di tiap tingkat: soal yang belum pernah dijawab (acak), lalu yang pernah salah, lalu yang pernah benar,
     * masing-masing yang terlama dulu. Bila stok satu tingkat kurang dari jatahnya, sisanya diambil dari
     * tingkat lain yang boleh di tahap itu: yang terdekat dulu, dan bila sama jauh, yang lebih sulit.
     * Stok yang tetap kurang membuat sesi lebih pendek. Hasilnya diacak untuk urutan tampil.
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
