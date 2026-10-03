<?php

namespace App\Console\Commands;

use App\Models\TryOut;
use App\Services\PenilaianTryOut;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class NilaiTryOut extends Command
{
    protected $signature = 'edvora:nilai-tryout
        {--paket= : Id paket tertentu. Kosong = semua paket yang sudah ditutup dan belum dinilai}
        {--dry-run : Hitung dan tampilkan ringkasan tanpa menulis apa pun}';

    protected $description = 'Kalibrasi IRT dan hitung skor Try Out yang sudah ditutup (RANCANGAN-irt.md 5.5)';

    public function handle(PenilaianTryOut $penilaian): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $paketList = $this->pilihPaket($dryRun);

        if ($paketList === null) {
            return self::FAILURE;
        }

        if ($paketList->isEmpty()) {
            $this->line('Tidak ada paket yang perlu dinilai.');

            return self::SUCCESS;
        }

        $gagal = 0;
        foreach ($paketList as $paket) {
            $this->info("Paket: {$paket->judul} ({$paket->id})");

            try {
                $hasil = $penilaian->jalankan($paket, $dryRun);
            } catch (Throwable $e) {
                // Paket ini dicoba lagi pada detak scheduler berikutnya; paket lain tetap dinilai.
                $gagal++;
                Log::error('Penilaian IRT gagal', ['try_out_id' => $paket->id, 'pesan' => $e->getMessage()]);
                $this->error("Gagal: {$e->getMessage()}");

                continue;
            }

            $this->tampilkan($hasil, $dryRun);
        }

        return $gagal === 0 ? self::SUCCESS : self::FAILURE;
    }

    // null = --paket tidak bisa dipakai; pesannya sudah ditampilkan.
    private function pilihPaket(bool $dryRun): ?Collection
    {
        $id = $this->option('paket');

        if ($id === null) {
            return PenilaianTryOut::paketSiap(now())->get();
        }

        $paket = Str::isUuid($id) ? TryOut::find($id) : null;
        if (! $paket) {
            $this->error('Paket tidak ditemukan.');

            return null;
        }

        // Dry-run boleh kapan saja, termasuk saat paket masih Dibuka; penilaian sungguhan hanya setelah jeda.
        if (! $dryRun && $paket->dinilai_at !== null) {
            $this->error('Paket sudah dinilai.');

            return null;
        }

        if (! $dryRun && ! PenilaianTryOut::paketSiap(now())->whereKey($paket->id)->exists()) {
            $this->error('Paket belum bisa dinilai: tunggu sampai 2 menit setelah periode berakhir.');

            return null;
        }

        return collect([$paket]);
    }

    /**
     * @param  array{peserta: int, subtes: array<int, array{nama: string, peserta: int, iterasi: int, konvergen: bool, a: float[], b: float[], skor: float[], geser: array<int, array{kode: string, label: string, b: float}>}>, ditulis: bool}  $hasil
     */
    private function tampilkan(array $hasil, bool $dryRun): void
    {
        $this->line("Pengerjaan selesai: {$hasil['peserta']}");
        $this->table(
            ['Subtes', 'Peserta', 'Iterasi', 'a (min / median / maks)', 'b (min / median / maks)', 'Skor (min / rata-rata / maks)'],
            array_map(fn ($s) => [
                $s['nama'],
                $s['peserta'],
                $s['iterasi'].($s['konvergen'] ? '' : ' (belum konvergen)'),
                $this->sebaran($s['a']),
                $this->sebaran($s['b']),
                $this->sebaran($s['skor'], rataRata: true),
            ], $hasil['subtes']),
        );

        foreach ($hasil['subtes'] as $s) {
            $geser = array_map(fn ($g) => sprintf('%s (%s → b %.2f)', $g['kode'], $g['label'], $g['b']), $s['geser']);
            $this->line("  {$s['nama']}: b paling bergeser dari label: ".implode('; ', $geser));
        }

        $this->info(match (true) {
            $dryRun => 'Dry-run: tidak ada yang ditulis.',
            $hasil['ditulis'] => 'Parameter soal dan skor tersimpan.',
            default => 'Dilewati: paket sudah dinilai proses lain.',
        });
    }

    // "min / median / maks", atau "min / rata-rata / maks"; "-" bila kosong.
    private function sebaran(array $nilai, bool $rataRata = false): string
    {
        if ($nilai === []) {
            return '-';
        }

        sort($nilai);
        $tengah = $rataRata ? array_sum($nilai) / count($nilai) : $nilai[intdiv(count($nilai), 2)];

        return sprintf('%.2f / %.2f / %.2f', $nilai[0], $tengah, $nilai[count($nilai) - 1]);
    }
}
