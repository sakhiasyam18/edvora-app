<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Riwayat generate soal AI (halaman /editor/generator). Soal hasil AI tetap disimpan ke tabel soal/opsi_jawaban
 * lewat importer; tabel ini menyimpan parameter permintaan, hasil JSON model, dan jumlah soal yang sudah disimpan.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE generator_soal (
                id                uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
                editor_id         uuid              REFERENCES admin_editor (user_id) ON DELETE SET NULL,
                subtes_id         uuid              NOT NULL REFERENCES subtes (id) ON DELETE CASCADE,
                topik_id          uuid              REFERENCES topik (id) ON DELETE SET NULL,
                tingkat_kesulitan tingkat_kesulitan NOT NULL,
                -- Tipe yang diminta (pg/isian/both); tipe_soal adalah label tampilan, mis. "Pilihan Ganda & Isian Singkat".
                tipe              varchar(10)       NOT NULL,
                tipe_soal         varchar(50)       NOT NULL,
                model_ai          varchar(120)      NOT NULL,
                jumlah_soal       integer           NOT NULL,
                permintaan        jsonb             NOT NULL,
                hasil             jsonb             NOT NULL,
                status            varchar(20)       NOT NULL DEFAULT 'dibuat',
                jumlah_tersimpan  integer           NOT NULL DEFAULT 0,
                kode_tersimpan    jsonb             NOT NULL DEFAULT '[]'::jsonb,
                created_at        timestamptz       NOT NULL DEFAULT now(),
                updated_at        timestamptz       NOT NULL DEFAULT now(),
                CONSTRAINT generator_soal_tipe    CHECK (tipe IN ('pg', 'isian', 'both')),
                CONSTRAINT generator_soal_status  CHECK (status IN ('dibuat', 'sebagian', 'tersimpan')),
                CONSTRAINT generator_soal_jumlah  CHECK (
                    jumlah_soal BETWEEN 1 AND 20
                    AND jumlah_tersimpan BETWEEN 0 AND jumlah_soal
                ),
                CONSTRAINT generator_soal_permintaan_objek CHECK (jsonb_typeof(permintaan) = 'object'),
                CONSTRAINT generator_soal_hasil_objek      CHECK (jsonb_typeof(hasil) = 'object'),
                CONSTRAINT generator_soal_kode_array       CHECK (jsonb_typeof(kode_tersimpan) = 'array')
            );

            -- Daftar riwayat selalu difilter per editor dan diurutkan dari yang terbaru.
            CREATE INDEX generator_soal_editor_idx ON generator_soal (editor_id, created_at DESC);
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS generator_soal');
    }
};
