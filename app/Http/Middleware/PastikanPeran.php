<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hanya role yang disebut di parameter yang boleh lewat; selain itu 403.
 * Contoh: ->middleware('peran:admin,admin_editor'). Nilai role sama dengan enum user_role di database.
 */
class PastikanPeran
{
    public function handle(Request $request, Closure $next, string ...$peran): Response
    {
        abort_unless(in_array($request->user()?->role, $peran, true), 403);

        return $next($request);
    }
}
