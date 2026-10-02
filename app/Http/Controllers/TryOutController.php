<?php

namespace App\Http\Controllers;

use App\Models\Pengerjaan;
use App\Models\TransaksiPoin;
use App\Models\TransaksiXp;
use App\Models\TryOut;
use App\Services\SesiTryOut;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Try Out siswa (RANCANGAN-tryout.md bagian 5): daftar paket, mulai, kerjakan per subtes, kirim, dan hasil.
 * Satu siswa hanya punya satu pengerjaan per paket, jadi semua rute memakai id paket.
 */
class TryOutController extends Controller
{
    public function index(SesiTryOut $sesi)
    {
        $userId = Auth::id();

        // Pengerjaan yang waktunya sudah habis diselesaikan dulu, supaya tombol di card sesuai keadaan sebenarnya.
        $sesi->rapikanMilik($userId);

        $paketList = TryOut::dibuka()
            ->with('subtesPaket:id,try_out_id,urutan,jumlah_soal,waktu_menit')
            ->orderBy('selesai_at')
            ->get();
        $statusPengerjaan = Pengerjaan::where('user_id', $userId)
            ->whereIn('try_out_id', $paketList->pluck('id'))
            ->pluck('status', 'try_out_id');

        return Inertia::render('TryOut/Index', [
            'paketList' => $paketList->map(function (TryOut $paket) use ($statusPengerjaan) {
                $totalMenit = (float) $paket->subtesPaket->sum('waktu_menit');

                return [
                    'id' => $paket->id,
                    'judul' => $paket->judul,
                    'totalSoal' => (int) $paket->subtesPaket->sum('jumlah_soal'),
                    'totalMenit' => $totalMenit,
                    'selesaiAt' => $paket->selesai_at->toIso8601String(),
                    'peraturan' => TryOut::pecahPeraturan($paket->peraturan),
                    'statusPengerjaan' => match ($statusPengerjaan[$paket->id] ?? null) {
                        'berjalan' => 'berjalan',
                        'selesai' => 'selesai',
                        default => 'belum',
                    },
                    // Mulai tetap boleh; pop-up hanya memperingatkan bahwa Try Out akan terpotong di akhir periode (T13).
                    'waktuCukup' => now()->addSeconds((int) round($totalMenit * 60))->lte($paket->selesai_at),
                ];
            }),
        ]);
    }

    public function mulai(TryOut $tryOut)
    {
        if ($tryOut->status() !== TryOut::DIBUKA) {
            Inertia::flash('error', 'Try Out ini sedang tidak dibuka.');

            return redirect()->route('tryout.index');
        }

        $pengerjaan = $this->pengerjaanMilik($tryOut);

        if (! $pengerjaan) {
            try {
                $pengerjaan = Pengerjaan::create([
                    'user_id' => Auth::id(),
                    'tipe' => 'try_out',
                    'status' => 'berjalan',
                    'try_out_id' => $tryOut->id,
                    'started_at' => now(),
                    'total_skor' => null,
                    'jumlah_soal_dipilih' => (int) $tryOut->subtesPaket()->sum('jumlah_soal'),
                ]);
            } catch (UniqueConstraintViolationException) {
                // Klik ganda atau dua tab: pengerjaan sudah dibuat request lain (pengerjaan_try_out_sekali).
                $pengerjaan = $this->pengerjaanMilik($tryOut);
            }
        }

        return redirect()->route($pengerjaan->status === 'selesai' ? 'tryout.hasil' : 'tryout.kerjakan', $tryOut);
    }

    public function kerjakan(TryOut $tryOut, SesiTryOut $sesi)
    {
        $pengerjaan = $this->pengerjaanMilik($tryOut);

        if (! $pengerjaan) {
            return redirect()->route('tryout.index');
        }

        if ($pengerjaan->status === 'selesai') {
            return redirect()->route('tryout.hasil', $tryOut);
        }

        $posisi = $sesi->rapikan($pengerjaan);

        if ($posisi['selesai']) {
            return redirect()->route('tryout.hasil', $tryOut);
        }

        $subtesPaket = $tryOut->subtesPaket()->with('subtes:id,nama_subtes')->get();
        $indeks = $subtesPaket->search(fn ($s) => $s->id === $posisi['aktif']);
        $aktif = $subtesPaket[$indeks];

        // Kunci, pembahasan, dan hint tidak dikirim ke browser.
        $soalList = $aktif->soal()
            ->with('opsiJawaban:id,soal_id,label,teks_opsi,gambar_opsi,urutan')
            ->get(['soal.id', 'soal.tipe', 'soal.teks_soal', 'soal.gambar_soal'])
            ->map(fn ($soal) => [
                'id' => $soal->id,
                'tipe' => $soal->tipe,
                'teks_soal' => $soal->teks_soal,
                'gambar_soal' => $soal->gambar_soal,
                'opsi' => $soal->opsiJawaban->map(fn ($o) => [
                    'id' => $o->id,
                    'label' => $o->label,
                    'teks_opsi' => $o->teks_opsi,
                    'gambar_opsi' => $o->gambar_opsi,
                ])->values(),
            ]);

        return Inertia::render('TryOut/Kerjakan', [
            'paket' => ['id' => $tryOut->id, 'judul' => $tryOut->judul],
            'pengerjaanId' => $pengerjaan->id,
            'subtes' => [
                'id' => $aktif->id,
                'nama' => $aktif->subtes->nama_subtes,
                'urutan' => $indeks + 1,
                'jumlahSubtes' => $subtesPaket->count(),
                'terakhir' => $indeks === $subtesPaket->count() - 1,
            ],
            'soalList' => $soalList,
            'sisaDetik' => max(0, $posisi['batas']->getTimestamp() - now()->getTimestamp()),
        ]);
    }

