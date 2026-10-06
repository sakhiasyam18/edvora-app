<?php

namespace App\Http\Controllers;

use App\Services\LevelXp;
use App\Services\PemeriksaBadge;
use App\Services\TokoAvatar;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Toko Avatar di Akun Pribadi (UCS5 2b, RANCANGAN-badge-avatar.md bagian 5 dan 6).
 */
class AvatarController extends Controller
{
    // UCS5 2b.5a.
    private const PESAN_GAGAL = 'Avatar Belum Berhasil Diperbarui';

    public function index(Request $request, TokoAvatar $toko): Response
    {
        $siswa = $request->user()->siswa;

        return Inertia::render('Akun/Avatar', [
            'totalPoint' => (int) $siswa->point,
            'level' => LevelXp::dariXp((int) $siswa->xp)['level'],
            'avatars' => $toko->daftar($siswa),
        ]);
    }

    public function beli(Request $request, TokoAvatar $toko, PemeriksaBadge $badge): RedirectResponse
    {
        $avatarId = $request->input('avatarId');

        if (! is_string($avatarId) || ! Str::isUuid($avatarId)) {
            Inertia::flash('error', self::PESAN_GAGAL);

            return back();
        }

        try {
            $gagal = $toko->beli(Auth::id(), $avatarId);
        } catch (Throwable $e) {
            report($e);
            Inertia::flash('error', self::PESAN_GAGAL);

            return back();
        }

        if ($gagal !== null) {
            Inertia::flash('error', $gagal);

            return back();
        }

        // Kolektor Avatar, sesudah transaksi pembelian (RANCANGAN-badge-avatar.md 4.4).
        $badge->periksa(Auth::id(), now());

        Inertia::flash('sukses', 'Avatar berhasil dibeli');

        return back();
    }

    public function pakai(Request $request, TokoAvatar $toko): RedirectResponse
    {
        // null = kembali ke Default.
        $avatarId = $request->input('avatarId');

        if ($avatarId !== null && (! is_string($avatarId) || ! Str::isUuid($avatarId))) {
            Inertia::flash('error', self::PESAN_GAGAL);

            return back();
        }

        try {
            $berhasil = $toko->pakai(Auth::id(), $avatarId);
        } catch (Throwable $e) {
            // UCS5 2b.5a: penggantian yang gagal (mis. koneksi database putus) tetap menampilkan pesan, bukan error 500.
            report($e);
            $berhasil = false;
        }

        if ($berhasil) {
            Inertia::flash('sukses', 'Avatar berhasil digunakan');
        } else {
            Inertia::flash('error', self::PESAN_GAGAL);
        }

        return back();
    }
}
