<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class BattleController extends Controller
{
    public function cariLawan()
    {
        return Inertia::render('Battle/Matchmaking');
    }

    public function mulaiBattle()
    {
        return Inertia::render('Battle/Arena');
    }

    public function hasilBattle()
    {
        return Inertia::render('Battle/Hasil');
    }

}
