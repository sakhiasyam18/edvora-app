<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class OpsiJawaban extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'opsi_jawaban';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // No created_at/updated_at based on schema checks

    protected $fillable = [
        'soal_id',
        'label',
        'teks_opsi',
        'gambar_opsi',
        'is_kunci',
        'urutan',
    ];

    public function soal()
    {
        return $this->belongsTo(Soal::class, 'soal_id', 'id');
    }
}
