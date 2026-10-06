<?php

namespace Tests\Unit;

use App\Services\ImportSoalExcel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use ReflectionMethod;

/**
 * Cara importer membaca satu sel Excel (ImportSoalExcel::bacaSel()). Tidak memakai database.
 */
class IsiSelExcelTest extends TestCase
{
    private function baca(string $isi): array
    {
        $sheet = (new Spreadsheet)->getActiveSheet();
        $sheet->setCellValueExplicit('A1', $isi, 's');

        $importer = (new ReflectionClass(ImportSoalExcel::class))->newInstanceWithoutConstructor();

        return (new ReflectionMethod(ImportSoalExcel::class, 'bacaSel'))->invoke($importer, $sheet, 'A1');
    }

    public function test_sel_berisi_spasi_tak_terlihat_dianggap_kosong(): void
    {
        // Non-breaking space (U+00A0) sering terbawa saat menyalin dari web/Word dan terlihat kosong di Excel.
        foreach (["\u{00A0}", " \u{00A0} ", "\u{200B}", "\u{FEFF}\u{00A0}\n"] as $isi) {
            $this->assertSame(['nilai' => null, 'masalah' => null, 'kosong' => true], $this->baca($isi), bin2hex($isi));
        }
    }

    public function test_spasi_tak_terlihat_di_tepi_dibuang_dan_di_tengah_dipertahankan(): void
    {
        $this->assertSame('PK/PK-034.png', $this->baca("\u{00A0}PK/PK-034.png\u{00A0}")['nilai']);
        $this->assertSame("Harga Rp\u{00A0}100", $this->baca(" Harga Rp\u{00A0}100\u{00A0}")['nilai']);
    }
}
