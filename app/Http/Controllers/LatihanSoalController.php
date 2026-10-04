<?php

namespace App\Http\Controllers;

use App\Models\JawabanPengerjaan;
use App\Models\Pengerjaan;
use App\Models\Soal;
use App\Models\Subtes;
use App\Models\Topik;
use App\Models\TransaksiXp;
use App\Services\PembahasanPengerjaan;
use App\Services\PemilihSoal;
use App\Services\Penguasaan;
use App\Services\PenilaianJawaban;
use App\Services\PenilaianLatihan;
use App\Services\PerbaruiPenguasaan;
use App\Services\RekomendasiTopik;
use App\Services\RingkasanPenguasaan;
use App\Services\SesiFleksibel;
use App\Services\SoalRemedial;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Throwable;

class LatihanSoalController extends Controller
{
    // Jumlah sesi remedial dan simulasi di session per pengguna; refresh halaman ujian selalu membuat sesi baru. Fleksibel disimpan di database (SesiFleksibel).
    private const MAKS_SESI = 3;

    // Batas jumlah soal yang boleh dipilih siswa untuk satu sesi fleksibel.
    public const JUMLAH_SOAL_MIN = 10;

    public const JUMLAH_SOAL_MAKS = 20;

    // Mulai fleksibel ditekan padahal subtes ini masih punya sesi yang belum selesai (SF5).
    private const PESAN_SESI_BERJALAN = 'Kamu masih punya latihan fleksibel yang belum selesai di subtes ini. Lanjutkan dari menu Riwayat Pengerjaan.';

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

    /**
     * Mode fleksibel: buat sesi berjalan lalu buka halaman kerjakan (RANCANGAN-RENCANA-save-fleksibel.md 3.1).
     * Subtes yang masih punya sesi fleksibel berjalan tidak bisa dimulai lagi; siswa melanjutkannya dari Riwayat (SF5).
     */
    public function mulai(Request $request, PemilihSoal $pemilih, SesiFleksibel $sesi)
    {
        $subtesId = $request->input('subtesId');

        if (! is_string($subtesId) || ! Str::isUuid($subtesId)) {
            return redirect()->route('latihan.index');
        }

        $subtes = Subtes::findOrFail($subtesId);
        $userId = Auth::id();
        $halamanMode = route('latihan.mode', ['subtes' => $subtes->kode_subtes, 'tab' => 'fleksibel']);

        if ($sesi->aktif($userId, $subtes->id)) {
            Inertia::flash('error', self::PESAN_SESI_BERJALAN);

            return redirect($halamanMode);
        }

        // Satu atau beberapa topik subtes ini yang punya soal; soal dipilih menurut tahap siswa di tiap topik.
        $semuaTopik = Topik::where('subtes_id', $subtes->id)->whereHas('soal')->pluck('id')->all();
        $topikIds = array_values(array_unique(array_filter((array) $request->input('topikIds', []), 'is_string')));
        $jumlahSoal = (int) $request->input('jumlahSoal');

        if ($topikIds === [] || array_diff($topikIds, $semuaTopik) !== []
            || $jumlahSoal < self::JUMLAH_SOAL_MIN || $jumlahSoal > self::JUMLAH_SOAL_MAKS) {
            Inertia::flash('error', 'Pilih minimal satu topik dan jumlah soal '.self::JUMLAH_SOAL_MIN.'–'.self::JUMLAH_SOAL_MAKS.' dulu.');

            return redirect($halamanMode);
        }

        $soalIds = $pemilih->fleksibel($userId, $topikIds, $jumlahSoal);

        // Soal hanya muncul sekali per siswa, jadi soal di pilihan ini bisa sudah habis dikerjakan.
        if ($soalIds === []) {
            Inertia::flash('error', 'Tidak ada soal baru untuk pilihan ini: semua soalnya sudah pernah kamu kerjakan.');

            return redirect($halamanMode);
        }

        // Null: request lain (klik ganda) sudah membuat sesi untuk subtes ini lebih dulu.
        $pengerjaan = $sesi->buat($userId, $subtes->id, $soalIds, $request->boolean('iceBreakingAktif'));

        if (! $pengerjaan) {
            Inertia::flash('error', self::PESAN_SESI_BERJALAN);

            return redirect($halamanMode);
        }

        return redirect()->route('latihan.kerjakan', $pengerjaan->id);
    }

