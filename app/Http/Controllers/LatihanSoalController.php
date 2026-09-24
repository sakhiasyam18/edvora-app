<?php

namespace App\Http\Controllers;

use App\Models\Subtes;
use App\Models\Soal;
use App\Models\OpsiJawaban;
use App\Models\Pengerjaan;
use App\Models\JawabanPengerjaan;
use App\Models\Siswa;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

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
        
        $soalList = Soal::with(['opsiJawaban' => fn($q) => $q->orderBy('urutan')])
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

    public function simpanJawaban(Request $request)
    {
        if ($request->get('aksi') === 'keluar') {
            return redirect()->route('dashboard');
        }

        $jawabanList = $request->get('jawaban', []); // Array of { soalId, opsiId }
        $subtesId = $request->get('subtesId');
        $iceBreakingAktif = $request->boolean('iceBreakingAktif');

        $pengerjaan = DB::transaction(function () use ($jawabanList, $subtesId, $iceBreakingAktif) {
            $p = Pengerjaan::create([
                'user_id' => Auth::id(),
                'tipe' => 'latihan_bebas',
                'status' => 'selesai',
                'subtes_id' => $subtesId,
                'jumlah_soal_dipilih' => count($jawabanList),
                'ice_breaking_aktif' => $iceBreakingAktif,
                'started_at' => now(),
                'finished_at' => now(),
                'total_skor' => 0
            ]);

            // Ambil semua kunci jawaban sekali jalan - hindari N+1 query.
            $kunci = OpsiJawaban::whereIn('id', array_column($jawabanList, 'opsiId'))
                ->pluck('is_kunci', 'id');

            $jawabanModel = new JawabanPengerjaan;
            $waktuMenjawab = now()->toDateTimeString();
            $baris = [];
            $jumlahBenar = 0;
            $totalSkor = 0;

            foreach ($jawabanList as $j) {
                $isCorrect = (bool) ($kunci[$j['opsiId']] ?? false);
                $skor = $isCorrect ? 10 : 0;

                $baris[] = [
                    'id' => $jawabanModel->newUniqueId(),
                    'pengerjaan_id' => $p->id,
                    'pengerjaan_subtes_id' => null,
                    'soal_id' => $j['soalId'],
                    'opsi_dipilih_id' => $j['opsiId'],
                    'jawaban_isian' => null,
                    'is_correct' => $isCorrect,
                    'skor' => $skor,
                    'waktu_menjawab' => $waktuMenjawab,
                ];

                if ($isCorrect) {
                    $jumlahBenar++;
                }
                $totalSkor += $skor;
            }

            if ($baris) {
                JawabanPengerjaan::insert($baris);
            }

            $p->update(['total_skor' => $totalSkor]);

            $xpDidapat = ($jumlahBenar * 15) + 10;

            Siswa::where('user_id', Auth::id())->update([
                'xp' => DB::raw('xp + ' . (int) $xpDidapat),
                'point' => DB::raw('point + ' . (int) $totalSkor),
            ]);

            return $p;
        });

        return redirect()->route('latihan.hasil', ['id' => $pengerjaan->id]);
    }

    public function hasil(Request $request)
    {
        $id = $request->get('id');
        $pengerjaan = Pengerjaan::with('jawabanPengerjaan')->where('user_id', Auth::id())->findOrFail($id);
        
        $jumlahBenar = $pengerjaan->jawabanPengerjaan->where('is_correct', true)->count();
        $jumlahSalah = $pengerjaan->jawabanPengerjaan->where('is_correct', false)->count();
        
        $xpDidapat = ($jumlahBenar * 15) + 10;
        
        $hasil = [
            'jumlahBenar' => $jumlahBenar,
            'jumlahSalah' => $jumlahSalah,
            'poin' => (int) $pengerjaan->total_skor,
            'xpDidapat' => $xpDidapat,
        ];

        return Inertia::render('Latihan/Hasil', [
            'hasil' => $hasil,
            'pengerjaan' => $pengerjaan
        ]);
    }
}
