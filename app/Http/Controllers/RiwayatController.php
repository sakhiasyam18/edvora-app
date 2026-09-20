<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class RiwayatController extends Controller
{
    public function index()
    {
        return Inertia::render('Riwayat/Index');
    }

    public function pembahasan()
    {
        return Inertia::render('Riwayat/Pembahasan');
    }

}
