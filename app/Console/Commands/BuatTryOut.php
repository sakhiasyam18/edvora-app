<?php

namespace App\Console\Commands;

use App\Models\Topik;
use App\Services\PenyusunPaketTryOut;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Throwable;

use function Laravel\Prompts\text;

class BuatTryOut extends Command
{
    protected $signature = 'edvora:buat-tryout
        {--judul= : Judul paket}
        {--mulai= : Waktu mulai dalam WIB, format "YYYY-MM-DD HH:MM"}
        {--selesai= : Waktu selesai dalam WIB, format "YYYY-MM-DD HH:MM"}
        {--peraturan= : Peraturan, aturan dipisah "|". Kosong = peraturan default}
        {--menit-per-subtes= : Ganti waktu semua subtes, mis. 1 untuk menguji waktu habis}
        {--dry-run : Hanya menampilkan susunan soal, tidak menyimpan apa pun}';

    protected $description = 'Buat paket Try Out dari bank soal (RANCANGAN-tryout.md 4.3)';

    // Tanggal di perintah ini diketik dalam WIB; database menyimpan waktu absolut.
    private const ZONA = 'Asia/Jakarta';

    public function handle(PenyusunPaketTryOut $penyusun): int
    {
        $menit = $this->option('menit-per-subtes');
        if ($menit !== null && (! is_numeric($menit) || (float) $menit <= 0)) {
            $this->error('--menit-per-subtes harus angka positif.');

            return self::FAILURE;
        }
        $menit = $menit === null ? null : (float) $menit;

        if ($this->option('dry-run')) {
            $this->tampilkanSusunan($penyusun->susun($menit));
            $this->info('Dry-run: tidak ada yang disimpan.');

            return self::SUCCESS;
        }

        $judul = trim($this->option('judul') ?? text('Judul paket', required: true));
        $mulai = $this->bacaWaktu($this->option('mulai') ?? text('Mulai (WIB, YYYY-MM-DD HH:MM)', required: true));
        $selesai = $this->bacaWaktu($this->option('selesai') ?? text('Selesai (WIB, YYYY-MM-DD HH:MM)', required: true));

        if ($judul === '' || ! $mulai || ! $selesai) {
            $this->error('Judul wajib diisi, dan waktu harus berformat YYYY-MM-DD HH:MM (WIB).');

            return self::FAILURE;
        }

        if ($selesai->lte($mulai)) {
            $this->error('Waktu selesai harus setelah waktu mulai.');

            return self::FAILURE;
        }

        if ($mulai->isPast()) {
            $this->warn('Waktu mulai sudah lewat: paket langsung Dibuka.');
        }

        $peraturan = trim((string) $this->option('peraturan')) === ''
            ? PenyusunPaketTryOut::PERATURAN_DEFAULT
            : implode("\n", array_map('trim', explode('|', $this->option('peraturan'))));

        try {
            $tryOut = $penyusun->buat($judul, $peraturan, $mulai, $selesai, null, $menit);
        } catch (Throwable $e) {
            $this->error("Paket tidak dibuat: {$e->getMessage()}");

            return self::FAILURE;
        }

        $this->info("Paket dibuat: {$tryOut->id}");
        $this->line('Periode: '.$mulai->format('d M Y H:i').' s.d. '.$selesai->format('d M Y H:i').' WIB');
        $this->line('Status sekarang: '.$tryOut->status());

        return self::SUCCESS;
    }

    // null bila format salah atau tanggalnya tidak ada (mis. 2026-02-30).
    private function bacaWaktu(string $teks): ?CarbonImmutable
    {
        try {
            $waktu = CarbonImmutable::createFromFormat('!Y-m-d H:i', trim($teks), self::ZONA);
        } catch (Throwable) {
            return null;
        }

        return $waktu && $waktu->format('Y-m-d H:i') === trim($teks) ? $waktu : null;
    }

    private function tampilkanSusunan(array $susunan): void
    {
        $namaTopik = Topik::pluck('nama_topik', 'id')->all();
        $baris = [];
        $totalSoal = 0;
        $totalMenit = 0.0;

        foreach ($susunan as $s) {
            $rincian = [];
            foreach ($s['rincian'] as $topikId => $perTingkat) {
                $rincian[] = ($namaTopik[$topikId] ?? 'Tanpa topik').' '
                    .implode('/', [$perTingkat['mudah'] ?? 0, $perTingkat['sedang'] ?? 0, $perTingkat['sulit'] ?? 0]);
            }

            $baris[] = [$s['subtes']->kode_subtes, count($s['soalIds']).'/'.$s['subtes']->jumlah_soal, $s['menit'], $s['segar'], implode('; ', $rincian)];
            $totalSoal += count($s['soalIds']);
            $totalMenit += $s['menit'];

            if ($s['kurang'] > 0) {
                $this->warn("{$s['subtes']->kode_subtes}: stok kurang {$s['kurang']} soal.");
            }
        }

        $this->table(['Subtes', 'Soal', 'Menit', 'Belum pernah dijawab', 'Topik (mudah/sedang/sulit)'], $baris);
        $this->line("Total: {$totalSoal} soal, {$totalMenit} menit.");
    }
}
