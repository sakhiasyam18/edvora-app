<?php

namespace App\Http\Controllers;

use App\Models\JawabanPengerjaan;
use App\Models\Pengerjaan;
use App\Models\Soal;
use App\Models\Subtes;
use App\Models\Topik;
use App\Models\TransaksiXp;
use App\Services\PemilihSoal;
use App\Services\Penguasaan;
use App\Services\PenilaianIsian;
use App\Services\PenilaianJawaban;
use App\Services\PenilaianLatihan;
use App\Services\PerbaruiPenguasaan;
use App\Services\RekomendasiTopik;
use App\Services\RingkasanPenguasaan;
use App\Services\SoalRemedial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Throwable;

class LatihanSoalController extends Controller
{
    // Jumlah sesi latihan yang disimpan per pengguna; refresh halaman ujian selalu membuat sesi baru.
    private const MAKS_SESI = 3;

    // Batas jumlah soal yang boleh dipilih siswa untuk satu sesi fleksibel.
    public const JUMLAH_SOAL_MIN = 10;

    public const JUMLAH_SOAL_MAKS = 20;

    public function index()
    {
        // Pilih Subtes. jumlahTopik hanya menghitung topik yang punya soal; 0 = card nonaktif.
        // Jumlah soal sengaja tidak dikirim.
        $subtesList = Subtes::select(['id', 'kode_subtes', 'nama_subtes', 'deskripsi'])
            ->withCount(['topik' => fn ($q) => $q->whereHas('soal')])
            ->orderBy('urutan')
            ->get()
            ->map(fn (Subtes $subtes) => [
                'id' => $subtes->id,
                'kode' => $subtes->kode_subtes,
                'nama' => $subtes->nama_subtes,
                'deskripsi' => $subtes->deskripsi,
                'jumlahTopik' => $subtes->topik_count,
            ]);

        return Inertia::render('Latihan/Persiapan', [
            'subtesList' => $subtesList,
        ]);
    }

    /**
     * Pilih Mode untuk satu subtes: fleksibel (pilih topik dan jumlah soal), simulasi, dan remedial.
     */
    public function pilihMode(Request $request, Subtes $subtes, RingkasanPenguasaan $ringkasan, SoalRemedial $remedial)
    {
        $userId = Auth::id();
        $topikSubtes = $ringkasan->perSubtes($userId, $subtes->id)[$subtes->id] ?? [];

        // Label "Direkomendasikan" = 3 rekomendasi teratas subtes ini (RANCANGAN-penyesuaian-sdd.md 5.4).
        $idRekomendasi = array_column(RekomendasiTopik::untukSubtes($topikSubtes), 'id');

        $topikList = collect($topikSubtes)
            ->filter(fn (array $topik) => $topik['adaSoal'])
            ->sortBy('urutan')
            ->map(fn (array $topik) => [
                'id' => $topik['id'],
                'nama' => $topik['nama'],
                'tahap' => $topik['tahap'],
                'label' => $topik['label'],
                'persen' => Penguasaan::persen($topik['tahap'], $topik['skor']),
                'direkomendasikan' => in_array($topik['id'], $idRekomendasi, true),
            ])
            ->values();

        // Dibuka dari halaman Perkembangan: tab dan topik awal dari URL. URL bisa diubah siswa, jadi nilai yang tidak
        // dikenal (termasuk array dan topik subtes lain) diabaikan; in_array strict juga menolak array.
        $tabAwal = in_array($request->query('tab'), ['fleksibel', 'simulasi', 'remedial'], true) ? $request->query('tab') : 'fleksibel';
        $topikAwal = in_array($request->query('topik'), $topikList->pluck('id')->all(), true) ? $request->query('topik') : null;

        return Inertia::render('Latihan/PilihMode', [
            'subtes' => [
                'id' => $subtes->id,
                'kode' => $subtes->kode_subtes,
                'nama' => $subtes->nama_subtes,
                'deskripsi' => $subtes->deskripsi,
                'jumlahTopik' => $topikList->count(),
            ],
            'topikList' => $topikList,
            'batasSoal' => ['min' => self::JUMLAH_SOAL_MIN, 'maks' => self::JUMLAH_SOAL_MAKS],
            'simulasi' => [
                'jumlahSoal' => $subtes->jumlah_soal,
                'waktuMenit' => $subtes->waktu_default_menit,
            ],
            'remedial' => [
                'jumlahSoal' => $remedial->jumlah($userId, $subtes->id),
                'batasSesi' => SoalRemedial::BATAS_SESI,
            ],
            'tabAwal' => $tabAwal,
            'topikAwal' => $topikAwal,
        ]);
    }

