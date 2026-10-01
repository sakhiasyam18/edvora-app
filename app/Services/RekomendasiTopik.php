<?php

namespace App\Services;

use Illuminate\Support\Collection;

/**
 * Topik yang paling perlu dilatih dari semua subtes. Dipakai card Direkomendasikan di Beranda
 * dan label "Direkomendasikan" di halaman Pilih Mode, supaya keduanya selalu sama.
 */
class RekomendasiTopik
{
    public const JUMLAH = 3;

    /**
     * Urutan mengikuti Penguasaan::urutkanRekomendasi(): prioritas dulu, lalu tahap terendah, lalu skor terendah.
     * Kosong bila siswa belum pernah menyelesaikan latihan fleksibel, karena belum ada dasar rekomendasi.
     *
     * @param  Collection  $subtesList  subtes urut `urutan`, minimal berisi id dan kode_subtes
     * @param  array  $topikPerSubtes  hasil RingkasanPenguasaan::perSubtes()
     * @return array<int, array<string, mixed>> keadaan topik (lihat RingkasanPenguasaan) + kodeSubtes
     */
    public function teratas(Collection $subtesList, array $topikPerSubtes): array
    {
        $semua = [];
        foreach ($subtesList as $subtes) {
            foreach ($topikPerSubtes[$subtes->id] ?? [] as $topik) {
                if ($topik['adaSoal']) {
                    $semua[] = $topik + ['kodeSubtes' => $subtes->kode_subtes];
                }
            }
        }

        if (! collect($semua)->contains(fn (array $topik) => $topik['nJendela'] > 0)) {
            return [];
        }

        return array_slice(Penguasaan::urutkanRekomendasi($semua), 0, self::JUMLAH);
    }
}
