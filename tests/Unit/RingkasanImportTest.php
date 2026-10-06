<?php

namespace Tests\Unit;

use App\Services\ImportSoalExcel;
use PHPUnit\Framework\TestCase;

/**
 * Laporan hasil periksa file Excel: dipakai edvora:import-soal dan modal upload di halaman Bank Soal.
 */
class RingkasanImportTest extends TestCase
{
    public function test_masalah_yang_sama_dikelompokkan_dengan_rentang_baris(): void
    {
        $masalah = ImportSoalExcel::kelompokkanMasalah([
            ['baris' => 9, 'kolom' => 'Kunci Jawaban', 'pesan' => 'Wajib diisi.'],
            ['baris' => 3, 'kolom' => 'Kunci Jawaban', 'pesan' => 'Wajib diisi.'],
            ['baris' => 4, 'kolom' => 'Kunci Jawaban', 'pesan' => 'Wajib diisi.'],
            ['baris' => 5, 'kolom' => 'Kunci Jawaban', 'pesan' => 'Wajib diisi.'],
            ['baris' => 4, 'kolom' => 'Teks Soal', 'pesan' => 'Wajib diisi.'],
            ['baris' => null, 'kolom' => null, 'pesan' => 'Rumus tidak bisa diperiksa.'],
        ]);

        $this->assertSame([
            ['baris' => '-', 'kolom' => '-', 'pesan' => 'Rumus tidak bisa diperiksa.'],
            ['baris' => '3–5, 9', 'kolom' => 'Kunci Jawaban', 'pesan' => 'Wajib diisi.'],
            ['baris' => '4', 'kolom' => 'Teks Soal', 'pesan' => 'Wajib diisi.'],
        ], $masalah);
    }

    public function test_upload_dari_bank_soal_menolak_soal_dan_topik_subtes_lain(): void
    {
        $hasil = [
            'error' => [],
            'soal' => [
                ['baris' => 2, 'kode_subtes' => 'PU', 'kode_soal' => 'PU-631'],
                ['baris' => 3, 'kode_subtes' => 'PK', 'kode_soal' => 'PK-631'],
            ],
            'topik' => [
                ['kode_subtes' => 'PU', 'nama_topik' => 'Logika'],
                ['kode_subtes' => 'PK', 'nama_topik' => 'Aljabar'],
            ],
        ];

        $dibatasi = ImportSoalExcel::batasiSubtes($hasil, 'PU');

        $this->assertSame(['PU-631'], array_column($dibatasi['soal'], 'kode_soal'));
        $this->assertSame(['Logika'], array_column($dibatasi['topik'], 'nama_topik'));
        $this->assertCount(2, $dibatasi['error']);
        $this->assertSame(3, $dibatasi['error'][0]['baris']);
        $this->assertStringContainsString('Unggah dari halaman Bank Soal PK', $dibatasi['error'][0]['pesan']);
        $this->assertNull($dibatasi['error'][1]['baris']);
        $this->assertStringContainsString('"Aljabar" milik PK', $dibatasi['error'][1]['pesan']);

        // Semua milik subtes halaman ini: tidak ada yang berubah.
        $this->assertSame($hasil['soal'][0], ImportSoalExcel::batasiSubtes(['error' => [], 'soal' => [$hasil['soal'][0]], 'topik' => []], 'PU')['soal'][0]);
    }
}
