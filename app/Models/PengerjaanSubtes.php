<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Satu subtes di pengerjaan Try Out. skor_subtes NULL sampai skor IRT dihitung.
 */
class PengerjaanSubtes extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pengerjaan_subtes';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'pengerjaan_id',
        'try_out_subtes_id',
        'waktu_mulai',
        'waktu_selesai',
        'skor_subtes',
    ];

    protected $casts = [
        'waktu_mulai' => 'datetime',
        'waktu_selesai' => 'datetime',
    ];
}
