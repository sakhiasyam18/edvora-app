<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Ubah Kata Sandi</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; }
        h2 { color: #4F46E5; font-size: 24px; margin-bottom: 10px; }
        p { font-size: 16px; color: #555; line-height: 1.5; margin-bottom: 25px; }
        .tombol { display: inline-block; background-color: #4F46E5; color: #ffffff !important; text-decoration: none; font-weight: 700; padding: 14px 32px; border-radius: 8px; margin-bottom: 25px; }
        .tautan { font-size: 13px; color: #999; word-break: break-all; }
        .footer { font-size: 13px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Ubah Kata Sandi</h2>
        <p>Halo! Kami menerima permintaan untuk mengubah kata sandi akun Anda. Tekan tombol di bawah ini untuk membuat kata sandi baru.</p>
        <a class="tombol" href="{{ $url }}">Ubah Kata Sandi</a>
        <p><strong>Jangan berikan tautan ini kepada siapapun.</strong> Tautan ini akan kedaluwarsa dalam {{ $menitBerlaku }} menit.</p>
        <p class="tautan">Jika tombol tidak bisa ditekan, salin tautan berikut ke browser Anda:<br>{{ $url }}</p>
        <div class="footer">
            <p>Jika Anda tidak meminta perubahan kata sandi, silakan abaikan email ini. Kata sandi Anda tidak akan berubah.</p>
        </div>
    </div>
</body>
</html>
