<?php

namespace App\Http\Controllers;

use App\Models\JawabanPengerjaan;
use App\Models\Pengerjaan;
use App\Services\FilterRiwayat;
use App\Services\PembahasanPengerjaan;
use App\Services\SesiTryOut;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RiwayatController extends Controller
{
    /**
     * Menampilkan daftar riwayat pengerjaan user.
     */
    public function index(Request $request, SesiTryOut $sesi)
    {
        $userId = auth()->id();

        // Try Out yang waktunya habis diselesaikan dulu, supaya statusnya di Riwayat sesuai keadaan sebenarnya.
        $sesi->rapikanMilik($userId);

        // Pencarian dan filter (UCS3). Nilai jenis/status yang tidak dikenal diabaikan, sehingga semua riwayat tampil.
        $cari = trim((string) $request->input('cari', ''));
        $jenis = is_string($request->input('jenis')) && isset(FilterRiwayat::JENIS[$request->input('jenis')]) ? $request->input('jenis') : null;
        $status = is_string($request->input('status')) && isset(FilterRiwayat::STATUS[$request->input('status')]) ? $request->input('status') : null;

        $riwayatQuery = FilterRiwayat::terapkan(Pengerjaan::with(['subtes', 'tryOut'])->where('user_id', $userId), $cari, $jenis, $status);

        // withQueryString: pencarian dan filter ikut terbawa saat pindah halaman.
        $riwayat = $riwayatQuery->orderBy('started_at', 'desc')
            ->paginate(10)
            ->withQueryString()
            ->through(function ($item) {
                // 1. Ambil nama subtes
                $namaMateri = $item->subtes ? $item->subtes->nama_subtes : '';
                $jenisPengerjaan = '';

                // 2. Tentukan Jenis Pengerjaan berdasarkan Mode / Try Out
                if ($item->try_out_id && $item->tryOut) {
                    $jenisPengerjaan = $item->tryOut->judul;
                } else {
                    // Label yang sama dicocokkan oleh pencarian (FilterRiwayat::jenisDariKata).
                    $jenisPengerjaan = FilterRiwayat::JENIS[in_array($item->mode_latihan, ['remedial', 'simulasi'], true) ? $item->mode_latihan : 'fleksibel'];
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
                'cari' => $cari,
                'jenis' => $jenis,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Mengambil detail ringkasan/metadata untuk Modal Popup (Ikon i).
     */
    public function getModalInfo($pengerjaanId)
    {
        // Hanya pengerjaan milik siswa yang login; milik orang lain dijawab 404 agar datanya tidak bocor.
        $pengerjaan = Pengerjaan::with(['subtes', 'tryOut'])
            ->where('user_id', auth()->id())
            ->findOrFail($pengerjaanId);

        $totalDijawab = JawabanPengerjaan::where('pengerjaan_id', $pengerjaanId)->count();

        // Tentukan Judul dan Jenis untuk Modal
        $judul = '';
        if ($pengerjaan->try_out_id && $pengerjaan->tryOut) {
            $judul = $pengerjaan->tryOut->judul.($pengerjaan->subtes ? ' - '.$pengerjaan->subtes->nama_subtes : '');
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

        // Pembahasan Try Out dibuka setelah paket ditutup, lewat halaman Try Out (RANCANGAN-tryout.md T15).
        // Tanpa penjaga ini, PembahasanPengerjaan menampilkan kunci soal Try Out yang sudah dijawab.
        if ($pengerjaan->try_out_id) {
            return redirect()->route('tryout.hasil', $pengerjaan->try_out_id);
        }

        // Sesi fleksibel yang belum selesai: pembahasan akan membocorkan kunci soal yang belum dijawab (SF13).
        if ($pengerjaan->status === 'berjalan') {
            return redirect()->route('latihan.kerjakan', $pengerjaan->id);
        }

        return Inertia::render('Latihan/Pembahasan', [
            'pengerjaan' => [
                'id' => $pengerjaan->id,
                'namaSubtes' => $pengerjaan->subtes?->nama_subtes ?? 'Try Out',
                'mode' => $pengerjaan->mode_latihan,
            ],
            'soalList' => $pembahasan->untuk($pengerjaan),
        ]);
    }
}
