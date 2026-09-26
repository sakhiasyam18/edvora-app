<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Soal extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'soal';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kode_soal',
        'subtes_id',
        'editor_id',
        'tipe',
        'teks_soal',
        'gambar_soal',
        'kunci_jawaban',
        'hint',
        'pembahasan',
        'tingkat_kesulitan',
        'status',
    ];

    public function subtes()
    {
        return $this->belongsTo(Subtes::class, 'subtes_id', 'id');
    }

    public function opsiJawaban()
    {
        return $this->hasMany(OpsiJawaban::class, 'soal_id', 'id')->orderBy('urutan');
    }
}
