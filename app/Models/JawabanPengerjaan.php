<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class JawabanPengerjaan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'jawaban_pengerjaan';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'pengerjaan_id',
        'pengerjaan_subtes_id',
        'soal_id',
        'opsi_dipilih_id',
        'opsi_dipilih_ids',
        'jawaban_isian',
        'is_correct',
        'skor',
        'waktu_menjawab'
    ];

    // Postgres mengirim uuid[] sebagai teks "{a,b}"; cast 'array' Laravel mengharapkan JSON.
    // array_filter membuang '' hasil explode dari "{}" (array kosong).
    protected function opsiDipilihIds(): Attribute
    {
        return Attribute::make(
            get: fn ($v) => $v ? array_values(array_filter(explode(',', trim($v, '{}')))) : [],
        );
    }

    public function pengerjaan()
    {
        return $this->belongsTo(Pengerjaan::class, 'pengerjaan_id');
    }

    public function soal()
    {
        return $this->belongsTo(Soal::class, 'soal_id');
    }

    public function opsiJawaban()
    {
        return $this->belongsTo(OpsiJawaban::class, 'opsi_dipilih_id');
    }
}
