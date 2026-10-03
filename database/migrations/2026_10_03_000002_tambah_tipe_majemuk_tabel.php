<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Tipe soal majemuk_tabel: pernyataan di setiap baris, siswa memilih satu kolom per baris
 * (mis. Benar / Salah / Tidak Bisa Ditentukan).
 *
 * Dipisah dari migration kolomnya karena Postgres tidak mengizinkan nilai enum baru dipakai
 * di transaksi yang sama dengan penambahannya.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared("ALTER TYPE tipe_soal ADD VALUE IF NOT EXISTS 'majemuk_tabel'");
    }

    public function down(): void
    {
        // Postgres tidak bisa menghapus satu nilai enum tanpa membuat ulang tipenya, jadi nilai ini dibiarkan.
    }
};
