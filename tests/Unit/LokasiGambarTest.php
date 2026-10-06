<?php

namespace Tests\Unit;

use App\Services\ImportSoalExcel;
use PHPUnit\Framework\TestCase;

/**
 * Aturan "satu file gambar untuk satu soal": folder = kode subtes, nama diawali kode soal.
 */
class LokasiGambarTest extends TestCase
{
    private const DASAR = 'https://contoh.supabase.co/storage/v1/object/public/gambar_soal/';

    private function masalah(string $path, ?string $kodeSubtes = 'PK', ?string $kodeSoal = 'PK-034'): ?string
    {
        return ImportSoalExcel::masalahLokasiGambar(self::DASAR.$path, $kodeSubtes, $kodeSoal);
    }

    public function test_gambar_soal_opsi_dan_versi_baru_diterima(): void
    {
        foreach (['PK/PK-034.png', 'PK/PK-034-A.png', 'PK/PK-034-pembahasan.png', 'PK/PK-034-v2.jpg', 'PK/pk-034.png'] as $path) {
            $this->assertNull($this->masalah($path), $path);
        }
    }

    public function test_folder_harus_sama_dengan_kode_subtes(): void
    {
        $this->assertStringContainsString('harus ada di folder PK: tulis PK/PK-034.png', $this->masalah('PU/PK-034.png'));
        $this->assertStringContainsString('harus ada di folder PK', $this->masalah('PK-034.png'));
        $this->assertStringContainsString('harus ada di folder PK', $this->masalah('PK/lama/PK-034.png'));
        // Folder di Storage membedakan huruf besar/kecil.
        $this->assertStringContainsString('harus ada di folder PK', $this->masalah('pk/PK-034.png'));
    }

    public function test_nama_harus_diawali_kode_soal_barisnya(): void
    {
        $this->assertStringContainsString('"PK-043.png" tidak diawali PK-034', $this->masalah('PK/PK-043.png'));
        $this->assertStringContainsString('tidak diawali PK-034', $this->masalah('PK/PK-0340.png'));
        // Gambar bersama tidak lagi dikecualikan.
        $this->assertStringContainsString('tidak diawali PK-034', $this->masalah('PK/stimulus-denah-rumah.png'));
    }

    public function test_tidak_diperiksa_bila_subtes_atau_kode_belum_valid(): void
    {
        $this->assertNull($this->masalah('PU/PK-043.png', null, null));
        $this->assertNull($this->masalah('PK/PK-043.png', 'PK', null));
    }
}
