<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hanya role yang disebut di parameter yang boleh lewat.
 * Role lain yang membuka halaman (GET) diarahkan ke berandanya sendiri, misalnya editor yang dibawa URL intended
 * atau tombol Dashboard ke Beranda siswa. Permintaan selain GET tetap 403.
 * Contoh: ->middleware('peran:admin,admin_editor'). Nilai role sama dengan enum user_role di database.
 */
class PastikanPeran
{
    public function handle(Request $request, Closure $next, string ...$peran): Response
    {
        $user = $request->user();

        if (in_array($user?->role, $peran, true)) {
            return $next($request);
        }

        // Rute beranda selalu mengizinkan role pemiliknya, jadi redirect ini tidak berulang.
        $beranda = $user?->ruteBeranda();
        abort_unless($beranda && $request->isMethod('GET'), 403);

        return redirect()->route($beranda);
    }
}
