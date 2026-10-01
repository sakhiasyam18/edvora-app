<?php

namespace App\Http\Controllers;

use App\Models\JawabanPengerjaan;
use App\Models\Pengerjaan;
use App\Models\Siswa;
use App\Models\Soal;
use App\Models\Subtes;
use App\Services\PenilaianIsian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LatihanSoalController extends Controller
{
    // Jumlah sesi latihan yang disimpan per pengguna; refresh halaman ujian selalu membuat sesi baru.
    private const MAKS_SESI = 3;

    public function index()
    {
        // soal_exists (boolean) hanya untuk menonaktifkan kartu; jumlah soal sengaja tidak dikirim.
        $subtes = Subtes::withExists('soal')->orderBy('urutan')->get();

        return Inertia::render('Latihan/Persiapan', [
            'subtes' => $subtes,
        ]);
    }

    public function ujian(Request $request)
    {
        $subtesId = $request->get('subtesId');

        if (! $subtesId) {
            return redirect()->route('latihan.index');
        }

        $subtes = Subtes::findOrFail($subtesId);

        $mode = $request->get('mode') === 'simulasi' ? 'simulasi' : 'fleksibel';

        // Simulasi mengikuti format UTBK per subtes; nilai dari URL diabaikan agar tidak bisa diakali.
        $jumlahSoal = $mode === 'simulasi'
            ? $subtes->jumlah_soal
            : (int) $request->get('jumlahSoal', 10);

        $pengerjaanId = $request->get('pengerjaanId');
        $soalList = null;

        if ($pengerjaanId) {
            $pengerjaanLama = \App\Models\Pengerjaan::with('jawabanPengerjaan')->find($pengerjaanId);
            if ($pengerjaanLama) {
                $soalIds = $pengerjaanLama->jawabanPengerjaan->pluck('soal_id')->all();
                $soalList = Soal::with(['opsiJawaban' => fn ($q) => $q->orderBy('urutan')])
                    ->whereIn('id', $soalIds)
                    ->get()
                    ->sortBy(fn($s) => array_search($s->id, $soalIds))
                    ->values();
            }
        }

        if (!$soalList || $soalList->isEmpty()) {
            $soalList = Soal::with(['opsiJawaban' => fn ($q) => $q->orderBy('urutan')])
                ->where('subtes_id', $subtesId)
                ->inRandomOrder()
                ->take($jumlahSoal)
                ->get();
        }

        // Jaring pengaman bila URL dibuka langsung untuk subtes tanpa soal.
        if ($soalList->isEmpty()) {
            return redirect()->route('latihan.index');
        }

        // Kunci isian dinilai di server (cekJawaban / simpanJawaban), jadi tidak perlu ikut ke browser.
        $soalList->makeHidden('kunci_jawaban');

        $konfigurasi = [
            'sesiId' => $this->mulaiSesi($subtes->id, $mode, $soalList->pluck('id')->all()),
            'subtesId' => $subtesId,
            'namaSubtes' => $subtes->nama_subtes,
            'mode' => $mode,
            'jumlahSoal' => $soalList->count(),
        ];

        if ($mode === 'simulasi') {
            $konfigurasi['waktuPengerjaanMenit'] = $subtes->waktu_default_menit;
        } else {
            $konfigurasi['iceBreakingAktif'] = $request->get('iceBreakingAktif') === 'true';
        }

        return Inertia::render('Latihan/Ujian', [
            'subtes' => $subtes,
            'soalList' => $soalList,
            'konfigurasi' => $konfigurasi,
        ]);
    }

    /**
     * Mode fleksibel: nilai satu jawaban isian saat tombol "Simpan Jawaban" ditekan.
     * Jawaban pertama dikunci di session dan dipakai lagi oleh simpanJawaban(),
     * sehingga hasil yang dilihat siswa selalu sama dengan nilai akhir.
     */
    public function cekJawaban(Request $request)
    {
        $data = $request->validate([
            'sesiId' => ['required', 'uuid'],
            'soalId' => ['required', 'uuid'],
            'jawabanIsian' => ['required', 'string', 'max:100'],
        ]);

        $kunciSesi = 'latihan.'.$data['sesiId'];
        $sesi = session($kunciSesi);

        if (! $sesi) {
            return response()->json(['message' => 'Sesi latihan tidak ditemukan atau sudah selesai.'], 410);
        }

        // Mode simulasi tidak boleh tahu benar/salah sebelum latihan selesai.
        if ($sesi['mode'] !== 'fleksibel') {
            return response()->json(['message' => 'Pengecekan per soal hanya tersedia di mode fleksibel.'], 403);
        }

        if (! in_array($data['soalId'], $sesi['soal_ids'], true)) {
            throw ValidationException::withMessages(['soalId' => 'Soal ini bukan bagian dari sesi latihan.']);
        }

        $soal = Soal::find($data['soalId'], ['id', 'tipe', 'kunci_jawaban']);

        if (! $soal || $soal->tipe !== 'isian_singkat') {
            throw ValidationException::withMessages(['soalId' => 'Pengecekan per soal hanya untuk soal isian singkat.']);
        }

        // Sudah pernah dicek: kembalikan hasil yang terkunci tanpa menilai ulang, supaya kunci tidak bisa ditebak berulang.
        if ($terkunci = $sesi['terkunci'][$data['soalId']] ?? null) {
            return $this->hasilCek($terkunci['benar'], $soal->kunci_jawaban, true);
        }

        $teksIsian = $this->rapikanIsian($data['jawabanIsian']);

        if (PenilaianIsian::normalisasi($teksIsian) === '') {
            throw ValidationException::withMessages(['jawabanIsian' => 'Jawaban tidak boleh kosong.']);
        }

        $benar = PenilaianIsian::cocok($teksIsian, $soal->kunci_jawaban ?? '');

        session()->put("{$kunciSesi}.terkunci.{$data['soalId']}", [
            'jawaban' => $teksIsian,
            'benar' => $benar,
            'waktu' => now()->toDateTimeString(),
        ]);

        return $this->hasilCek($benar, $soal->kunci_jawaban);
    }

    /**
     * Bentuk respons cekJawaban. Kunci hanya ikut saat jawaban salah, dan hanya setelah jawaban
     * terkunci di session, jadi nilainya sudah final dan kunci tidak bisa dipakai menebak.
     */
    private function hasilCek(bool $benar, ?string $kunci, bool $sudahDikunci = false): \Illuminate\Http\JsonResponse
    {
        $data = ['benar' => $benar];

        if ($sudahDikunci) {
            $data['sudahDikunci'] = true;
        }

        if (! $benar) {
            $data['kunciJawaban'] = $this->kunciTampil($kunci);
        }

        return response()->json($data);
    }

    // Kunci boleh punya alternatif dipisah "|" (mis. "delapan|8"); siswa cukup dilihatkan yang pertama.
    private function kunciTampil(?string $kunci): string
    {
        foreach (explode('|', (string) $kunci) as $alternatif) {
            $alternatif = $this->rapikanIsian($alternatif);

            if ($alternatif !== '') {
                return $alternatif;
            }
        }

        return '';
    }

    public function simpanJawaban(Request $request)
    {
        $sesiId = $request->input('sesiId');
        $kunciSesi = 'latihan.'.$sesiId;
        $aksi = $request->input('aksi'); // 'keluar' atau 'selesai'

        // Jawaban isian dibatasi satu kata atau bilangan bulat; 100 karakter sudah sangat longgar.
        $request->validate([
            'sesiId' => ['required', 'uuid'],
            'jawaban' => ['array'],
            'jawaban.*.opsiIds' => ['nullable', 'array'],
            'jawaban.*.jawabanIsian' => ['nullable', 'string', 'max:100'],
        ]);

        $sesi = session($kunciSesi);

        // Sesi hilang berarti sudah pernah diselesaikan (mis. submit ulang lewat tombol Back) atau kedaluwarsa.
        if (! $sesi) {
            Inertia::flash('error', 'Sesi latihan sudah selesai atau kedaluwarsa. Silakan mulai latihan lagi.');

            return redirect()->route('latihan.index');
        }

        // Array of { soalId, opsiIds: [], jawabanIsian: string|null }.
        $kiriman = collect($request->input('jawaban', []))
            ->filter(fn ($j) => is_array($j) && in_array($j['soalId'] ?? null, $sesi['soal_ids'], true))
            ->unique('soalId')
            ->keyBy('soalId');

        $iceBreakingAktif = $request->boolean('iceBreakingAktif');

        $pengerjaan = DB::transaction(function () use ($sesi, $kiriman, $iceBreakingAktif, $aksi) {
            // Jika pengerjaan sebelumnya belum pernah dibuat, kita buat baru.
            // Gunakan updateOrCreate jika kedepannya mau me-replace session lama.
            $p = Pengerjaan::create([
                'user_id' => Auth::id(),
                'tipe' => 'latihan_bebas',
                // JIKA keluar = berjalan, JIKA selesai = selesai
                'status' => $aksi === 'keluar' ? 'berjalan' : 'selesai',
                'subtes_id' => $sesi['subtes_id'],
                'jumlah_soal_dipilih' => count($sesi['soal_ids']),
                'ice_breaking_aktif' => $iceBreakingAktif,
                'started_at' => $sesi['mulai'],
                // JIKA keluar = null, JIKA selesai = now()
                'finished_at' => $aksi === 'keluar' ? null : now(),
                'total_skor' => 0,
            ]);

            // Ambil semua soal beserta opsinya sekali jalan - hindari N+1 query.
            $soalMap = Soal::with('opsiJawaban:id,soal_id,is_kunci')
                ->whereIn('id', $sesi['soal_ids'])
                ->get(['id', 'tipe', 'kunci_jawaban'])
                ->keyBy('id');

            $jawabanModel = new JawabanPengerjaan;
            $waktuSelesai = now()->toDateTimeString();
            $baris = [];
            $jumlahBenar = 0;
            $totalSkor = 0;

            // Urut sesuai soal yang diberikan; soal tanpa jawaban tidak dicatat.
            foreach ($sesi['soal_ids'] as $soalId) {
                $soal = $soalMap[$soalId] ?? null;
                if (! $soal) {
                    continue;
                }

                $j = $kiriman->get($soalId);
                $terkunci = $sesi['terkunci'][$soalId] ?? null;
                $dipilih = [];
                $teksIsian = null;
                $waktuMenjawab = $waktuSelesai;

                if ($soal->tipe === 'isian_singkat' && $terkunci) {
                    $teksIsian = $terkunci['jawaban'];
                    $isCorrect = $terkunci['benar'];
                    $waktuMenjawab = $terkunci['waktu'];
                } elseif (! $j) {
                    continue;
                } elseif ($soal->tipe === 'isian_singkat') {
                    $teksIsian = $this->rapikanIsian($j['jawabanIsian'] ?? '');

                    if (PenilaianIsian::normalisasi($teksIsian) === '') {
                        continue;
                    }
                    $isCorrect = PenilaianIsian::cocok($teksIsian, $soal->kunci_jawaban ?? '');
                } else {
                    $dikirim = $j['opsiIds'] ?? (isset($j['opsiId']) ? [$j['opsiId']] : []);
                    $dipilih = array_values(array_intersect($dikirim, $soal->opsiJawaban->pluck('id')->all()));
                    $kunci = $soal->opsiJawaban->where('is_kunci', true)->pluck('id')->all();
                    sort($dipilih);
                    sort($kunci);
                    $isCorrect = $kunci !== [] && $dipilih === $kunci;
                }

                $skor = $isCorrect ? 10 : 0;

                $baris[] = [
                    'id' => $jawabanModel->newUniqueId(),
                    'pengerjaan_id' => $p->id,
                    'pengerjaan_subtes_id' => null,
                    'soal_id' => $soalId,
                    'opsi_dipilih_id' => $soal->tipe === 'pilihan_ganda' ? ($dipilih[0] ?? null) : null,
                    'opsi_dipilih_ids' => $soal->tipe === 'benar_salah' ? '{'.implode(',', $dipilih).'}' : null,
                    'jawaban_isian' => $teksIsian,
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

            // Simpan skor. Jika opsi keluar, skor tetap bisa disimpan untuk ditabulasi nanti.
            $p->update(['total_skor' => $totalSkor]);

            // Hanya tambahkan XP dan Poin jika latihan benar-benar diakhiri (Submit Final)
            if ($aksi === 'selesai') {
                $xpDidapat = ($jumlahBenar * 15) + 10;
                Siswa::where('user_id', Auth::id())->update([
                    'xp' => DB::raw('xp + '.(int) $xpDidapat),
                    'point' => DB::raw('point + '.(int) $totalSkor),
                ]);
            }

            return $p;
        });

        // Routing Berdasarkan Aksi
        if ($aksi === 'keluar') {
            // JANGAN hapus session 'latihan.SESI_ID' dari server jika masih mau dilanjutkan.
            // Namun, jika desain Anda adalah menginisialisasi sesi baru saat resume dari pengerjaan_id (database),
            // maka menghapus session tetap diperbolehkan. Saya hapus sesuai alur di kode lama Anda.
            session()->forget($kunciSesi);
            
            // Redirect ke halaman index/dashboard karena ini bukan penyelesaian ujian
            return redirect()->route('latihan.index')->with('success', 'Latihan disimpan sementara dan dapat dilanjutkan nanti.');
        }

        // Jika selesai, hapus sesi dari server dan pergi ke halaman hasil
        session()->forget($kunciSesi);
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
            'pengerjaan' => $pengerjaan,
        ]);
    }

    /**
     * Catat soal yang diberikan di session. cekJawaban() dan simpanJawaban() memakainya untuk memastikan
     * jawaban hanya untuk soal sesi ini dan satu sesi tidak bisa diselesaikan dua kali.
     */
    private function mulaiSesi(string $subtesId, string $mode, array $soalIds): string
    {
        $sesiId = (string) Str::uuid();

        // Buang sesi lama agar session tidak membengkak saat halaman ujian sering di-refresh.
        $semua = array_slice(session('latihan', []), -(self::MAKS_SESI - 1), null, true);

        $semua[$sesiId] = [
            'subtes_id' => $subtesId,
            'mode' => $mode,
            'soal_ids' => $soalIds,
            'mulai' => now()->toDateTimeString(),
            'terkunci' => [],
        ];

        session()->put('latihan', $semua);

        return $sesiId;
    }

    // Pangkas tepi termasuk non-breaking space; huruf besar-kecil disimpan apa adanya.
    private function rapikanIsian(?string $teks): string
    {
        return preg_replace('/^[\p{Z}\s]+|[\p{Z}\s]+$/u', '', (string) $teks);
    }
}
