<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Kolom universitas.singkatan dihapus: data top PTN dari tim tidak memuat singkatan,
 * dan tampilan cukup memakai nama_universitas.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared('ALTER TABLE universitas DROP COLUMN singkatan');
    }

    public function down(): void
    {
        // Nullable: saat dibatalkan, baris universitas yang sudah ada tidak punya singkatan.
        DB::unprepared('ALTER TABLE universitas ADD COLUMN singkatan varchar(20)');
    }
};
