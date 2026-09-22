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

    public function ujian(Request $request)
    {
        $subtesId = $request->get('subtesId');
        
        if (!$subtesId) {
            return redirect()->route('latihan.index');
        }

        $subtes = Subtes::findOrFail($subtesId);
        
        $jumlahSoal = (int) $request->get('jumlahSoal', 10);
        
        $soalList = \App\Models\Soal::with('opsiJawaban')
            ->where('subtes_id', $subtesId)
            ->inRandomOrder()
            ->take($jumlahSoal)
            ->get();

        $mode = $request->get('mode') === 'simulasi' ? 'simulasi' : 'fleksibel';
        
        $konfigurasi = [
            'subtesId' => $subtesId,
            'namaSubtes' => $subtes->nama_subtes,
            'mode' => $mode,
            'jumlahSoal' => $soalList->count(),
        ];

        if ($mode === 'simulasi') {
            $konfigurasi['waktuPengerjaanMenit'] = (int) $request->get('waktuPengerjaanMenit', 20);
        } else {
            $konfigurasi['iceBreakingAktif'] = $request->get('iceBreakingAktif') === 'true';
        }

        return Inertia::render('Latihan/Ujian', [
            'subtes' => $subtes,
            'soalList' => $soalList,
            'konfigurasi' => $konfigurasi,
        ]);
    }
}