    /**
     * Halaman kerjakan fleksibel dari database: dibuka pertama kali, saat refresh, dan lewat Lanjut Kerjakan (SF4).
     * Soal tidak diacak ulang; jawaban yang sudah tersimpan tampil terkunci beserta umpan baliknya.
     */
    public function kerjakan(Pengerjaan $pengerjaan, SesiFleksibel $sesi)
    {
        // Milik siswa lain, Try Out, atau mode lain dianggap tidak ada.
        if ($pengerjaan->user_id !== Auth::id() || $pengerjaan->mode_latihan !== 'fleksibel') {
            abort(404);
        }

        if ($pengerjaan->status !== 'berjalan') {
            return redirect()->route('latihan.hasil', ['id' => $pengerjaan->id]);
        }

        $subtes = Subtes::findOrFail($pengerjaan->subtes_id);
        $soalList = $this->soalUntukUjian($pengerjaan->soal_ids);

        return Inertia::render('Latihan/Ujian', [
            'subtes' => $subtes,
            'soalList' => $soalList,
            'konfigurasi' => [
                'sesiId' => $pengerjaan->id,
                'subtesId' => $subtes->id,
                'namaSubtes' => $subtes->nama_subtes,
                'mode' => 'fleksibel',
                'jumlahSoal' => $soalList->count(),
                'iceBreakingAktif' => (bool) $pengerjaan->ice_breaking_aktif,
            ],
            ...$sesi->muat($pengerjaan, $soalList),
        ]);
    }

