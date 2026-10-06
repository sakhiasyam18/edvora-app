<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Avatar yang sudah dibeli siswa. UNIQUE (user_id, avatar_id): avatar tidak bisa dibeli dua kali.
 */
class AvatarSiswa extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'siswa_avatar';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'avatar_id',
        'dibeli_at',
    ];

    protected $casts = [
        'dibeli_at' => 'datetime',
    ];
}
