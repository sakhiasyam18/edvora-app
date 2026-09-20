<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminSoalController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/KelolaSoal');
    }

    public function simpan()
    {
        // Logika simpan soal
        return back();
    }

}
