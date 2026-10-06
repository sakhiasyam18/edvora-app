<?php

namespace App\Http\Controllers;

use App\Services\DataAnalitik;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**

 */
class AnalitikController extends Controller
{
    public function index(DataAnalitik $data): Response
    {
        try {
            $analitik = $data->ambil();
        } catch (Throwable $e) {
            // UCS9 2a: halaman tetap terbuka dengan pesan "Gagal Menampilkan Data, Coba Lagi Nanti!".
            report($e);
            $analitik = null;
        }

        return Inertia::render('Editor/Analitik', ['analitik' => $analitik]);
    }
}
