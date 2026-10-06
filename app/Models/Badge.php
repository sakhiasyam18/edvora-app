<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Badge SDD 8.2. Syaratnya data (jenis_syarat, target); penilaiannya di App\Services\PemeriksaBadge.
 */
class Badge extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'badge';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'nama_badge',
        'deskripsi',
        'icon',
        'syarat_text',
        'jenis_syarat',
        'target',
    ];

    protected $casts = [
        'target' => 'integer',
    ];
}
