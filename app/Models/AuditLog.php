<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'audit_log';

    public $incrementing = false;

    protected $keyType = 'string';

    // Hanya ada created_at, diisi default now() oleh database.
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'peran',
        'aksi',
        'keterangan',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Mencatat aksi user yang sedang login (UCS6 aksi admin, UCS7 aksi editor).
     * Panggil di dalam DB::transaction yang sama dengan aksinya, agar log hanya ada bila aksinya berhasil.
     */
    public static function catat(string $aksi, ?string $keterangan = null): void
    {
        $user = Auth::user();

        static::create([
            'user_id' => $user->id,
            'peran' => $user->role,
            'aksi' => $aksi,
            'keterangan' => $keterangan,
        ]);
    }
}
