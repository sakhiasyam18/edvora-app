<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    /**
     * Display the landing page (Company Pack).
     */
    public function index()
    {
        return Inertia::render('Welcome');
    }
}
