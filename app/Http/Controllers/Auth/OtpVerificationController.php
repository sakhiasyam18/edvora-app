<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class OtpVerificationController extends Controller
{
    public function verify(Request $request)
    {
        $request->validate(['otp' => 'required|string|size:6']);
        $user = $request->user();
        $cachedOtp = Cache::get('otp_'.$user->id);

        if (! $cachedOtp) {
            // back() membuka lagi halaman verifikasi, yang langsung mengirim kode baru (EmailVerificationPromptController).
            return back()->withErrors(['otp' => 'Kode OTP sudah kedaluwarsa.']);
        }
        if ($request->otp !== $cachedOtp) {
            return back()->withErrors(['otp' => 'Kode OTP salah.']);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }
        Cache::forget('otp_'.$user->id);

        // intended(): pakai URL yang disimpan middleware verified (Redirect::guest), supaya tidak tertinggal di session
        // dan membelokkan redirect()->intended() berikutnya di BiodataController::simpan ke /biodata lagi.
        return redirect()->intended(route('biodata', absolute: false))->with('status', 'Email berhasil diverifikasi.');
    }

    public function resend(Request $request)
    {
        $user = $request->user();
        if ($user->hasVerifiedEmail()) {
            return redirect()->route('biodata');
        }
        $user->sendEmailVerificationNotification();

        return back()->with('status', 'Kode OTP baru telah dikirim ke email Anda.');
    }
}
