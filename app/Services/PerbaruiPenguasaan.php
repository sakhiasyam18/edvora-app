<?php

namespace App\Services;

use App\Models\PenguasaanTopik;
use App\Models\RiwayatTahap;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;

/**
 * Memperbarui skor dan tahap satu topik setelah sesi fleksibel selesai.
 *
 * Jendela diambil dari log jawaban setiap kali, jadi hasilnya selalu bisa dihitung ulang;
 * yang tidak bisa diturunkan dari log hanya tahap dan tahap_sejak. Aturannya ada di Penguasaan.
 */
class PerbaruiPenguasaan
{
    /**
     * Hasilnya null bila siswa belum punya jawaban fleksibel di topik ini.
     *
     * @return array{tahap_lama: int, tahap: int, skor: ?float, n_jendela: int, n_di_tahap: int, berubah: bool}|null
     */
    public function setelahSesi(string $userId, string $topikId, string $pengerjaanId, DateTimeInterface $selesai): ?array
    {
        // Satu query: 20 jawaban terakhir (satu per soal, dari yang terbaru masuk), keadaan yang tersimpan,
        // dan jumlah soal yang dikerjakan sejak tahap terakhir berubah (dasar topik prioritas).
        $baris = DB::select(<<<'SQL'
            with keadaan as (
                select tahap, tahap_sejak from penguasaan_topik where user_id = ? and topik_id = ?
            ),
            jawaban as (
                select j.id, j.soal_id, j.is_correct, j.pakai_hint, p.finished_at, q.kode_soal, q.tingkat_kesulitan
                from jawaban_pengerjaan j
                join pengerjaan p on p.id = j.pengerjaan_id
                join soal q on q.id = j.soal_id
                where p.user_id = ? and q.topik_id = ? and p.status = 'selesai'
                  and p.mode_latihan = 'fleksibel' and not p.sesi_ulangan
            ),
            terbaru as (
                select distinct on (soal_id) * from jawaban order by soal_id, finished_at desc, id desc
            )
            select t.kode_soal, t.tingkat_kesulitan::text as tingkat, t.is_correct as benar, t.pakai_hint as hint,
                   (select tahap from keadaan) as tahap,
                   (select tahap_sejak from keadaan) as tahap_sejak,
                   (select count(*) from jawaban
                     where (select tahap_sejak from keadaan) is null
                        or finished_at > (select tahap_sejak from keadaan)) as n_sejak
            from terbaru t
            -- Urutan masuk: sesi terbaru dulu; di dalam sesi, sulit ke mudah lalu kode soal (kebalikan urutan masuk).
            order by t.finished_at desc, t.tingkat_kesulitan desc, t.kode_soal desc
            limit 20
            SQL, [$userId, $topikId, $userId, $topikId]);

        if ($baris === []) {
            return null;
        }

        $tahapLama = (int) ($baris[0]->tahap ?? Penguasaan::TAHAP_AWAL);
        $jendela = array_reverse(array_map(fn ($b) => [
            'soal' => $b->kode_soal,
            'tingkat' => $b->tingkat,
            'benar' => (bool) $b->benar,
            'hint' => (bool) $b->hint,
        ], $baris));

        $hasil = Penguasaan::setelahSesi($tahapLama, $jendela, (int) $baris[0]->n_sejak);

        PenguasaanTopik::upsert([[
            'user_id' => $userId,
            'topik_id' => $topikId,
            'skor' => $hasil['skor'],
            'n_jendela' => $hasil['n_jendela'],
            'n_di_tahap' => $hasil['n_di_tahap'],
            'tahap' => $hasil['tahap'],
            // Batas jawaban "sejak tahap berubah": sesi pemicu tidak ikut dihitung di tahap barunya.
            'tahap_sejak' => $hasil['berubah'] ? $selesai : $baris[0]->tahap_sejak,
            'updated_at' => now(),
        ]], ['user_id', 'topik_id'], ['skor', 'n_jendela', 'n_di_tahap', 'tahap', 'tahap_sejak', 'updated_at']);

        if ($hasil['berubah']) {
            RiwayatTahap::create([
                'user_id' => $userId,
                'topik_id' => $topikId,
                'dari_tahap' => $tahapLama,
                'ke_tahap' => $hasil['tahap'],
                'skor' => $hasil['skor'],
                'pengerjaan_id' => $pengerjaanId,
                'created_at' => now(),
            ]);
        }

        return ['tahap_lama' => $tahapLama] + $hasil;
    }
}
