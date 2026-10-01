<?php

namespace App\Services;

use App\Models\Pengerjaan;
use Illuminate\Support\Facades\DB;

/**
 * Menyiapkan keadaan penguasaan siswa per topik untuk halaman Persiapan dan Hasil.
 * Hanya membaca nilai tersimpan di penguasaan_topik; jendela tidak dihitung ulang di sini.
 */
class RingkasanPenguasaan
{
    /**
     * Topik tiap subtes beserta keadaan siswa. Topik yang bisa dikerjakan diurutkan untuk rekomendasi
     * (prioritas dulu); topik tanpa soal ditaruh paling bawah.
     *
     * @return array<string, array<int, array<string, mixed>>> subtes_id => daftar topik
     */
    public function perSubtes(string $userId): array
    {
        $baris = DB::select(<<<'SQL'
            select t.id, t.subtes_id, t.nama_topik,
                   exists (select 1 from soal q where q.topik_id = t.id) as ada_soal,
                   pt.tahap, pt.skor, pt.n_jendela, pt.n_di_tahap
            from topik t
            left join penguasaan_topik pt on pt.topik_id = t.id and pt.user_id = ?
            order by t.subtes_id, t.urutan, t.nama_topik
            SQL, [$userId]);

        $perSubtes = [];
        foreach ($baris as $b) {
            $perSubtes[$b->subtes_id][] = self::keadaan($b);
        }

        return array_map(fn (array $topik) => [
            ...Penguasaan::urutkanRekomendasi(array_values(array_filter($topik, fn ($t) => $t['adaSoal']))),
            ...array_values(array_filter($topik, fn ($t) => ! $t['adaSoal'])),
        ], $perSubtes);
    }

    /**
     * Keadaan topik setelah satu sesi fleksibel, termasuk naik/turun tahap di sesi itu.
     * Null untuk sesi simulasi, sesi ulangan, atau sesi tanpa jawaban.
     */
    public function untukHasil(Pengerjaan $pengerjaan): ?array
    {
        $soalId = $pengerjaan->jawabanPengerjaan->first()?->soal_id;

        if ($pengerjaan->mode_latihan !== 'fleksibel' || $pengerjaan->sesi_ulangan || ! $soalId) {
            return null;
        }

        // Satu sesi fleksibel hanya berisi satu topik, jadi topiknya cukup dibaca dari satu soal.
        $b = DB::selectOne(<<<'SQL'
            select t.id, t.nama_topik, true as ada_soal,
                   pt.tahap, pt.skor, pt.n_jendela, pt.n_di_tahap,
                   r.dari_tahap, r.ke_tahap
            from soal q
            join topik t on t.id = q.topik_id
            left join penguasaan_topik pt on pt.topik_id = t.id and pt.user_id = ?
            left join riwayat_tahap r on r.pengerjaan_id = ? and r.topik_id = t.id
            where q.id = ?
            SQL, [$pengerjaan->user_id, $pengerjaan->id, $soalId]);

        if (! $b) {
            return null;
        }

        return self::keadaan($b) + [
            'perubahan' => $b->ke_tahap === null ? null : ['dari' => (int) $b->dari_tahap, 'ke' => (int) $b->ke_tahap],
        ];
    }

    /** Satu topik sebagai props React (camelCase). Tanpa baris penguasaan berarti tahap 1 dan belum ada skor. */
    private static function keadaan(object $b): array
    {
        $tahap = (int) ($b->tahap ?? Penguasaan::TAHAP_AWAL);
        $skor = $b->skor === null ? null : (float) $b->skor;
        $nDiTahap = (int) ($b->n_di_tahap ?? 0);

        return [
            'id' => $b->id,
            'nama' => $b->nama_topik,
            'adaSoal' => (bool) $b->ada_soal,
            'tahap' => $tahap,
            'skor' => $skor,
            'nJendela' => (int) ($b->n_jendela ?? 0),
            'nDiTahap' => $nDiTahap,
            'isiLingkaran' => Penguasaan::isiLingkaran($skor),
            'label' => Penguasaan::label($tahap, $skor),
            'prioritas' => Penguasaan::prioritas($tahap, $skor, $nDiTahap),
        ];
    }
}
