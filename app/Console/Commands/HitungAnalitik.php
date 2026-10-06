<?php

namespace App\Console\Commands;

use App\Services\DataAnalitik;
use Illuminate\Console\Command;

class HitungAnalitik extends Command
{
    protected $signature = 'edvora:hitung-analitik';

    protected $description = 'Hitung ulang data Dashboard Analitik editor (UCS9, terjadwal setiap hari pukul 00.00 WIB)';

    public function handle(DataAnalitik $data): int
    {
        $hasil = $data->perbarui();

        $this->info("Data analitik diperbarui ({$hasil['dihitungPada']}).");
        $this->line("Soal: {$hasil['ringkasan']['total']} ({$hasil['ringkasan']['published']} published, {$hasil['ringkasan']['draft']} draft)");
        $this->line('Topik stok kurang: '.count($hasil['stok']['topikKurang']).', topik di heatmap: '.count($hasil['heatmap']));

        return self::SUCCESS;
    }
}
