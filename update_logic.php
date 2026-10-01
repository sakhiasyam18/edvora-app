<?php

// 1. Update routes/auth.php
$authPath = 'routes/auth.php';
$authContent = file_get_contents($authPath);

// Define exactly what to replace
$oldRoutes = <<<PHP
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
PHP;

$newRoutes = <<<PHP
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

// normalize line endings to be safe
$authContent = str_replace(str_replace("\r\n", "\n", $oldRoutes), $newRoutes, str_replace("\r\n", "\n", $authContent));
file_put_contents($authPath, $authContent);


// 2. Update VerifyEmail.tsx
$tsxPath = 'resources/js/Pages/Auth/VerifyEmail.tsx';
$tsxContent = file_get_contents($tsxPath);

$oldHandle = <<<TSX
    const handleVerification = () => {
        const fullCode = otp.join('');
        if (fullCode.length < 6) {
            setHasError(true);
            return;
        }

        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);
            setIsVerified(true);
            setTimeout(() => {
                router.visit('/biodata');
            }, 1000);
        }, 1200);
    };
TSX;

$newHandle = <<<TSX
    const handleVerification = () => {
        const fullCode = otp.join('');
        if (fullCode.length < 6) {
            setHasError(true);
            return;
        }

        setIsVerifying(true);
        router.post(route('otp.verify'), { otp: fullCode }, {
            onFinish: () => setIsVerifying(false),
            onSuccess: () => setIsVerified(true),
            onError: () => {
                setHasError(true);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        });
    };
TSX;

$tsxContent = str_replace(str_replace("\r\n", "\n", $oldHandle), $newHandle, str_replace("\r\n", "\n", $tsxContent));
file_put_contents($tsxPath, $tsxContent);

echo "Success!";
?>
