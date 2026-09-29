<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Tabel referensi: universitas, program_studi, avatar, badge, subtes.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            -- kode_ptn adalah kode PTN dari SNPMB, dipakai sebagai kunci upsert importer.
            -- Data tidak dihapus; untuk menyembunyikan dari dropdown, set is_aktif = false.
            CREATE TABLE universitas (
                id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                nama_universitas text        NOT NULL,
                kode_ptn         varchar(10) NOT NULL UNIQUE,
                singkatan        varchar(20) NOT NULL,
                is_aktif         boolean     NOT NULL DEFAULT true
            );
            CREATE UNIQUE INDEX universitas_nama_unik ON universitas (lower(nama_universitas));

            -- nama_prodi ditulis tanpa jenjang, mis. "Teknik Informatika", bukan "S1 Teknik Informatika".
            CREATE TABLE program_studi (
                id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
                universitas_id uuid          NOT NULL REFERENCES universitas (id) ON DELETE RESTRICT,
                nama_prodi     text          NOT NULL,
                kode_prodi     varchar(20)   NOT NULL UNIQUE,
                jenjang        jenjang_prodi NOT NULL,
                is_aktif       boolean       NOT NULL DEFAULT true,
                -- Tidak menambah aturan baru, tetapi wajib sebagai target FK komposit siswa_tujuan_fkey.
                CONSTRAINT program_studi_id_universitas_key UNIQUE (id, universitas_id)
            );
            CREATE UNIQUE INDEX program_studi_nama_unik ON program_studi (universitas_id, jenjang, lower(nama_prodi));

            CREATE TABLE avatar (
                id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
                nama        text    NOT NULL,
                gambar      varchar NOT NULL,
                harga_point integer NOT NULL DEFAULT 0
            );

            CREATE TABLE badge (
                id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
                nama_badge  text    NOT NULL,
                deskripsi   text,
                icon        varchar NOT NULL,
                syarat_text text
            );

            -- waktu_default_menit numeric(4,1) agar 42,5 menit tidak dibulatkan (model Subtes meng-cast ke float).
            -- jumlah_soal = jumlah soal mode simulasi untuk subtes itu.
            CREATE TABLE subtes (
                id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
                nama_subtes         text         NOT NULL,
                deskripsi           text,
                urutan              integer      NOT NULL,
                waktu_default_menit numeric(4,1) NOT NULL,
                kode_subtes         varchar      UNIQUE,
                jumlah_soal         integer      NOT NULL,
                CONSTRAINT subtes_jumlah_soal_positif CHECK (jumlah_soal > 0)
            );
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS subtes, badge, avatar, program_studi, universitas');
    }
};
