<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Penyesuaian dengan SDD 5.3 (RANCANGAN-penyesuaian-sdd.md bagian 7): jumlah soal simulasi per topik,
 * skor sementara untuk urutan rekomendasi, dan mode latihan remedial.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            -- Jumlah soal topik ini di mode simulasi (proporsi UTBK, SDD 5.3.2.3). NULL = belum ditentukan.
            ALTER TABLE topik ADD COLUMN jumlah_soal_simulasi smallint
                CONSTRAINT topik_jumlah_soal_simulasi_positif CHECK (jumlah_soal_simulasi > 0);

            -- Skor dari jawaban yang sudah ada di jendela, terisi sejak jawaban pertama. Hanya untuk urutan
            -- rekomendasi; tampilan dan tahap tetap memakai kolom skor (NULL sampai 20 jawaban).
            ALTER TABLE penguasaan_topik ADD COLUMN skor_sementara numeric(5,2)
                CONSTRAINT penguasaan_topik_skor_sementara_rentang CHECK (skor_sementara BETWEEN 0 AND 100);

            ALTER TABLE pengerjaan DROP CONSTRAINT pengerjaan_mode_latihan_valid,
                ADD CONSTRAINT pengerjaan_mode_latihan_valid CHECK (mode_latihan IN ('fleksibel', 'simulasi', 'remedial'));
            SQL);
    }

    public function down(): void
    {
        // Ditolak Postgres bila sudah ada pengerjaan remedial: hapus atau ubah baris itu dulu.
        DB::unprepared(<<<'SQL'
            ALTER TABLE pengerjaan DROP CONSTRAINT pengerjaan_mode_latihan_valid,
                ADD CONSTRAINT pengerjaan_mode_latihan_valid CHECK (mode_latihan IN ('fleksibel', 'simulasi'));
            ALTER TABLE penguasaan_topik DROP COLUMN IF EXISTS skor_sementara;
            ALTER TABLE topik DROP COLUMN IF EXISTS jumlah_soal_simulasi;
            SQL);
    }
};
