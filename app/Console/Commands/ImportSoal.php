<?php

namespace App\Console\Commands;

use App\Services\ImportSoalExcel;
use App\Services\Penguasaan;
use App\Services\PratinjauSoal;
use Illuminate\Console\Command;
use Throwable;

class ImportSoal extends Command
{
    protected $signature = 'edvora:import-soal
        {file : Path file Excel (.xlsx) berisi soal}
        {--dry-run : Hanya memeriksa file, tidak menyimpan apa pun ke database}
        {--pratinjau= : Tulis laporan HTML semua soal (gambar dan rumus dirender) ke file ini, untuk dicek editor}';

    protected $description = 'Import soal dari file Excel (upsert berdasarkan Kode Soal)';

    public function handle(ImportSoalExcel $importer, PratinjauSoal $pratinjau): int
    {
        $path = $this->argument('file');

        if (! is_file($path)) {
            $this->error("File tidak ditemukan: {$path}");

            return self::FAILURE;
        }

        try {
            $hasil = $importer->periksa($path);
        } catch (Throwable $e) {
            $this->error("File tidak bisa dibaca sebagai .xlsx: {$e->getMessage()}");

            return self::FAILURE;
        }

        foreach ($hasil['peringatan'] as $peringatan) {
            $this->warn($peringatan);
        }

        $jumlahSoal = count($hasil['soal']);
        $barisError = collect($hasil['error'])->pluck('baris')->filter()->unique()->count();
        $this->line("Sheet: {$hasil['sheet']} | baris soal: ".($jumlahSoal + $barisError)
            ." | baris kosong dilewati: {$hasil['dilewati']} | link gambar diperiksa: {$hasil['jumlah_gambar']}"
            ." | rumus diperiksa: {$hasil['jumlah_rumus']}");

        // Peringatan tidak menghalangi import, tetapi perlu dicek editor (mis. nama file gambar tidak cocok dengan kode soal).
        if ($hasil['peringatan_baris']) {
            $this->warn('Peringatan (tidak menghalangi import):');
            $this->tampilkanTabel($hasil['peringatan_baris']);
        }

        if ($hasil['error']) {
            $this->tampilkanTabel($hasil['error']);
            $this->error(count($hasil['error'])." masalah di {$barisError} baris. Tidak ada soal yang disimpan.");

            return self::FAILURE;
        }

        if ($jumlahSoal === 0) {
            $this->warn('Tidak ada soal di file ini.');

            return self::SUCCESS;
        }

        $this->tampilkanRingkasan($hasil['soal']);

        if ($tujuan = $this->option('pratinjau')) {
            if (file_put_contents($tujuan, $pratinjau->html($hasil['soal'], basename($path))) === false) {
                $this->error("Pratinjau tidak bisa ditulis ke {$tujuan}.");

                return self::FAILURE;
            }

            $this->info('Pratinjau: '.count($hasil['soal']).' soal ('.count(PratinjauSoal::bergambar($hasil['soal']))
                ." bergambar) ditulis ke {$tujuan}.");
        }

        if ($this->option('dry-run')) {
            $this->info("Dry-run: {$jumlahSoal} soal dan ".count($hasil['topik']).' topik di sheet Topik valid. Tidak ada yang disimpan.');

            return self::SUCCESS;
        }

        try {
            $jumlah = $importer->simpan($hasil['soal'], $hasil['topik']);
        } catch (Throwable $e) {
            $this->error("Gagal menyimpan, semua perubahan dibatalkan: {$e->getMessage()}");

            return self::FAILURE;
        }

        $this->info("Tersimpan: {$jumlah['baru']} soal baru, {$jumlah['diperbarui']} soal diperbarui; "
            ."{$jumlah['topik_baru']} topik baru, {$jumlah['topik_diperbarui']} topik diperbarui.");

        if ($kurang = $importer->topikKurangSoalMudah()) {
            $this->warn('Topik berikut punya kurang dari '.Penguasaan::JENDELA.' soal mudah. Siswa tahap 1 hanya diberi soal mudah, '
                .'jadi skor mereka di topik ini tidak akan pernah terhitung sampai soal mudahnya ditambah.');
            $this->table(['Subtes', 'Topik', 'Soal mudah'], array_map(fn ($t) => array_values($t), $kurang));
        }

        return self::SUCCESS;
    }

    // Kelompokkan error atau peringatan yang sama agar laporan tetap ringkas, mis. "Wajib diisi" di baris 3–40.
    private function tampilkanTabel(array $daftar): void
    {
        $baris = collect($daftar)
            ->groupBy(fn ($e) => $e['kolom']."\0".$e['pesan'])
            ->map(fn ($grup) => [
                'kolom' => $grup[0]['kolom'] ?? '-',
                'pesan' => $grup[0]['pesan'],
                'baris' => $this->rentangBaris($grup->pluck('baris')->filter()->all()),
                'urut' => $grup->min('baris') ?? 0,
            ])
            ->sortBy('urut')
            ->map(fn ($e) => [$e['baris'] ?: '-', $e['kolom'], $e['pesan']])
            ->values()
            ->all();

        $this->table(['Baris', 'Kolom', 'Masalah'], $baris);
    }

    private function tampilkanRingkasan(array $soalList): void
    {
        $baris = collect($soalList)
            ->groupBy(fn ($s) => $s['kode_subtes'].'|'.$s['nama_topik'].'|'.$s['tipe'])
            ->map(fn ($grup) => [
                $grup[0]['kode_subtes'],
                $grup[0]['nama_topik'],
                $grup[0]['tipe'],
                $grup->where('sudah_ada', false)->count(),
                $grup->where('sudah_ada', true)->count(),
            ])
            ->sortKeys()
            ->values()
            ->all();

        $this->table(['Subtes', 'Topik', 'Tipe', 'Baru', 'Diperbarui'], $baris);
    }

    // [3, 4, 5, 9] => "3–5, 9"
    private function rentangBaris(array $baris): string
    {
        sort($baris);
        $rentang = [];

        foreach ($baris as $b) {
            $akhir = array_key_last($rentang);

            if ($akhir !== null && $rentang[$akhir][1] === $b - 1) {
                $rentang[$akhir][1] = $b;
            } elseif ($akhir === null || $rentang[$akhir][1] !== $b) {
                $rentang[] = [$b, $b];
            }
        }

        return implode(', ', array_map(fn ($r) => $r[0] === $r[1] ? $r[0] : "{$r[0]}–{$r[1]}", $rentang));
    }
}
