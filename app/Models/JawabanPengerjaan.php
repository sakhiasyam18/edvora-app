<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'waktu_menjawab',
        'pakai_hint',
        'pilihan_kolom',
    ];

    protected $casts = [
        // Soal majemuk_tabel: {id opsi: nomor kolom pilihan siswa}.
        'pilihan_kolom' => 'array',
    ];

    // Postgres mengirim uuid[] sebagai teks "{a,b}"; cast 'array' Laravel mengharapkan JSON.
    // array_filter membuang '' hasil explode dari "{}" (array kosong).
    protected function opsiDipilihIds(): Attribute
    {
        return Attribute::make(
            get: fn ($v) => $v ? array_values(array_filter(explode(',', trim($v, '{}')))) : [],
        );
    }

    /**
     * Kolom jawaban menurut tipe soal, untuk insert massal. Jalur itu melewati mutator Eloquent, jadi literal array
     * Postgres dan JSON ditulis manual. Pilihan ganda memakai opsi_dipilih_id supaya FK-nya terjaga; benar_salah memakai
     * opsi_dipilih_ids; isian memakai jawaban_isian; majemuk_tabel memakai pilihan_kolom. Keempat kolom selalu ada,
     * karena insert massal mensyaratkan setiap baris memiliki kolom yang sama.
     *
     * @param  array<int, string>  $opsiIds
     * @param  array<string, int>|null  $pilihanKolom  majemuk_tabel: id opsi => nomor kolom
     * @return array{opsi_dipilih_id: ?string, opsi_dipilih_ids: ?string, jawaban_isian: ?string, pilihan_kolom: ?string}
     */
    public static function kolomJawaban(string $tipe, array $opsiIds, ?string $jawabanIsian, ?array $pilihanKolom = null): array
    {
        return [
            'opsi_dipilih_id' => $tipe === 'pilihan_ganda' ? ($opsiIds[0] ?? null) : null,
            'opsi_dipilih_ids' => $tipe === 'benar_salah' ? '{'.implode(',', $opsiIds).'}' : null,
            'jawaban_isian' => $tipe === 'isian_singkat' ? $jawabanIsian : null,
            'pilihan_kolom' => $tipe === 'majemuk_tabel' && $pilihanKolom !== null ? json_encode($pilihanKolom) : null,
        ];
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
