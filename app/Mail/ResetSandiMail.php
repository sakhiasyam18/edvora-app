<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email tautan ubah kata sandi berbahasa Indonesia, pengganti notifikasi bawaan Laravel (User::sendPasswordResetNotification).
 */
class ResetSandiMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $url, public int $menitBerlaku) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Tautan Ubah Kata Sandi Anda');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.reset-sandi');
    }

    public function attachments(): array
    {
        return [];
    }
}
