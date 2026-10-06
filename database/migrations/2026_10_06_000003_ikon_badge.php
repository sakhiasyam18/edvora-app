<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Ikon per badge menggantikan satu gambar bersama (RANCANGAN-badge-avatar.md bagian 7). File SVG dari tim ada di
 * public/images/badge dengan pola <Nama_Badge>-<urutan>.svg; tetap SVG karena vektor dan hanya 3–11 KB per file.
 * Migration 2026_10_06_000001 sudah dijalankan dengan icon yang sama untuk semua badge, jadi diperbarui di sini.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            UPDATE badge b SET icon = v.icon
            FROM (VALUES
                ('Langkah Pertama', '/images/badge/Langkah_Pertama-1.svg'),
                ('Penakluk 100 Soal', '/images/badge/Penakluk_100_Soal-2.svg'),
                ('Penakluk 500 Soal', '/images/badge/Penakluk_500_Soal-3.svg'),
                ('Penakluk 1000 Soal', '/images/badge/Penakluk_1000_Soal-4.svg'),
                ('Penakluk Semua Soal', '/images/badge/Penakluk_Semua_Soal-5.svg'),
                ('Tepat Sasaran', '/images/badge/Tepat_Sasaran-6.svg'),
                ('Tanpa Celah', '/images/badge/Tanpa_Celah-7.svg'),
                ('Belajar dari Kesalahan', '/images/badge/Belajar_dari_Kesalahan-8.svg'),
                ('Pemburu Kesalahan', '/images/badge/Pemburu_Kesalahan-9.svg'),
                ('First Wave', '/images/badge/First_Wave-10.svg'),
                ('Tsunami', '/images/badge/Tsunami-11.svg'),
                ('Ocean Master', '/images/badge/Ocean_Master-12.svg'),
                ('Debut TO', '/images/badge/Debut_TO-13.svg'),
                ('Rising Star', '/images/badge/Rising_Star-14.svg'),
                ('Veteran', '/images/badge/Veteran-15.svg'),
                ('Tembus 600', '/images/badge/Tembus_600-16.svg'),
                ('Tembus 700', '/images/badge/Tembus_700-17.svg'),
                ('Lima Besar', '/images/badge/Lima_Besar-18.svg'),
                ('Champion', '/images/badge/Champion-19.svg'),
                ('Kolektor Avatar', '/images/badge/Kolektor_Avatar-20.svg')
            ) AS v (nama_badge, icon)
            WHERE b.nama_badge = v.nama_badge;
            SQL);
    }

    public function down(): void
    {
        // Mengembalikan nilai dari migration 2026_10_06_000001. File itu sudah diganti ikon per badge,
        // jadi sesudah rollback ikonnya tidak tampil sampai badge.svg disediakan lagi.
        DB::unprepared("UPDATE badge SET icon = '/images/badge/badge.svg'");
    }
};
