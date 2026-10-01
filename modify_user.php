<?php

\ = 'app/Models/User.php';
\ = file_get_contents(\);
if (strpos(\, 'sendEmailVerificationNotification') === false) {
    \ = <<<PHP

    /**
     * Override default email verification to send OTP instead.
     */
    public function sendEmailVerificationNotification()
    {
        \ = (string) random_int(100000, 999999);
        \Illuminate\Support\Facades\Cache::put('otp_' . \->id, \, now()->addMinutes(10));
        \Illuminate\Support\Facades\Mail::to(\->email)->send(new \App\Mail\OtpMail(\));
    }
}
PHP;
    \ = preg_replace('/}[^}]*$/', \, \);
    file_put_contents(\, \);
}

\ = 'routes/auth.php';
\ = file_get_contents(\);
// Ganti rute verifikasi default
if (strpos(\, 'verify-email/{id}/{hash}') !== false) {
    \ = <<<PHP
    Route::get('verify-email', function () {
        return Inertia\Inertia::render('Auth/VerifyEmail');
    })->name('verification.notice');

    Route::post('verify-otp', [\App\Http\Controllers\Auth\OtpVerificationController::class, 'verify'])
                ->middleware('throttle:6,1')
                ->name('otp.verify');

    Route::post('email/verification-notification', [\App\Http\Controllers\Auth\OtpVerificationController::class, 'resend'])
                ->middleware('throttle:6,1')
                ->name('verification.send');
PHP;
    \ = preg_replace("/Route::get\('verify-email',.*?->name\('verification\.send'\);/s", \, \);
    file_put_contents(\, \);
}

echo 'Modification Done';
?>
