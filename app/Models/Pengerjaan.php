<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pengerjaan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pengerjaan';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'tipe',
        'status',
        'subtes_id',
        'jumlah_soal_dipilih',
        'ice_breaking_aktif',
        'try_out_id',
        'started_at',
        'finished_at',
        'total_skor',
        'mode_latihan',
        'sesi_ulangan',
    ];

    public function jawabanPengerjaan()
    {
        return $this->hasMany(JawabanPengerjaan::class, 'pengerjaan_id');
    }

    public function subtes()
    {
        return $this->belongsTo(Subtes::class, 'subtes_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
