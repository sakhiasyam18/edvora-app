<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Subtes extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'subtes';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'nama_subtes',
        'deskripsi',
        'urutan',
        'waktu_default_menit',
        'kode_subtes',
        'jumlah_soal',
    ];

    // Kolom numeric(4,1) dibaca PDO Postgres sebagai string ("42.5"); ubah ke angka.
    protected $casts = [
        'waktu_default_menit' => 'float',
    ];

    public function soal()
    {
        return $this->hasMany(Soal::class, 'subtes_id', 'id');
    }
}