    public function kirim(Request $request, TryOut $tryOut, SesiTryOut $sesi)
    {
        // Isian dibatasi satu kata atau bilangan bulat; 100 karakter sudah sangat longgar.
        $data = $request->validate([
            'tryOutSubtesId' => ['required', 'uuid'],
            'jawaban' => ['nullable', 'array'],
            'jawaban.*.soalId' => ['required', 'uuid'],
            'jawaban.*.opsiIds' => ['nullable', 'array'],
            'jawaban.*.opsiIds.*' => ['uuid'],
            'jawaban.*.jawabanIsian' => ['nullable', 'string', 'max:100'],
        ]);

        $pengerjaan = $this->pengerjaanMilik($tryOut);

        if (! $pengerjaan) {
            return redirect()->route('tryout.index');
        }

        if ($pengerjaan->status === 'selesai') {
            return redirect()->route('tryout.hasil', $tryOut);
        }

        // Hanya soal milik subtes yang dikirim, dan kiriman pertama untuk tiap soal.
        $soalSubtes = DB::table('try_out_soal')->where('try_out_subtes_id', $data['tryOutSubtesId'])->pluck('soal_id')->all();
        $jawaban = collect($data['jawaban'] ?? [])
            ->filter(fn ($j) => in_array($j['soalId'], $soalSubtes, true))
            ->unique('soalId')
            ->mapWithKeys(fn ($j) => [$j['soalId'] => [
                'opsiIds' => array_values($j['opsiIds'] ?? []),
                'jawabanIsian' => $j['jawabanIsian'] ?? null,
            ]])
            ->all();

        $posisi = $sesi->terima($pengerjaan, $data['tryOutSubtesId'], $jawaban);

        return redirect()->route($posisi['selesai'] ? 'tryout.hasil' : 'tryout.kerjakan', $tryOut);
    }

    public function hasil(TryOut $tryOut, SesiTryOut $sesi)
    {
        $pengerjaan = $this->pengerjaanMilik($tryOut);

        if (! $pengerjaan) {
            return redirect()->route('tryout.index');
        }

        if ($pengerjaan->status === 'berjalan') {
            if (! $sesi->rapikan($pengerjaan)['selesai']) {
                return redirect()->route('tryout.kerjakan', $tryOut);
            }

            $pengerjaan->refresh();
        }

        $subtesPaket = $tryOut->subtesPaket()->with('subtes:id,nama_subtes')->get();
        $rekap = DB::table('jawaban_pengerjaan as j')
            ->join('pengerjaan_subtes as ps', 'ps.id', '=', 'j.pengerjaan_subtes_id')
            ->where('j.pengerjaan_id', $pengerjaan->id)
            ->groupBy('ps.try_out_subtes_id')
            ->selectRaw('ps.try_out_subtes_id, count(*) filter (where j.is_correct) as benar, count(*) filter (where not j.is_correct) as salah')
            ->get()
            ->keyBy('try_out_subtes_id');

        return Inertia::render('TryOut/Hasil', [
            'paket' => ['id' => $tryOut->id, 'judul' => $tryOut->judul, 'selesaiAt' => $tryOut->selesai_at->toIso8601String()],
            'ditutup' => $tryOut->status() === TryOut::DITUTUP,
            // NULL sampai skor IRT dihitung setelah paket ditutup.
            'skorTotal' => $pengerjaan->total_skor === null ? null : (float) $pengerjaan->total_skor,
            'perSubtes' => $subtesPaket->map(function ($s) use ($rekap) {
                $benar = (int) ($rekap[$s->id]->benar ?? 0);
                $salah = (int) ($rekap[$s->id]->salah ?? 0);

                return [
                    'id' => $s->id,
                    'nama' => $s->subtes->nama_subtes,
                    'jumlahSoal' => $s->jumlah_soal,
                    'benar' => $benar,
                    'salah' => $salah,
                    'kosong' => max(0, $s->jumlah_soal - $benar - $salah),
                ];
            })->values(),
            // XP dan poin dibaca dari catatan saat diberikan (K12).
            'xp' => (int) TransaksiXp::where('pengerjaan_id', $pengerjaan->id)->sum('jumlah'),
            'poin' => (int) TransaksiPoin::where('pengerjaan_id', $pengerjaan->id)->sum('jumlah'),
        ]);
    }

    private function pengerjaanMilik(TryOut $tryOut): ?Pengerjaan
    {
        return Pengerjaan::where('try_out_id', $tryOut->id)->where('user_id', Auth::id())->first();
    }
}
