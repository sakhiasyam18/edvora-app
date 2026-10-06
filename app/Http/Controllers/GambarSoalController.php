<?php

namespace App\Http\Controllers;

use App\Models\Subtes;
use App\Services\PengunggahGambarSoal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

/**
 * Tombol "atau unggah gambar" di formulir soal: gambar soal, opsi, atau pembahasan diunggah ke Storage, lalu link
 * publiknya diisi ke kolom URL formulir. Soalnya sendiri baru tersimpan saat formulir disimpan. JSON, lewat axios.
 */
class GambarSoalController extends Controller
{
    public function unggah(Request $request, Subtes $subtes, PengunggahGambarSoal $pengunggah): JsonResponse
    {
        $data = $request->validate([
            // Kode yang tampil di formulir. Soal baru belum tersimpan, jadi cukup diperiksa cocok dengan subtesnya.
            'kodeSoal' => ['required', 'string', 'regex:/^'.preg_quote($subtes->kode_subtes, '/').'-\d{3,}$/'],
            'bagian' => ['required', Rule::in(array_keys(PengunggahGambarSoal::BAGIAN))],
            'file' => ['required', 'file', 'max:1024'],
        ], [
            'kodeSoal.regex' => 'Kode soal tidak cocok dengan subtes ini. Muat ulang halaman.',
            'file.required' => 'Pilih gambar dulu.',
            'file.uploaded' => 'Gambar gagal diunggah. Ukuran maksimal 1 MB.',
            'file.file' => 'Gambar gagal diunggah. Ukuran maksimal 1 MB.',
            'file.max' => 'Ukuran gambar maksimal 1 MB. Kecilkan dulu, mis. dengan squoosh.app.',
        ]);

        try {
            $hasil = $pengunggah->unggah($request->file('file')->get(), $subtes->kode_subtes, $data['kodeSoal'], $data['bagian']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['pesan' => 'Gambar gagal disimpan ke Storage. Coba lagi; bila terus gagal, hubungi tim BE.'], 502);
        }

        if ($hasil['masalah']) {
            return response()->json(['pesan' => $hasil['masalah']], 422);
        }

        return response()->json(['url' => $hasil['url']]);
    }
}
