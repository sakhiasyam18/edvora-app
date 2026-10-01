<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Soal remedial siswa per subtes: soal yang pernah dijawab salah dan belum pernah dijawab benar,
 * dari pengerjaan apa pun yang sudah selesai. Statusnya dihitung dari log jawaban, tidak disimpan
 * (RANCANGAN-dashboard-topik-remedial.md, K5).
 */
class SoalRemedial
{
    // Batas soal per sesi remedial; sisanya dikerjakan di sesi berikutnya (UCS1, K9).
    public const BATAS_SESI = 20;

    public function jumlah(string $userId, string $subtesId): int
    {
        // bool_or(is_correct) false berarti semua jawaban siswa untuk soal itu salah.
        $hasil = DB::selectOne(<<<'SQL'
            select count(*) as jumlah
            from (
                select j.soal_id
                from jawaban_pengerjaan j
                join pengerjaan p on p.id = j.pengerjaan_id
                join soal q on q.id = j.soal_id
                where p.user_id = ? and p.status = 'selesai' and q.subtes_id = ?
                group by j.soal_id
                having not bool_or(j.is_correct)
            ) remedial
            SQL, [$userId, $subtesId]);

        return (int) $hasil->jumlah;
    }
}
