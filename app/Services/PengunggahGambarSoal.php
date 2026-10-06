<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Unggah gambar dari formulir soal editor ke bucket gambar soal (disk gambar_soal, protokol S3 Supabase).
 *
 * Nama file dibuat server dari kode soal, jadi selalu memenuhi aturan "1 soal 1 gambar"
 * (ImportSoalExcel::masalahLokasiGambar()). Isinya diperiksa dengan aturan yang sama dengan link gambar di Excel
 * (PemeriksaLinkGambar::periksaIsi()). Setiap unggahan mendapat nama baru, jadi file tidak pernah ditimpa: gambar
 * pengganti tidak tertahan cache, dan file yang tidak dipakai lagi tertinggal di bucket.
 */
class PengunggahGambarSoal
{
    // Bagian soal => penanda di nama file. Gambar soal tanpa penanda: PU/PU-631-x7k2f9.png.
    public const BAGIAN = ['soal' => '', 'A' => '-A', 'B' => '-B', 'C' => '-C', 'D' => '-D', 'E' => '-E', 'pembahasan' => '-pembahasan'];

    private const EKSTENSI = [IMAGETYPE_PNG => 'png', IMAGETYPE_JPEG => 'jpg', IMAGETYPE_WEBP => 'webp'];

    /**
     * @return array{url: string|null, masalah: string|null} link publik gambar, atau pesan bila isi file ditolak
     */
    public function unggah(string $isi, string $kodeSubtes, string $kodeSoal, string $bagian): array
    {
        if ($masalah = PemeriksaLinkGambar::periksaIsi($isi)) {
            return ['url' => null, 'masalah' => $masalah];
        }

        // Ekstensi dari isi file, bukan dari nama file kiriman browser.
        $tipe = getimagesizefromstring($isi)[2];
        $path = self::path($kodeSubtes, $kodeSoal, $bagian, self::EKSTENSI[$tipe], Str::lower(Str::random(6)));

        // Nama tidak pernah dipakai ulang, jadi aman di-cache lama; menghemat kuota egress Supabase.
        Storage::disk('gambar_soal')->put($path, $isi, [
            'ContentType' => image_type_to_mime_type($tipe),
            'CacheControl' => 'public, max-age=31536000, immutable',
        ]);

        return ['url' => rtrim((string) config('services.supabase.url_gambar_soal'), '/').'/'.$path, 'masalah' => null];
    }

    /**
     * Unggah gambar dengan nama yang sudah ditulis di Excel (mis. PU/PU-104-A.png), untuk gambar yang belum ada di
     * bucket. File yang sudah ada tidak ditimpa: versi baru harus memakai nama baru (PU-104-A-v2.png).
     *
     * @return array{url: string|null, masalah: string|null}
     */
    public function unggahDenganNama(string $isi, string $path): array
    {
        if ($masalah = PemeriksaLinkGambar::periksaIsi($isi)) {
            return ['url' => null, 'masalah' => $masalah];
        }

        $disk = Storage::disk('gambar_soal');

        if ($disk->exists($path)) {
            return ['url' => null, 'masalah' => 'Sudah ada di Storage dan tidak ditimpa. Untuk versi baru, pakai nama baru (mis. -v2) di Excel.'];
        }

        $disk->put($path, $isi, [
            'ContentType' => image_type_to_mime_type(getimagesizefromstring($isi)[2]),
            'CacheControl' => 'public, max-age=31536000, immutable',
        ]);

        return ['url' => rtrim((string) config('services.supabase.url_gambar_soal'), '/').'/'.$path, 'masalah' => null];
    }

    /**
     * Masalah nama gambar dari Excel yang akan diunggah lewat modal upload, atau null bila sesuai aturan
     * 1 soal 1 gambar: <kode subtes>/<kode soal>[akhiran].png|jpg|jpeg|webp.
     */
    public static function masalahPathExcel(string $path, string $kodeSubtes): ?string
    {
        $kode = preg_quote($kodeSubtes, '#');

        if (! preg_match("#^{$kode}/{$kode}-\\d{3,}(?!\\d)[A-Za-z0-9_-]*\\.(png|jpe?g|webp)$#i", $path)) {
            return "Nama \"{$path}\" tidak sesuai aturan: {$kodeSubtes}/<kode soal>.png, mis. {$kodeSubtes}/{$kodeSubtes}-104-A.png.";
        }

        return null;
    }

    // ('PU', 'PU-631', 'A', 'png', 'x7k2f9') => "PU/PU-631-A-x7k2f9.png"
    public static function path(string $kodeSubtes, string $kodeSoal, string $bagian, string $ekstensi, string $acak): string
    {
        return "{$kodeSubtes}/{$kodeSoal}".self::BAGIAN[$bagian]."-{$acak}.{$ekstensi}";
    }
}
