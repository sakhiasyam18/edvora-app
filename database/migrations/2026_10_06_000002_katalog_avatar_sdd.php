<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Katalog avatar mengikuti SDD 8.3 terbaru (RANCANGAN-badge-avatar.md 3.2): 11 avatar berbayar, Lv. 5–50, 150–2.500
 * point, gambar WebP. Migration 2026_10_06_000001 sudah dijalankan dengan angka sementara, jadi katalog diperbarui di
 * sini. Avatar lama diperbarui di tempat (id tetap), sehingga kepemilikan dan avatar aktif tetap sah.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            UPDATE avatar SET nama = 'Mahasiswa Kedokteran' WHERE nama = 'Mahasiswa Dokter';

            -- SDD 8.3: "N Level – M Point" = terbuka di level N, dibeli dengan M point. Default tidak disimpan di sini.
            -- Konflik pada avatar_nama_unik (lower(nama)) = avatar lama: perbarui gambar, level, dan harganya.
            INSERT INTO avatar (nama, gambar_perempuan, gambar_laki_laki, level_minimal, harga_point) VALUES
                ('Peserta UTBK', '/images/avatar/peserta-utbk-perempuan.webp', '/images/avatar/peserta-utbk-laki-laki.webp', 5, 150),
                ('Mahasiswa Baru', '/images/avatar/mahasiswa-baru-perempuan.webp', '/images/avatar/mahasiswa-baru-laki-laki.webp', 10, 300),
                ('Mahasiswa FMIPA', '/images/avatar/fmipa-perempuan.webp', '/images/avatar/fmipa-laki-laki.webp', 15, 600),
                ('Mahasiswa Teknik', '/images/avatar/teknik-perempuan.webp', '/images/avatar/teknik-laki-laki.webp', 15, 600),
                ('Mahasiswa Ekonomi', '/images/avatar/ekonomi-perempuan.webp', '/images/avatar/ekonomi-laki-laki.webp', 15, 600),
                ('Mahasiswa Seni', '/images/avatar/seni-perempuan.webp', '/images/avatar/seni-laki-laki.webp', 15, 600),
                ('Mahasiswa Pendidikan', '/images/avatar/pendidikan-perempuan.webp', '/images/avatar/pendidikan-laki-laki.webp', 15, 600),
                ('Mahasiswa Hukum', '/images/avatar/hukum-perempuan.webp', '/images/avatar/hukum-laki-laki.webp', 15, 600),
                ('Mahasiswa Kedokteran', '/images/avatar/kedokteran-perempuan.webp', '/images/avatar/kedokteran-laki-laki.webp', 20, 800),
                ('Sarjana', '/images/avatar/sarjana-perempuan.webp', '/images/avatar/sarjana-laki-laki.webp', 30, 1500),
                ('Cumlaude', '/images/avatar/cumlaude-perempuan.webp', '/images/avatar/cumlaude-laki-laki.webp', 50, 2500)
            ON CONFLICT ((lower(nama))) DO UPDATE SET
                gambar_perempuan = EXCLUDED.gambar_perempuan,
                gambar_laki_laki = EXCLUDED.gambar_laki_laki,
                level_minimal = EXCLUDED.level_minimal,
                harga_point = EXCLUDED.harga_point;
            SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM siswa_avatar sa JOIN avatar a ON a.id = sa.avatar_id
                    WHERE a.nama IN ('Peserta UTBK', 'Mahasiswa Baru', 'Mahasiswa Hukum', 'Sarjana', 'Cumlaude')
                ) THEN
                    RAISE EXCEPTION 'Avatar baru dari SDD 8.3 sudah dibeli siswa. Rollback akan menghapus kepemilikannya.';
                END IF;
            END $$;

            DELETE FROM avatar WHERE nama IN ('Peserta UTBK', 'Mahasiswa Baru', 'Mahasiswa Hukum', 'Sarjana', 'Cumlaude');
            UPDATE avatar SET nama = 'Mahasiswa Dokter' WHERE nama = 'Mahasiswa Kedokteran';

            -- Nilai sementara dari migration 2026_10_06_000001.
            UPDATE avatar a SET
                gambar_perempuan = v.perempuan, gambar_laki_laki = v.laki_laki, level_minimal = v.level, harga_point = v.harga
            FROM (VALUES
                ('Mahasiswa Pendidikan', '/images/avatar/pendidikan-perempuan.png', '/images/avatar/pendidikan-laki-laki.png', 3, 250),
                ('Mahasiswa FMIPA', '/images/avatar/fmipa-perempuan.png', '/images/avatar/fmipa-laki-laki.png', 3, 250),
                ('Mahasiswa Ekonomi', '/images/avatar/ekonomi-perempuan.png', '/images/avatar/ekonomi-laki-laki.png', 5, 800),
                ('Mahasiswa Seni', '/images/avatar/seni-perempuan.png', '/images/avatar/seni-laki-laki.png', 5, 800),
                ('Mahasiswa Teknik', '/images/avatar/teknik-perempuan.png', '/images/avatar/teknik-laki-laki.png', 8, 2250),
                ('Mahasiswa Dokter', '/images/avatar/dokter-perempuan.png', '/images/avatar/dokter-laki-laki.png', 10, 3600)
            ) AS v (nama, perempuan, laki_laki, level, harga)
            WHERE a.nama = v.nama;
            SQL);
    }
};
