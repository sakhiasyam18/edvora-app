<?php

namespace Tests\Unit;

use App\Services\PenilaianTryOut;
use Generator;
use PHPUnit\Framework\TestCase;

class PenilaianTryOutTest extends TestCase
{
    public function test_jawaban_dikelompokkan_per_subtes_dan_pengerjaan_subtes(): void
    {
        $baris = [
            (object) ['try_out_subtes_id' => 't1', 'pengerjaan_subtes_id' => 'ps1', 'soal_id' => 's1', 'is_correct' => true],
            (object) ['try_out_subtes_id' => 't1', 'pengerjaan_subtes_id' => 'ps1', 'soal_id' => 's2', 'is_correct' => false],
            (object) ['try_out_subtes_id' => 't2', 'pengerjaan_subtes_id' => 'ps2', 'soal_id' => 's9', 'is_correct' => true],
        ];

        $this->assertSame(
            ['t1' => ['ps1' => ['s1' => 1, 's2' => 0]], 't2' => ['ps2' => ['s9' => 1]]],
            PenilaianTryOut::kumpulkanJawaban($baris),
        );
    }

    public function test_paket_1000_peserta_muat_di_memori(): void
    {
        // Temuan review akhir: memuat 175 ribu baris jawaban sekaligus sebagai objek butuh ±118 MB dan melewati
        // memory_limit 128M, sehingga penilaian mati tanpa bisa ditangkap. Baris dibaca satu per satu (cursor), jadi
        // yang tertahan di memori hanya matriks 0/1.
        $awal = memory_get_usage();
        memory_reset_peak_usage();

        $jawaban = PenilaianTryOut::kumpulkanJawaban($this->barisBesar(1000, 7, 25));
        $puncak = memory_get_peak_usage() - $awal;

        // Assertion hanya menerima angka: PHPUnit meng-export nilai assertion, dan array sebesar ini ikut memakan memori.
        $this->assertLessThan(40 * 1024 * 1024, $puncak);
        $this->assertSame(7, count($jawaban));
        $this->assertSame(1000, count($jawaban['tos-0']));
    }

    /**
     * Baris seperti hasil query jawaban: string UUID baru berukuran pas di setiap baris, seperti yang dikembalikan
     * PDO. Bukan sprintf(), karena PHP menyisakan buffer ±256 byte di setiap string hasil sprintf.
     */
    private function barisBesar(int $peserta, int $subtes, int $soalPerSubtes): Generator
    {
        for ($p = 0; $p < $peserta; $p++) {
            for ($t = 0; $t < $subtes; $t++) {
                for ($s = 0; $s < $soalPerSubtes; $s++) {
                    yield (object) [
                        'try_out_subtes_id' => 'tos-'.$t,
                        'pengerjaan_subtes_id' => $this->uuid($p, '0000', $t),
                        'soal_id' => $this->uuid($t, '1111', $s),
                        'is_correct' => ($p + $s) % 2 === 0,
                    ];
                }
            }
        }
    }

    private function uuid(int $depan, string $tengah, int $belakang): string
    {
        return str_pad((string) $depan, 8, '0', STR_PAD_LEFT).'-'.$tengah.'-4000-8000-'.str_pad((string) $belakang, 12, '0', STR_PAD_LEFT);
    }
}
