<?php

namespace App\Http\Middleware;

use App\Models\Subtes;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            // Submenu Bank Soal di sidebar editor. Closure: query hanya jalan untuk editor.
            'menuBankSoal' => fn () => $request->user()?->role === 'admin_editor'
                ? Subtes::orderBy('urutan')->get(['kode_subtes', 'nama_subtes'])
                    ->map(fn (Subtes $s) => ['kode' => $s->kode_subtes, 'nama' => $s->nama_subtes])
                : null,
        ];
    }
}
