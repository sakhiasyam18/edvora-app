<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Try Out: try_out, try_out_subtes, try_out_soal.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE try_out (
                id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
                judul       text          NOT NULL,
                peraturan   text,
                status      status_tryout NOT NULL DEFAULT 'draft',
                dibuat_oleh uuid          REFERENCES users (id),
                created_at  timestamptz   NOT NULL DEFAULT now(),
                updated_at  timestamptz   NOT NULL DEFAULT now()
            );

            CREATE TABLE try_out_subtes (
                id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
                try_out_id  uuid    NOT NULL REFERENCES try_out (id),
                subtes_id   uuid    NOT NULL REFERENCES subtes (id),
                urutan      integer NOT NULL,
                jumlah_soal integer NOT NULL,
                waktu_menit integer NOT NULL
            );

            CREATE TABLE try_out_soal (
                id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
                try_out_subtes_id uuid    NOT NULL REFERENCES try_out_subtes (id),
                soal_id           uuid    NOT NULL REFERENCES soal (id) ON DELETE CASCADE,
                urutan            integer NOT NULL
            );
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS try_out_soal, try_out_subtes, try_out');
    }
};
