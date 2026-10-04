<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Soal extends Model
{
    use HasFactory, HasUuids;

    // Nilai enum status_soal. Latihan dan Try Out hanya mengambil soal published; draft belum tampil ke siswa.
    public const STATUS = ['draft', 'review', 'published'];

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

    /**
     * Kode untuk soal baru dari formulir editor: nomor terbesar yang sudah dipakai subtes ini + 1, minimal 3 digit
     * (PU-631). Nomor yang dilewati tidak diisi ulang.
     */
    public static function kodeBerikutnya(Subtes $subtes): string
    {
        $terbesar = static::where('subtes_id', $subtes->id)
            ->selectRaw("max(substring(kode_soal from '-([0-9]+)$')::int) as terbesar")
            ->value('terbesar');

        return sprintf('%s-%03d', $subtes->kode_subtes, (int) $terbesar + 1);
    }

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
