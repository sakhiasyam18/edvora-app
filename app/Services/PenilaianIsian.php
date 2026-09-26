<?php

namespace App\Services;

/**
 * Penilaian soal isian_singkat. Jawaban dibatasi satu kata atau bilangan bulat.
 *
 * Aturan normalisasi dijalankan simetris pada kunci dan jawaban siswa:
 * semua jenis spasi (termasuk non-breaking space) dirapikan, tepi dipangkas,
 * huruf dikecilkan. Salah ketik tidak ditoleransi ("Ben ar", "Benir" tetap salah).
 */
class PenilaianIsian
{
    private const POLA_BILANGAN_BULAT = '/^-?\d+$/';

    public static function normalisasi(string $teks): string
    {
        // trim() bawaan PHP tidak menghapus non-breaking space (U+00A0) dari hasil salin-tempel.
        $teks = preg_replace('/[\p{Z}\s]+/u', ' ', $teks);

        return mb_strtolower(trim($teks), 'UTF-8');
    }

    /**
     * Cocokkan jawaban siswa dengan kunci. Alternatif kunci dipisah "|" (keputusan K2),
     * contoh "delapan|8".
     */
    public static function cocok(string $jawaban, string $kunci): bool
    {
        $jawaban = self::normalisasi($jawaban);
        if ($jawaban === '') {
            return false;
        }

        foreach (explode('|', $kunci) as $alternatif) {
            $alternatif = self::normalisasi($alternatif);
            if ($alternatif === '') {
                continue;
            }

            if ($alternatif === $jawaban) {
                return true;
            }

            // Perbandingan angka ketat: "07" sama dengan "7", tapi "7.0" dan "1e3" tidak dianggap bilangan bulat.
            if (preg_match(self::POLA_BILANGAN_BULAT, $alternatif) && preg_match(self::POLA_BILANGAN_BULAT, $jawaban)
                && (int) $alternatif === (int) $jawaban) {
                return true;
            }
        }

        return false;
    }
}
