<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TryOutSoal extends Model
{
    use HasFactory;

    // Mengarahkan ke nama tabel yang benar di database
    protected $table = 'try_out_soal';

    // Jika tabel try_out_soal di database Anda tidak memiliki kolom created_at & updated_at, 
    // hapus tanda // pada baris di bawah ini:
    // public $timestamps = false;

    protected $fillable = [
        'try_out_subtes_id',
        'soal_id',
        'urutan',
    ];

    // Relasi balik ke TryOutSubtes
    public function tryOutSubtes()
    {
        return $this->belongsTo(TryOutSubtes::class, 'try_out_subtes_id');
    }

    // Relasi ke tabel Soal (ini penting agar nanti saat ujian bisa menampilkan teks soalnya)
    public function soal()
    {
        return $this->belongsTo(Soal::class, 'soal_id');
    }
}