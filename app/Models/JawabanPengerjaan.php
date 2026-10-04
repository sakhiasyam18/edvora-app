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
     * Postgres ditulis manual. Pilihan ganda memakai opsi_dipilih_id supaya FK-nya terjaga; benar_salah memakai
     * opsi_dipilih_ids; isian memakai jawaban_isian.
     *
     * @param  array<int, string>  $opsiIds
     * @return array{opsi_dipilih_id: ?string, opsi_dipilih_ids: ?string, jawaban_isian: ?string}
     */
    public static function kolomJawaban(string $tipe, array $opsiIds, ?string $jawabanIsian): array
    {
        return [
            'opsi_dipilih_id' => $tipe === 'pilihan_ganda' ? ($opsiIds[0] ?? null) : null,
            'opsi_dipilih_ids' => $tipe === 'benar_salah' ? '{'.implode(',', $opsiIds).'}' : null,
            'jawaban_isian' => $tipe === 'isian_singkat' ? $jawabanIsian : null,
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
