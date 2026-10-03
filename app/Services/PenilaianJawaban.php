<?php

namespace App\Services;

/**
 * Menilai satu jawaban siswa (RANCANGAN-tryout.md 5.8). Dipakai latihan (LatihanSoalController::simpanJawaban)
 * dan Try Out (SelesaikanTryOut) supaya aturannya sama. Fungsi murni, tanpa database.
 */
class PenilaianJawaban
{
    /**
     * @param  array<int, string>  $idOpsiSoal  semua opsi milik soal
     * @param  array<int, string>  $idOpsiKunci  opsi yang is_kunci
     * @param  array<int, string|int>  $opsiIds  opsi yang dikirim siswa
     * @return array{opsiIds: string[], jawabanIsian: ?string, benar: bool}|null null = jawaban kosong, tidak dicatat
     */
    public static function nilai(string $tipe, array $idOpsiSoal, array $idOpsiKunci, ?string $kunciIsian, array $opsiIds, ?string $jawabanIsian): ?array
    {
        if ($tipe === 'isian_singkat') {
            $teks = self::rapikanIsian($jawabanIsian);

            // Jawaban kosong tidak dicatat, sama seperti soal ber-opsi yang dilewati.
            if (PenilaianIsian::normalisasi($teks) === '') {
                return null;
            }

            return ['opsiIds' => [], 'jawabanIsian' => $teks, 'benar' => PenilaianIsian::cocok($teks, $kunciIsian ?? '')];
        }

        // Kolom array tidak punya FK, jadi hanya terima opsi yang memang milik soal ini.
        $dipilih = array_values(array_unique(array_intersect(array_map('strval', $opsiIds), $idOpsiSoal)));

        if ($dipilih === []) {
            return null;
        }

        $kunci = array_values($idOpsiKunci);
        sort($dipilih);
        sort($kunci);

        // Semua-atau-nol; pilihan ganda = himpunan beranggota satu.
        // $kunci !== [] mencegah soal tanpa kunci terbaca benar.
        return ['opsiIds' => $dipilih, 'jawabanIsian' => null, 'benar' => $kunci !== [] && $dipilih === $kunci];
    }

    // Pangkas tepi termasuk non-breaking space; huruf besar-kecil disimpan apa adanya.
    public static function rapikanIsian(?string $teks): string
    {
        return preg_replace('/^[\p{Z}\s]+|[\p{Z}\s]+$/u', '', (string) $teks);
    }
}
