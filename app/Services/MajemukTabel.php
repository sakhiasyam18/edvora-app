<?php

namespace App\Services;

/**
 * Soal majemuk_tabel: setiap opsi adalah satu pernyataan (baris tabel), dan siswa memilih satu kolom per baris,
 * mis. Benar / Salah / Tidak Bisa Ditentukan. Kunci per pernyataan disimpan sebagai nomor kolom (mulai 1)
 * di opsi_jawaban.kunci_kolom. Penilaiannya semua-atau-nol, sama dengan benar_salah.
 *
 * Aturan penilaian di frontend (Pages/Latihan/Ujian.tsx) harus sama dengan benar().
 */
class MajemukTabel
{
    // Kolom Tabel yang dikosongkan di Excel.
    public const KOLOM_BAWAAN = ['Benar', 'Salah'];

    public const MAKS_KOLOM = 4;

    /** Judul kolom dari sel Kolom Tabel, dipisah "|". */
    public static function kolom(?string $teks): array
    {
        return $teks === null ? self::KOLOM_BAWAAN : array_map('trim', explode('|', $teks));
    }

    public static function masalahKolom(array $kolom): ?string
    {
        if (count($kolom) < 2 || count($kolom) > self::MAKS_KOLOM) {
            return 'Kolom Tabel harus berisi 2–'.self::MAKS_KOLOM.' judul kolom dipisah |, mis. Benar|Salah|Tidak Bisa Ditentukan.';
        }

        if (in_array('', $kolom, true)) {
            return 'Ada judul kolom kosong di antara tanda |.';
        }

        if (count(array_unique(array_map('mb_strtolower', $kolom))) !== count($kolom)) {
            return 'Ada judul kolom yang sama.';
        }

        return null;
    }

    /**
     * Kunci per pernyataan, berurutan, dipisah koma: huruf awal judul kolom ("T,B,T,S") atau nomor kolom ("3,1,3,2").
     * Huruf hanya bisa dipakai bila huruf awal semua judul kolom berbeda.
     *
     * @return array{0: int[]|null, 1: string|null} [nomor kolom per pernyataan, pesan masalah]
     */
    public static function kunci(string $kunci, array $kolom): array
    {
        $huruf = array_map(fn ($k) => mb_strtoupper(mb_substr($k, 0, 1)), $kolom);
        $hurufUnik = count(array_unique($huruf)) === count($huruf);
        $nomor = [];

        foreach (array_map('trim', explode(',', $kunci)) as $nilai) {
            if (ctype_digit($nilai) && (int) $nilai >= 1 && (int) $nilai <= count($kolom)) {
                $nomor[] = (int) $nilai;

                continue;
            }

            $indeks = mb_strlen($nilai) === 1 ? array_search(mb_strtoupper($nilai), $huruf, true) : false;

            if ($indeks !== false && $hurufUnik) {
                $nomor[] = $indeks + 1;

                continue;
            }

            if ($indeks !== false) {
                return [null, 'Huruf awal judul kolom ada yang sama ('.implode(', ', $kolom).'), jadi tulis kunci dengan nomor kolom, mis. 1,2,1.'];
            }

            return [null, "\"{$nilai}\" tidak cocok dengan kolom mana pun. Pilihan: ".self::pilihanKunci($kolom, $huruf, $hurufUnik).'.'];
        }

        return [$nomor, null];
    }

    /**
     * Semua-atau-nol: setiap pernyataan harus dijawab dengan kolom kuncinya.
     *
     * @param  array<string, int|null>  $kunci  id opsi => nomor kolom kunci
     * @param  array<string, int>  $pilihan  id opsi => nomor kolom pilihan siswa
     */
    public static function benar(array $kunci, array $pilihan): bool
    {
        if ($kunci === []) {
            return false;
        }

        foreach ($kunci as $id => $nomor) {
            if ($nomor === null || (int) ($pilihan[$id] ?? 0) !== (int) $nomor) {
                return false;
            }
        }

        return true;
    }

    private static function pilihanKunci(array $kolom, array $huruf, bool $hurufUnik): string
    {
        $nomor = 'nomor 1–'.count($kolom);

        if (! $hurufUnik) {
            return $nomor;
        }

        return implode(', ', array_map(fn ($h, $k) => "{$h} ({$k})", $huruf, $kolom)).", atau {$nomor}";
    }
}
