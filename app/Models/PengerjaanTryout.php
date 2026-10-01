<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PengerjaanTryout extends Model
{
    use HasFactory, HasUuids;

    // WAJIB: definisikan nama tabel karena secara default Eloquent akan mencari tabel `pengerjaan_tryouts`
    protected $table = 'try_out'; 

    public $incrementing = false;
    protected $keyType = 'string';
    
    // Aktifkan timestamp jika tabel try_out menggunakan created_at & updated_at
    public $timestamps = true;

    protected $fillable = [
        'judul',
        'peraturan',
        'dibuat_oleh',
        'status',
    ];
}