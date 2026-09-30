<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Profil pengguna: admin_editor, siswa, siswa_avatar, siswa_badge.
 *
 * Tabel gameplay (pengerjaan, battle, transaksi) ber-FK ke siswa.user_id, bukan ke users,
 * jadi akun tanpa baris siswa akan gagal menyimpan pengerjaan.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE admin_editor (
                user_id      uuid PRIMARY KEY REFERENCES users (id),
                nama_lengkap text NOT NULL
            );

            -- kelas diambil dari konstanta Siswa::PILIHAN_KELAS: 10, 11, 12, kuliah-awal, kuliah-akhir, umum.
            CREATE TABLE siswa (
                user_id               uuid          PRIMARY KEY REFERENCES users (id),
                nama_lengkap          text          NOT NULL,
                kelas                 text,
                jenis_kelamin         jenis_kelamin,
                xp                    integer       NOT NULL DEFAULT 0,
                point                 integer       NOT NULL DEFAULT 0,
                streak_saat_ini       integer       NOT NULL DEFAULT 0,
                avatar_aktif_id       uuid          REFERENCES avatar (id),
                universitas_tujuan_id uuid,
                prodi_tujuan_id       uuid,
                created_at            timestamptz   NOT NULL DEFAULT now(),
                updated_at            timestamptz   NOT NULL DEFAULT now(),
                -- MATCH FULL: kedua kolom tujuan sama-sama NULL, atau sama-sama terisi dan cocok.
                CONSTRAINT siswa_tujuan_fkey FOREIGN KEY (prodi_tujuan_id, universitas_tujuan_id)
                    REFERENCES program_studi (id, universitas_id) MATCH FULL ON DELETE RESTRICT
            );
            -- Untuk leaderboard khusus prodi.
            CREATE INDEX siswa_prodi_tujuan_idx ON siswa (prodi_tujuan_id);

            CREATE TABLE siswa_avatar (
                id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id   uuid        NOT NULL REFERENCES siswa (user_id),
                avatar_id uuid        NOT NULL REFERENCES avatar (id),
                dibeli_at timestamptz NOT NULL DEFAULT now()
            );

            CREATE TABLE siswa_badge (
                id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id      uuid        NOT NULL REFERENCES siswa (user_id),
                badge_id     uuid        NOT NULL REFERENCES badge (id),
                diperoleh_at timestamptz NOT NULL DEFAULT now()
            );
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS siswa_badge, siswa_avatar, siswa, admin_editor');
    }
};
