<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'gambar_pembahasan',
        'kolom_tabel',
        'tingkat_kesulitan',
        'status',
        'topik_id',
    ];

    protected $casts = [
        // Judul kolom soal majemuk_tabel, mis. ["Benar", "Salah"]; null untuk tipe lain.
        'kolom_tabel' => 'array',
    ];

    public function subtes()
    {
        return $this->belongsTo(Subtes::class, 'subtes_id', 'id');
    }

    public function topik()
    {
        return $this->belongsTo(Topik::class, 'topik_id');
    }

    public function opsiJawaban()
    {
        return $this->hasMany(OpsiJawaban::class, 'soal_id', 'id')->orderBy('urutan');
    }
}
