<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Catatan poin yang diberikan ke atau dipakai siswa (K12).
 */
class TransaksiPoin extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'point_transactions';

    public $incrementing = false;

    protected $keyType = 'string';

    // Hanya ada created_at; diisi sendiri saat insert.
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'jumlah',
        'sumber_tipe',
        'pengerjaan_id',
        'battle_id',
        'avatar_id',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}
