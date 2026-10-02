<?php

namespace App\Http\Controllers;

use App\Models\Pengerjaan;
use App\Models\JawabanPengerjaan;
use App\Services\PembahasanPengerjaan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RiwayatController extends Controller
{
    /**
     * Menampilkan daftar riwayat pengerjaan user.
     */
   public function index(Request $request)
    {
        $userId = auth()->id();
        $search = $request->input('search');

        $riwayatQuery = \App\Models\Pengerjaan::with(['subtes', 'pengerjaanTryout'])
            ->where('user_id', $userId);

        if ($search) {
            $riwayatQuery->where(function ($q) use ($search) {
                $q->whereHas('subtes', function ($sub) use ($search) {
                    $sub->where('nama_subtes', 'ilike', '%' . $search . '%');
                })->orWhereHas('pengerjaanTryout', function ($to) use ($search) {
                    $to->where('judul', 'ilike', '%' . $search . '%');
                });
            });
        }

        $riwayat = $riwayatQuery->orderBy('started_at', 'desc')
            ->paginate(12)
            ->withQueryString()
            ->through(function ($item) {
                // 1. Ambil nama subtes
                $namaMateri = $item->subtes ? $item->subtes->nama_subtes : '';
                $jenisPengerjaan = '';

                // 2. Tentukan Jenis Pengerjaan berdasarkan Mode / Try Out
                if ($item->try_out_id && $item->pengerjaanTryout) {
                    $jenisPengerjaan = $item->pengerjaanTryout->judul;
                } else {
                    if ($item->mode_latihan === 'remedial') {
                        $jenisPengerjaan = 'Remedial';
                    } elseif ($item->mode_latihan === 'simulasi') {
                        $jenisPengerjaan = 'Latihan Simulasi';
                    } else {
                        $jenisPengerjaan = 'Latihan Soal Fleksibel';
                    }
                }

                return [
                    'id' => $item->id,
                    'tipe' => $item->tipe,
                    'mode_latihan' => $item->mode_latihan ?? 'fleksibel', 
                    'status' => $item->status,
                    'jenis_pengerjaan' => $jenisPengerjaan,
                    'nama_materi' => $namaMateri,
                    'total_skor' => $item->total_skor,
                    'started_at' => $item->started_at ? $item->started_at->format('d M Y, H:i') : '-',
                    'finished_at' => $item->finished_at ? $item->finished_at->format('d M Y, H:i') : null,
                    'try_out_id' => $item->try_out_id,
                    'subtes_id' => $item->subtes_id,
                ];
            });

        return Inertia::render('Riwayat/Index', [
            'riwayat' => $riwayat,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Mengambil detail ringkasan/metadata untuk Modal Popup (Ikon i).
     */
    public function getModalInfo($pengerjaanId)
    {
        // Hanya pengerjaan milik siswa yang login; milik orang lain dijawab 404 agar datanya tidak bocor.
        $pengerjaan = \App\Models\Pengerjaan::with(['subtes', 'pengerjaanTryout'])
            ->where('user_id', auth()->id())
            ->findOrFail($pengerjaanId);

        $totalDijawab = \App\Models\JawabanPengerjaan::where('pengerjaan_id', $pengerjaanId)->count();
        
        // Tentukan Judul dan Jenis untuk Modal
        $judul = '';
        if ($pengerjaan->try_out_id && $pengerjaan->pengerjaanTryout) {
            $judul = $pengerjaan->pengerjaanTryout->judul . ($pengerjaan->subtes ? ' - ' . $pengerjaan->subtes->nama_subtes : '');
        } else {
            $mode = $pengerjaan->mode_latihan ? ucfirst($pengerjaan->mode_latihan) : '';
            $subtes = $pengerjaan->subtes ? $pengerjaan->subtes->nama_subtes : '';
            $judul = trim("Latihan {$mode} {$subtes}");
        }

        return response()->json([
            'id' => $pengerjaan->id,
            'judul' => $judul,
            'tipe' => $pengerjaan->tipe,
            'mode_latihan' => $pengerjaan->mode_latihan ?? 'fleksibel',
            'started_at' => $pengerjaan->started_at ? $pengerjaan->started_at->format('d M Y, H:i') : '-',
            'status' => $pengerjaan->status,
            'total_dijawab' => $totalDijawab,
            'jumlah_soal' => $pengerjaan->jumlah_soal_dipilih ?? 0,
            'skor' => $pengerjaan->total_skor,
        ]);
    }

    /**
     * Halaman Pembahasan Detail Latihan
     */
    /**
     * Pembahasan satu pengerjaan: semua soal sesi (termasuk yang kosong) dengan jawaban siswa, kunci, dan pembahasan.
     * Halaman Latihan/Pembahasan memakai gaya halaman ujian (satu soal per tampilan, sidebar nomor soal).
     */
    public function pembahasan(string $pengerjaanId, PembahasanPengerjaan $pembahasan)
    {
        // Hanya pengerjaan milik siswa ini; milik orang lain dianggap tidak ada (404).
        $pengerjaan = Pengerjaan::with('subtes:id,nama_subtes')
            ->where('user_id', auth()->id())
            ->findOrFail($pengerjaanId);

        return Inertia::render('Latihan/Pembahasan', [
            'pengerjaan' => [
                'id' => $pengerjaan->id,
                'namaSubtes' => $pengerjaan->subtes?->nama_subtes ?? 'Try Out',
                'mode' => $pengerjaan->mode_latihan,
            ],
            'soalList' => $pembahasan->untuk($pengerjaan),
        ]);
    }

    public function tryOut()
    {
        // Sesuaikan parameter pertama dengan nama class model Try Out kamu
        // Jika nama model aslinya adalah PengerjaanTryout:
        return $this->belongsTo(PengerjaanTryout::class, 'try_out_id');
        
        // PENTING: Jika kamu menggunakan model lain untuk tabel "try_out" (misal namanya `TryOut.php`), 
        // ganti PengerjaanTryout::class dengan TryOut::class.
    }
}