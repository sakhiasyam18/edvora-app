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

    // ('PU', 'PU-631', 'A', 'png', 'x7k2f9') => "PU/PU-631-A-x7k2f9.png"
    public static function path(string $kodeSubtes, string $kodeSoal, string $bagian, string $ekstensi, string $acak): string
    {
        return "{$kodeSubtes}/{$kodeSoal}".self::BAGIAN[$bagian]."-{$acak}.{$ekstensi}";
    }
}
