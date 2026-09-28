<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Siswa extends Model
{
    use HasFactory;

    // Nilai kolom kelas => label yang ditampilkan; dipakai props halaman Biodata dan validasinya.
    // PHP mengubah kunci angka seperti '10' menjadi int, jadi ubah ke string saat dikirim ke React.
    public const PILIHAN_KELAS = [
        '10' => 'Kelas 10 SMA/SMK',
        '11' => 'Kelas 11 SMA/SMK',
        '12' => 'Kelas 12 SMA/SMK',
        'kuliah-awal' => 'Tingkat 1 - 2 (Semester Awal)',
        'kuliah-akhir' => 'Tingkat 3 - 4 (Semester Akhir)',
        'umum' => 'Alumni / Mahasiswa Pasca',
    ];

    protected $table = 'siswa';

    // Primary key-nya user_id, yang merujuk ke users.id.
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'nama_lengkap',
        'kelas',
        'jenis_kelamin',
        'xp',
        'point',
        'streak_saat_ini',
        'universitas_tujuan_id',
        'prodi_tujuan_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function universitasTujuan()
    {
        return $this->belongsTo(Universitas::class, 'universitas_tujuan_id', 'id');
    }

    public function prodiTujuan()
    {
        return $this->belongsTo(ProgramStudi::class, 'prodi_tujuan_id', 'id');
    }
}
