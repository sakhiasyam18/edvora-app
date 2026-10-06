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
     * Topik tiap subtes beserta keadaan siswa, urut `urutan`. Urutan rekomendasi ada di RekomendasiTopik.
     *
     * @param  string|null  $subtesId  hanya topik subtes ini; null untuk semua subtes
     * @return array<string, array<int, array<string, mixed>>> subtes_id => daftar topik
     */
    public function perSubtes(string $userId, ?string $subtesId = null): array
    {
        $baris = DB::select(<<<'SQL'
            select t.id, t.subtes_id, t.nama_topik, t.urutan, t.jumlah_soal_simulasi, s.jumlah_soal as jumlah_soal_subtes,
                   exists (select 1 from soal q where q.topik_id = t.id and q.status = 'published') as ada_soal,
                   pt.tahap, pt.skor, pt.skor_sementara, pt.n_jendela, pt.n_di_tahap
            from topik t
            join subtes s on s.id = t.subtes_id
            left join penguasaan_topik pt on pt.topik_id = t.id and pt.user_id = ?
            where ?::uuid is null or t.subtes_id = ?::uuid
            order by t.subtes_id, t.urutan, t.nama_topik
            SQL, [$userId, $subtesId, $subtesId]);

        $perSubtes = [];
        foreach ($baris as $b) {
            $perSubtes[$b->subtes_id][] = self::keadaan($b);
        }

        return $perSubtes;
    }

    /**
     * Keadaan setiap topik yang dikerjakan di satu sesi fleksibel atau remedial, termasuk naik/turun tahap di sesi itu.
     * Kosong untuk sesi simulasi dan sesi tanpa jawaban.
     *
     * @return array<int, array<string, mixed>> urut sesuai urutan topik
     */
    public function untukHasil(Pengerjaan $pengerjaan): array
    {
        if (! in_array($pengerjaan->mode_latihan, ['fleksibel', 'remedial'], true)) {
            return [];
        }

        $baris = DB::select(<<<'SQL'
            select t.id, t.nama_topik, t.urutan, true as ada_soal, t.jumlah_soal_simulasi, s.jumlah_soal as jumlah_soal_subtes,
                   pt.tahap, pt.skor, pt.skor_sementara, pt.n_jendela, pt.n_di_tahap,
                   r.dari_tahap, r.ke_tahap
            from topik t
            join subtes s on s.id = t.subtes_id
            left join penguasaan_topik pt on pt.topik_id = t.id and pt.user_id = ?
            left join riwayat_tahap r on r.pengerjaan_id = ? and r.topik_id = t.id
            where t.id in (
                select q.topik_id from jawaban_pengerjaan j join soal q on q.id = j.soal_id where j.pengerjaan_id = ?
            )
            order by t.urutan, t.nama_topik
            SQL, [$pengerjaan->user_id, $pengerjaan->id, $pengerjaan->id]);

        return array_map(fn ($b) => self::keadaan($b) + [
            'perubahan' => $b->ke_tahap === null ? null : ['dari' => (int) $b->dari_tahap, 'ke' => (int) $b->ke_tahap],
        ], $baris);
    }

    /** Satu topik sebagai props React (camelCase). Tanpa baris penguasaan berarti tahap 1 dan belum ada skor. */
    private static function keadaan(object $b): array
    {
        $tahap = (int) ($b->tahap ?? Penguasaan::TAHAP_AWAL);
        $skor = $b->skor === null ? null : (float) $b->skor;

        return [
            'id' => $b->id,
            'nama' => $b->nama_topik,
            // Dipakai halaman Pilih Mode dan urutan rekomendasi.
            'urutan' => (int) $b->urutan,
            'adaSoal' => (bool) $b->ada_soal,
            'tahap' => $tahap,
            'skor' => $skor,
            // Skor dari jawaban yang sudah ada walaupun jendela belum penuh; hanya untuk urutan rekomendasi.
            'skorSementara' => $b->skor_sementara === null ? null : (float) $b->skor_sementara,
            // Porsi topik ini di UTBK (SDD 5.3.4); 0 bila jumlah soal simulasinya belum ditentukan.
            'proporsi' => $b->jumlah_soal_simulasi === null ? 0.0 : round($b->jumlah_soal_simulasi / $b->jumlah_soal_subtes, 4),
            'nJendela' => (int) ($b->n_jendela ?? 0),
            'nDiTahap' => (int) ($b->n_di_tahap ?? 0),
            'isiLingkaran' => Penguasaan::isiLingkaran($skor),
            'label' => Penguasaan::label($tahap, $skor),
        ];
    }
}
