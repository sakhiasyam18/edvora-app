<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Badge otomatis dan toko avatar (RANCANGAN-badge-avatar.md bagian 3): syarat badge sebagai data, dua versi gambar
 * dan syarat level per avatar, UNIQUE kepemilikan, CHECK saldo point, serta isi katalog SDD 8.2 dan 8.3.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            -- Kolom NOT NULL di bawah hanya bisa ditambahkan ke tabel kosong; katalognya diisi migration ini.
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM avatar) OR EXISTS (SELECT 1 FROM badge) THEN
                    RAISE EXCEPTION 'Tabel avatar atau badge sudah berisi. Kosongkan dulu; katalognya diisi oleh migration ini.';
                END IF;
            END $$;

            -- Dua versi gambar; yang tampil mengikuti siswa.jenis_kelamin.
            ALTER TABLE avatar RENAME COLUMN gambar TO gambar_perempuan;
            ALTER TABLE avatar ADD COLUMN gambar_laki_laki varchar NOT NULL;
            -- Level akun minimum untuk membuka avatar (SDD 5.3.7); batas 50 dari keputusan tim.
            ALTER TABLE avatar ADD COLUMN level_minimal smallint NOT NULL DEFAULT 1;
            ALTER TABLE avatar ADD CONSTRAINT avatar_level_minimal_rentang CHECK (level_minimal BETWEEN 1 AND 50);
            -- Harga negatif akan menambah point saat dibeli.
            ALTER TABLE avatar ADD CONSTRAINT avatar_harga_point_positif CHECK (harga_point >= 0);
            CREATE UNIQUE INDEX avatar_nama_unik ON avatar (lower(nama));

            -- Syarat badge sebagai data; penilaiannya per jenis di App\Services\PemeriksaBadge.
            ALTER TABLE badge ADD COLUMN jenis_syarat text NOT NULL;
            ALTER TABLE badge ADD COLUMN target integer;
            ALTER TABLE badge ALTER COLUMN syarat_text SET NOT NULL;
            ALTER TABLE badge ADD CONSTRAINT badge_jenis_syarat_valid CHECK (jenis_syarat IN (
                'soal_dijawab', 'jawaban_benar', 'sesi_sempurna', 'soal_remedial', 'simulasi_selesai',
                'try_out_selesai', 'rata_skor_try_out', 'peringkat_try_out', 'semua_avatar'
            ));
            ALTER TABLE badge ADD CONSTRAINT badge_target_positif CHECK (target > 0);
            -- Hanya Kolektor Avatar yang tanpa angka; jumlah katalog dihitung saat diperiksa.
            ALTER TABLE badge ADD CONSTRAINT badge_target_sesuai_jenis CHECK ((jenis_syarat = 'semua_avatar') = (target IS NULL));
            CREATE UNIQUE INDEX badge_nama_unik ON badge (lower(nama_badge));

            -- Tiap badge hanya sekali (SDD 5.3.8); avatar tidak bisa dibeli dua kali.
            ALTER TABLE siswa_badge ADD CONSTRAINT siswa_badge_unik UNIQUE (user_id, badge_id);
            ALTER TABLE siswa_avatar ADD CONSTRAINT siswa_avatar_unik UNIQUE (user_id, avatar_id);
            -- Pengaman terakhir saldo; pembelian memotong point dengan UPDATE ... WHERE point >= harga.
            ALTER TABLE siswa ADD CONSTRAINT siswa_point_tidak_negatif CHECK (point >= 0);

            -- SDD 8.3. Level dan harga sementara (RANCANGAN-badge-avatar.md bagian 11); harga = 40 × L × (L − 1).
            INSERT INTO avatar (nama, gambar_perempuan, gambar_laki_laki, level_minimal, harga_point) VALUES
                ('Mahasiswa Pendidikan', '/images/avatar/pendidikan-perempuan.png', '/images/avatar/pendidikan-laki-laki.png', 3, 250),
                ('Mahasiswa FMIPA', '/images/avatar/fmipa-perempuan.png', '/images/avatar/fmipa-laki-laki.png', 3, 250),
                ('Mahasiswa Ekonomi', '/images/avatar/ekonomi-perempuan.png', '/images/avatar/ekonomi-laki-laki.png', 5, 800),
                ('Mahasiswa Seni', '/images/avatar/seni-perempuan.png', '/images/avatar/seni-laki-laki.png', 5, 800),
                ('Mahasiswa Teknik', '/images/avatar/teknik-perempuan.png', '/images/avatar/teknik-laki-laki.png', 8, 2250),
                ('Mahasiswa Dokter', '/images/avatar/dokter-perempuan.png', '/images/avatar/dokter-laki-laki.png', 10, 3600);

            -- SDD 8.2. Untuk sementara satu gambar untuk semua badge.
            INSERT INTO badge (nama_badge, syarat_text, jenis_syarat, target, icon) VALUES
                ('Langkah Pertama', 'Mengerjakan 1 Soal', 'soal_dijawab', 1, '/images/badge/badge.svg'),
                ('Penakluk 100 Soal', 'Mengerjakan 100 Soal', 'soal_dijawab', 100, '/images/badge/badge.svg'),
                ('Penakluk 500 Soal', 'Mengerjakan 500 Soal', 'soal_dijawab', 500, '/images/badge/badge.svg'),
                ('Penakluk 1000 Soal', 'Mengerjakan 1000 Soal', 'soal_dijawab', 1000, '/images/badge/badge.svg'),
                ('Penakluk Semua Soal', 'Mengerjakan lebih dari 2000 Soal', 'soal_dijawab', 2001, '/images/badge/badge.svg'),
                ('Tepat Sasaran', 'Menjawab benar 100 soal', 'jawaban_benar', 100, '/images/badge/badge.svg'),
                ('Tanpa Celah', 'Mengerjakan 1 Paket Soal dengan 100% Benar', 'sesi_sempurna', 1, '/images/badge/badge.svg'),
                ('Belajar dari Kesalahan', 'Menyelesaikan 10 soal remedial', 'soal_remedial', 10, '/images/badge/badge.svg'),
                ('Pemburu Kesalahan', 'Menyelesaikan 100 soal remedial', 'soal_remedial', 100, '/images/badge/badge.svg'),
                ('First Wave', 'Menyelesaikan 1 simulasi subtest', 'simulasi_selesai', 1, '/images/badge/badge.svg'),
                ('Tsunami', 'Menyelesaikan 15 simulasi subtest', 'simulasi_selesai', 15, '/images/badge/badge.svg'),
                ('Ocean Master', 'Menyelesaikan 50 simulasi subtest', 'simulasi_selesai', 50, '/images/badge/badge.svg'),
                ('Debut TO', 'Menyelesaikan 1 Try Out', 'try_out_selesai', 1, '/images/badge/badge.svg'),
                ('Rising Star', 'Menyelesaikan 5 Try Out', 'try_out_selesai', 5, '/images/badge/badge.svg'),
                ('Veteran', 'Menyelesaikan 10 Try Out', 'try_out_selesai', 10, '/images/badge/badge.svg'),
                ('Tembus 600', 'Skor Rata-Rata Try Out ≥ 600', 'rata_skor_try_out', 600, '/images/badge/badge.svg'),
                ('Tembus 700', 'Skor Rata-Rata Try Out ≥ 700', 'rata_skor_try_out', 700, '/images/badge/badge.svg'),
                ('Lima Besar', 'Masuk 5 besar peringkat suatu TO', 'peringkat_try_out', 5, '/images/badge/badge.svg'),
                ('Champion', 'Peringkat pertama suatu TO', 'peringkat_try_out', 1, '/images/badge/badge.svg'),
                ('Kolektor Avatar', 'Memiliki semua avatar', 'semua_avatar', NULL, '/images/badge/badge.svg');
            SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM siswa_avatar) THEN
                    RAISE EXCEPTION 'Sudah ada % pembelian avatar. Rollback akan merusak saldo point siswa.',
                        (SELECT count(*) FROM siswa_avatar);
                END IF;
            END $$;

            DELETE FROM siswa_badge;
            DELETE FROM badge;
            DELETE FROM avatar;

            ALTER TABLE siswa DROP CONSTRAINT siswa_point_tidak_negatif;
            ALTER TABLE siswa_avatar DROP CONSTRAINT siswa_avatar_unik;
            ALTER TABLE siswa_badge DROP CONSTRAINT siswa_badge_unik;

            DROP INDEX badge_nama_unik;
            ALTER TABLE badge DROP CONSTRAINT badge_target_sesuai_jenis;
            ALTER TABLE badge DROP CONSTRAINT badge_target_positif;
            ALTER TABLE badge DROP CONSTRAINT badge_jenis_syarat_valid;
            ALTER TABLE badge ALTER COLUMN syarat_text DROP NOT NULL;
            ALTER TABLE badge DROP COLUMN target;
            ALTER TABLE badge DROP COLUMN jenis_syarat;

            DROP INDEX avatar_nama_unik;
            ALTER TABLE avatar DROP CONSTRAINT avatar_harga_point_positif;
            ALTER TABLE avatar DROP CONSTRAINT avatar_level_minimal_rentang;
            ALTER TABLE avatar DROP COLUMN level_minimal;
            ALTER TABLE avatar DROP COLUMN gambar_laki_laki;
            ALTER TABLE avatar RENAME COLUMN gambar_perempuan TO gambar;
            SQL);
    }
};
