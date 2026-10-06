<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Satu subtes di paket Try Out: jumlah soal dan waktunya disimpan per paket.
 */
class TryOutSubtes extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'try_out_subtes';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'try_out_id',
        'subtes_id',
        'urutan',
        'jumlah_soal',
        'waktu_menit',
    ];

    // Kolom numeric(4,1) dibaca PDO Postgres sebagai string ("42.5"); ubah ke angka.
    protected $casts = [
        'waktu_menit' => 'float',
    ];

    public function tryOut()
    {
        return $this->belongsTo(TryOut::class, 'try_out_id');
    }

    public function subtes()
    {
        return $this->belongsTo(Subtes::class, 'subtes_id');
    }

    // Soal paket di subtes ini, urut tampil.
    public function soal()
    {
        return $this->belongsToMany(Soal::class, 'try_out_soal', 'try_out_subtes_id', 'soal_id')
            ->withPivot('urutan')
            ->orderByPivot('urutan');
    }
}
