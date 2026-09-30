<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Pengerjaan latihan / try out: pengerjaan, pengerjaan_subtes, jawaban_pengerjaan.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            -- user_id ber-FK ke siswa(user_id), bukan ke users.
            CREATE TABLE pengerjaan (
                id                  uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id             uuid              NOT NULL REFERENCES siswa (user_id),
                tipe                tipe_pengerjaan   NOT NULL,
                status              status_pengerjaan NOT NULL DEFAULT 'berjalan',
                subtes_id           uuid              REFERENCES subtes (id),
                jumlah_soal_dipilih integer,
                ice_breaking_aktif  boolean           DEFAULT false,
                try_out_id          uuid              REFERENCES try_out (id),
                started_at          timestamptz       NOT NULL DEFAULT now(),
                finished_at         timestamptz,
                total_skor          numeric           DEFAULT 0
            );
            -- Satu siswa hanya boleh punya satu pengerjaan per Try Out; latihan bebas (try_out_id NULL) tidak terpengaruh.
            CREATE UNIQUE INDEX pengerjaan_try_out_sekali ON pengerjaan (try_out_id, user_id) WHERE try_out_id IS NOT NULL;

            CREATE TABLE pengerjaan_subtes (
                id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                pengerjaan_id     uuid        NOT NULL REFERENCES pengerjaan (id),
                try_out_subtes_id uuid        REFERENCES try_out_subtes (id),
                waktu_mulai       timestamptz,
                waktu_selesai     timestamptz,
                skor_subtes       numeric     DEFAULT 0
            );

            -- Kolom jawaban yang diisi bergantung pada soal.tipe:
            --   pilihan_ganda -> opsi_dipilih_id; benar_salah -> opsi_dipilih_ids; isian_singkat -> jawaban_isian.
            CREATE TABLE jawaban_pengerjaan (
                id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                pengerjaan_id        uuid        NOT NULL REFERENCES pengerjaan (id) ON DELETE CASCADE,
                pengerjaan_subtes_id uuid        REFERENCES pengerjaan_subtes (id) ON DELETE CASCADE,
                soal_id              uuid        NOT NULL REFERENCES soal (id) ON DELETE CASCADE,
                opsi_dipilih_id      uuid        REFERENCES opsi_jawaban (id) ON DELETE SET NULL,
                jawaban_isian        text,
                is_correct           boolean     NOT NULL DEFAULT false,
                skor                 numeric     DEFAULT 0,
                waktu_menjawab       timestamptz NOT NULL DEFAULT now(),
                -- Tanpa FK: Postgres tidak mendukung FK pada elemen array; aplikasi menyaring UUID-nya sendiri.
                opsi_dipilih_ids     uuid[]
            );
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS jawaban_pengerjaan, pengerjaan_subtes, pengerjaan');
    }
};
