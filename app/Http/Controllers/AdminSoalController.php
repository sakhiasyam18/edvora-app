<?php

namespace App\Http\Controllers;

use App\Models\Soal;
use App\Models\Subtes;
use App\Models\Topik;
use App\Models\TryOut;
use App\Services\FormulirSoal;
use App\Services\ImportSoalExcel;
use App\Services\MajemukTabel;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

/**
 * Halaman editor (UCS7 Bank Soal): dashboard stok soal, daftar soal per subtes, serta tambah dan edit satu soal.
 * Upload Excel ada di UploadSoalController. Soal dari formulir diperiksa dengan aturan yang sama dengan import Excel.
 */
class AdminSoalController extends Controller
{
    private const PER_HALAMAN = 20;

    public function dashboard(): Response
    {
        $stok = DB::select(<<<'SQL'
            select s.kode_subtes, s.nama_subtes,
                   (select count(*) from topik t where t.subtes_id = s.id) as topik,
                   count(q.id) filter (where q.status = 'published') as published,
                   count(q.id) filter (where q.status = 'draft') as draft,
                   count(q.id) filter (where q.status = 'review') as review
            from subtes s
            left join soal q on q.subtes_id = s.id
            group by s.id
            order by s.urutan
            SQL);

        $stokSubtes = array_map(fn ($s) => [
            'kode' => $s->kode_subtes,
            'nama' => $s->nama_subtes,
            'jumlahTopik' => (int) $s->topik,
            'published' => (int) $s->published,
            'draft' => (int) $s->draft,
            'review' => (int) $s->review,
        ], $stok);

        return Inertia::render('Editor/Dashboard', [
            'ringkasan' => [
                'published' => array_sum(array_column($stokSubtes, 'published')),
                'draft' => array_sum(array_column($stokSubtes, 'draft')),
                'review' => array_sum(array_column($stokSubtes, 'review')),
            ],
            'tryOutDibuka' => TryOut::dibuka()->count(),
            'stokSubtes' => $stokSubtes,
        ]);
    }

    public function index(Request $request, Subtes $subtes): Response
    {
        $topikList = $subtes->topik()->get(['id', 'nama_topik']);
        $namaTopik = $topikList->pluck('nama_topik', 'id');

        // Nilai filter yang tidak dikenal diabaikan, bukan error query (mis. id topik subtes lain).
        $topik = $request->query('topik');
        $filter = [
            'topik' => is_string($topik) && $namaTopik->has($topik) ? $topik : null,
            'status' => in_array($request->query('status'), Soal::STATUS, true) ? $request->query('status') : null,
            'cari' => is_string($request->query('cari')) ? trim($request->query('cari')) : '',
        ];
        $pola = '%'.addcslashes($filter['cari'], '\\%_').'%';

        $soalList = Soal::query()
            ->where('subtes_id', $subtes->id)
            ->when($filter['topik'], fn ($q, $id) => $q->where('topik_id', $id))
            ->when($filter['status'], fn ($q, $status) => $q->where('status', $status))
            ->when($filter['cari'] !== '', fn ($q) => $q->where(fn ($q) => $q->where('kode_soal', 'ilike', $pola)->orWhere('teks_soal', 'ilike', $pola)))
            // PU-099 sebelum PU-100, juga bila nomornya sudah 4 digit.
            ->orderByRaw('length(kode_soal), kode_soal')
            ->paginate(self::PER_HALAMAN, ['id', 'kode_soal', 'teks_soal', 'topik_id', 'tipe', 'tingkat_kesulitan', 'status'])
            ->withQueryString()
            ->through(fn (Soal $s) => [
                'kode' => $s->kode_soal,
                'teks' => Str::limit(preg_replace('/\s+/u', ' ', $s->teks_soal), 90),
                'topik' => $namaTopik[$s->topik_id] ?? '-',
                'tipe' => $s->tipe,
                'tingkat' => $s->tingkat_kesulitan,
                'status' => $s->status,
            ]);

        return Inertia::render('Editor/BankSoal', [
            'subtes' => self::infoSubtes($subtes),
            'topikList' => self::pilihanTopik($topikList),
            'filter' => $filter,
            'soalList' => $soalList,
            'adaTemplate' => is_file(UploadSoalController::pathTemplate()),
            'maksBarisUpload' => UploadSoalController::MAKS_BARIS,
        ]);
    }

