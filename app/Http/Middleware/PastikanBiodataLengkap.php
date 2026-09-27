<?php

namespace App\Http\Middleware;

use App\Models\Siswa;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Siswa yang belum memilih universitas dan prodi tujuan diarahkan ke halaman Biodata.
 */
class PastikanBiodataLengkap
{
    public const KUNCI_SESSION = 'biodata_lengkap';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'siswa' || $request->session()->get(self::KUNCI_SESSION)) {
            return $next($request);
        }

        // Dicek sekali per sesi login; hasilnya disimpan di session agar request berikutnya tanpa query.
        if (Siswa::whereKey($user->id)->whereNotNull('prodi_tujuan_id')->exists()) {
            $request->session()->put(self::KUNCI_SESSION, true);

            return $next($request);
        }

        // guest() mengingat URL yang dituju (hanya untuk GET); BiodataController memakainya lewat intended().
        return redirect()->guest(route('biodata'));
    }
}
