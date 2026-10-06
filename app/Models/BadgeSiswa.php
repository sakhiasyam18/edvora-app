<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Badge yang sudah diperoleh siswa. UNIQUE (user_id, badge_id): tiap badge hanya sekali (SDD 5.3.8).
 */
class BadgeSiswa extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'siswa_badge';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'badge_id',
        'diperoleh_at',
    ];

    protected $casts = [
        'diperoleh_at' => 'datetime',
    ];

    public function badge()
    {
        return $this->belongsTo(Badge::class, 'badge_id');
    }
}
