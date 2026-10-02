<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Paket Try Out. Statusnya dihitung dari periode, tidak disimpan (RANCANGAN-tryout.md T4).
 */
class TryOut extends Model
{
    use HasFactory, HasUuids;

    public const DRAFT = 'draft';

    public const DIBUKA = 'dibuka';

    public const DITUTUP = 'ditutup';

    protected $table = 'try_out';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'judul',
        'peraturan',
        'dibuat_oleh',
        'mulai_at',
        'selesai_at',
    ];

    protected $casts = [
        'mulai_at' => 'datetime',
        'selesai_at' => 'datetime',
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
}
