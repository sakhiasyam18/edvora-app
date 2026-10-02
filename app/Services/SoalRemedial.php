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

    // Aturan remedial untuk semua subtes, di satu tempat. jumlah(), ambil(), dan jumlahPerSubtes() hanya menambah
    // filter subtes, urutan, atau pengelompokan, sehingga tab Remedial di Pilih Mode dan card di halaman
    // Perkembangan selalu menghitung hal yang sama. Parameternya user_id.
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
        select q.id, q.subtes_id, q.kode_soal, js.salah_terakhir
        from jawaban_siswa js
        join soal q on q.id = js.soal_id
        where js.salah_di_latihan and not js.pernah_benar
        SQL;

    // Daftar remedial sebagai subquery bernama "remedial". Soal paket Try Out yang belum Ditutup tidak ikut
    // (RANCANGAN-tryout.md T9).
    private static function daftar(): string
    {
        return '('.self::DAFTAR.' and '.PemilihSoal::bukanSoalTryOutAktif('q.id').') remedial';
    }

    public function jumlah(string $userId, string $subtesId): int
    {
        return (int) DB::selectOne(
            'select count(*) as jumlah from '.self::daftar().' where remedial.subtes_id = ?',
            [$userId, $subtesId],
        )->jumlah;
    }

    /**
     * Jumlah soal remedial setiap subtes dalam satu query (halaman Perkembangan).
     *
     * @return array<string, int> subtes_id => jumlah; subtes tanpa soal remedial tidak ada di daftar
     */
    public function jumlahPerSubtes(string $userId): array
    {
        $baris = DB::select(
            'select remedial.subtes_id, count(*) as jumlah from '.self::daftar().' group by remedial.subtes_id',
            [$userId],
        );

        return array_map('intval', array_column($baris, 'jumlah', 'subtes_id'));
    }

    /**
     * Soal satu sesi remedial: 25 soal yang paling lama menunggu, lalu urutan tampilnya diacak (SDD 5.3.3).
     * Antrean FIFO menurut waktu salah terakhir: soal yang salah lagi di remedial pindah ke belakang.
     *
     * @return string[] id soal dalam urutan tampil
     */
    public function ambil(string $userId, string $subtesId, ?int $seed = null): array
    {
        $baris = DB::select(
            'select remedial.id from '.self::daftar()
                .' where remedial.subtes_id = ? order by remedial.salah_terakhir, remedial.kode_soal limit ?',
            [$userId, $subtesId, self::BATAS_SESI],
        );
        $ids = array_column($baris, 'id');

        return $ids === [] ? [] : (new Randomizer($seed === null ? null : new Mt19937($seed)))->shuffleArray($ids);
    }
}
