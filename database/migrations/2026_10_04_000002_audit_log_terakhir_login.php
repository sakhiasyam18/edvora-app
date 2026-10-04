<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Halaman admin (UCS6): waktu login terakhir untuk "aktif hari ini" di Dashboard Admin dan pop-up Informasi Akun,
 * serta audit log aksi admin (UCS6) dan editor (UCS7) yang ditampilkan di Dashboard Admin.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            -- Diisi setiap kali user login (event Login di AppServiceProvider), termasuk lewat "ingat saya".
            ALTER TABLE users ADD COLUMN terakhir_login_at timestamptz;

            -- peran disalin dari users.role saat aksi dicatat, agar log admin dan editor bisa dipisah.
            -- user_id SET NULL: log tetap ada walaupun akun pelakunya kelak dihapus.
            CREATE TABLE audit_log (
                id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id    uuid REFERENCES users (id) ON DELETE SET NULL,
                peran      user_role NOT NULL,
                aksi       text NOT NULL,
                keterangan text,
                created_at timestamptz NOT NULL DEFAULT now()
            );

            -- Dashboard Admin mengambil beberapa log terbaru per peran.
            CREATE INDEX audit_log_peran_waktu_idx ON audit_log (peran, created_at DESC);

            -- Akun editor yang sudah ada belum punya baris admin_editor; soal.editor_id merujuk ke tabel ini.
            INSERT INTO admin_editor (user_id, nama_lengkap)
            SELECT u.id, COALESCE(u.name, split_part(u.email, '@', 1))
            FROM users u
            WHERE u.role = 'admin_editor'
              AND NOT EXISTS (SELECT 1 FROM admin_editor a WHERE a.user_id = u.id);
            SQL);
    }

    public function down(): void
    {
        // Baris admin_editor hasil isian di atas dibiarkan: tidak bisa dibedakan dari baris yang dibuat aplikasi.
        DB::unprepared(<<<'SQL'
            DROP TABLE audit_log;
            ALTER TABLE users DROP COLUMN terakhir_login_at;
            SQL);
    }
};
