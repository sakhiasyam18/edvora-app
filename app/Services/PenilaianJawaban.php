<?php

namespace App\Services;

/**
 * Menilai satu jawaban siswa (RANCANGAN-tryout.md 5.8). Dipakai latihan (LatihanSoalController, SesiFleksibel)
 * dan Try Out (SelesaikanTryOut) supaya aturannya sama. Fungsi murni, tanpa database.
 */
class PenilaianJawaban
{
    /**
     * @param  array<int, string>  $idOpsiSoal  semua opsi milik soal
     * @param  array<int, string>  $idOpsiKunci  opsi yang is_kunci
     * @param  array<int, string|int>  $opsiIds  opsi yang dikirim siswa
     * @param  array<string, int|null>  $kunciKolom  majemuk_tabel: id opsi => nomor kolom kunci (opsi_jawaban.kunci_kolom)
     * @param  array<string, int|string>  $pilihanKolom  majemuk_tabel: id opsi => nomor kolom yang dipilih siswa
     * @return array{opsiIds: string[], jawabanIsian: ?string, pilihanKolom: ?array<string, int>, benar: bool}|null null = jawaban kosong, tidak dicatat
     */
    public static function nilai(
        string $tipe,
        array $idOpsiSoal,
        array $idOpsiKunci,
        ?string $kunciIsian,
        array $opsiIds,
        ?string $jawabanIsian,
        array $kunciKolom = [],
        array $pilihanKolom = [],
    ): ?array {
        if ($tipe === 'isian_singkat') {
            $teks = self::rapikanIsian($jawabanIsian);

            // Jawaban kosong tidak dicatat, sama seperti soal ber-opsi yang dilewati.
            if (PenilaianIsian::normalisasi($teks) === '') {
                return null;
            }

            return ['opsiIds' => [], 'jawabanIsian' => $teks, 'pilihanKolom' => null, 'benar' => PenilaianIsian::cocok($teks, $kunciIsian ?? '')];
        }

        if ($tipe === 'majemuk_tabel') {
            // Kolom jsonb tidak punya FK, jadi hanya terima pilihan untuk pernyataan milik soal ini.
            $pilihan = array_map('intval', array_intersect_key($pilihanKolom, $kunciKolom));

            // Tanpa pilihan sama sekali berarti soal dilewati. Baris yang tidak dipilih dihitung salah.
            if ($pilihan === []) {
                return null;
            }

            return ['opsiIds' => [], 'jawabanIsian' => null, 'pilihanKolom' => $pilihan, 'benar' => MajemukTabel::benar($kunciKolom, $pilihan)];
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
        return ['opsiIds' => $dipilih, 'jawabanIsian' => null, 'pilihanKolom' => null, 'benar' => $kunci !== [] && $dipilih === $kunci];
    }

    // Pangkas tepi termasuk non-breaking space; huruf besar-kecil disimpan apa adanya.
    public static function rapikanIsian(?string $teks): string
    {
        return preg_replace('/^[\p{Z}\s]+|[\p{Z}\s]+$/u', '', (string) $teks);
    }
}
