<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Avatar yang dijual di toko (SDD 8.3). Default tidak disimpan di tabel ini: siswa.avatar_aktif_id kosong berarti Default.
 */
class Avatar extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'avatar';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'nama',
        'gambar_perempuan',
        'gambar_laki_laki',
        'harga_point',
        'level_minimal',
    ];

    protected $casts = [
        'harga_point' => 'integer',
        'level_minimal' => 'integer',
    ];
}