    public function tambah(Subtes $subtes): Response
    {
        return $this->formulir($subtes, Soal::kodeBerikutnya($subtes));
    }

    public function edit(Soal $soal): Response
    {
        $soal->load('opsiJawaban');

        return $this->formulir($soal->subtes, $soal->kode_soal, FormulirSoal::dariSoal($soal) + ['status' => $soal->status]);
    }

    /**
     * Kode soal dikirim dari formulir (tampil read-only), supaya nama file gambar yang ditulis editor cocok dengan
     * kode yang tersimpan. Kode yang sudah dipakai soal lain ditolak, bukan menimpa soal itu.
     */
    public function simpan(Request $request, Subtes $subtes, ImportSoalExcel $importer): RedirectResponse
    {
        $isian = $this->validasi($request);
        $kode = (string) $request->validate([
            'kodeSoal' => ['required', 'string', 'regex:/^'.preg_quote($subtes->kode_subtes, '/').'-\d{3,}$/'],
        ])['kodeSoal'];

        if (Soal::where('kode_soal', $kode)->exists()) {
            throw ValidationException::withMessages(['umum' => self::pesanKodeTerpakai($kode)]);
        }

        $this->simpanSoal($isian, $subtes, $kode, $importer, hanyaBaru: true);
        Inertia::flash('sukses', $isian['status'] === 'published'
            ? "Soal {$kode} berhasil ditambahkan dan dipublish."
            : "Soal {$kode} berhasil ditambahkan sebagai Draft.");

        return redirect()->route('editor.soal.index', $subtes->kode_subtes);
    }

    public function ubah(Request $request, Soal $soal, ImportSoalExcel $importer): RedirectResponse
    {
        $isian = $this->validasi($request);

        $this->simpanSoal($isian, $soal->subtes, $soal->kode_soal, $importer);
        Inertia::flash('sukses', 'Soal Berhasil Diubah');

        return redirect()->route('editor.soal.index', $soal->subtes->kode_subtes);
    }

    // Tombol status di daftar soal: terbitkan soal Draft, atau tarik kembali soal published menjadi Draft.
    public function ubahStatus(Request $request, Soal $soal): RedirectResponse
    {
        $status = $request->validate(['status' => ['required', Rule::in(['draft', 'published'])]])['status'];

        $soal->update(['status' => $status]);
        Inertia::flash('sukses', $status === 'published'
            ? "Soal {$soal->kode_soal} sudah dipublish."
            : "Soal {$soal->kode_soal} dikembalikan ke Draft.");

        return back();
    }

    private function formulir(Subtes $subtes, string $kodeSoal, ?array $soal = null): Response
    {
        return Inertia::render('Editor/FormSoal', [
            'subtes' => self::infoSubtes($subtes),
            'topikList' => self::pilihanTopik($subtes->topik()->get(['id', 'nama_topik'])),
            'kodeSoal' => $kodeSoal,
            'soal' => $soal,
            // Untuk pratinjau gambar yang ditulis versi pendek, mis. PU/PU-631.png.
            'urlGambar' => rtrim((string) config('services.supabase.url_gambar_soal'), '/'),
        ]);
    }

