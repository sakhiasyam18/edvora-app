<?php

namespace App\Http\Controllers\AdminEditor;

use App\Http\Controllers\Controller;
use App\Models\Subtes;
use App\Models\TryOut;
use App\Models\Soal;
use App\Models\TryOutSubtes;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Throwable;


class EditorTryOutEditorController extends Controller
{
    // Default format UTBK: [jumlah soal, waktu menit]. Kode di luar daftar memakai [20, 30].
    // private const DEFAULT_SUBTES = [
    //     'PU' => [30, 30],
    //     'PPU' => [20, 15],
    //     'PBM' => [20, 25],
    //     'PK' => [15, 20],
    //     'LBI' => [30, 42.5],
    //     'LBE' => [20, 20],
    //     'PM' => [20, 42.5],
    // ];

    private const PERATURAN_DEFAULT = "1. Subtes dikerjakan berurutan dan tidak dapat dibuka kembali setelah selesai\n"
        . "2. Setiap subtes memiliki waktu masing-masing; jawaban dikirim otomatis saat waktu habis\n"
        . '3. Skor dihitung dengan IRT. Skor final tersedia setelah periode Try Out ditutup';

    public function index()
    {
        $paketList = TryOut::with(['subtesPaket' => fn($q) => $q->withCount('soal')])
            ->withCount('pengerjaan') // sesuaikan: hanya yang sudah selesai, mis. ->withCount(['pengerjaan' => fn ($q) => $q->whereNotNull('selesai_at')])
            ->orderByDesc('mulai_at')
            ->get()
            ->map(fn($to) => [
                'id' => $to->id,
                'judul' => $to->judul,
                'mulaiAt' => Carbon::parse($to->mulai_at)->translatedFormat('d M Y, H.i'),
                'selesaiAt' => Carbon::parse($to->selesai_at)->translatedFormat('d M Y, H.i'),
                'soalTerkumpul' => (int) $to->subtesPaket->sum('soal_count'),
                'totalTargetSoal' => (int) $to->subtesPaket->sum('jumlah_soal'),
                'jumlahPeserta' => $to->pengerjaan_count,
                'status' => $to->status(), // draft | dibuka | ditutup
            ]);

        return Inertia::render('Editor/TryOut/Index', ['paketList' => $paketList]);
    }

