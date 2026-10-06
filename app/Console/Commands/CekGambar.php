<?php

namespace App\Console\Commands;

use App\Services\PemeriksaLinkGambar;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CekGambar extends Command
{
    protected $signature = 'edvora:cek-gambar';

    protected $description = 'Periksa ulang semua link gambar soal, opsi, dan pembahasan di database (hanya membaca)';

    /**
     * File di Storage masih bisa dihapus atau ditimpa lewat dashboard setelah import, dan database tidak tahu.
     * Command ini menemukan gambar yang rusak sebelum siswa yang menemukannya.
     */
    public function handle(PemeriksaLinkGambar $pemeriksa): int
    {
        $pemakaian = DB::select(<<<'SQL'
            select q.kode_soal, 'Gambar Soal' as kolom, q.gambar_soal as url
            from soal q
            where q.gambar_soal is not null
            union all
            select q.kode_soal, 'Gambar Pembahasan', q.gambar_pembahasan
            from soal q
            where q.gambar_pembahasan is not null
            union all
            select q.kode_soal, 'Opsi ' || o.label || ' - Gambar', o.gambar_opsi
            from opsi_jawaban o
            join soal q on q.id = o.soal_id
            where o.gambar_opsi is not null
            order by 1, 2
            SQL);

        if (! $pemakaian) {
            $this->info('Belum ada soal bergambar.');

            return self::SUCCESS;
        }

        $masalah = $pemeriksa->periksa(array_column($pemakaian, 'url'));
        $rusak = [];

        foreach ($pemakaian as $p) {
            if ($masalah[$p->url] !== null) {
                $rusak[] = [$p->kode_soal, $p->kolom, $masalah[$p->url]];
            }
        }

        $this->line(count($pemakaian).' gambar dipakai soal, dari '.count($masalah).' link berbeda.');

        if (! $rusak) {
            $this->info('Semua link gambar baik.');

            return self::SUCCESS;
        }

        $this->table(['Kode Soal', 'Kolom', 'Masalah'], $rusak);
        $this->error(count($rusak).' gambar bermasalah.');

        return self::FAILURE;
    }
}
