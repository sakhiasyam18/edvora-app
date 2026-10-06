<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Hasil hitung skor dan tahap per siswa × topik (mode fleksibel dan remedial). Aturannya ada di App\Services\Penguasaan.
 */
class PenguasaanTopik extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'penguasaan_topik';

    public $incrementing = false;

    protected $keyType = 'string';

    // Hanya ada updated_at; diisi sendiri saat upsert.
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'topik_id',
        'skor',
        'skor_sementara',
        'n_jendela',
        'n_di_tahap',
        'tahap',
        'tahap_sejak',
        'updated_at',
    ];

    protected $casts = [
        'skor' => 'float',
        'skor_sementara' => 'float',
        'tahap_sejak' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'user_id', 'user_id');
    }

    public function topik()
    {
        return $this->belongsTo(Topik::class, 'topik_id');
    }
}
