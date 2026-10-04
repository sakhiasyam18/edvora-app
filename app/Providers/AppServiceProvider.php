<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Foundation\Console\ServeCommand;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        if (PHP_OS_FAMILY === 'Windows') {
            ServeCommand::$passthroughVariables[] = 'SystemRoot';
        }

        // Waktu login terakhir: "aktif hari ini" di Dashboard Admin dan "terakhir login" di Informasi Akun (UCS6).
        // Event Login juga terpicu saat masuk lewat "ingat saya" dan setelah registrasi.
        // toBase(): updated_at tidak ikut berubah hanya karena user login.
        Event::listen(function (Login $event) {
            User::whereKey($event->user->getAuthIdentifier())->toBase()->update(['terakhir_login_at' => now()]);
        });
    }
}
