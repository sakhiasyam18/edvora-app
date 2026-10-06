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
        {--pratinjau= : Tulis laporan HTML semua soal (gambar dan rumus dirender) ke file ini, untuk dicek editor}
        {--publish : Semua soal di file langsung berstatus published (tampil ke siswa). Tanpa opsi ini soal baru masuk Draft}';

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

        if ($jumlahSoal === 0 && $hasil['topik'] === []) {
            $this->warn('Tidak ada soal maupun topik di file ini.');

            return self::SUCCESS;
        }

        // File boleh hanya berisi sheet Topik, mis. untuk mengisi Jumlah Soal Simulasi topik yang sudah ada.
        if ($jumlahSoal > 0) {
            $this->tampilkanRingkasan($hasil['soal']);
        }

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
            $jumlah = $importer->simpan($hasil['soal'], $hasil['topik'], status: $this->option('publish') ? 'published' : null);
        } catch (Throwable $e) {
            $this->error("Gagal menyimpan, semua perubahan dibatalkan: {$e->getMessage()}");

            return self::FAILURE;
        }

        $this->info("Tersimpan: {$jumlah['baru']} soal baru, {$jumlah['diperbarui']} soal diperbarui; "
            ."{$jumlah['topik_baru']} topik baru, {$jumlah['topik_diperbarui']} topik diperbarui.");

        // Latihan dan Try Out hanya mengambil soal published.
        if (! $this->option('publish') && $jumlah['baru'] > 0) {
            $this->warn("{$jumlah['baru']} soal baru berstatus Draft, belum tampil ke siswa. Terbitkan di halaman Bank Soal, "
                .'atau import ulang dengan --publish.');
        }

        if ($kurang = $importer->topikKurangSoalMudah()) {
            $this->warn('Topik berikut punya kurang dari '.Penguasaan::JENDELA.' soal mudah. Siswa tahap 1 hanya diberi soal mudah, '
                .'jadi skor mereka di topik ini tidak akan pernah terhitung sampai soal mudahnya ditambah.');
            $this->table(['Subtes', 'Topik', 'Soal mudah'], array_map(fn ($t) => array_values($t), $kurang));
        }

        return self::SUCCESS;
    }

    private function tampilkanTabel(array $daftar): void
    {
        $this->table(['Baris', 'Kolom', 'Masalah'], array_map('array_values', ImportSoalExcel::kelompokkanMasalah($daftar)));
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
}
