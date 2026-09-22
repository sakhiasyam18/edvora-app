<?php

namespace App\Models;

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
        'jawaban_isian',
        'is_correct',
        'skor',
        'waktu_menjawab'
    ];

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
