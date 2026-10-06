<?php

namespace App\Services;

use App\Models\Siswa;
use App\Models\TransaksiPoin;
use App\Models\TransaksiXp;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * XP dan poin untuk jawaban latihan (SDD 5.3.6 dan 5.3.7, RANCANGAN-penyesuaian-sdd.md bagian 4).
 * Hanya jawaban benar yang mendapat hadiah; jawaban benar dengan hint mendapat setengahnya, dibulatkan ke bawah.
 * Hint hanya bisa dibuka di fleksibel dan remedial, jadi di simulasi pakai_hint selalu false.
 * Nilai 0,5 untuk hint di skor topik (Penguasaan::NILAI_HINT) adalah aturan terpisah.
 */
class PenilaianLatihan
{
    public const XP = ['mudah' => 5, 'sedang' => 10, 'sulit' => 15];

    public const POIN = ['mudah' => 3, 'sedang' => 5, 'sulit' => 8];

    /**
     * @return array{xp: int, poin: int}
     */
    public static function hadiah(string $tingkat, bool $benar, bool $pakaiHint): array
    {
        $xp = self::XP[$tingkat] ?? throw new InvalidArgumentException("Tingkat kesulitan \"{$tingkat}\" tidak dikenal.");
        $poin = self::POIN[$tingkat];

        if (! $benar) {
            return ['xp' => 0, 'poin' => 0];
        }

        return $pakaiHint
            ? ['xp' => intdiv($xp, 2), 'poin' => intdiv($poin, 2)]
            : ['xp' => $xp, 'poin' => $poin];
    }

    /**
     * Tambahkan XP dan poin satu sesi ke siswa beserta catatannya (K12). Jumlah 0 tidak dicatat.
     * Dipanggil di dalam transaksi simpanJawaban(), sesudah pengerjaan dibuat. pengerjaan.user_id merujuk ke
     * siswa, jadi baris siswa untuk $userId pasti ada.
     */
    public function catatHadiah(string $userId, string $pengerjaanId, int $xp, int $poin, DateTimeInterface $waktu): void
    {
        $catatan = ['user_id' => $userId, 'sumber_tipe' => 'pengerjaan', 'pengerjaan_id' => $pengerjaanId, 'created_at' => $waktu];

        if ($xp > 0) {
            TransaksiXp::create($catatan + ['jumlah' => $xp]);
        }

        if ($poin > 0) {
            TransaksiPoin::create($catatan + ['jumlah' => $poin]);
        }

        Siswa::where('user_id', $userId)->update([
            'xp' => DB::raw('xp + '.$xp),
            'point' => DB::raw('point + '.$poin),
        ]);
    }
}
