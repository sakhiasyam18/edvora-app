<?php

namespace Tests\Unit;

use App\Services\LevelXp;
use PHPUnit\Framework\TestCase;

class LevelXpTest extends TestCase
{
    public function test_xp_minimal_tiap_level_sesuai_sdd(): void
    {
        $this->assertSame(0, LevelXp::xpMinimal(1));
        $this->assertSame(300, LevelXp::xpMinimal(2));
        $this->assertSame(900, LevelXp::xpMinimal(3));
        $this->assertSame(1800, LevelXp::xpMinimal(4));
        $this->assertSame(3000, LevelXp::xpMinimal(5));
    }

    public function test_level_dari_total_xp(): void
    {
        foreach ([0 => 1, 299 => 1, 300 => 2, 899 => 2, 900 => 3, 1799 => 3, 1800 => 4] as $xp => $level) {
            $this->assertSame($level, LevelXp::dariXp($xp)['level'], "{$xp} XP");
        }
    }

    public function test_kemajuan_menuju_level_berikutnya(): void
    {
        $this->assertSame(
            ['level' => 2, 'xp' => 600, 'xpLevelIni' => 300, 'xpLevelBerikutnya' => 900, 'persen' => 50.0],
            LevelXp::dariXp(600),
        );
    }

    public function test_xp_negatif_dianggap_nol(): void
    {
        $this->assertSame(1, LevelXp::dariXp(-50)['level']);
    }
}
