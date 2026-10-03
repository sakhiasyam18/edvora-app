<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Gambar pembahasan: satu link gambar per soal, tampil di bawah teks pembahasan.
 * Hanya menambah kolom yang boleh kosong; soal yang sudah ada tidak berubah.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            -- Seperti gambar_soal, yang disimpan hanya link ke bucket gambar_soal (nama file PK-034-pembahasan.png).
            ALTER TABLE soal ADD COLUMN gambar_pembahasan text;
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('ALTER TABLE soal DROP COLUMN IF EXISTS gambar_pembahasan');
    }
};
