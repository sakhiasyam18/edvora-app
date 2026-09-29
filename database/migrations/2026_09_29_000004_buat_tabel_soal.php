<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Bank soal: soal, opsi_jawaban, ice_breaking_content.
 *
 * Menghapus soal ikut menghapus (CASCADE) opsi_jawaban, jawaban_pengerjaan, try_out_soal,
 * dan battle_daftar_soal. pengerjaan dan xp/point siswa tidak ikut terhapus.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE soal (
                id                uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
                kode_soal         varchar(100)      NOT NULL UNIQUE,
                subtes_id         uuid              NOT NULL REFERENCES subtes (id) ON DELETE CASCADE,
                editor_id         uuid              REFERENCES admin_editor (user_id) ON DELETE SET NULL,
                tipe              tipe_soal         NOT NULL,
                teks_soal         text              NOT NULL,
                gambar_soal       text,
                -- Kunci soal ber-opsi ada di opsi_jawaban.is_kunci; kolom ini hanya untuk isian_singkat,
                -- dengan jawaban alternatif dipisah "|".
                kunci_jawaban     text,
                hint              text,
                pembahasan        text              NOT NULL,
                tingkat_kesulitan tingkat_kesulitan NOT NULL,
                status            status_soal       NOT NULL DEFAULT 'draft',
                created_at        timestamptz       NOT NULL DEFAULT now(),
                updated_at        timestamptz       NOT NULL DEFAULT now(),
                CONSTRAINT soal_isian_wajib_kunci     CHECK (tipe <> 'isian_singkat' OR kunci_jawaban IS NOT NULL),
                CONSTRAINT soal_opsi_tanpa_kunci_teks CHECK (tipe = 'isian_singkat' OR kunci_jawaban IS NULL)
            );

            -- Soal benar_salah: satu opsi berisi satu pernyataan; is_kunci = true berarti pernyataan itu Benar.
            CREATE TABLE opsi_jawaban (
                id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
                soal_id     uuid    NOT NULL REFERENCES soal (id) ON DELETE CASCADE,
                label       varchar NOT NULL,
                teks_opsi   text    NOT NULL,
                gambar_opsi text,
                is_kunci    boolean NOT NULL DEFAULT false,
                urutan      integer NOT NULL
            );

            CREATE TABLE ice_breaking_content (
                id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
                konten_teks   text          NOT NULL,
                konten_gambar varchar,
                jawaban       text          NOT NULL,
                dibuat_oleh   uuid          REFERENCES users (id),
                status        status_konten NOT NULL DEFAULT 'draft',
                created_at    timestamptz   NOT NULL DEFAULT now()
            );
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS ice_breaking_content, opsi_jawaban, soal');
    }
};
