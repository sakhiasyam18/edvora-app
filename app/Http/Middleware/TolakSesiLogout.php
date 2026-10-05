<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sesi yang sudah logout tidak boleh dipakai lagi.
 * Request lambat (mis. prefetch Inertia) yang mulai sebelum logout tetap menulis ulang file sesi lama
 * saat selesai, dan cookie balasannya bisa mengembalikan browser ke ID itu dalam keadaan login.
 * Logout mencatat ID sesinya lewat tandai(); di sini sesi tersebut dibuang sebelum middleware auth berjalan.
 */
class TolakSesiLogout
{
    public static function tandai(string $idSesi): void
    {
        Cache::put(self::kunci($idSesi), true, now()->addMinutes((int) config('session.lifetime')));
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (Cache::has(self::kunci($request->session()->getId()))) {
            $request->session()->invalidate();
        }

        return $next($request);
    }

    private static function kunci(string $idSesi): string
    {
        return 'sesi_logout:'.$idSesi;
    }
}
