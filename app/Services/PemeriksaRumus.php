<?php

namespace App\Services;

use Illuminate\Support\Facades\Process;
use RuntimeException;

/**
 * Memeriksa rumus LaTeX dengan KaTeX versi frontend, lewat scripts/periksa-rumus.cjs (butuh Node.js dan npm install).
 *
 * Importer hanya bisa menghitung tanda $. Rumus yang salah ketik, mis. $\frac{1}{2$, tetap berpasangan tetapi gagal
 * dirender, lalu tampil mentah di layar siswa. Semua rumus diperiksa dalam satu proses Node per import.
 */
class PemeriksaRumus
{
    /**
     * @param  string[]  $rumus  isi rumus tanpa tanda $
     * @return array<string, string|null> rumus => pesan error KaTeX, atau null bila bisa ditampilkan
     *
     * @throws RuntimeException bila Node.js atau KaTeX tidak bisa dijalankan
     */
    public function periksa(array $rumus): array
    {
        // Rumus seperti "16" bisa berubah jadi kunci array int, jadi dipaksa string sebelum dikirim.
        $rumus = array_values(array_unique(array_map('strval', $rumus)));

        if (! $rumus) {
            return [];
        }

        $proses = Process::input(json_encode($rumus, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE))
            ->timeout(120)
            ->run(['node', base_path('scripts/periksa-rumus.cjs')]);

        if ($proses->failed()) {
            throw new RuntimeException(trim($proses->errorOutput()) ?: 'proses Node berhenti dengan kode '.$proses->exitCode().'.');
        }

        $pesan = json_decode($proses->output(), true);

        if (! is_array($pesan) || count($pesan) !== count($rumus)) {
            throw new RuntimeException('keluaran pemeriksa rumus tidak terbaca.');
        }

        return array_combine($rumus, $pesan);
    }
}
