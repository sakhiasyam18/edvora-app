<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Simpan progres latihan fleksibel (RANCANGAN-RENCANA-save-fleksibel.md bagian 4).
 * - hint_soal_ids: soal yang hint-nya dibuka di sesi fleksibel, supaya tetap tercatat setelah logout (SF9).
 * - jawaban_unik_per_soal: satu jawaban per soal per pengerjaan; kirim ulang tidak membuat baris dobel (SF14).
 * - pengerjaan_fleksibel_berjalan_satu: paling banyak satu fleksibel berjalan per siswa per subtes (SF5).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE pengerjaan ADD COLUMN hint_soal_ids uuid[] NOT NULL DEFAULT '{}';

            ALTER TABLE jawaban_pengerjaan
                ADD CONSTRAINT jawaban_unik_per_soal UNIQUE (pengerjaan_id, soal_id);

            CREATE UNIQUE INDEX pengerjaan_fleksibel_berjalan_satu
                ON pengerjaan (user_id, subtes_id)
                WHERE status = 'berjalan' AND mode_latihan = 'fleksibel';
            SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP INDEX IF EXISTS pengerjaan_fleksibel_berjalan_satu;
            ALTER TABLE jawaban_pengerjaan DROP CONSTRAINT IF EXISTS jawaban_unik_per_soal;
            ALTER TABLE pengerjaan DROP COLUMN IF EXISTS hint_soal_ids;
            SQL);
    }
};
