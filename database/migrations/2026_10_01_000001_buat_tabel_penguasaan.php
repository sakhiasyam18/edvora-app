<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Skor penguasaan dan tahap per siswa × topik (khusus mode fleksibel):
 * topik, penguasaan_topik, riwayat_tahap, serta kolom baru di soal, pengerjaan, dan jawaban_pengerjaan.
 *
 * Tidak ada kolom lama yang diubah atau dihapus. soal.topik_id wajib, jadi tabel soal harus kosong saat
 * migration ini dijalankan; soal diisi ulang dengan data dummy berlabel topik sesudahnya.
 *
 * "20 jawaban terakhir" tidak disimpan di tabel sendiri; ia diambil dari jawaban_pengerjaan setiap sesi
 * selesai. penguasaan_topik hanya menyimpan hasil hitungnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            -- Batalkan dengan pesan jelas bila masih ada soal lama: kolom topik_id yang wajib tidak bisa ditambahkan.
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM soal) THEN
                    RAISE EXCEPTION 'Tabel soal masih berisi % soal tanpa topik. Kosongkan dulu, lalu isi dengan data dummy berlabel topik setelah migration ini.',
                        (SELECT count(*) FROM soal);
                END IF;
            END $$;

            CREATE TABLE topik (
                id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
                subtes_id  uuid         NOT NULL REFERENCES subtes (id) ON DELETE CASCADE,
                nama_topik text         NOT NULL,
                urutan     integer      NOT NULL,
                -- Target FK komposit soal_topik_fkey.
                CONSTRAINT topik_id_subtes_key UNIQUE (id, subtes_id)
            );
            CREATE UNIQUE INDEX topik_nama_unik ON topik (subtes_id, lower(nama_topik));

            -- Setiap soal wajib punya topik. FK komposit menjamin topik berada di subtes yang sama dengan soalnya.
            -- Tanpa ON DELETE: topik yang masih dipakai soal tidak bisa dihapus.
            ALTER TABLE soal ADD COLUMN topik_id uuid NOT NULL;
            ALTER TABLE soal ADD CONSTRAINT soal_topik_fkey
                FOREIGN KEY (topik_id, subtes_id) REFERENCES topik (id, subtes_id);
            CREATE INDEX soal_topik_tingkat_idx ON soal (topik_id, tingkat_kesulitan);

            -- Fleksibel dan simulasi sama-sama tersimpan sebagai tipe latihan_bebas; hanya fleksibel yang dihitung.
            -- NULL untuk pengerjaan Try Out.
            ALTER TABLE pengerjaan ADD COLUMN mode_latihan text
                CONSTRAINT pengerjaan_mode_latihan_valid CHECK (mode_latihan IN ('fleksibel', 'simulasi'));
            -- Sesi dari "Ulangi Latihan" menyajikan soal yang sama setelah pembahasan terlihat, jadi tidak dihitung.
            ALTER TABLE pengerjaan ADD COLUMN sesi_ulangan boolean NOT NULL DEFAULT false;
            CREATE INDEX pengerjaan_user_selesai_idx ON pengerjaan (user_id, finished_at);

            ALTER TABLE jawaban_pengerjaan ADD COLUMN pakai_hint boolean NOT NULL DEFAULT false;
            CREATE INDEX jawaban_pengerjaan_pengerjaan_idx ON jawaban_pengerjaan (pengerjaan_id);
            CREATE INDEX jawaban_pengerjaan_soal_idx ON jawaban_pengerjaan (soal_id);

            CREATE TABLE penguasaan_topik (
                id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id     uuid         NOT NULL REFERENCES siswa (user_id),
                topik_id    uuid         NOT NULL REFERENCES topik (id) ON DELETE CASCADE,
                -- NULL selama jendela belum berisi 20 jawaban (belum cukup data).
                skor        numeric(5,2),
                n_jendela   smallint     NOT NULL DEFAULT 0,
                -- Jumlah soal yang dikerjakan sejak tahap terakhir berubah; dasar penanda topik prioritas.
                n_di_tahap  integer      NOT NULL DEFAULT 0,
                tahap       smallint     NOT NULL DEFAULT 1,
                -- Kapan tahap terakhir berubah; NULL = belum pernah.
                tahap_sejak timestamptz,
                updated_at  timestamptz  NOT NULL DEFAULT now(),
                CONSTRAINT penguasaan_topik_unik UNIQUE (user_id, topik_id),
                CONSTRAINT penguasaan_topik_skor_rentang CHECK (skor BETWEEN 0 AND 100),
                CONSTRAINT penguasaan_topik_n_jendela_rentang CHECK (n_jendela BETWEEN 0 AND 20),
                CONSTRAINT penguasaan_topik_n_di_tahap_positif CHECK (n_di_tahap >= 0),
                CONSTRAINT penguasaan_topik_tahap_rentang CHECK (tahap BETWEEN 1 AND 3)
            );

            CREATE TABLE riwayat_tahap (
                id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id       uuid         NOT NULL REFERENCES siswa (user_id),
                topik_id      uuid         NOT NULL REFERENCES topik (id) ON DELETE CASCADE,
                dari_tahap    smallint     NOT NULL,
                ke_tahap      smallint     NOT NULL,
                -- Skor jendela saat pindah tahap.
                skor          numeric(5,2) NOT NULL,
                -- Sesi yang memicu perpindahan; dipakai halaman Hasil.
                pengerjaan_id uuid         REFERENCES pengerjaan (id) ON DELETE SET NULL,
                created_at    timestamptz  NOT NULL DEFAULT now()
            );
            CREATE INDEX riwayat_tahap_pengerjaan_idx ON riwayat_tahap (pengerjaan_id);
            SQL);
    }

    public function down(): void
    {
        // Menghapus kolom ikut menghapus index dan constraint yang memakainya.
        DB::unprepared(<<<'SQL'
            DROP TABLE IF EXISTS riwayat_tahap, penguasaan_topik;
            DROP INDEX IF EXISTS jawaban_pengerjaan_soal_idx, jawaban_pengerjaan_pengerjaan_idx, pengerjaan_user_selesai_idx;
            ALTER TABLE jawaban_pengerjaan DROP COLUMN IF EXISTS pakai_hint;
            ALTER TABLE pengerjaan DROP COLUMN IF EXISTS sesi_ulangan, DROP COLUMN IF EXISTS mode_latihan;
            ALTER TABLE soal DROP COLUMN IF EXISTS topik_id;
            DROP TABLE IF EXISTS topik;
            SQL);
    }
};
