<?php

namespace Tests\Unit;

use App\Services\PemeriksaRumus;
use Illuminate\Support\Facades\Process;
use RuntimeException;
use Tests\TestCase;

/**
 * Menjalankan Node sungguhan dengan KaTeX dari node_modules; dilewati bila Node atau KaTeX tidak tersedia.
 */
class PemeriksaRumusTest extends TestCase
{
    public function test_rumus_yang_tidak_bisa_dirender_katex_dilaporkan(): void
    {
        if (! is_file(base_path('node_modules/katex/package.json')) || Process::run(['node', '--version'])->failed()) {
            $this->markTestSkipped('Node.js atau KaTeX belum terpasang.');
        }

        $hasil = (new PemeriksaRumus)->periksa(['\frac{1}{2}', '\frac{1}{2', '\fracc{1}{2}', '16', '\$5 + \$3', '\frac{1}{2}']);

        $this->assertSame(['\frac{1}{2}', '\frac{1}{2', '\fracc{1}{2}', '16', '\$5 + \$3'], array_map('strval', array_keys($hasil)));
        $this->assertNull($hasil['\frac{1}{2}']);
        $this->assertStringContainsString("expected '}'", $hasil['\frac{1}{2']);
        $this->assertStringContainsString('Undefined control sequence', $hasil['\fracc{1}{2}']);
        $this->assertNull($hasil['16']);
        $this->assertNull($hasil['\$5 + \$3']);
    }

    public function test_tetap_jalan_tanpa_systemroot_seperti_di_php_artisan_serve(): void
    {
        if (PHP_OS_FAMILY !== 'Windows' || ! is_file(base_path('node_modules/katex/package.json')) || Process::run(['node', '--version'])->failed()) {
            $this->markTestSkipped('Hanya relevan di Windows dengan Node.js dan KaTeX terpasang.');
        }

        // php artisan serve membuang SystemRoot; tanpa itu Node di Windows crash (ncrypto::CSPRNG).
        $asli = getenv('SystemRoot');
        putenv('SystemRoot');

        try {
            $this->assertSame(['x^2' => null], (new PemeriksaRumus)->periksa(['x^2']));
        } finally {
            putenv("SystemRoot={$asli}");
        }
    }

    public function test_node_yang_gagal_dijalankan_dilaporkan_sebagai_exception(): void
    {
        Process::fake(['*' => Process::result(errorOutput: "'node' is not recognized", exitCode: 1)]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("'node' is not recognized");

        (new PemeriksaRumus)->periksa(['x^2']);
    }
}