    public function ujian(Request $request, PemilihSoal $pemilih, SoalRemedial $remedial)
    {
        $subtesId = $request->get('subtesId');

        if (! Str::isUuid($subtesId)) {
            return redirect()->route('latihan.index');
        }

        $subtes = Subtes::findOrFail($subtesId);

        $mode = in_array($request->get('mode'), ['simulasi', 'remedial'], true) ? $request->get('mode') : 'fleksibel';
        $namaTopik = null;
        // Input tidak valid atau soal habis: kembali ke halaman Pilih Mode subtes ini, di tab yang sama
        // (mis. pesan "Tidak ada soal remedial" tampil di tab Remedial, bukan Fleksibel).
        $halamanMode = route('latihan.mode', ['subtes' => $subtes->kode_subtes, 'tab' => $mode]);

        if ($mode === 'fleksibel') {
            // Fleksibel: satu atau beberapa topik subtes ini yang punya soal; soal dipilih menurut tahap siswa di tiap topik.
            $semuaTopik = Topik::where('subtes_id', $subtes->id)->whereHas('soal')->orderBy('urutan')->get(['id', 'nama_topik']);
            $topikIds = array_values(array_unique(array_filter((array) $request->input('topikIds', []), 'is_string')));
            $topikList = $semuaTopik->whereIn('id', $topikIds)->values();
            $jumlahSoal = (int) $request->get('jumlahSoal');

            if ($topikList->isEmpty() || $topikList->count() !== count($topikIds)
                || $jumlahSoal < self::JUMLAH_SOAL_MIN || $jumlahSoal > self::JUMLAH_SOAL_MAKS) {
                Inertia::flash('error', 'Pilih minimal satu topik dan jumlah soal '.self::JUMLAH_SOAL_MIN.'–'.self::JUMLAH_SOAL_MAKS.' dulu.');

                return redirect($halamanMode);
            }

            $soalIds = $pemilih->fleksibel(Auth::id(), $topikList->pluck('id')->all(), $jumlahSoal);
            $namaTopik = $topikList->count() === $semuaTopik->count() ? 'Semua topik' : $topikList->pluck('nama_topik')->implode(', ');
        } elseif ($mode === 'remedial') {
            // Remedial: 25 soal yang paling lama menunggu di daftar remedial subtes ini, tanpa tahap dan tanpa timer.
            $soalIds = $remedial->ambil(Auth::id(), $subtes->id);
            $namaTopik = 'Remedial';
        } else {
            // Simulasi mengikuti format UTBK per subtes dan tidak memakai tahap; jumlah soal dari URL diabaikan.
            $soalIds = $pemilih->simulasi(Auth::id(), $subtes->id, $subtes->jumlah_soal);
        }

        // Soal hanya muncul sekali per siswa, jadi soal di pilihan ini bisa sudah habis dikerjakan.
        if ($soalIds === []) {
            Inertia::flash('error', $mode === 'remedial'
                ? 'Tidak ada soal remedial untuk subtes ini.'
                : 'Tidak ada soal baru untuk pilihan ini: semua soalnya sudah pernah kamu kerjakan.');

            return redirect($halamanMode);
        }

        $soalList = Soal::with(['opsiJawaban' => fn ($q) => $q->orderBy('urutan')])
            ->whereIn('id', $soalIds)
            ->get()
            ->sortBy(fn ($s) => array_search($s->id, $soalIds))
            ->values();

        // Kunci isian dinilai di server; teks hint diambil lewat latihan.hint supaya pemakaiannya tercatat.
        $soalList->makeHidden(['kunci_jawaban', 'hint']);
        $soalList->each(fn ($soal) => $soal->setAttribute('ada_hint', filled($soal->hint)));

        $konfigurasi = [
            'sesiId' => $this->mulaiSesi($subtes->id, $mode, $soalList->pluck('id')->all()),
            'subtesId' => $subtesId,
            'namaSubtes' => $subtes->nama_subtes,
            // Mode fleksibel: "Semua topik" atau nama topik yang dipilih, untuk judul halaman.
            'namaTopik' => $namaTopik,
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
     * Mode fleksibel dan remedial: nilai satu jawaban isian saat tombol "Simpan Jawaban" ditekan.
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
        if ($sesi['mode'] === 'simulasi') {
            return response()->json(['message' => 'Pengecekan per soal tidak tersedia di mode simulasi.'], 403);
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

        $teksIsian = PenilaianJawaban::rapikanIsian($data['jawabanIsian']);

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
    private function hasilCek(bool $benar, ?string $kunci, bool $sudahDikunci = false): JsonResponse
    {
        $data = ['benar' => $benar];

        if ($sudahDikunci) {
            $data['sudahDikunci'] = true;
        }

        if (! $benar) {
            // Kunci boleh punya alternatif dipisah "|"; siswa cukup dilihatkan yang pertama.
            $data['kunciJawaban'] = PenilaianIsian::kunciTampil($kunci);
        }

        return response()->json($data);
    }

    /**
     * Mode fleksibel dan remedial: buka hint satu soal. Pembukaan dicatat di session, lalu simpanJawaban() mengisi
     * pakai_hint dari catatan ini, bukan dari kiriman browser.
     */
    public function bukaHint(Request $request)
    {
        $data = $request->validate([
            'sesiId' => ['required', 'uuid'],
            'soalId' => ['required', 'uuid'],
        ]);

        $kunciSesi = 'latihan.'.$data['sesiId'];
        $sesi = session($kunciSesi);

        if (! $sesi) {
            return response()->json(['message' => 'Sesi latihan tidak ditemukan atau sudah selesai.'], 410);
        }

        if ($sesi['mode'] === 'simulasi') {
            return response()->json(['message' => 'Hint tidak tersedia di mode simulasi.'], 403);
        }

        if (! in_array($data['soalId'], $sesi['soal_ids'], true)) {
            throw ValidationException::withMessages(['soalId' => 'Soal ini bukan bagian dari sesi latihan.']);
        }

        $hint = Soal::whereKey($data['soalId'])->value('hint');

        if (blank($hint)) {
            return response()->json(['message' => 'Soal ini belum punya hint.'], 404);
        }

        // Isian yang sudah dikunci lewat cekJawaban() nilainya sudah final, jadi hint tidak lagi mengurangi nilai.
        if (! isset($sesi['terkunci'][$data['soalId']])) {
            session()->put("{$kunciSesi}.hint.{$data['soalId']}", true);
        }

        return response()->json(['hint' => $hint]);
    }

    public function simpanJawaban(Request $request, PerbaruiPenguasaan $penguasaan, PenilaianLatihan $penilaian)
    {
        $sesiId = $request->input('sesiId');
        $kunciSesi = 'latihan.'.$sesiId;

        if ($request->get('aksi') === 'keluar') {
            if (Str::isUuid($sesiId)) {
                session()->forget($kunciSesi);
            }

            return redirect()->route('dashboard');
        }

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
        // Hanya soal yang benar-benar diberikan di sesi ini; soal dobel cukup yang pertama.
        $kiriman = collect($request->input('jawaban', []))
            ->filter(fn ($j) => is_array($j) && in_array($j['soalId'] ?? null, $sesi['soal_ids'], true))
            ->unique('soalId')
            ->keyBy('soalId');

        $iceBreakingAktif = $request->boolean('iceBreakingAktif');
        $selesai = now();

        [$pengerjaan, $topikDijawab] = DB::transaction(function () use ($sesi, $kiriman, $iceBreakingAktif, $selesai, $penilaian) {
            $p = Pengerjaan::create([
                'user_id' => Auth::id(),
                'tipe' => 'latihan_bebas',
                'status' => 'selesai',
                'subtes_id' => $sesi['subtes_id'],
                'jumlah_soal_dipilih' => count($sesi['soal_ids']),
                'ice_breaking_aktif' => $iceBreakingAktif,
                'started_at' => $sesi['mulai'],
                'finished_at' => $selesai,
                'total_skor' => 0,
                'mode_latihan' => $sesi['mode'],
                // Semua soal sesi urut tampil, termasuk yang tidak dijawab, untuk halaman pembahasan.
                // Ditulis sebagai literal array Postgres karena create() tidak mengubah array PHP menjadi uuid[].
                'soal_ids' => '{'.implode(',', $sesi['soal_ids']).'}',
            ]);

            // Ambil semua soal beserta opsinya sekali jalan - hindari N+1 query.
            $soalMap = Soal::with('opsiJawaban:id,soal_id,is_kunci')
                ->whereIn('id', $sesi['soal_ids'])
                ->get(['id', 'tipe', 'kunci_jawaban', 'topik_id', 'tingkat_kesulitan'])
                ->keyBy('id');

            $jawabanModel = new JawabanPengerjaan;
            $waktuSelesai = now()->toDateTimeString();
            $baris = [];
            $totalXp = 0;
            $totalPoin = 0;

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
                    // Sudah dicek lewat cekJawaban(): pakai jawaban dan hasil yang terkunci, abaikan kiriman klien.
                    $teksIsian = $terkunci['jawaban'];
                    $isCorrect = $terkunci['benar'];
                    $waktuMenjawab = $terkunci['waktu'];
                } elseif (! $j) {
                    continue;
                } else {
                    // Aturan penilaian dipakai bersama Try Out (RANCANGAN-tryout.md 5.8).
                    // Sementara: terima bentuk lama { opsiId } sampai semua klien memakai opsiIds.
                    $hasil = PenilaianJawaban::nilai(
                        $soal->tipe,
                        $soal->opsiJawaban->pluck('id')->all(),
                        $soal->opsiJawaban->where('is_kunci', true)->pluck('id')->all(),
                        $soal->kunci_jawaban,
                        $j['opsiIds'] ?? (isset($j['opsiId']) ? [$j['opsiId']] : []),
                        $j['jawabanIsian'] ?? null,
                    );

                    // Jawaban kosong tidak dicatat.
                    if ($hasil === null) {
                        continue;
                    }

                    $dipilih = $hasil['opsiIds'];
                    $teksIsian = $hasil['jawabanIsian'];
                    $isCorrect = $hasil['benar'];
                }

                $pakaiHint = isset($sesi['hint'][$soalId]);
                $hadiah = PenilaianLatihan::hadiah($soal->tingkat_kesulitan, $isCorrect, $pakaiHint);

                $baris[] = [
                    'id' => $jawabanModel->newUniqueId(),
                    'pengerjaan_id' => $p->id,
                    'pengerjaan_subtes_id' => null,
                    'soal_id' => $soalId,
                    // Bulk insert melewati mutator Eloquent, jadi format array Postgres ditulis manual.
                    'opsi_dipilih_id' => $soal->tipe === 'pilihan_ganda' ? ($dipilih[0] ?? null) : null,
                    'opsi_dipilih_ids' => $soal->tipe === 'benar_salah' ? '{'.implode(',', $dipilih).'}' : null,
                    'jawaban_isian' => $teksIsian,
                    'is_correct' => $isCorrect,
                    // Poin jawaban ini (RANCANGAN-penyesuaian-sdd.md 4.2).
                    'skor' => $hadiah['poin'],
                    'waktu_menjawab' => $waktuMenjawab,
                    'pakai_hint' => $pakaiHint,
                ];

                $totalXp += $hadiah['xp'];
                $totalPoin += $hadiah['poin'];
            }

            if ($baris) {
                JawabanPengerjaan::insert($baris);
            }

            $p->update(['total_skor' => $totalPoin]);

            $penilaian->catatHadiah($p->user_id, $p->id, $totalXp, $totalPoin, $selesai);

            // Topik yang benar-benar punya jawaban di sesi ini; hanya topik ini yang tahapnya dinilai.
            $topikDijawab = array_values(array_unique(array_map(fn ($b) => $soalMap[$b['soal_id']]->topik_id, $baris)));

            return [$p, $topikDijawab];
        });

        // Sesi yang sudah diselesaikan dihapus agar tidak bisa disubmit ulang untuk menambah XP.
        session()->forget($kunciSesi);

        // Skor dan tahap dihitung untuk sesi fleksibel dan remedial (#4); setiap topik yang dijawab dinilai sendiri-sendiri.
        // Dihitung sesudah jawaban tersimpan: bila gagal, jawaban dan XP tetap aman, dan sesi berikutnya menghitung ulang
        // dari log jawaban.
        if (in_array($sesi['mode'], ['fleksibel', 'remedial'], true) && $topikDijawab !== []) {
            try {
                $penguasaan->setelahSesi(Auth::id(), $topikDijawab, $pengerjaan->id, $selesai);
            } catch (Throwable $e) {
                report($e);
            }
        }

        return redirect()->route('latihan.hasil', ['id' => $pengerjaan->id]);
    }

    public function hasil(Request $request, RingkasanPenguasaan $ringkasan)
    {
        $id = $request->get('id');
        $pengerjaan = Pengerjaan::with('jawabanPengerjaan')->where('user_id', Auth::id())->findOrFail($id);

        // Hasil Try Out punya halamannya sendiri. Halaman ini mengirim benar/salah per soal, yang tidak boleh
        // terlihat selama paket masih Dibuka (RANCANGAN-tryout.md T15).
        if ($pengerjaan->try_out_id) {
            return redirect()->route('tryout.hasil', $pengerjaan->try_out_id);
        }

        $jumlahBenar = $pengerjaan->jawabanPengerjaan->where('is_correct', true)->count();
        $jumlahSalah = $pengerjaan->jawabanPengerjaan->where('is_correct', false)->count();

        // XP dibaca dari catatan saat diberikan (K12); sesi sebelum aturan ini tidak punya catatan, jadi 0.
        $xpDidapat = (int) TransaksiXp::where('pengerjaan_id', $pengerjaan->id)->sum('jumlah');

        $hasil = [
            'jumlahBenar' => $jumlahBenar,
            'jumlahSalah' => $jumlahSalah,
            'poin' => (int) $pengerjaan->total_skor,
            'xpDidapat' => $xpDidapat,
        ];

        return Inertia::render('Latihan/Hasil', [
            'hasil' => $hasil,
            'pengerjaan' => $pengerjaan,
            // Tahap dan skor setiap topik setelah sesi fleksibel ini, termasuk naik/turun tahap bila ada.
            'ringkasanTopik' => $ringkasan->untukHasil($pengerjaan),
            // Topik yang disarankan dilatih berikutnya di subtes yang sama (maks 3).
            'rekomendasiTopik' => $pengerjaan->subtes_id
                ? RekomendasiTopik::untukSubtes($ringkasan->perSubtes(Auth::id(), $pengerjaan->subtes_id)[$pengerjaan->subtes_id] ?? [])
                : [],
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
            // Latihan fleksibel: soal yang hint-nya dibuka.
            'hint' => [],
        ];

        session()->put('latihan', $semua);

        return $sesiId;
    }
}
