<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Kolom untuk soal majemuk_tabel. Hanya menambah kolom yang boleh kosong; soal dan jawaban yang sudah ada
 * tidak berubah. Kesesuaian kunci_kolom dengan jumlah kolom tabel dijaga importer, karena beda tabel.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            -- Judul kolom tabel, mis. ["Benar", "Salah", "Tidak Bisa Ditentukan"]: wajib untuk majemuk_tabel, kosong untuk tipe lain.
            ALTER TABLE soal ADD COLUMN kolom_tabel jsonb;
            ALTER TABLE soal ADD CONSTRAINT soal_kolom_tabel_valid CHECK (
                (tipe = 'majemuk_tabel') = (kolom_tabel IS NOT NULL)
                AND (kolom_tabel IS NULL OR CASE WHEN jsonb_typeof(kolom_tabel) = 'array'
                    THEN jsonb_array_length(kolom_tabel) BETWEEN 2 AND 4 ELSE false END)
            );

            -- Nomor kolom (mulai 1) yang benar untuk pernyataan ini; hanya terisi di soal majemuk_tabel.
            ALTER TABLE opsi_jawaban ADD COLUMN kunci_kolom smallint
                CONSTRAINT opsi_jawaban_kunci_kolom_positif CHECK (kunci_kolom >= 1);

            -- Jawaban siswa untuk soal majemuk_tabel: {"<id opsi>": nomor kolom}.
            ALTER TABLE jawaban_pengerjaan ADD COLUMN pilihan_kolom jsonb
                CONSTRAINT jawaban_pengerjaan_pilihan_kolom_objek CHECK (jsonb_typeof(pilihan_kolom) = 'object');
            SQL);
    }

    public function down(): void
    {
        // Menghapus kolom ikut menghapus constraint yang memakainya.
        DB::unprepared(<<<'SQL'
            ALTER TABLE jawaban_pengerjaan DROP COLUMN IF EXISTS pilihan_kolom;
            ALTER TABLE opsi_jawaban DROP COLUMN IF EXISTS kunci_kolom;
            ALTER TABLE soal DROP COLUMN IF EXISTS kolom_tabel;
            SQL);
    }
};
