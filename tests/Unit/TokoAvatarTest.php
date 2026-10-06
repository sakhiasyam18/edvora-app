<?php

namespace Tests\Unit;

use App\Models\Avatar;
use App\Services\TokoAvatar;
use PHPUnit\Framework\TestCase;

class TokoAvatarTest extends TestCase
{
    public function test_avatar_belum_dimiliki_terkunci_bila_level_kurang(): void
    {
        $this->assertSame('terkunci', TokoAvatar::status(2, 3, false, false));
        $this->assertSame('terbuka', TokoAvatar::status(3, 3, false, false));
    }

    public function test_avatar_dimiliki_dan_dipakai(): void
    {
        $this->assertSame('dimiliki', TokoAvatar::status(5, 3, true, false));
        $this->assertSame('dipakai', TokoAvatar::status(5, 3, true, true));
    }

    public function test_avatar_milik_siswa_tidak_terkunci_walau_syarat_level_dinaikkan(): void
    {
        // Tim bisa menaikkan level_minimal setelah avatar dibeli; avatar itu tetap bisa dipakai.
        $this->assertSame('dimiliki', TokoAvatar::status(3, 10, true, false));
        $this->assertSame('dipakai', TokoAvatar::status(3, 10, true, true));
    }

    public function test_gambar_mengikuti_jenis_kelamin(): void
    {
        $avatar = new Avatar(['gambar_perempuan' => '/p.png', 'gambar_laki_laki' => '/l.png']);

        $this->assertSame('/p.png', TokoAvatar::urlGambar($avatar, 'perempuan'));
        $this->assertSame('/l.png', TokoAvatar::urlGambar($avatar, 'laki-laki'));
    }

    public function test_default_dan_jenis_kelamin_kosong(): void
    {
        $avatar = new Avatar(['gambar_perempuan' => '/p.png', 'gambar_laki_laki' => '/l.png']);

        $this->assertSame('/images/avatar/default-perempuan.webp', TokoAvatar::urlGambar(null, 'perempuan'));
        $this->assertSame('/images/avatar/default-laki-laki.webp', TokoAvatar::urlGambar(null, null));
        $this->assertSame('/l.png', TokoAvatar::urlGambar($avatar, null));
    }
}
