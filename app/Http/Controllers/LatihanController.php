<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class LatihanController extends Controller
{
    public function persiapan()
    {
        return Inertia::render('Latihan/Persiapan');
    }

    public function mulaiUjian()
    {
        return Inertia::render('Latihan/Ujian');
    }

    public function simpanJawaban()
    {
        // Logika simpan jawaban
        return back();
    }

    public function hasil()
    {
        return Inertia::render('Latihan/Hasil');
    }

}
