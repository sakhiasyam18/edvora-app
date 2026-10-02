<?php

namespace App\Services;

/**
 * Level global siswa dari total XP (SDD 5.3.6). XP untuk naik dari level L adalah 300 × L:
 * level 1 → 2 butuh 300, level 2 → 3 butuh 600, level 3 → 4 butuh 900, dst.
 * Total XP untuk mencapai level L = 150 × L × (L − 1): level 2 = 300, level 3 = 900, level 4 = 1.800.
 *
 * Terpisah dari tahap per topik (Penguasaan): level hanya untuk motivasi dan tidak memengaruhi soal.
 */
class LevelXp
{
    public const KENAIKAN_PER_LEVEL = 300;

    /** Total XP minimal untuk berada di level ini. */
    public static function xpMinimal(int $level): int
    {
        // L × (L − 1) selalu genap, jadi pembagiannya selalu bulat.
        return intdiv(self::KENAIKAN_PER_LEVEL * $level * ($level - 1), 2);
    }

    /**
     * Level dan kemajuan menuju level berikutnya. Bar dihitung dari xpLevelIni ke xpLevelBerikutnya,
     * sedangkan angka yang ditampilkan adalah total XP (mis. 244 / 600 XP).
     *
     * @return array{level: int, xp: int, xpLevelIni: int, xpLevelBerikutnya: int, persen: float}
     */
    public static function dariXp(int $xp): array
    {
        $xp = max(0, $xp);
        $level = 1;

        // Loop pendek: level 30 baru tercapai di 130.500 XP.
        while ($xp >= self::xpMinimal($level + 1)) {
            $level++;
        }

        $awal = self::xpMinimal($level);
        $berikutnya = self::xpMinimal($level + 1);

        return [
            'level' => $level,
            'xp' => $xp,
            'xpLevelIni' => $awal,
            'xpLevelBerikutnya' => $berikutnya,
            'persen' => round(100 * ($xp - $awal) / ($berikutnya - $awal), 1),
        ];
    }
}