    public function ujian(Request $request, PemilihSoal $pemilih, SoalRemedial $remedial)
    {
        $subtesId = $request->get('subtesId');

        if (! Str::isUuid($subtesId)) {
            return redirect()->route('latihan.index');
        }

        $subtes = Subtes::findOrFail($subtesId);
        $mode = $request->get('mode');

        // Fleksibel dimulai lewat latihan.mulai dan dikerjakan di latihan.kerjakan. Tautan lama ke sini dibawa ke
        // tab Fleksibel di Pilih Mode.
        if (! in_array($mode, ['simulasi', 'remedial'], true)) {
            return redirect()->route('latihan.mode', ['subtes' => $subtes->kode_subtes, 'tab' => 'fleksibel']);
        }

        if ($mode === 'remedial') {
            // Remedial: 25 soal yang paling lama menunggu di daftar remedial subtes ini, tanpa tahap dan tanpa timer.
            $soalIds = $remedial->ambil(Auth::id(), $subtes->id);
        } else {
            // Simulasi mengikuti format UTBK per subtes dan tidak memakai tahap; jumlah soal dari URL diabaikan.
            $soalIds = $pemilih->simulasi(Auth::id(), $subtes->id, $subtes->jumlah_soal);
        }

        // Soal hanya muncul sekali per siswa, jadi soal di pilihan ini bisa sudah habis dikerjakan. Kembali ke Pilih
        // Mode di tab yang sama (mis. pesan "Tidak ada soal remedial" tampil di tab Remedial).
        if ($soalIds === []) {
            Inertia::flash('error', $mode === 'remedial'
                ? 'Tidak ada soal remedial untuk subtes ini.'
                : 'Tidak ada soal baru untuk pilihan ini: semua soalnya sudah pernah kamu kerjakan.');

            return redirect()->route('latihan.mode', ['subtes' => $subtes->kode_subtes, 'tab' => $mode]);
        }

        $soalList = $this->soalUntukUjian($soalIds);

        $konfigurasi = [
            'sesiId' => $this->mulaiSesi($subtes->id, $mode, $soalList->pluck('id')->all()),
            'subtesId' => $subtesId,
            'namaSubtes' => $subtes->nama_subtes,
            'namaTopik' => $mode === 'remedial' ? 'Remedial' : null,
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
     * Mode fleksibel dan remedial: nilai dan simpan satu jawaban saat "Simpan Jawaban" ditekan (SF7). Fleksibel menulis
     * ke database; remedial mengunci jawaban di session sampai Selesaikan. Kunci dan pembahasan hanya dikirim di
     * balasan ini, setelah jawaban final, jadi tidak bisa dipakai untuk menebak.
     */
    public function jawab(Request $request, SesiFleksibel $fleksibel)
    {
        $data = $request->validate([
            'sesiId' => ['required', 'uuid'],
            'soalId' => ['required', 'uuid'],
            'opsiIds' => ['nullable', 'array'],
            'opsiIds.*' => ['string'],
            // Jawaban isian dibatasi satu kata atau bilangan bulat; 100 karakter sudah sangat longgar.
            'jawabanIsian' => ['nullable', 'string', 'max:100'],
        ]);
        $opsiIds = $data['opsiIds'] ?? [];
        $jawabanIsian = $data['jawabanIsian'] ?? null;

        $kunciSesi = 'latihan.'.$data['sesiId'];
        $sesi = session($kunciSesi);

        // Tidak ada di session: fleksibel di database (RANCANGAN-RENCANA-save-fleksibel.md 5.2).
        if (! $sesi) {
            $pengerjaan = $fleksibel->cari(Auth::id(), $data['sesiId']);

            return $pengerjaan
                ? response()->json($fleksibel->jawab($pengerjaan, $data['soalId'], $opsiIds, $jawabanIsian))
                : response()->json(['message' => 'Sesi latihan tidak ditemukan atau sudah selesai.'], 410);
        }

        // Mode simulasi tidak boleh tahu benar/salah sebelum latihan selesai.
        if ($sesi['mode'] === 'simulasi') {
            return response()->json(['message' => 'Pengecekan per soal tidak tersedia di mode simulasi.'], 403);
        }

        if (! in_array($data['soalId'], $sesi['soal_ids'], true)) {
            throw ValidationException::withMessages(['soalId' => 'Soal ini bukan bagian dari sesi latihan.']);
        }

        $soal = Soal::with(['opsiJawaban' => fn ($q) => $q->orderBy('urutan')])
            ->findOrFail($data['soalId'], ['id', 'tipe', 'kunci_jawaban', 'pembahasan']);

        // Sudah dikunci: balas hasil yang tersimpan tanpa menilai ulang, supaya jawaban tidak bisa diganti.
        if ($terkunci = $sesi['terkunci'][$data['soalId']] ?? null) {
            return response()->json(PembahasanPengerjaan::umpanBalikSoal($soal, $terkunci['benar']));
        }

        $hasil = PenilaianJawaban::nilai(
            $soal->tipe,
            $soal->opsiJawaban->pluck('id')->all(),
            $soal->opsiJawaban->where('is_kunci', true)->pluck('id')->all(),
            $soal->kunci_jawaban,
            $opsiIds,
            $jawabanIsian,
        );

        if ($hasil === null) {
            throw ValidationException::withMessages(['jawaban' => 'Jawaban tidak boleh kosong.']);
        }

        // Dikunci di session sampai Selesaikan; simpanJawaban() memakai kuncian ini, bukan kiriman klien.
        session()->put("{$kunciSesi}.terkunci.{$data['soalId']}", [
            'opsiIds' => $hasil['opsiIds'],
            'jawaban' => $hasil['jawabanIsian'],
            'benar' => $hasil['benar'],
            'waktu' => now()->toDateTimeString(),
        ]);

        return response()->json(PembahasanPengerjaan::umpanBalikSoal($soal, $hasil['benar']));
    }

    /**
     * Mode fleksibel dan remedial: buka hint satu soal. Fleksibel mencatatnya di pengerjaan.hint_soal_ids (SF9), remedial
     * di session. SesiFleksibel::jawab() dan simpanJawaban() mengisi pakai_hint dari catatan ini, bukan dari kiriman
     * browser.
     */
    public function bukaHint(Request $request, SesiFleksibel $fleksibel)
    {
        $data = $request->validate([
            'sesiId' => ['required', 'uuid'],
            'soalId' => ['required', 'uuid'],
        ]);

        $kunciSesi = 'latihan.'.$data['sesiId'];
        $sesi = session($kunciSesi);
        $pengerjaan = $sesi ? null : $fleksibel->cari(Auth::id(), $data['sesiId']);

        if (! $sesi && ! $pengerjaan) {
            return response()->json(['message' => 'Sesi latihan tidak ditemukan atau sudah selesai.'], 410);
        }

        if ($sesi && $sesi['mode'] === 'simulasi') {
            return response()->json(['message' => 'Hint tidak tersedia di mode simulasi.'], 403);
        }

        if (! in_array($data['soalId'], $sesi ? $sesi['soal_ids'] : $pengerjaan->soal_ids, true)) {
            throw ValidationException::withMessages(['soalId' => 'Soal ini bukan bagian dari sesi latihan.']);
        }

        $hint = Soal::whereKey($data['soalId'])->value('hint');

        if (blank($hint)) {
            return response()->json(['message' => 'Soal ini belum punya hint.'], 404);
        }

        if ($pengerjaan) {
            $fleksibel->bukaHint($pengerjaan, $data['soalId']);
        } elseif (! isset($sesi['terkunci'][$data['soalId']])) {
            // Jawaban yang sudah dikunci nilainya final, jadi hint tidak lagi mengurangi nilai.
            session()->put("{$kunciSesi}.hint.{$data['soalId']}", true);
        }

        return response()->json(['hint' => $hint]);
    }

    public function simpanJawaban(Request $request, PerbaruiPenguasaan $penguasaan, PenilaianLatihan $penilaian, SesiFleksibel $fleksibel)
    {
        $sesiId = $request->input('sesiId');
        $kunciSesi = 'latihan.'.$sesiId;

        // Fleksibel yang tersimpan di database (RANCANGAN-RENCANA-save-fleksibel.md 5.2). Sesi di session
        // (remedial, simulasi, dan fleksibel lama) didahulukan.
        $pengerjaan = is_string($sesiId) && Str::isUuid($sesiId) && ! session()->has($kunciSesi)
            ? $fleksibel->milik(Auth::id(), $sesiId)
            : null;

        if ($pengerjaan) {
            return $this->simpanFleksibel($request->get('aksi'), $pengerjaan, $fleksibel, $penguasaan);
        }

        // Session: Keluar membatalkan sesi. Remedial tidak disimpan (SF8).
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

                if ($terkunci) {
                    // Sudah dinilai lewat jawab(): pakai jawaban dan hasil yang terkunci di session, abaikan kiriman klien.
                    // Kuncian sesi lama (hanya isian, tanpa opsiIds) tetap terbaca.
                    $dipilih = $terkunci['opsiIds'] ?? [];
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
                    // Bulk insert melewati mutator Eloquent; kolom per tipe soal dari kolomJawaban().
                    ...JawabanPengerjaan::kolomJawaban($soal->tipe, $dipilih, $teksIsian),
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

    /**
     * Keluar atau Selesaikan untuk fleksibel di database. Keluar tidak menulis apa pun karena setiap jawaban sudah
     * tersimpan (SF3). Selesaikan yang dikirim ulang setelah sesi selesai langsung ke Hasil (SF14).
     */
    private function simpanFleksibel(?string $aksi, Pengerjaan $pengerjaan, SesiFleksibel $fleksibel, PerbaruiPenguasaan $penguasaan)
    {
        if ($pengerjaan->status === 'berjalan' && $aksi === 'keluar') {
            return redirect()->route('dashboard');
        }

        if ($pengerjaan->status === 'berjalan') {
            [$pengerjaan, $topikDijawab] = $fleksibel->selesaikan($pengerjaan);

            // Sama seperti jalur session: penguasaan dihitung sesudah jawaban dan XP tersimpan, dan kegagalannya
            // tidak membatalkan apa pun (sesi berikutnya menghitung ulang dari log jawaban).
            if ($topikDijawab !== []) {
                try {
                    $penguasaan->setelahSesi(Auth::id(), $topikDijawab, $pengerjaan->id, $pengerjaan->finished_at);
                } catch (Throwable $e) {
                    report($e);
                }
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

        // Sesi fleksibel yang belum selesai dibuka di halaman kerjakan; Hasil belum punya nilai akhirnya (SF13).
        if ($pengerjaan->status === 'berjalan') {
            return redirect()->route('latihan.kerjakan', $pengerjaan->id);
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
     * Soal halaman ujian urut $soalIds, tanpa kunci, pembahasan, dan teks hint (SF7). Kunci dan pembahasan dikirim
     * latihan.jawab setelah soal dijawab; teks hint lewat latihan.hint supaya pemakaiannya tercatat. Atribut yang
     * disembunyikan tetap bisa dibaca di server (SesiFleksibel::muat). Soal yang sudah dihapus dari bank dilewati.
     *
     * @param  string[]  $soalIds
     */
    private function soalUntukUjian(array $soalIds): Collection
    {
        $soalList = Soal::with(['opsiJawaban' => fn ($q) => $q->orderBy('urutan')])
            ->whereIn('id', $soalIds)
            ->get()
            ->sortBy(fn ($s) => array_search($s->id, $soalIds))
            ->values();

        $soalList->each(function (Soal $soal) {
            $soal->setAttribute('ada_hint', filled($soal->hint));
            $soal->makeHidden(['kunci_jawaban', 'hint', 'pembahasan']);
            $soal->opsiJawaban->each->makeHidden('is_kunci');
        });

        return $soalList;
    }

    /**
     * Catat soal yang diberikan di session. jawab() dan simpanJawaban() memakainya untuk memastikan
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
            // Remedial: soal yang hint-nya dibuka.
            'hint' => [],
        ];

        session()->put('latihan', $semua);

        return $sesiId;
    }
}
