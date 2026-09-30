<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Enum native Postgres untuk tabel aplikasi (user_role ada di migrasi users).
 *
 * Tabel aplikasi ditulis dengan SQL mentah, karena Blueprint Laravel tidak mendukung enum native,
 * uuid[], index parsial/ekspresi, FK komposit MATCH FULL, dan CHECK. Nama constraint sengaja
 * dibiarkan mengikuti penamaan bawaan Postgres agar sama dengan StuctureDatabse.md.
 *
 * Postgres tidak bisa menghapus nilai enum. Mengubah daftar nilai = membuat ulang type
 * (lihat riwayat tipe_soal di StuctureDatabse.md).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TYPE jenis_kelamin         AS ENUM ('laki-laki', 'perempuan');
            -- Urutan ini dipakai saat mengurutkan prodi (ORDER BY jenjang), bukan urutan abjad.
            CREATE TYPE jenjang_prodi         AS ENUM ('S1', 'D3', 'D4');
            CREATE TYPE sumber_tipe_transaksi AS ENUM ('pengerjaan', 'battle', 'avatar', 'reward', 'lainnya');
            CREATE TYPE tipe_soal             AS ENUM ('pilihan_ganda', 'isian_singkat', 'benar_salah');
            CREATE TYPE tingkat_kesulitan     AS ENUM ('mudah', 'sedang', 'sulit');
            CREATE TYPE status_soal           AS ENUM ('draft', 'review', 'published');
            CREATE TYPE status_konten         AS ENUM ('draft', 'published');
            CREATE TYPE status_tryout         AS ENUM ('draft', 'active', 'completed');
            CREATE TYPE tipe_pengerjaan       AS ENUM ('latihan_bebas', 'try_out');
            CREATE TYPE status_pengerjaan     AS ENUM ('berjalan', 'selesai', 'dibatalkan');
            CREATE TYPE mode_battle           AS ENUM ('solo', '1v1', 'grup');
            CREATE TYPE status_battle         AS ENUM ('waiting', 'ongoing', 'finished', 'cancelled');
            SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP TYPE IF EXISTS status_battle, mode_battle, status_pengerjaan, tipe_pengerjaan, status_tryout,
                status_konten, status_soal, tingkat_kesulitan, tipe_soal, sumber_tipe_transaksi,
                jenjang_prodi, jenis_kelamin;
            SQL);
    }
};
