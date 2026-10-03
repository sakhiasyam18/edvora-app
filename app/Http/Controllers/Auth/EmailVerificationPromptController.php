<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class EmailVerificationPromptController extends Controller
{
    /**
     * Halaman verifikasi email (OTP).
     * OTP dikirim otomatis bila belum ada yang berlaku, mis. siswa masuk lewat Login atau OTP lama sudah kedaluwarsa.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        // Pesan dari Kirim Ulang (OtpVerificationController::resend).
        $status = session('status');
        $gagalKirim = false;

        // Cek cache dulu, supaya memuat ulang halaman tidak mengirim email baru.
        if (! $user->punyaOtpAktif()) {
            try {
                $user->sendEmailVerificationNotification();
                $status = 'Kode OTP telah dikirim ke email Anda.';
            } catch (TransportExceptionInterface $e) {
                // SMTP gagal: halaman tetap tampil dan siswa bisa mencoba lagi lewat Kirim Ulang.
                report($e);
                $gagalKirim = true;
            }
        }

        return Inertia::render('Auth/VerifyEmail', [
            'status' => $status,
            'gagalKirim' => $gagalKirim,
            'jedaKirimUlang' => $user->sisaJedaKirimOtp(),
        ]);
    }
}
