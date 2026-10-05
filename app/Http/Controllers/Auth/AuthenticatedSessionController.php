<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Admin (UCS6) dan editor (UCS7-9) punya halaman sendiri; siswa ke Beranda.
        // URL intended milik role lain dibelokkan PastikanPeran ke beranda role ini.
        $tujuan = route($request->user()->ruteBeranda() ?? 'dashboard', absolute: false);

        return redirect()->intended($tujuan);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): SymfonyResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        // Muat ulang penuh, bukan kunjungan Inertia: cache prefetch dan state halaman akun lama
        // ada di memori browser dan bisa tampil ke akun berikutnya selama 30 detik.
        return Inertia::location(url('/'));
    }
}
