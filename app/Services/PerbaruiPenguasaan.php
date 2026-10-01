<?php

namespace App\Services;

use App\Models\PenguasaanTopik;
use App\Models\RiwayatTahap;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;

/**
 * Memperbarui skor dan tahap topik-topik yang dikerjakan di satu sesi fleksibel.
 *
 * Jendela diambil dari log jawaban setiap kali, jadi hasilnya selalu bisa dihitung ulang;
 * yang tidak bisa diturunkan dari log hanya tahap dan tahap_sejak. Aturannya ada di Penguasaan.
 */
class PerbaruiPenguasaan
{
    /**
     * Jendela tiap topik dinilai sendiri-sendiri, jadi satu sesi bisa menaikkan satu topik dan menurunkan topik lain.
     * Berapa pun jumlah topiknya, cukup tiga query: membaca jendela, upsert penguasaan, dan insert riwayat.
     *
     * @param  string[]  $topikIds  topik yang punya jawaban di sesi ini
     * @return array<string, array{tahap_lama: int, tahap: int, skor: ?float, n_jendela: int, n_di_tahap: int, berubah: bool}> topik_id => hasil
     */
    public function setelahSesi(string $userId, array $topikIds, string $pengerjaanId, DateTimeInterface $selesai): array
    {
        if ($topikIds === []) {
            return [];
        }

        $tanda = implode(', ', array_fill(0, count($topikIds), '?'));

        // Per topik: 20 jawaban terakhir (satu per soal, dari yang terbaru masuk), keadaan yang tersimpan,
        // dan jumlah soal yang dikerjakan sejak tahap terakhir berubah (dasar topik prioritas).
        $baris = DB::select(sprintf(<<<'SQL'
            with keadaan as (
                select topik_id, tahap, tahap_sejak from penguasaan_topik where user_id = ? and topik_id in (%1$s)
            ),
            jawaban as (
                select j.id, j.soal_id, j.is_correct, j.pakai_hint, p.finished_at, q.kode_soal, q.tingkat_kesulitan, q.topik_id
                from jawaban_pengerjaan j
                join pengerjaan p on p.id = j.pengerjaan_id
                join soal q on q.id = j.soal_id
                where p.user_id = ? and q.topik_id in (%1$s) and p.status = 'selesai' and p.mode_latihan = 'fleksibel'
            ),
            terbaru as (
                select distinct on (soal_id) * from jawaban order by soal_id, finished_at desc, id desc
            ),
            jendela as (
                -- Urutan masuk: sesi terbaru dulu; di dalam sesi, sulit ke mudah lalu kode soal (kebalikan urutan masuk).
                select t.*, row_number() over (
                    partition by t.topik_id order by t.finished_at desc, t.tingkat_kesulitan desc, t.kode_soal desc
                ) as ke
                from terbaru t
            ),
            n_sejak as (
                select j.topik_id, count(*) as n
                from jawaban j
                left join keadaan k on k.topik_id = j.topik_id
                where k.tahap_sejak is null or j.finished_at > k.tahap_sejak
                group by j.topik_id
            )
            select w.topik_id, w.kode_soal, w.tingkat_kesulitan::text as tingkat, w.is_correct as benar, w.pakai_hint as hint,
                   k.tahap, k.tahap_sejak, coalesce(n.n, 0) as n_sejak
            from jendela w
            left join keadaan k on k.topik_id = w.topik_id
            left join n_sejak n on n.topik_id = w.topik_id
            where w.ke <= ?
            order by w.topik_id, w.ke
            SQL, $tanda), [$userId, ...$topikIds, $userId, ...$topikIds, Penguasaan::JENDELA]);

        $hasil = [];
        $penguasaan = [];
        $riwayat = [];
        $riwayatModel = new RiwayatTahap;

        foreach (collect($baris)->groupBy('topik_id') as $topikId => $jawaban) {
            $pertama = $jawaban->first();
            $tahapLama = (int) ($pertama->tahap ?? Penguasaan::TAHAP_AWAL);
            // Baris diurutkan dari yang terbaru masuk, sedangkan jendela dari yang paling lama.
            $jendela = $jawaban->reverse()->map(fn ($b) => [
                'soal' => $b->kode_soal,
                'tingkat' => $b->tingkat,
                'benar' => (bool) $b->benar,
                'hint' => (bool) $b->hint,
            ])->values()->all();

            $h = Penguasaan::setelahSesi($tahapLama, $jendela, (int) $pertama->n_sejak);
            $hasil[$topikId] = ['tahap_lama' => $tahapLama] + $h;

            $penguasaan[] = [
                'user_id' => $userId,
                'topik_id' => $topikId,
                'skor' => $h['skor'],
                'n_jendela' => $h['n_jendela'],
                'n_di_tahap' => $h['n_di_tahap'],
                'tahap' => $h['tahap'],
                // Batas jawaban "sejak tahap berubah": sesi pemicu tidak ikut dihitung di tahap barunya.
                'tahap_sejak' => $h['berubah'] ? $selesai : $pertama->tahap_sejak,
                'updated_at' => now(),
            ];

            if ($h['berubah']) {
                $riwayat[] = [
                    'id' => $riwayatModel->newUniqueId(),
                    'user_id' => $userId,
                    'topik_id' => $topikId,
                    'dari_tahap' => $tahapLama,
                    'ke_tahap' => $h['tahap'],
                    'skor' => $h['skor'],
                    'pengerjaan_id' => $pengerjaanId,
                    'created_at' => now(),
                ];
            }
        }

        if ($penguasaan !== []) {
            PenguasaanTopik::upsert($penguasaan, ['user_id', 'topik_id'], ['skor', 'n_jendela', 'n_di_tahap', 'tahap', 'tahap_sejak', 'updated_at']);
        }

        if ($riwayat !== []) {
            RiwayatTahap::insert($riwayat);
        }

        return $hasil;
    }
}
