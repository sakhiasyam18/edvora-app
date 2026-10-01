<?php

file_put_contents('resources/views/emails/otp.blade.php', <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset=\"utf-8\">
    <title>Kode OTP Anda</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; }
        h2 { color: #4F46E5; font-size: 24px; margin-bottom: 10px; }
        p { font-size: 16px; color: #555; line-height: 1.5; margin-bottom: 25px; }
        .otp-box { display: inline-block; background-color: #EEF2FF; border: 2px dashed #4F46E5; padding: 15px 40px; border-radius: 8px; margin-bottom: 25px; }
        .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #4F46E5; margin: 0; user-select: all; }
        .footer { font-size: 13px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class=\"container\">
        <h2>Verifikasi Email Anda</h2>
        <p>Halo! Terima kasih telah mendaftar. Silakan gunakan kode OTP 6 digit di bawah ini untuk memverifikasi akun Anda. Anda bisa langsung menyorot (blok) dan menyalin (copy) angka di bawah ini.</p>
        
        <div class=\"otp-box\">
            <p class=\"otp-code\">{{ \ }}</p>
        </div>
        
        <p><strong>Jangan berikan kode ini kepada siapapun.</strong> Kode ini akan kedaluwarsa dalam 10 menit.</p>
        
        <div class=\"footer\">
            <p>Jika Anda tidak merasa mendaftar di aplikasi ini, silakan abaikan email ini.</p>
        </div>
    </div>
</body>
</html>
HTML
);

file_put_contents('app/Mail/OtpMail.php', <<<PHP
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public \;

    /**
     * Create a new message instance.
     */
    public function __construct(\)
    {
        \->otp = \;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kode OTP Verifikasi Anda',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
PHP
);

\ = file_get_contents('app/Models/User.php');
if (strpos(\, 'sendEmailVerificationNotification') === false) {
    \ = <<<PHP

    /**
     * Override default email verification to send OTP instead.
     */
    public function sendEmailVerificationNotification()
    {
        // Buat kode OTP acak 6 digit
        \ = (string) random_int(100000, 999999);
        
        // Simpan di Cache selama 10 menit
        \Illuminate\Support\Facades\Cache::put('otp_' . \->id, \, now()->addMinutes(10));
        
        // Kirim email
        \Illuminate\Support\Facades\Mail::to(\->email)->send(new \App\Mail\OtpMail(\));
    }
}
PHP;
    \ = preg_replace('/}[^}]*$/', \, \);
    file_put_contents('app/Models/User.php', \);
}

file_put_contents('app/Http/Controllers/Auth/OtpVerificationController.php', <<<PHP
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class OtpVerificationController extends Controller
{
    public function verify(Request \)
    {
        \->validate([
            'otp' => 'required|string|size:6'
        ]);

        \ = \->user();
        \ = Cache::get('otp_' . \->id);

        if (!\) {
            return back()->withErrors(['otp' => 'Kode OTP sudah kedaluwarsa. Silakan kirim ulang.']);
        }

        if (\->otp !== \) {
            return back()->withErrors(['otp' => 'Kode OTP salah.']);
        }

        // Lolos verifikasi
        if (\->markEmailAsVerified()) {
            event(new \Illuminate\Auth\Events\Verified(\));
        }

        Cache::forget('otp_' . \->id);

        return redirect()->route('biodata')->with('status', 'Email berhasil diverifikasi.');
    }

    public function resend(Request \)
    {
        \ = \->user();

        if (\->hasVerifiedEmail()) {
            return redirect()->route('biodata');
        }

        \->sendEmailVerificationNotification();

        return back()->with('status', 'Kode OTP baru telah dikirim ke email Anda.');
    }
}
PHP
);

echo "Success!";
?>
