<?php

namespace Tests\Unit;

use App\Http\Controllers\AvatarController;
use App\Models\User;
use App\Services\TokoAvatar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Exceptions;
use Inertia\Inertia;
use RuntimeException;
use Tests\TestCase;

/**
 * Tanpa database: TokoAvatar diganti stub, dan session memakai driver array (phpunit.xml).
 */
class AvatarControllerTest extends TestCase
{
    public function test_pakai_yang_gagal_karena_error_database_menampilkan_pesan_ucs(): void
    {
        Exceptions::fake();

        $user = new User;
        $user->id = '00000000-0000-0000-0000-000000000001';
        $this->actingAs($user);

        $request = Request::create('/akun/avatar/pakai', 'POST', ['avatarId' => null]);
        $request->setLaravelSession($this->app['session.store']);
        $this->app->instance('request', $request);

        // Mis. koneksi ke Supabase putus saat UPDATE (UCS5 2b.5a).
        $toko = new class extends TokoAvatar
        {
            public function pakai(string $userId, ?string $avatarId): bool
            {
                throw new RuntimeException('koneksi putus');
            }
        };

        (new AvatarController)->pakai($request, $toko);

        $this->assertSame('Avatar Belum Berhasil Diperbarui', Inertia::getFlashed($request)['error'] ?? null);
        Exceptions::assertReported(RuntimeException::class);
    }
}
