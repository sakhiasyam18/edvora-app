<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgramStudi extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'program_studi';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'universitas_id',
        'kode_prodi',
        'nama_prodi',
        'jenjang',
        'is_aktif',
    ];

    protected $casts = [
        'is_aktif' => 'boolean',
    ];

    public function universitas()
    {
        return $this->belongsTo(Universitas::class, 'universitas_id', 'id');
    }
}
