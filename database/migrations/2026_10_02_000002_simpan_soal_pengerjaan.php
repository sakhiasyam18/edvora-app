<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Daftar soal yang diberikan di satu sesi latihan, urut tampil, termasuk soal yang tidak dijawab.
 * Dipakai halaman pembahasan untuk menampilkan soal kosong dengan nomor yang sama seperti saat mengerjakan.
 * Hanya catatan tampilan: aturan "soal kosong boleh muncul lagi" (K4) tetap membaca jawaban_pengerjaan.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            -- NULL untuk sesi sebelum kolom ini ada dan untuk Try Out.
            ALTER TABLE pengerjaan ADD COLUMN soal_ids uuid[];
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('ALTER TABLE pengerjaan DROP COLUMN IF EXISTS soal_ids');
    }
};
