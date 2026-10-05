<?php

namespace Tests\Unit;

use App\Services\ImportSoalExcel;
use App\Services\PemeriksaLinkGambar;
use App\Services\PengunggahGambarSoal;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Tanpa database dan tanpa internet: bucket diganti Storage::fake(), gambar dibuat dengan GD.
 */
class PengunggahGambarSoalTest extends TestCase
{
    private const DASAR = 'https://contoh.supabase.co/storage/v1/object/public/gambar_soal';

    public function test_nama_file_selalu_lolos_aturan_satu_soal_satu_gambar(): void
    {
        foreach (array_keys(PengunggahGambarSoal::BAGIAN) as $bagian) {
            // Akhiran acak yang diawali angka tidak boleh terbaca sebagai lanjutan nomor soal.
            $path = PengunggahGambarSoal::path('PU', 'PU-631', $bagian, 'png', '123abc');

            $this->assertNull(ImportSoalExcel::masalahLokasiGambar(self::DASAR.'/'.$path, 'PU', 'PU-631'), $path);
            // Aturan nama file di ImportSoalExcel::periksaGambar().
            $this->assertMatchesRegularExpression('#^[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*\.(png|jpe?g|webp)$#i', $path);
        }

        $this->assertSame('PU/PU-631-123abc.png', PengunggahGambarSoal::path('PU', 'PU-631', 'soal', 'png', '123abc'));
        $this->assertSame('PK/PK-034-pembahasan-x7k2f9.webp', PengunggahGambarSoal::path('PK', 'PK-034', 'pembahasan', 'webp', 'x7k2f9'));
    }

    public function test_unggah_menyimpan_dengan_ekstensi_dari_isi_file(): void
    {
        Storage::fake('gambar_soal');
        config(['services.supabase.url_gambar_soal' => self::DASAR.'/']);

        // Isi JPEG walaupun nama file kiriman browser mungkin .png: ekstensi mengikuti isinya.
        $hasil = (new PengunggahGambarSoal)->unggah($this->gambar('jpeg'), 'PU', 'PU-631', 'A');

        $this->assertNull($hasil['masalah']);
        $this->assertMatchesRegularExpression('#^'.preg_quote(self::DASAR, '#').'/PU/PU-631-A-[a-z0-9]{6}\.jpg$#', $hasil['url']);
        Storage::disk('gambar_soal')->assertExists(substr($hasil['url'], strlen(self::DASAR) + 1));
    }

    public function test_dua_unggahan_tidak_saling_menimpa(): void
    {
        Storage::fake('gambar_soal');
        $pengunggah = new PengunggahGambarSoal;

        $satu = $pengunggah->unggah($this->gambar('png'), 'PU', 'PU-631', 'soal')['url'];
        $dua = $pengunggah->unggah($this->gambar('png'), 'PU', 'PU-631', 'soal')['url'];

        $this->assertNotSame($satu, $dua);
        $this->assertCount(2, Storage::disk('gambar_soal')->files('PU'));
    }

    public function test_isi_yang_bukan_gambar_ditolak_tanpa_menyimpan(): void
    {
        Storage::fake('gambar_soal');

        $hasil = (new PengunggahGambarSoal)->unggah('ini bukan gambar', 'PU', 'PU-631', 'soal');

        $this->assertNull($hasil['url']);
        $this->assertStringStartsWith('Bukan gambar PNG, JPG, atau WebP', $hasil['masalah']);
        $this->assertSame([], Storage::disk('gambar_soal')->allFiles());
    }

    public function test_nama_gambar_dari_excel_harus_sesuai_aturan(): void
    {
        foreach (['PU/PU-104.png', 'PU/PU-104-A.png', 'PU/PU-104-pembahasan.JPG', 'PU/PU-1040-v2.webp'] as $path) {
            $this->assertNull(PengunggahGambarSoal::masalahPathExcel($path, 'PU'), $path);
        }

        foreach (['PK/PK-104.png', 'PU/PK-104.png', 'PU/stimulus.png', 'PU/PU-10.png', 'PU/../PU-104.png', 'PU/PU-104.gif', 'PU/sub/PU-104.png'] as $path) {
            $this->assertNotNull(PengunggahGambarSoal::masalahPathExcel($path, 'PU'), $path);
        }
    }

    public function test_unggah_dengan_nama_excel_tidak_menimpa_file_lama(): void
    {
        Storage::fake('gambar_soal');
        config(['services.supabase.url_gambar_soal' => self::DASAR]);
        $pengunggah = new PengunggahGambarSoal;

        $pertama = $pengunggah->unggahDenganNama($this->gambar('png'), 'PU/PU-104-A.png');
        $kedua = $pengunggah->unggahDenganNama($this->gambar('png'), 'PU/PU-104-A.png');

        $this->assertSame(self::DASAR.'/PU/PU-104-A.png', $pertama['url']);
        $this->assertNull($kedua['url']);
        $this->assertStringContainsString('tidak ditimpa', $kedua['masalah']);
        $this->assertStringStartsWith('Bukan gambar', $pengunggah->unggahDenganNama('bukan gambar', 'PU/PU-105.png')['masalah']);
    }

    public function test_pesan_file_belum_ada_dikenali(): void
    {
        Http::fake(['*' => Http::response('', 400)]);
        $url = self::DASAR.'/PU/PU-104.png';

        $pesan = (new PemeriksaLinkGambar)->periksa([$url])[$url];

        $this->assertTrue(PemeriksaLinkGambar::belumAda($pesan));
        $this->assertFalse(PemeriksaLinkGambar::belumAda('Ukuran file 1,5 MB, maksimal 1 MB.'));
    }

    private function gambar(string $format): string
    {
        $gambar = imagecreatetruecolor(4, 3);
        ob_start();
        $format === 'jpeg' ? imagejpeg($gambar) : imagepng($gambar);

        return (string) ob_get_clean();
    }
}
