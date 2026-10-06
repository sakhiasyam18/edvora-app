<?php

namespace App\Http\Controllers\AdminEditor;

use App\Http\Controllers\Controller;
use App\Models\Soal;
use App\Models\Subtes;
use App\Models\TryOut;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
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
        ."2. Setiap subtes memiliki waktu masing-masing; jawaban dikirim otomatis saat waktu habis\n"
        .'3. Skor dihitung dengan IRT. Skor final tersedia setelah periode Try Out ditutup';

    public function index()
    {
        $paketList = TryOut::with(['subtesPaket' => fn ($q) => $q->withCount('soal')])
            ->withCount('pengerjaan') // sesuaikan: hanya yang sudah selesai, mis. ->withCount(['pengerjaan' => fn ($q) => $q->whereNotNull('selesai_at')])
            ->orderByDesc('mulai_at')
            ->get()
            ->map(fn ($to) => [
                'id' => $to->id,
                'judul' => $to->judul,
                // Ditampilkan dalam WIB, zona yang sama dengan isian form.
                'mulaiAt' => $to->mulai_at->copy()->setTimezone(TryOut::ZONA_FORM)->translatedFormat('d M Y, H.i').' WIB',
                'selesaiAt' => $to->selesai_at->copy()->setTimezone(TryOut::ZONA_FORM)->translatedFormat('d M Y, H.i').' WIB',
                'soalTerkumpul' => (int) $to->subtesPaket->sum('soal_count'),
                'totalTargetSoal' => (int) $to->subtesPaket->sum('jumlah_soal'),
                'jumlahPeserta' => $to->pengerjaan_count,
                'status' => $to->status(), // draft | dibuka | ditutup
            ]);

        return Inertia::render('Editor/TryOut/Index', ['paketList' => $paketList]);
    }

    public function create()
    {
        $baris = Subtes::orderBy('urutan')->get()->map(fn ($s) => [
            'subtes_id' => $s->id,
            'nama' => $s->nama_subtes,
            'jumlah_soal' => $s->jumlah_soal,
            'waktu_menit' => $s->waktu_default_menit,
        ])->values();

        return Inertia::render('Editor/TryOut/Form', [
            'paket' => [
                'id' => null,
                'judul' => '',
                'mulai_at' => TryOut::keInputForm(now()),
                'selesai_at' => TryOut::keInputForm(now()->addHours(4)),
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
                    // Isian form dalam WIB; disimpan dalam UTC.
                    'mulai_at' => TryOut::dariInputForm($data['mulai_at']),
                    'selesai_at' => TryOut::dariInputForm($data['selesai_at']),
                    'dibuat_oleh' => auth()->id(),
                ]);

                $subtesPaket = collect($data['subtes'])->map(fn ($s, $i) => $paket->subtesPaket()->create([
                    'subtes_id' => $s['subtes_id'],
                    'urutan' => $i + 1,
                    'jumlah_soal' => $s['jumlah_soal'],
                    'waktu_menit' => $s['waktu_menit'],
                ]));

                $this->isiSoal($subtesPaket);
            });
        } catch (Throwable $e) {
            Log::error('Gagal menambah paket try out: '.$e->getMessage());

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
                'mulai_at' => TryOut::keInputForm($paket->mulai_at),
                'selesai_at' => TryOut::keInputForm($paket->selesai_at),
                'peraturan' => $paket->peraturan ?? '',
            ],
            'baris' => $paket->subtesPaket->map(fn ($st) => [
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
                    'mulai_at' => TryOut::dariInputForm($data['mulai_at']),
                    'selesai_at' => TryOut::dariInputForm($data['selesai_at']),
                ]);

                // Satu query untuk semua subtes paket, bukan satu query per baris form.
                $subtesPaket = $paket->subtesPaket()->get()->keyBy('subtes_id');
                foreach ($data['subtes'] as $s) {
                    $subtesPaket->get($s['subtes_id'])?->update(['jumlah_soal' => $s['jumlah_soal'], 'waktu_menit' => $s['waktu_menit']]);
                }

                $this->isiSoal($subtesPaket->values());
            });
        } catch (Throwable $e) {
            Log::error('Gagal mengubah paket try out: '.$e->getMessage());

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
            return back()->with('gagal', 'Paket tidak bisa dihapus karena sudah dikerjakan '.$paket->pengerjaan_count.' peserta.');
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
            Log::error('Gagal menghapus paket try out: '.$e->getMessage());

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
            // Rule::in dengan satu query, bukan exists (satu query per baris subtes).
            'subtes.*.subtes_id' => ['required', 'distinct', Rule::in(Subtes::pluck('id')->all())],
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

    // Samakan jumlah soal setiap subtes paket dengan target. Satu soal hanya boleh di satu paket (unique try_out_soal.soal_id).
    // Semua subtes diproses sekaligus dengan query yang jumlahnya tetap: satu query ke Supabase ±0,3–0,7 detik,
    // jadi INSERT per soal (±160 per paket) membuat request melewati batas 30 detik PHP.
    private function isiSoal(Collection $subtesPaket): void
    {
        $ada = DB::table('try_out_soal')
            ->whereIn('try_out_subtes_id', $subtesPaket->pluck('id'))
            ->orderBy('urutan')
            ->get(['try_out_subtes_id', 'soal_id', 'urutan'])
            ->groupBy('try_out_subtes_id');

        $buang = [];
        $kurang = []; // subtes_id => [subtes paket, jumlah kurang, urutan terakhir]
        foreach ($subtesPaket as $st) {
            $punya = $ada->get($st->id, collect());
            $selisih = $st->jumlah_soal - $punya->count();

            if ($selisih < 0) {
                // Buang soal dengan urutan paling akhir.
                array_push($buang, ...$punya->slice($st->jumlah_soal)->pluck('soal_id'));
            } elseif ($selisih > 0) {
                $kurang[$st->subtes_id] = ['st' => $st, 'jumlah' => $selisih, 'urutan' => (int) $punya->max('urutan')];
            }
        }

        if ($buang !== []) {
            DB::table('try_out_soal')
                ->whereIn('try_out_subtes_id', $subtesPaket->pluck('id'))
                ->whereIn('soal_id', $buang)
                ->delete();
        }
        if ($kurang === []) {
            return;
        }

        // Soal published yang belum dipakai paket mana pun, diacak per subtes di database.
        // Cukup ambil sebanyak kebutuhan terbesar per subtes, lalu dipotong sesuai kebutuhan masing-masing.
        $acak = Soal::query()
            ->select('id', 'subtes_id')
            ->selectRaw('row_number() over (partition by subtes_id order by random()) as nomor')
            ->whereIn('subtes_id', array_keys($kurang))
            ->where('status', 'published')
            ->whereNotIn('id', DB::table('try_out_soal')->select('soal_id'));
        $kandidat = DB::query()->fromSub($acak, 'acak')
            ->where('nomor', '<=', max(array_column($kurang, 'jumlah')))
            ->orderBy('nomor')
            ->get(['id', 'subtes_id'])
            ->groupBy('subtes_id');

        $baris = [];
        foreach ($kurang as $subtesId => $k) {
            $urutan = $k['urutan'];
            foreach ($kandidat->get($subtesId, collect())->take($k['jumlah']) as $soal) {
                $baris[] = ['try_out_subtes_id' => $k['st']->id, 'soal_id' => $soal->id, 'urutan' => ++$urutan];
            }
        }

        if ($baris !== []) {
            DB::table('try_out_soal')->insert($baris);
        }
    }
}
