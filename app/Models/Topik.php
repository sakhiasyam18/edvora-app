<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Topik extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'topik';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'subtes_id',
        'nama_topik',
        'urutan',
        'jumlah_soal_simulasi',
    ];

    public function subtes()
    {
        return $this->belongsTo(Subtes::class, 'subtes_id');
    }

    public function soal()
    {
        return $this->hasMany(Soal::class, 'topik_id');
    }

    public function penguasaanTopik()
    {
        return $this->hasMany(PenguasaanTopik::class, 'topik_id');
    }
}
