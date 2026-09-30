<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Battle: battle, battle_peserta, battle_daftar_soal, battle_jawaban.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE battle (
                id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
                subtes_id   uuid          NOT NULL REFERENCES subtes (id),
                mode        mode_battle   NOT NULL,
                join_code   text          UNIQUE,
                status      status_battle NOT NULL DEFAULT 'waiting',
                jumlah_soal integer       NOT NULL DEFAULT 10,
                dibuat_oleh uuid          REFERENCES users (id),
                created_at  timestamptz   NOT NULL DEFAULT now(),
                started_at  timestamptz,
                ended_at    timestamptz
            );

            CREATE TABLE battle_peserta (
                id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                battle_id  uuid        NOT NULL REFERENCES battle (id),
                user_id    uuid        NOT NULL REFERENCES siswa (user_id),
                total_skor numeric     DEFAULT 0,
                rank       integer,
                joined_at  timestamptz NOT NULL DEFAULT now()
            );

            CREATE TABLE battle_daftar_soal (
                id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
                battle_id uuid    NOT NULL REFERENCES battle (id),
                soal_id   uuid    NOT NULL REFERENCES soal (id) ON DELETE CASCADE,
                urutan    integer NOT NULL
            );

            CREATE TABLE battle_jawaban (
                id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                battle_peserta_id     uuid        NOT NULL REFERENCES battle_peserta (id),
                battle_daftar_soal_id uuid        NOT NULL REFERENCES battle_daftar_soal (id) ON DELETE CASCADE,
                opsi_dipilih_id       uuid        REFERENCES opsi_jawaban (id) ON DELETE SET NULL,
                is_correct            boolean     NOT NULL DEFAULT false,
                waktu_jawab_ms        integer     NOT NULL DEFAULT 0,
                answered_at           timestamptz NOT NULL DEFAULT now(),
                skor                  numeric     DEFAULT 0
            );
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS battle_jawaban, battle_daftar_soal, battle_peserta, battle');
    }
};
