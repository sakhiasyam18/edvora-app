<?php

namespace App\Services;

use Illuminate\Support\Collection;

/**
 * Topik yang paling perlu dilatih (SDD 5.3.4, RANCANGAN-penyesuaian-sdd.md 5.4).
 * Beranda memakai 3 teratas lintas subtes; Pilih Mode dan Hasil memakai 3 teratas per subtes.
 */
class RekomendasiTopik
{
    public const JUMLAH = 3;

    /**
     * Urutan: skor sementara terendah, lalu proporsi UTBK terbesar, lalu urutan topik.
     * Topik tanpa soal, tanpa jawaban fleksibel/remedial (skor sementara null), atau sudah dikuasai dibuang.
     *
     * @param  array<int, array<string, mixed>>  $topikList  keadaan topik dari RingkasanPenguasaan
     * @return array<int, array<string, mixed>>
     */
    public static function urutkan(array $topikList): array
    {
        $calon = array_values(array_filter($topikList, fn (array $t) => $t['adaSoal']
            && $t['skorSementara'] !== null
            && $t['label'] !== 'dikuasai'));

        usort($calon, fn (array $a, array $b) => [$a['skorSementara'], -$a['proporsi'], $a['urutan']]
            <=> [$b['skorSementara'], -$b['proporsi'], $b['urutan']]);

        return $calon;
    }

    /**
     * Pilih Mode dan Hasil: 3 teratas di satu subtes.
     *
     * @param  array<int, array<string, mixed>>  $topikList  topik satu subtes dari RingkasanPenguasaan::perSubtes()
     * @return array<int, array<string, mixed>>
     */
    public static function untukSubtes(array $topikList): array
    {
        return array_slice(self::urutkan($topikList), 0, self::JUMLAH);
    }

    /**
     * Beranda: 3 teratas dari semua subtes. Setiap topik ditambah kodeSubtes.
     *
     * @param  Collection  $subtesList  subtes urut `urutan`, minimal berisi id dan kode_subtes
     * @param  array  $topikPerSubtes  hasil RingkasanPenguasaan::perSubtes()
     * @return array<int, array<string, mixed>>
     */
    public function teratas(Collection $subtesList, array $topikPerSubtes): array
    {
        $semua = [];
        foreach ($subtesList as $subtes) {
            foreach ($topikPerSubtes[$subtes->id] ?? [] as $topik) {
                $semua[] = $topik + ['kodeSubtes' => $subtes->kode_subtes];
            }
        }

        return array_slice(self::urutkan($semua), 0, self::JUMLAH);
    }
}
