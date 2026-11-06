<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

/**
 * Riwayat generate soal AI per editor: parameter permintaan, hasil JSON dari model, dan berapa soal yang sudah
 * disimpan ke bank soal. Soal yang disimpan tetap memakai tabel soal/opsi_jawaban; tabel ini hanya jejak generate.
 */
class GeneratorSoal extends Model
{
    use HasUuids;

    // dibuat: hasil AI belum disimpan; sebagian/tersimpan: jumlah soal yang sudah masuk bank soal.
    public const STATUS = ['dibuat', 'sebagian', 'tersimpan'];

    protected $table = 'generator_soal';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'editor_id',
        'subtes_id',
        'topik_id',
        'tingkat_kesulitan',
        'tipe',
        'tipe_soal',
        'model_ai',
        'jumlah_soal',
        'permintaan',
        'hasil',
        'status',
        'jumlah_tersimpan',
        'kode_tersimpan',
    ];

    protected $casts = [
        'permintaan' => 'array',
        'hasil' => 'array',
        'kode_tersimpan' => 'array',
        'jumlah_soal' => 'integer',
        'jumlah_tersimpan' => 'integer',
    ];

    public function editor()
    {
        return $this->belongsTo(AdminEditor::class, 'editor_id', 'user_id');
    }

    public function subtes()
    {
        return $this->belongsTo(Subtes::class, 'subtes_id');
    }

    public function topik()
    {
        return $this->belongsTo(Topik::class, 'topik_id');
    }

    /**
     * Riwayat hanya pelengkap: bila migrasinya belum dijalankan, generator tetap bisa dipakai tanpa riwayat.
     */
    public static function tabelSiap(): bool
    {
        return Schema::hasTable('generator_soal');
    }
}
