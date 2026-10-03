<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kode OTP Anda</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; }
        h2 { color: #4F46E5; font-size: 24px; margin-bottom: 10px; }
        p { font-size: 16px; color: #555; line-height: 1.5; margin-bottom: 25px; }
        .otp-box { display: inline-block; background-color: #EEF2FF; border: 2px dashed #4F46E5; padding: 15px 40px; border-radius: 8px; margin-bottom: 25px; }
        .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #4F46E5; margin: 0; user-select: all; cursor: copy; }
        .footer { font-size: 13px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Verifikasi Email Anda</h2>
        <p>Halo! Terima kasih telah mendaftar. Silakan gunakan kode OTP 6 digit di bawah ini untuk memverifikasi akun Anda. Anda bisa langsung menyorot (blok) dan menyalin (copy) angka di bawah ini.</p>
        <div class="otp-box">
            <p class="otp-code">{{ $otp }}</p>
        </div>
        <p><strong>Jangan berikan kode ini kepada siapapun.</strong> Kode ini akan kedaluwarsa dalam 10 menit.</p>
        <div class="footer">
            <p>Jika Anda tidak merasa mendaftar di aplikasi ini, silakan abaikan email ini.</p>
        </div>
    </div>
</body>
</html>
