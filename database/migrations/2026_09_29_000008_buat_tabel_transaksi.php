<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Riwayat perubahan XP dan point siswa: xp_transactions, point_transactions.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE xp_transactions (
                id            uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id       uuid                  NOT NULL REFERENCES siswa (user_id),
                jumlah        integer               NOT NULL,
                sumber_tipe   sumber_tipe_transaksi NOT NULL,
                pengerjaan_id uuid                  REFERENCES pengerjaan (id),
                battle_id     uuid                  REFERENCES battle (id),
                created_at    timestamptz           NOT NULL DEFAULT now()
            );

            CREATE TABLE point_transactions (
                id            uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id       uuid                  NOT NULL REFERENCES siswa (user_id),
                jumlah        integer               NOT NULL,
                sumber_tipe   sumber_tipe_transaksi NOT NULL,
                pengerjaan_id uuid                  REFERENCES pengerjaan (id),
                battle_id     uuid                  REFERENCES battle (id),
                avatar_id     uuid                  REFERENCES avatar (id),
                created_at    timestamptz           NOT NULL DEFAULT now()
            );
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS point_transactions, xp_transactions');
    }
};
