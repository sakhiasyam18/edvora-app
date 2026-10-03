<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;

/**
 * Pencarian dan filter halaman Riwayat (UCS3). Label jenis sesi tidak disimpan di database; label itu dibuat dari
 * try_out_id dan mode_latihan, sama seperti label di card Riwayat.
 */
class FilterRiwayat
{
    // Kode jenis di query string => label yang tampil di card dan panel filter.
    public const JENIS = [
        'fleksibel' => 'Latihan Soal Fleksibel',
        'simulasi' => 'Latihan Simulasi',
        'remedial' => 'Remedial',
        'tryout' => 'Try Out',
    ];

    // Kode status di query string => nilai kolom pengerjaan.status.
    public const STATUS = [
        'selesai' => 'selesai',
        'belum_selesai' => 'berjalan',
    ];

    /**
     * Terapkan filter jenis, status, dan kata pencarian (digabung dengan AND) ke query pengerjaan.
     * Jenis atau status yang tidak dikenal diabaikan. Kata pencarian cocok dengan nama subtes, judul Try Out,
     * atau label jenis sesi (jenisDariKata()).
     */
    public static function terapkan(Builder $query, ?string $cari, ?string $jenis, ?string $status): Builder
    {
        if ($jenis !== null && isset(self::JENIS[$jenis])) {
            $query->where(fn (Builder $q) => self::syaratJenis($q, $jenis));
        }

        if ($status !== null && isset(self::STATUS[$status])) {
            $query->where('status', self::STATUS[$status]);
        }

        $cari = trim((string) $cari);
        if ($cari !== '') {
            // % dan _ dicari apa adanya, bukan sebagai wildcard.
            $pola = '%'.addcslashes($cari, '%_\\').'%';

            $query->where(function (Builder $q) use ($cari, $pola) {
                $q->whereHas('subtes', fn (Builder $s) => $s->where('nama_subtes', 'ilike', $pola))
                    ->orWhereHas('tryOut', fn (Builder $t) => $t->where('judul', 'ilike', $pola));

                foreach (self::jenisDariKata($cari) as $kode) {
                    $q->orWhere(fn (Builder $w) => self::syaratJenis($w, $kode));
                }
            });
        }

        return $query;
    }

    /**
     * Jenis sesi yang labelnya memuat kata pencarian, tanpa membedakan huruf besar-kecil dan spasi
     * ("tryout" sama dengan "Try Out").
     *
     * @return string[] kode jenis, urut seperti JENIS
     */
    public static function jenisDariKata(string $kata): array
    {
        $kata = str_replace(' ', '', mb_strtolower(preg_replace('/\s+/u', ' ', $kata)));

        if ($kata === '') {
            return [];
        }

        $cocok = array_filter(self::JENIS, fn ($label) => str_contains(str_replace(' ', '', mb_strtolower($label)), $kata));

        return array_keys($cocok);
    }

    // Sama dengan label card: Try Out dari try_out_id; selain itu dari mode_latihan, kosong (sesi lama) = fleksibel.
    private static function syaratJenis(Builder $q, string $kode): void
    {
        match ($kode) {
            'tryout' => $q->whereNotNull('try_out_id'),
            'fleksibel' => $q->whereNull('try_out_id')
                ->where(fn (Builder $m) => $m->where('mode_latihan', 'fleksibel')->orWhereNull('mode_latihan')),
            default => $q->whereNull('try_out_id')->where('mode_latihan', $kode),
        };
    }
}