    public function create()
    {
        $baris = Subtes::orderBy('urutan')->get()->map(fn($s) => [
            'subtes_id' => $s->id,
            'nama' => $s->nama_subtes,
            'jumlah_soal' => $s->jumlah_soal,
            'waktu_menit' => $s->waktu_default_menit,
        ])->values();

        return Inertia::render('Editor/TryOut/Form', [
            'paket' => [
                'id' => null,
                'judul' => '',
                'mulai_at' => now()->format('Y-m-d\TH:i'),
                'selesai_at' => now()->addHours(4)->format('Y-m-d\TH:i'),
                'peraturan' => self::PERATURAN_DEFAULT,
            ],
            'baris' => $baris,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validasi($request);

        try {
            DB::transaction(function () use ($data) {
                $paket = TryOut::create([
                    'judul' => $data['judul'],
                    'peraturan' => $data['peraturan'] ?? null,
                    'mulai_at' => $data['mulai_at'],
                    'selesai_at' => $data['selesai_at'],
                    'dibuat_oleh' => auth()->id(),
                ]);

                foreach ($data['subtes'] as $i => $s) {
                    $st = $paket->subtesPaket()->create([
                        'subtes_id' => $s['subtes_id'],
                        'urutan' => $i + 1,
                        'jumlah_soal' => $s['jumlah_soal'],
                        'waktu_menit' => $s['waktu_menit'],
                    ]);
                    $this->isiSoal($st);
                }
            });
        } catch (Throwable $e) {
            Log::error('Gagal menambah paket try out: ' . $e->getMessage());

            return back()->withInput()->with('gagal', 'Paket Try Out gagal ditambahkan. Silakan coba lagi.');
        }

        return redirect()->route('editor.tryout.index')->with('sukses', 'Paket Try Out berhasil ditambahkan.');
    }

    public function edit(string $id)
    {
        $paket = TryOut::with('subtesPaket.subtes')->findOrFail($id);
        if ($paket->status() !== TryOut::DRAFT) {
            return redirect()->route('editor.tryout.index')->with('gagal', 'Hanya paket berstatus Draft yang dapat diedit.');
        }

        return Inertia::render('Editor/TryOut/Form', [
            'paket' => [
                'id' => $paket->id,
                'judul' => $paket->judul,
                'mulai_at' => Carbon::parse($paket->mulai_at)->format('Y-m-d\TH:i'),
                'selesai_at' => Carbon::parse($paket->selesai_at)->format('Y-m-d\TH:i'),
                'peraturan' => $paket->peraturan ?? '',
            ],
            'baris' => $paket->subtesPaket->map(fn($st) => [
                'subtes_id' => $st->subtes_id,
                'nama' => $st->subtes?->nama_subtes ?? '-',
                'jumlah_soal' => $st->jumlah_soal,
                'waktu_menit' => $st->waktu_menit,
            ])->values(),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $paket = TryOut::findOrFail($id);
        $data = $this->validasi($request);

        try {
            DB::transaction(function () use ($paket, $data) {
                $paket->update([
                    'judul' => $data['judul'],
                    'peraturan' => $data['peraturan'] ?? null,
                    'mulai_at' => $data['mulai_at'],
                    'selesai_at' => $data['selesai_at'],
                ]);

                foreach ($data['subtes'] as $s) {
                    $st = $paket->subtesPaket()->where('subtes_id', $s['subtes_id'])->first();
                    if (! $st) continue;
                    $st->update(['jumlah_soal' => $s['jumlah_soal'], 'waktu_menit' => $s['waktu_menit']]);
                    $this->isiSoal($st);
                }
            });
        } catch (Throwable $e) {
            Log::error('Gagal mengubah paket try out: ' . $e->getMessage());

            return back()->withInput()->with('gagal', 'Paket Try Out gagal diperbarui. Silakan coba lagi.');
        }

        return redirect()->route('editor.tryout.index')->with('sukses', 'Paket Try Out berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $paket = TryOut::withCount('pengerjaan')->findOrFail($id);
        if ($paket->status() !== TryOut::DRAFT) {
            return back()->with('gagal', 'Hanya paket berstatus Draft yang dapat dihapus.');
        }

        if ($paket->pengerjaan_count > 0) {
            return back()->with('gagal', 'Paket tidak bisa dihapus karena sudah dikerjakan ' . $paket->pengerjaan_count . ' peserta.');
        }

        try {
            DB::transaction(function () use ($paket) {
                foreach ($paket->subtesPaket as $st) {
                    $st->soal()->detach();
                    $st->delete();
                }
                $paket->delete();
            });
        } catch (Throwable $e) {
            Log::error('Gagal menghapus paket try out: ' . $e->getMessage());

            return back()->with('gagal', 'Paket Try Out gagal dihapus. Silakan coba lagi.');
        }

        return back()->with('sukses', 'Paket Try Out berhasil dihapus.');
    }

    private function validasi(Request $request): array
    {
        return $request->validate([
            'judul' => ['required', 'string', 'max:150'],
            'mulai_at' => ['required', 'date'],
            'selesai_at' => ['required', 'date', 'after:mulai_at'],
            'peraturan' => ['nullable', 'string', 'max:3000'],
            'subtes' => ['required', 'array', 'min:1'],
            'subtes.*.subtes_id' => ['required', 'distinct', 'exists:subtes,id'],
            'subtes.*.jumlah_soal' => ['required', 'integer', 'min:1', 'max:200'],
            'subtes.*.waktu_menit' => ['required', 'numeric', 'min:1', 'max:300'],
        ], [
            'judul.required' => 'Judul wajib diisi.',
            'mulai_at.required' => 'Waktu mulai wajib diisi.',
            'selesai_at.required' => 'Waktu selesai wajib diisi.',
            'selesai_at.after' => 'Waktu selesai harus setelah waktu mulai.',
            'subtes.*.jumlah_soal.*' => 'Jumlah soal harus berupa angka 1-200.',
            'subtes.*.waktu_menit.*' => 'Waktu harus berupa angka 1-300 menit.',
        ]);
    }

    // Samakan jumlah soal paket dengan target. Satu soal hanya boleh di satu paket (unique try_out_soal.soal_id).
    private function isiSoal(TryOutSubtes $st): void
    {
        $ada = DB::table('try_out_soal')
            ->where('try_out_subtes_id', $st->id)
            ->orderBy('urutan')
            ->get(['soal_id', 'urutan']);

        $kurang = $st->jumlah_soal - $ada->count();

        if ($kurang < 0) {
            // Buang soal dengan urutan paling akhir.
            $st->soal()->detach($ada->slice($st->jumlah_soal)->pluck('soal_id')->all());
            return;
        }
        if ($kurang === 0) {
            return;
        }

        $baru = Soal::where('subtes_id', $st->subtes_id)
            ->where('status', 'published')
            ->whereNotIn('id', DB::table('try_out_soal')->select('soal_id'))
            ->inRandomOrder()
            ->limit($kurang)
            ->pluck('id');

        $urutan = (int) $ada->max('urutan'); // 0 jika belum ada
        foreach ($baru as $id) {
            $st->soal()->attach($id, ['urutan' => ++$urutan]);
        }
    }
}
