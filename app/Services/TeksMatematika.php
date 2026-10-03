<?php

namespace App\Services;

/**
 * Aturan tanda $ di teks soal, opsi, hint, dan pembahasan. Harus sama dengan pecahTeksMatematika() di
 * resources/js/lib/teksMatematika.ts, yang menampilkan teks yang sama ke siswa.
 *
 * - Teks di antara sepasang $ adalah rumus LaTeX yang dirender KaTeX, mis. $\frac{1}{2}$.
 * - \$ di luar rumus adalah tanda dolar biasa, mis. "harga \$5". Di dalam rumus, \$ tetap perintah LaTeX
 *   untuk tanda dolar dan tidak menutup rumus.
 * - $ tanpa pasangan dan $$ ditampilkan apa adanya; importer menolak keduanya lewat masalah().
 */
class TeksMatematika
{
    /**
     * @return array<int, array{rumus: bool, isi: string}> potongan teks berurutan; isi rumus tanpa tanda $
     */
    public static function pecah(string $teks): array
    {
        return self::pindai($teks)[0];
    }

    /** @return string[] isi setiap rumus, tanpa tanda $ */
    public static function rumus(string $teks): array
    {
        return array_values(array_column(array_filter(self::pecah($teks), fn ($b) => $b['rumus']), 'isi'));
    }

    /** Pesan untuk editor bila tanda $ tidak bisa dipasangkan, atau null bila aman. */
    public static function masalah(string $teks): ?string
    {
        return match (self::pindai($teks)[1]) {
            'kosong' => 'Ada $$ atau rumus kosong. Rumus ditulis di antara sepasang $, mis. $\frac{1}{2}$; bentuk $$...$$ belum didukung.',
            'terbuka' => 'Tanda $ tidak berpasangan. Rumus diapit sepasang $, mis. $\frac{1}{2}$. Untuk tanda dolar biasa tulis \$.',
            default => null,
        };
    }

    /**
     * Rumus yang diakhiri spasi tetapi tidak diawali spasi biasanya dua tanda dolar biasa yang terbaca sebagai rumus,
     * mis. "harga $5 dan $10" menghasilkan rumus "5 dan ".
     */
    public static function miripDolarBiasa(string $rumus): bool
    {
        return $rumus !== rtrim($rumus) && $rumus === ltrim($rumus);
    }

    /** @return array{0: array<int, array{rumus: bool, isi: string}>, 1: 'kosong'|'terbuka'|null} */
    private static function pindai(string $teks): array
    {
        // Dibaca per byte: $ dan \ adalah ASCII, jadi tidak pernah muncul di tengah karakter UTF-8 lain.
        $panjang = strlen($teks);
        $bagian = [];
        $biasa = '';
        $masalah = null;
        $i = 0;

        while ($i < $panjang) {
            if ($teks[$i] === '\\' && ($teks[$i + 1] ?? '') === '$') {
                $biasa .= '$';
                $i += 2;

                continue;
            }

            if ($teks[$i] === '$') {
                $j = $i + 1;
                $rumus = '';

                // Pasangan \x di dalam rumus dibaca utuh, jadi \$ tidak menutup rumus.
                while ($j < $panjang && $teks[$j] !== '$') {
                    $langkah = $teks[$j] === '\\' && $j + 1 < $panjang ? 2 : 1;
                    $rumus .= substr($teks, $j, $langkah);
                    $j += $langkah;
                }

                if ($j < $panjang && trim($rumus) !== '') {
                    if ($biasa !== '') {
                        $bagian[] = ['rumus' => false, 'isi' => $biasa];
                        $biasa = '';
                    }

                    $bagian[] = ['rumus' => true, 'isi' => $rumus];
                    $i = $j + 1;

                    continue;
                }

                $masalah ??= $j < $panjang ? 'kosong' : 'terbuka';
            }

            $biasa .= $teks[$i];
            $i++;
        }

        if ($biasa !== '') {
            $bagian[] = ['rumus' => false, 'isi' => $biasa];
        }

        return [$bagian, $masalah];
    }
}
