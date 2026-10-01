<?php

namespace App\Http\Controllers;

use App\Models\Pengerjaan;
use App\Models\JawabanPengerjaan;
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
        $pengerjaan = \App\Models\Pengerjaan::with(['subtes', 'pengerjaanTryout'])->findOrFail($pengerjaanId);

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
    public function pembahasan($pengerjaanId)
    {
        // Ambil data pengerjaan beserta relasi jawaban, soal, dan opsi
        $pengerjaan = \App\Models\Pengerjaan::with([
            'subtes',
            'jawabanPengerjaan.soal.opsiJawaban'
        ])->findOrFail($pengerjaanId);

        // Keamanan: Pastikan user hanya bisa melihat riwayat pengerjaannya sendiri
        if ($pengerjaan->user_id !== auth()->id()) {
            abort(403, 'Akses ditolak. Anda tidak memiliki izin melihat riwayat ini.');
        }

        // Format data detail jawaban agar rapi saat dibaca oleh React Frontend
        $detailJawaban = $pengerjaan->jawabanPengerjaan->map(function ($jawaban, $index) {
            return [
                'nomor' => $index + 1,
                'is_correct' => $jawaban->is_correct,
                'skor' => $jawaban->skor,
                'soal' => [
                    'id' => $jawaban->soal->id,
                    'tipe' => $jawaban->soal->tipe,
                    'teks_soal' => $jawaban->soal->teks_soal,
                    'gambar_soal' => $jawaban->soal->gambar_soal,
                    'pembahasan' => $jawaban->soal->pembahasan,
                    'kunci_jawaban' => $jawaban->soal->kunci_jawaban,
                ],
                'jawaban_user' => [
                    'opsi_dipilih_id' => $jawaban->opsi_dipilih_id,
                    'opsi_dipilih_ids' => $jawaban->opsi_dipilih_ids,
                    'jawaban_isian' => $jawaban->jawaban_isian,
                ],
                'opsi_jawaban' => $jawaban->soal->opsiJawaban->map(function ($opsi) {
                    return [
                        'id' => $opsi->id,
                        'teks_opsi' => $opsi->teks_opsi,
                        'is_kunci' => $opsi->is_kunci,
                    ];
                })->toArray(), // Pastikan menjadi array biasa
            ];
        });

        // Hitung statistik cepat
        $totalSoal = $detailJawaban->count();
        $totalBenar = $detailJawaban->where('is_correct', true)->count();
        $totalSalah = $totalSoal - $totalBenar;

        return Inertia::render('Riwayat/Pembahasan', [
            'pengerjaan' => [
                'id' => $pengerjaan->id,
                'mode_latihan' => $pengerjaan->mode_latihan ? ucfirst($pengerjaan->mode_latihan) : 'Latihan',
                'nama_materi' => $pengerjaan->subtes ? $pengerjaan->subtes->nama_subtes : 'Try Out',
                'total_skor' => $pengerjaan->total_skor,
                'waktu_selesai' => $pengerjaan->finished_at ? $pengerjaan->finished_at->format('d M Y, H:i WIB') : '-',
                'total_soal' => $totalSoal,
                'total_benar' => $totalBenar,
                'total_salah' => $totalSalah,
            ],
            'detailJawaban' => $detailJawaban,
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