<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * Soal remedial siswa per subtes (RANCANGAN-penyesuaian-sdd.md bagian 6): soal yang pernah dijawab salah di
 * fleksibel atau simulasi dan belum pernah dijawab benar. Daftarnya tidak dibatasi dan dihitung dari log
 * jawaban, tanpa tabel status (K5). Jawaban Try Out (mode_latihan null) tidak ikut. Soal paket Try Out yang
 * belum Ditutup juga tidak ikut.
 */
class SoalRemedial
{
    // Soal per sesi remedial; sisanya dikerjakan di sesi berikutnya.
    public const BATAS_SESI = 25;

    // Antrean FIFO menurut waktu salah terakhir: soal yang salah lagi di remedial pindah ke belakang.
    // Parameternya user_id lalu subtes_id.
    private const DAFTAR = <<<'SQL'
        with jawaban_siswa as (
            select j.soal_id,
                   bool_or(j.is_correct) as pernah_benar,
                   bool_or(not j.is_correct and p.mode_latihan in ('fleksibel', 'simulasi')) as salah_di_latihan,
                   max(p.finished_at) filter (where not j.is_correct) as salah_terakhir
            from jawaban_pengerjaan j
            join pengerjaan p on p.id = j.pengerjaan_id
            where p.user_id = ? and p.status = 'selesai'
              and p.mode_latihan in ('fleksibel', 'simulasi', 'remedial')
            group by j.soal_id
        )
        select q.id
        from jawaban_siswa js
        join soal q on q.id = js.soal_id
        where q.subtes_id = ? and js.salah_di_latihan and not js.pernah_benar
        SQL;

    // Soal paket Try Out yang belum Ditutup tidak masuk sesi remedial (RANCANGAN-tryout.md T9).
    private static function daftar(): string
    {
        return self::DAFTAR.' and '.PemilihSoal::bukanSoalTryOutAktif('q.id');
    }

    public function jumlah(string $userId, string $subtesId): int
    {
        return (int) DB::selectOne('select count(*) as jumlah from ('.self::daftar().') remedial', [$userId, $subtesId])->jumlah;
    }

    /**
     * Soal satu sesi remedial: 25 soal yang paling lama menunggu, lalu urutan tampilnya diacak (SDD 5.3.3).
     *
     * @return string[] id soal dalam urutan tampil
     */
    public function ambil(string $userId, string $subtesId, ?int $seed = null): array
    {
        $baris = DB::select(self::daftar().' order by js.salah_terakhir, q.kode_soal limit ?', [$userId, $subtesId, self::BATAS_SESI]);
        $ids = array_column($baris, 'id');

        return $ids === [] ? [] : (new Randomizer($seed === null ? null : new Mt19937($seed)))->shuffleArray($ids);
    }
}
