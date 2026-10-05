<?php

namespace App\Models;

use App\Mail\OtpMail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, HasUuids, Notifiable;

    protected $table = 'users';

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'email_verified_at',
    ];

    public function siswa()
    {
        return $this->hasOne(Siswa::class, 'user_id', 'id');
    }

    public function adminEditor()
    {
        return $this->hasOne(AdminEditor::class, 'user_id', 'id');
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'terakhir_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Jeda minimal antar-pengiriman OTP; dasar hitung mundur tombol Kirim Ulang.
     */
    public const JEDA_KIRIM_OTP_DETIK = 60;

    /**
     * Override default email verification untuk mengirim OTP angka.
     */
    public function sendEmailVerificationNotification()
    {
        // 1. Buat angka acak 6 digit
        $otp = (string) random_int(100000, 999999);

        // 2. Kirim dulu: kalau SMTP gagal, OTP lama tetap berlaku dan jeda Kirim Ulang tidak dimulai.
        Mail::to($this->email)->send(new OtpMail($otp));

        // 3. Simpan di Cache selama 10 menit menggunakan ID User, beserta waktu kirimnya untuk jeda Kirim Ulang.
        Cache::put('otp_'.$this->id, $otp, now()->addMinutes(10));
        Cache::put('otp_dikirim_'.$this->id, now()->getTimestamp(), self::JEDA_KIRIM_OTP_DETIK);
    }

    /**
     * Masih ada OTP yang berlaku (belum kedaluwarsa dan belum dipakai).
     */
    public function punyaOtpAktif(): bool
    {
        return Cache::has('otp_'.$this->id);
    }

    /**
     * Detik yang tersisa sebelum Kirim Ulang boleh ditekan; 0 = boleh sekarang.
     */
    public function sisaJedaKirimOtp(): int
    {
        $dikirim = Cache::get('otp_dikirim_'.$this->id);

        return $dikirim === null ? 0 : max(0, self::JEDA_KIRIM_OTP_DETIK - (now()->getTimestamp() - (int) $dikirim));
    }
}
