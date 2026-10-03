<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Penilaian IRT Try Out (RANCANGAN-irt.md bagian 4): parameter butir hasil kalibrasi disimpan pada data soal
 * (SDD 5.3.5), dan penanda paket yang sudah dinilai. Semua kolom nullable, jadi aman untuk tabel yang sudah berisi.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            -- NULL = soal belum pernah dikalibrasi (belum masuk paket yang sudah dinilai).
            ALTER TABLE soal
                ADD COLUMN irt_a numeric,
                ADD COLUMN irt_b numeric,
                ADD CONSTRAINT soal_irt_a_positif CHECK (irt_a IS NULL OR irt_a > 0);

            -- NULL = paket belum dinilai; diisi di transaksi yang sama dengan penulisan skor.
            ALTER TABLE try_out
                ADD COLUMN dinilai_at timestamptz;
            SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE try_out DROP COLUMN dinilai_at;
            ALTER TABLE soal
                DROP CONSTRAINT soal_irt_a_positif,
                DROP COLUMN irt_b,
                DROP COLUMN irt_a;
            SQL);
    }
};
