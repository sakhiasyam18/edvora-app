<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * users.id is a uuid, so sessions.user_id must be one too.
     * Existing bigint values can't point to a uuid user, so they are cleared.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE sessions ALTER COLUMN user_id TYPE uuid USING NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE sessions ALTER COLUMN user_id TYPE bigint USING NULL');
    }
};
