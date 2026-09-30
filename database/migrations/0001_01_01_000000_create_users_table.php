<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // users memakai uuid dan enum native Postgres, jadi ditulis dengan SQL (lihat StuctureDatabse.md).
        // Tabel aplikasi lain ber-FK ke users.id atau siswa.user_id, keduanya uuid.
        DB::unprepared(<<<'SQL'
            CREATE TYPE user_role AS ENUM ('siswa', 'admin_editor', 'admin');

            CREATE TABLE users (
                id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                email             text        NOT NULL UNIQUE,
                password          text        NOT NULL,
                role              user_role   NOT NULL DEFAULT 'siswa',
                is_active         boolean     NOT NULL DEFAULT true,
                email_verified_at timestamptz,
                created_at        timestamptz NOT NULL DEFAULT now(),
                updated_at        timestamptz NOT NULL DEFAULT now(),
                remember_token    varchar,
                -- Maksimal 50 karakter; validasi nama di aplikasi harus max:50.
                name              varchar(50)
            );
            SQL);

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
        DB::unprepared('DROP TYPE IF EXISTS user_role');
    }
};
