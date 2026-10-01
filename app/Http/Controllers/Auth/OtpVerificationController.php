<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class OtpVerificationController extends Controller
{
    public function verify(Request $request)
    {
        $request->validate(['otp' => 'required|string|size:6']);
        $user = $request->user();
        $cachedOtp = Cache::get('otp_' . $user->id);

        if (!$cachedOtp) {
            return back()->withErrors(['otp' => 'Kode OTP sudah kedaluwarsa. Silakan kirim ulang.']);
        }
        if ($request->otp !== $cachedOtp) {
            return back()->withErrors(['otp' => 'Kode OTP salah.']);
        }

        if ($user->markEmailAsVerified()) {
            event(new \Illuminate\Auth\Events\Verified($user));
        }
        Cache::forget('otp_' . $user->id);

        return redirect()->route('biodata')->with('status', 'Email berhasil diverifikasi.');
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
