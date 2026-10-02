<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
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
        'soal_ids',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    // Soal yang diberikan di sesi, urut tampil (termasuk yang tidak dijawab). Postgres mengirim uuid[] sebagai
    // teks "{a,b}"; sesi sebelum kolom ini ada bernilai NULL, jadi dibaca sebagai array kosong.
    protected function soalIds(): Attribute
    {
        return Attribute::make(
            get: fn ($v) => $v ? array_values(array_filter(explode(',', trim($v, '{}')))) : [],
        );
    }

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

    public function tryOut()
    {
        return $this->belongsTo(TryOut::class, 'try_out_id');
    }

    public function subtesPengerjaan()
    {
        return $this->hasMany(PengerjaanSubtes::class, 'pengerjaan_id');
    }
}
