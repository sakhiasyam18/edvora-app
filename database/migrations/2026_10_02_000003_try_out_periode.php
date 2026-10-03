<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Try Out (RANCANGAN-tryout.md bagian 3): periode menggantikan status manual, satu soal hanya ada di satu paket,
 * dan subtes/soal paket ikut terhapus bersama paketnya.
 * ADD COLUMN ... NOT NULL hanya berhasil selama try_out kosong (2026-10-02: kosong).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            -- Status paket dihitung dari periode (Draft / Dibuka / Ditutup), tidak disimpan.
            ALTER TABLE try_out
                ADD COLUMN mulai_at   timestamptz NOT NULL,
                ADD COLUMN selesai_at timestamptz NOT NULL,
                ADD CONSTRAINT try_out_periode_valid CHECK (selesai_at > mulai_at),
                DROP COLUMN status;
            DROP TYPE status_tryout;

            -- waktu_menit sudah numeric(4,1) di Supabase (M5); baris ini menyamakan migration.
            ALTER TABLE try_out_subtes
                ALTER COLUMN waktu_menit TYPE numeric(4,1),
                DROP CONSTRAINT try_out_subtes_try_out_id_fkey,
                ADD  CONSTRAINT try_out_subtes_try_out_id_fkey
                     FOREIGN KEY (try_out_id) REFERENCES try_out (id) ON DELETE CASCADE,
                ADD  CONSTRAINT try_out_subtes_subtes_unik UNIQUE (try_out_id, subtes_id),
                ADD  CONSTRAINT try_out_subtes_urutan_unik UNIQUE (try_out_id, urutan),
                ADD  CONSTRAINT try_out_subtes_isi_positif CHECK (jumlah_soal > 0 AND waktu_menit > 0);

            -- Satu soal hanya boleh ada di satu paket; index-nya juga dipakai filter soal paket di latihan.
            ALTER TABLE try_out_soal
                DROP CONSTRAINT try_out_soal_try_out_subtes_id_fkey,
                ADD  CONSTRAINT try_out_soal_try_out_subtes_id_fkey
                     FOREIGN KEY (try_out_subtes_id) REFERENCES try_out_subtes (id) ON DELETE CASCADE,
                ADD  CONSTRAINT try_out_soal_satu_paket UNIQUE (soal_id),
                ADD  CONSTRAINT try_out_soal_urutan_unik UNIQUE (try_out_subtes_id, urutan);

            ALTER TABLE pengerjaan_subtes
                DROP CONSTRAINT pengerjaan_subtes_pengerjaan_id_fkey,
                ADD  CONSTRAINT pengerjaan_subtes_pengerjaan_id_fkey
                     FOREIGN KEY (pengerjaan_id) REFERENCES pengerjaan (id) ON DELETE CASCADE,
                ADD  CONSTRAINT pengerjaan_subtes_subtes_unik UNIQUE (pengerjaan_id, try_out_subtes_id);
            SQL);
    }

    public function down(): void
    {
        // Periode yang sudah diisi hilang. waktu_menit tetap numeric(4,1), sama dengan Supabase sebelum migration ini.
        DB::unprepared(<<<'SQL'
            ALTER TABLE pengerjaan_subtes
                DROP CONSTRAINT pengerjaan_subtes_subtes_unik,
                DROP CONSTRAINT pengerjaan_subtes_pengerjaan_id_fkey,
                ADD  CONSTRAINT pengerjaan_subtes_pengerjaan_id_fkey FOREIGN KEY (pengerjaan_id) REFERENCES pengerjaan (id);
            ALTER TABLE try_out_soal
                DROP CONSTRAINT try_out_soal_urutan_unik,
                DROP CONSTRAINT try_out_soal_satu_paket,
                DROP CONSTRAINT try_out_soal_try_out_subtes_id_fkey,
                ADD  CONSTRAINT try_out_soal_try_out_subtes_id_fkey FOREIGN KEY (try_out_subtes_id) REFERENCES try_out_subtes (id);
            ALTER TABLE try_out_subtes
                DROP CONSTRAINT try_out_subtes_isi_positif,
                DROP CONSTRAINT try_out_subtes_urutan_unik,
                DROP CONSTRAINT try_out_subtes_subtes_unik,
                DROP CONSTRAINT try_out_subtes_try_out_id_fkey,
                ADD  CONSTRAINT try_out_subtes_try_out_id_fkey FOREIGN KEY (try_out_id) REFERENCES try_out (id);
            CREATE TYPE status_tryout AS ENUM ('draft', 'active', 'completed');
            ALTER TABLE try_out
                ADD COLUMN status status_tryout NOT NULL DEFAULT 'draft',
                DROP CONSTRAINT try_out_periode_valid,
                DROP COLUMN selesai_at,
                DROP COLUMN mulai_at;
            SQL);
    }
};
