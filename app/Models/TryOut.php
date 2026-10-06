<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Paket Try Out. Statusnya dihitung dari periode, tidak disimpan (RANCANGAN-tryout.md T4). dinilai_at terisi
 * setelah skor IRT paket ini tersimpan (RANCANGAN-irt.md I9).
 */
class TryOut extends Model
{
    use HasFactory, HasUuids;

    public const DRAFT = 'draft';

    public const DIBUKA = 'dibuka';

    public const DITUTUP = 'ditutup';

    // Editor mengisi jam di form (input datetime-local, tanpa zona waktu) dalam WIB; aplikasi dan database memakai UTC.
    public const ZONA_FORM = 'Asia/Jakarta';

    protected $table = 'try_out';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'judul',
        'peraturan',
        'dibuat_oleh',
        'mulai_at',
        'selesai_at',
        'dinilai_at',
    ];

    protected $casts = [
        'mulai_at' => 'datetime',
        'selesai_at' => 'datetime',
        'dinilai_at' => 'datetime',
    ];

    // Draft sebelum mulai_at, Dibuka sampai sebelum selesai_at, Ditutup sejak selesai_at.
    public static function statusPada(CarbonInterface $mulai, CarbonInterface $selesai, CarbonInterface $sekarang): string
    {
        if ($sekarang->lt($mulai)) {
            return self::DRAFT;
        }

        return $sekarang->lt($selesai) ? self::DIBUKA : self::DITUTUP;
    }

    /**
     * Nilai input datetime-local dari form editor ("2026-10-06T17:10", WIB) menjadi waktu UTC untuk disimpan.
     * utc() wajib: Eloquent menulis jam dinding Carbon apa adanya, tanpa mengubah zona waktunya.
     */
    public static function dariInputForm(string $nilai): CarbonImmutable
    {
        return CarbonImmutable::parse($nilai, self::ZONA_FORM)->utc();
    }

    /** Kebalikan dariInputForm(): waktu tersimpan menjadi nilai input datetime-local dalam WIB. */
    public static function keInputForm(CarbonInterface $waktu): string
    {
        return $waktu->copy()->setTimezone(self::ZONA_FORM)->format('Y-m-d\TH:i');
    }

    /**
     * Peraturan disimpan sebagai teks, satu baris satu aturan. Nomor di awal baris dibuang karena halaman
     * menomori sendiri.
     *
     * @return string[]
     */
    public static function pecahPeraturan(?string $teks): array
    {
        $baris = array_map(fn ($b) => trim(preg_replace('/^\s*\d+[.)]\s*/', '', $b)), preg_split('/\R/', (string) $teks));

        return array_values(array_filter($baris, fn ($b) => $b !== ''));
    }

    public function status(): string
    {
        return self::statusPada($this->mulai_at, $this->selesai_at, now());
    }

    public function scopeDibuka(Builder $query): void
    {
        $query->where('mulai_at', '<=', now())->where('selesai_at', '>', now());
    }

    public function subtesPaket()
    {
        return $this->hasMany(TryOutSubtes::class, 'try_out_id')->orderBy('urutan');
    }

    public function pengerjaan()
    {
        return $this->hasMany(Pengerjaan::class, 'try_out_id');
    }
}