    /**
     * Tipe data saja; aturan isi soal (wajib diisi, kunci, rumus, link gambar) diperiksa importer.
     *
     * @return array<string, mixed>
     */
    private function validasi(Request $request): array
    {
        return $request->validate([
            'topikId' => ['nullable', 'uuid'],
            'tipe' => ['required', Rule::in(array_keys(ImportSoalExcel::TIPE_SOAL))],
            'tingkatKesulitan' => ['nullable', Rule::in(ImportSoalExcel::TINGKAT_KESULITAN)],
            'teksSoal' => ['nullable', 'string', 'max:20000'],
            'gambarSoal' => ['nullable', 'string', 'max:1000'],
            'opsi' => ['array', 'max:'.count(ImportSoalExcel::LABEL_OPSI)],
            'opsi.*.teks' => ['nullable', 'string', 'max:5000'],
            'opsi.*.gambar' => ['nullable', 'string', 'max:1000'],
            'kunciPg' => ['nullable', Rule::in(ImportSoalExcel::LABEL_OPSI)],
            'kunciBenar' => ['array'],
            'kunciBenar.*' => ['boolean'],
            'kolomTabel' => ['array', 'max:'.MajemukTabel::MAKS_KOLOM],
            'kolomTabel.*' => ['nullable', 'string', 'max:100'],
            'kunciKolom' => ['array'],
            'kunciKolom.*' => ['nullable', 'integer', 'min:1'],
            'jawabanIsian' => ['array', 'max:20'],
            'jawabanIsian.*' => ['nullable', 'string', 'max:500'],
            'hint' => ['nullable', 'string', 'max:20000'],
            'pembahasan' => ['nullable', 'string', 'max:20000'],
            'gambarPembahasan' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', Rule::in(['draft', 'published'])],
        ]);
    }

    /**
     * Periksa lalu simpan satu soal. Error pemeriksaan dikembalikan ke formulir per field ('umum' untuk yang lain).
     *
     * @param  array<string, mixed>  $isian
     * @param  bool  $hanyaBaru  soal baru: kode yang ternyata sudah ada ditolak, bukan memperbarui soal itu
     */
    private function simpanSoal(array $isian, Subtes $subtes, string $kode, ImportSoalExcel $importer, bool $hanyaBaru = false): void
    {
        $topikId = $isian['topikId'] ?? null;
        $namaTopik = $topikId ? Topik::where('subtes_id', $subtes->id)->whereKey($topikId)->value('nama_topik') : null;

        $hasil = $importer->periksaSatu(FormulirSoal::keKolom($isian, $subtes->kode_subtes, $kode, $namaTopik));

        if ($hasil['error']) {
            throw ValidationException::withMessages(FormulirSoal::pesanError($hasil['error'], $isian['tipe']));
        }

        try {
            $importer->simpan([$hasil['soal']], status: $isian['status'], editorId: Auth::id(), hanyaBaru: $hanyaBaru);
        } catch (UniqueConstraintViolationException) {
            // Editor lain menyimpan soal dengan kode yang sama tepat sebelum ini.
            throw ValidationException::withMessages(['umum' => self::pesanKodeTerpakai($kode)]);
        } catch (QueryException $e) {
            report($e);

            throw ValidationException::withMessages(['umum' => 'Soal gagal disimpan karena masalah database. Coba lagi.']);
        } catch (RuntimeException $e) {
            // Mis. opsi yang dihapus sudah pernah dipilih siswa.
            throw ValidationException::withMessages(['umum' => $e->getMessage()]);
        }
    }

    private static function pesanKodeTerpakai(string $kode): string
    {
        return "Kode {$kode} baru saja dipakai soal lain. Muat ulang halaman untuk mendapat kode baru, "
            .'lalu sesuaikan nama file gambar bila ada.';
    }

    /** @return array{kode: string, nama: string} */
    private static function infoSubtes(Subtes $subtes): array
    {
        return ['kode' => $subtes->kode_subtes, 'nama' => $subtes->nama_subtes];
    }

    /** @return array<int, array{id: string, nama: string}> */
    private static function pilihanTopik(Collection $topikList): array
    {
        return $topikList->map(fn (Topik $t) => ['id' => $t->id, 'nama' => $t->nama_topik])->values()->all();
    }
}
