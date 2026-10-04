<?php

namespace App\Services;

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Memeriksa link gambar soal: link harus hidup dan berisi gambar yang layak ditampilkan ke siswa.
 *
 * Gambar tidak diolah atau disalin; yang disimpan ke database tetap link aslinya. Karena itu ukuran, format,
 * dan lokasi GPS hanya diperiksa di sini, dan editor yang memperbaiki file di Storage.
 */
class PemeriksaLinkGambar
{
    // Gambar diunduh setiap kali siswa membuka soal, sedangkan kuota egress Supabase terbatas.
    public const MAKS_BYTE = 1024 * 1024;

    // Batas lebar dan tinggi dalam piksel.
    public const MAKS_SISI = 4000;

    // Format yang tampil di semua browser. Kunci: konstanta IMAGETYPE_* dari getimagesize().
    public const FORMAT = [IMAGETYPE_PNG => 'PNG', IMAGETYPE_JPEG => 'JPG', IMAGETYPE_WEBP => 'WebP'];

    // Jumlah link yang diunduh bersamaan.
    private const SEKALIGUS = 10;

    /**
     * Setiap link diunduh sekali walau dipakai beberapa soal.
     *
     * @param  string[]  $urls
     * @return array<string, string|null> url => pesan masalah, atau null bila lolos
     */
    public function periksa(array $urls): array
    {
        $hasil = [];

        foreach (array_chunk(array_values(array_unique($urls)), self::SEKALIGUS) as $bagian) {
            $respons = Http::pool(fn (Pool $pool) => array_map(
                fn (string $url) => $pool->as($url)->connectTimeout(10)->timeout(30)->get($url),
                $bagian
            ));

            foreach ($bagian as $url) {
                $hasil[$url] = $this->nilaiRespons($respons[$url] ?? null);
            }
        }

        return $hasil;
    }

    /**
     * Isi file layak ditampilkan sebagai gambar soal? Mengembalikan pesan masalah, atau null bila lolos.
     */
    public static function periksaIsi(string $isi): ?string
    {
        if (strlen($isi) > self::MAKS_BYTE) {
            return 'Ukuran file '.self::mb(strlen($isi)).' MB, maksimal '.self::mb(self::MAKS_BYTE).' MB. Kecilkan dulu, mis. dengan squoosh.app.';
        }

        $info = $isi === '' ? false : @getimagesizefromstring($isi);

        if ($info === false || ! isset(self::FORMAT[$info[2]])) {
            return 'Bukan gambar PNG, JPG, atau WebP. Simpan ulang gambarnya dalam salah satu format itu.';
        }

        if ($info[0] > self::MAKS_SISI || $info[1] > self::MAKS_SISI) {
            return "Ukuran gambar {$info[0]}×{$info[1]} px, maksimal ".self::MAKS_SISI.' px per sisi.';
        }

        if ($info[2] === IMAGETYPE_JPEG && self::adaLokasiGps($isi)) {
            return 'Foto masih menyimpan lokasi GPS. Hapus lokasinya, lalu unggah ulang dengan nama baru.';
        }

        return null;
    }

    /**
     * Apakah JPEG menyimpan lintang atau bujur GPS di EXIF-nya.
     * Dibaca manual karena ekstensi exif PHP tidak aktif di semua mesin tim.
     */
    public static function adaLokasiGps(string $jpeg): bool
    {
        $tiff = self::ambilExif($jpeg);

        if ($tiff === null || strlen($tiff) < 8) {
            return false;
        }

        $kecil = substr($tiff, 0, 2) === 'II';
        $u16 = fn (int $o) => $o >= 0 && $o + 2 <= strlen($tiff) ? unpack($kecil ? 'v' : 'n', $tiff, $o)[1] : null;
        $u32 = fn (int $o) => $o >= 0 && $o + 4 <= strlen($tiff) ? unpack($kecil ? 'V' : 'N', $tiff, $o)[1] : null;

        // Nilai tag di satu IFD, atau null bila tag tidak ada.
        $nilaiTag = function (?int $ifd, int $tag) use ($u16, $u32): ?int {
            $jumlah = $ifd === null ? null : $u16($ifd);

            for ($i = 0; $i < ($jumlah ?? 0); $i++) {
                if ($u16($ifd + 2 + 12 * $i) === $tag) {
                    return $u32($ifd + 2 + 12 * $i + 8) ?? 0;
                }
            }

            return null;
        };

        // 0x8825 = penunjuk ke IFD GPS; 0x0002 = lintang, 0x0004 = bujur.
        $gps = $nilaiTag($u32(4), 0x8825);

        return $gps !== null && ($nilaiTag($gps, 0x0002) !== null || $nilaiTag($gps, 0x0004) !== null);
    }

    private function nilaiRespons(mixed $respons): ?string
    {
        if (! $respons instanceof Response) {
            // Umum di PHP XAMPP (Windows): daftar sertifikat belum diatur, jadi semua link HTTPS ditolak, bukan hanya satu.
            if ($respons instanceof Throwable && str_contains($respons->getMessage(), 'cURL error 60')) {
                return 'PHP tidak bisa memverifikasi sertifikat HTTPS (cURL error 60). Isi curl.cainfo dan openssl.cafile di php.ini.';
            }

            return 'Link tidak bisa dibuka (koneksi gagal atau terlalu lama). Coba lagi, atau periksa link-nya.';
        }

        if (! $respons->successful()) {
            return "File tidak ditemukan di Storage (HTTP {$respons->status()}). Pastikan sudah diunggah, dan nama folder/file di link sama persis, termasuk huruf besar/kecil.";
        }

        return self::periksaIsi($respons->body());
    }

    // Isi segmen APP1 "Exif" (data TIFF), atau null bila JPEG tidak punya EXIF.
    private static function ambilExif(string $jpeg): ?string
    {
        $panjang = strlen($jpeg);

        if ($panjang < 4 || substr($jpeg, 0, 2) !== "\xFF\xD8") {
            return null;
        }

        $posisi = 2;

        while ($posisi + 4 <= $panjang && $jpeg[$posisi] === "\xFF") {
            $penanda = ord($jpeg[$posisi + 1]);

            // 0xFF = byte pengisi; 0xDA = awal data gambar dan 0xD9 = akhir file, tidak ada metadata lagi sesudahnya.
            if ($penanda === 0xFF) {
                $posisi++;

                continue;
            }

            if ($penanda === 0xDA || $penanda === 0xD9) {
                break;
            }

            $ukuran = unpack('n', $jpeg, $posisi + 2)[1];

            if ($penanda === 0xE1 && substr($jpeg, $posisi + 4, 6) === "Exif\0\0") {
                return substr($jpeg, $posisi + 10, $ukuran - 8);
            }

            $posisi += 2 + $ukuran;
        }

        return null;
    }

    // 1572864 => "1,5"; 1048576 => "1"
    private static function mb(int $byte): string
    {
        $teks = number_format($byte / 1048576, 1, ',', '.');

        return str_ends_with($teks, ',0') ? substr($teks, 0, -2) : $teks;
    }
}
