<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class JadwalController extends Controller
{
    public function index()
    {
        return Inertia::render('Jadwal/Index');
    }

    public function simpan()
    {
        // Logika simpan jadwal
        return back();
    }

}
