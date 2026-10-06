<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatTahap extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'riwayat_tahap';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'topik_id',
        'dari_tahap',
        'ke_tahap',
        'skor',
        'pengerjaan_id',
        'created_at',
    ];

    protected $casts = [
        'skor' => 'float',
        'created_at' => 'datetime',
    ];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'user_id', 'user_id');
    }

    public function topik()
    {
        return $this->belongsTo(Topik::class, 'topik_id');
    }

    public function pengerjaan()
    {
        return $this->belongsTo(Pengerjaan::class, 'pengerjaan_id');
    }
}
