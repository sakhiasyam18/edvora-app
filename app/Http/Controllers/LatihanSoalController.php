<?php

namespace App\Http\Controllers;

use App\Models\Subtes;
use Inertia\Inertia;
use Illuminate\Http\Request;

class LatihanSoalController extends Controller
{
    public function index()
    {
        $subtes = Subtes::withCount('soal')->orderBy('urutan')->get();
        return Inertia::render('Latihan/Persiapan', [
            'subtes' => $subtes
        ]);
    }
}
