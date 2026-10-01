<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, HasUuids;

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
    ];

    public function siswa()
    {
        return $this->hasOne(Siswa::class, 'user_id', 'id');
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
            'password' => 'hashed',
        ];
    }

    /**
     * Override default email verification untuk mengirim OTP angka.
     */
    public function sendEmailVerificationNotification()
    {
        // 1. Buat angka acak 6 digit
        $otp = (string) random_int(100000, 999999);
        
        // 2. Simpan di Cache selama 10 menit menggunakan ID User
        \Illuminate\Support\Facades\Cache::put('otp_' . $this->id, $otp, now()->addMinutes(10));
        
        // 3. Kirim template email cantik yang tadi saya buat
        \Illuminate\Support\Facades\Mail::to($this->email)->send(new \App\Mail\OtpMail($otp));
    }

}
