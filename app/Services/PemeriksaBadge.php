<?php

namespace App\Services;

use App\Models\Badge;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Throwable;

/**
 * Badge otomatis (SDD 5.3.8, RANCANGAN-badge-avatar.md bagian 4). Syarat disimpan di tabel badge; statistik dihitung
 * dari log saat diperiksa, jadi badge yang terlewat karena pemeriksaan gagal diberikan di pemeriksaan berikutnya.
 */
class PemeriksaBadge
{
    /**
     * Berikan badge yang syaratnya terpenuhi tetapi belum dimiliki. Dipanggil di luar transaksi sesi dan tidak pernah
     * melempar exception, supaya kegagalannya tidak membatalkan sesi, XP, atau pembelian.
     */
    public function periksa(string $userId, CarbonInterface $waktu): void
    {
        try {
            $belumDimiliki = Badge::whereNotIn('id', DB::table('siswa_badge')->select('badge_id')->where('user_id', $userId))
                ->get(['id', 'jenis_syarat', 'target']);

            if ($belumDimiliki->isEmpty()) {
                return;
            }

            $statistik = $this->statistik($userId);

            $baris = $belumDimiliki
                ->filter(fn (Badge $b) => self::lolos($b->jenis_syarat, $b->target, $statistik))
                ->map(fn (Badge $b) => ['user_id' => $userId, 'badge_id' => $b->id, 'diperoleh_at' => $waktu])
                ->values()
                ->all();

            if ($baris !== []) {
                // ON CONFLICT DO NOTHING: pemeriksaan bersamaan untuk siswa yang sama tidak menggandakan badge.
                DB::table('siswa_badge')->insertOrIgnore($baris);
            }
        } catch (Throwable $e) {
            report($e);
        }
    }

    /**
     * Aturan lolos per jenis (RANCANGAN-badge-avatar.md 4.2). Peringkat makin kecil makin baik; skor dan peringkat
     * Try Out kosong selama belum ada paket yang dinilai.
     *
     * @param  array{soal_dijawab: int, jawaban_benar: int, sesi_sempurna: int, soal_remedial: int, simulasi_selesai: int, try_out_selesai: int, rata_skor_try_out: ?float, peringkat_try_out: ?int, avatar_dimiliki: int, avatar_total: int}  $statistik
     */
    public static function lolos(string $jenis, ?int $target, array $statistik): bool
    {
        return match ($jenis) {
            'soal_dijawab', 'jawaban_benar', 'sesi_sempurna', 'soal_remedial', 'simulasi_selesai', 'try_out_selesai' => $statistik[$jenis] >= $target,
            'rata_skor_try_out' => $statistik['rata_skor_try_out'] !== null && $statistik['rata_skor_try_out'] >= $target,
            'peringkat_try_out' => $statistik['peringkat_try_out'] !== null && $statistik['peringkat_try_out'] <= $target,
            'semua_avatar' => $statistik['avatar_total'] > 0 && $statistik['avatar_dimiliki'] >= $statistik['avatar_total'],
            default => throw new InvalidArgumentException("Jenis syarat badge \"{$jenis}\" tidak dikenal."),
        };
    }

    /**
     * Statistik satu siswa dalam satu query. "Sesi" = pengerjaan berstatus selesai.
     *
     * @return array{soal_dijawab: int, jawaban_benar: int, sesi_sempurna: int, soal_remedial: int, simulasi_selesai: int, try_out_selesai: int, rata_skor_try_out: ?float, peringkat_try_out: ?int, avatar_dimiliki: int, avatar_total: int}
     */
    private function statistik(string $userId): array
    {
        $b = DB::selectOne(<<<'SQL'
            with param as (select ?::uuid as user_id),
            sesi as (
                -- Benar/salah Try Out baru dipakai setelah paket dinilai (T15).
                select p.id, p.tipe, p.mode_latihan, p.jumlah_soal_dipilih,
                       (p.tipe <> 'try_out' or t.dinilai_at is not null) as benar_terbuka
                from pengerjaan p
                left join try_out t on t.id = p.try_out_id
                where p.user_id = (select user_id from param) and p.status = 'selesai'
            ),
            jawaban as (
                select j.pengerjaan_id as sesi_id, count(*) as dijawab, count(*) filter (where j.is_correct) as benar
                from jawaban_pengerjaan j
                where j.pengerjaan_id in (select id from sesi)
                group by j.pengerjaan_id
            ),
            peringkat as (
                -- Sama dengan peringkat umum PeringkatTryOut::queryPeringkat(): RANK() atas peserta selesai yang sudah dinilai.
                -- dinilai_at ikut disyaratkan karena total_skor ber-default 0: tanpa itu, paket yang belum dinilai bisa
                -- membuat semua peserta seri di peringkat 1.
                select p.user_id, rank() over (partition by p.try_out_id order by p.total_skor desc) as peringkat
                from pengerjaan p
                join try_out t on t.id = p.try_out_id
                where p.status = 'selesai' and p.total_skor is not null and t.dinilai_at is not null
                  and p.try_out_id in (
                      select try_out_id from pengerjaan
                      where user_id = (select user_id from param) and tipe = 'try_out' and status = 'selesai' and total_skor is not null
                  )
            )
            select
                coalesce((select sum(dijawab) from jawaban), 0) as soal_dijawab,
                coalesce((select sum(j.benar) from jawaban j join sesi s on s.id = j.sesi_id where s.benar_terbuka), 0) as jawaban_benar,
                -- Remedial tidak dihitung: soalnya pernah salah dan pembahasannya sudah dilihat.
                (select count(*) from jawaban j join sesi s on s.id = j.sesi_id
                  where s.benar_terbuka and coalesce(s.mode_latihan, '') <> 'remedial'
                    and s.jumlah_soal_dipilih > 0 and j.benar = s.jumlah_soal_dipilih) as sesi_sempurna,
                coalesce((select sum(j.dijawab) from jawaban j join sesi s on s.id = j.sesi_id where s.mode_latihan = 'remedial'), 0) as soal_remedial,
                (select count(*) from sesi where mode_latihan = 'simulasi') as simulasi_selesai,
                (select count(*) from sesi where tipe = 'try_out') as try_out_selesai,
                (select avg(p.total_skor) from pengerjaan p
                  join try_out t on t.id = p.try_out_id
                  where p.user_id = (select user_id from param) and p.tipe = 'try_out' and p.status = 'selesai'
                    and p.total_skor is not null and t.dinilai_at is not null) as rata_skor_try_out,
                (select min(peringkat) from peringkat where user_id = (select user_id from param)) as peringkat_try_out,
                (select count(*) from siswa_avatar where user_id = (select user_id from param)) as avatar_dimiliki,
                (select count(*) from avatar) as avatar_total
            SQL, [$userId]);

        return [
            'soal_dijawab' => (int) $b->soal_dijawab,
            'jawaban_benar' => (int) $b->jawaban_benar,
            'sesi_sempurna' => (int) $b->sesi_sempurna,
            'soal_remedial' => (int) $b->soal_remedial,
            'simulasi_selesai' => (int) $b->simulasi_selesai,
            'try_out_selesai' => (int) $b->try_out_selesai,
            'rata_skor_try_out' => $b->rata_skor_try_out === null ? null : (float) $b->rata_skor_try_out,
            'peringkat_try_out' => $b->peringkat_try_out === null ? null : (int) $b->peringkat_try_out,
            'avatar_dimiliki' => (int) $b->avatar_dimiliki,
            'avatar_total' => (int) $b->avatar_total,
        ];
    }
}
