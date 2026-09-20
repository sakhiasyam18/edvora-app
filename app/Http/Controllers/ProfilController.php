<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfilController extends Controller
{
    public function index()
    {
        return Inertia::render('Akun/Profil');
    }

    public function update()
    {
        // Logika update profil
        return back();
    }

}
