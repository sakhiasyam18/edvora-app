<?php

namespace Tests\Unit;

use App\Services\PemeriksaLinkGambar;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Tanpa database dan tanpa internet: gambar dibuat dengan GD, dan unduhan link dipalsukan dengan Http::fake().
 */
class PemeriksaLinkGambarTest extends TestCase
{
    public function test_png_jpg_webp_berukuran_wajar_lolos(): void
    {
        foreach (['png', 'jpeg', 'webp'] as $format) {
            $this->assertNull(PemeriksaLinkGambar::periksaIsi($this->gambar($format)), $format);
        }
    }

    public function test_selain_png_jpg_webp_ditolak(): void
    {
        foreach ([$this->gambar('gif'), 'ini bukan gambar', ''] as $isi) {
            $this->assertStringStartsWith('Bukan gambar PNG, JPG, atau WebP', PemeriksaLinkGambar::periksaIsi($isi));
        }
    }

    public function test_file_lebih_dari_batas_ukuran_ditolak(): void
    {
        $pesan = PemeriksaLinkGambar::periksaIsi(str_repeat("\0", PemeriksaLinkGambar::MAKS_BYTE + 1));

        $this->assertStringContainsString('maksimal 1 MB', $pesan);
    }

    public function test_sisi_lebih_dari_batas_piksel_ditolak(): void
    {
        $pesan = PemeriksaLinkGambar::periksaIsi($this->gambar('png', PemeriksaLinkGambar::MAKS_SISI + 1, 2));

        $this->assertStringContainsString('4001×2 px', $pesan);
    }

    public function test_foto_dengan_lokasi_gps_ditolak(): void
    {
        $foto = $this->jpegDenganExif([0x0000, 0x0001, 0x0002, 0x0003, 0x0004]);

        $this->assertTrue(PemeriksaLinkGambar::adaLokasiGps($foto));
        $this->assertStringStartsWith('Foto masih menyimpan lokasi GPS', PemeriksaLinkGambar::periksaIsi($foto));
    }

    public function test_exif_tanpa_koordinat_tidak_dianggap_lokasi(): void
    {
        // Sebagian HP tetap menulis IFD GPS berisi versi saja saat lokasi dimatikan.
        $this->assertFalse(PemeriksaLinkGambar::adaLokasiGps($this->jpegDenganExif([0x0000])));
        $this->assertFalse(PemeriksaLinkGambar::adaLokasiGps($this->gambar('jpeg')));
        $this->assertNull(PemeriksaLinkGambar::periksaIsi($this->jpegDenganExif([0x0000])));
    }

    public function test_setiap_link_diunduh_sekali_lalu_dinilai(): void
    {
        $dasar = 'https://contoh.test/storage/v1/object/public/gambar-soal/PK';

        Http::fake([
            "{$dasar}/PK-001.png" => Http::response($this->gambar('png')),
            "{$dasar}/PK-002.png" => Http::response('{"error":"not_found"}', 400),
            "{$dasar}/PK-003.png" => Http::failedConnection(),
            "{$dasar}/PK-004.png" => Http::response('<html>bukan gambar</html>'),
        ]);

        $hasil = (new PemeriksaLinkGambar)->periksa([
            "{$dasar}/PK-001.png", "{$dasar}/PK-002.png", "{$dasar}/PK-001.png", "{$dasar}/PK-003.png", "{$dasar}/PK-004.png",
        ]);

        $this->assertSame(["{$dasar}/PK-001.png", "{$dasar}/PK-002.png", "{$dasar}/PK-003.png", "{$dasar}/PK-004.png"], array_keys($hasil));
        $this->assertNull($hasil["{$dasar}/PK-001.png"]);
        $this->assertStringStartsWith('File tidak ditemukan di Storage (HTTP 400)', $hasil["{$dasar}/PK-002.png"]);
        $this->assertStringStartsWith('Link tidak bisa dibuka', $hasil["{$dasar}/PK-003.png"]);
        $this->assertStringStartsWith('Bukan gambar', $hasil["{$dasar}/PK-004.png"]);
        // PK-001 dipakai dua kali tetapi hanya diunduh sekali.
        $this->assertCount(1, Http::recorded(fn ($request) => $request->url() === "{$dasar}/PK-001.png"));
    }

    public function test_sertifikat_https_yang_tidak_terverifikasi_diberi_pesan_khusus(): void
    {
        $url = 'https://contoh.test/storage/v1/object/public/gambar-soal/PK/PK-001.png';
        Http::fake([$url => Http::failedConnection('cURL error 60: SSL certificate problem: unable to get local issuer certificate')]);

        $this->assertStringStartsWith('PHP tidak bisa memverifikasi sertifikat HTTPS', (new PemeriksaLinkGambar)->periksa([$url])[$url]);
    }

    private function gambar(string $format, int $lebar = 40, int $tinggi = 30): string
    {
        $gambar = imagecreatetruecolor($lebar, $tinggi);
        imagefill($gambar, 0, 0, imagecolorallocate($gambar, 40, 80, 220));

        ob_start();
        ['png' => 'imagepng', 'jpeg' => 'imagejpeg', 'webp' => 'imagewebp', 'gif' => 'imagegif'][$format]($gambar);

        return ob_get_clean();
    }

    /**
     * JPEG dengan EXIF berisi penunjuk IFD GPS, dan IFD GPS berisi tag-tag $tagGps.
     * Tag 0x0002 = lintang dan 0x0004 = bujur; 0x0000 = versi GPS.
     */
    private function jpegDenganExif(array $tagGps): string
    {
        // Header TIFF little-endian; IFD0 di offset 8 dengan satu entri: penunjuk ke IFD GPS di offset 26.
        $tiff = 'II'.pack('v', 42).pack('V', 8)
            .pack('v', 1).pack('vvVV', 0x8825, 4, 1, 26).pack('V', 0)
            .pack('v', count($tagGps));

        foreach ($tagGps as $tag) {
            $tiff .= pack('vvVV', $tag, 1, 4, 0);
        }

        $tiff .= pack('V', 0);
        $app1 = "\xFF\xE1".pack('n', 8 + strlen($tiff))."Exif\0\0".$tiff;
        $jpeg = $this->gambar('jpeg');

        return substr($jpeg, 0, 2).$app1.substr($jpeg, 2);
    }
}
