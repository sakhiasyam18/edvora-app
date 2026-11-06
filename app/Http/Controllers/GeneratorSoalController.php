<?php

namespace App\Http\Controllers;

use App\Exceptions\GeneratorSoalException;
use App\Models\GeneratorSoal;
use App\Models\Soal;
use App\Models\Subtes;
use App\Models\Topik;
use App\Services\FormulirSoal;
use App\Services\GeneratorSoalAI;
use App\Services\ImportSoalExcel;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use RuntimeException;

/**
 * Generator soal AI untuk editor (UCS7). Soal dibuat lewat OpenRouter, ditinjau di halaman, lalu disimpan sebagai
 * Draft. Penyimpanan memakai jalur formulir soal yang sama dengan importer Excel: FormulirSoal::keKolom() lalu
 * ImportSoalExcel::periksaSatu() dan simpan().
 */
class GeneratorSoalController extends Controller
{
    private const MAKS_SOAL = 20;

    public function index(): InertiaResponse
    {
        $subtesList = Subtes::with('topik:id,subtes_id,nama_topik,urutan')
            ->orderBy('urutan')
            ->get()
            ->map(fn (Subtes $subtes) => [
                'kode' => $subtes->kode_subtes,
                'nama' => $subtes->nama_subtes,
                'bolehIsian' => in_array($subtes->kode_subtes, GeneratorSoalAI::SUBTES_MATEMATIKA, true),
                'topik' => $subtes->topik
                    ->map(fn (Topik $topik) => ['id' => $topik->id, 'nama' => $topik->nama_topik])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();

        return Inertia::render('Editor/GeneratorSoal', [
            'subtesList' => $subtesList,
            'adaKunci' => filled(config('services.openrouter.api_key')),
            'maksSoal' => self::MAKS_SOAL,
            'riwayat' => $this->riwayatEditor(),
        ]);
    }

    /**
     * Riwayat generate terakhir milik editor yang sedang login. Kosong bila migrasi tabel riwayat belum dijalankan.
     *
     * @return array<int, array<string, mixed>>
     */
    private function riwayatEditor(): array
    {
        if (! GeneratorSoal::tabelSiap()) {
            return [];
        }

        return GeneratorSoal::with(['subtes:id,kode_subtes,nama_subtes', 'topik:id,nama_topik'])
            ->where('editor_id', Auth::id())
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn (GeneratorSoal $sesi) => [
                'id' => $sesi->id,
                'subtes' => $sesi->subtes?->kode_subtes ?? '-',
                'subtes_nama' => $sesi->subtes?->nama_subtes ?? '-',
                'topik' => $sesi->topik?->nama_topik ?? '-',
                'tingkat' => ucfirst($sesi->tingkat_kesulitan),
                'tipe_soal' => $sesi->tipe_soal,
                'model' => $sesi->model_ai,
                'jumlah_soal' => $sesi->jumlah_soal,
                'jumlah_tersimpan' => $sesi->jumlah_tersimpan,
                'status' => $sesi->status,
                'dibuat' => $sesi->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    public function model(GeneratorSoalAI $ai): JsonResponse
    {
        return response()->json($ai->daftarModel());
    }

    public function generate(Request $request, GeneratorSoalAI $ai): JsonResponse
    {
        $data = $request->validate([
            'subtes' => ['required', 'string', 'max:10'],
            'topik' => ['required', 'string', 'max:150'],
            'tingkat' => ['required', Rule::in(['mudah', 'sedang', 'sulit'])],
            'jumlah' => ['required', 'integer', 'min:1', 'max:'.self::MAKS_SOAL],
            'tipe' => ['required', Rule::in(['pg', 'isian', 'both'])],
            'distribusi' => ['nullable', Rule::in(['acak', 'manual'])],
            'jumlah_pg' => ['nullable', 'integer', 'min:1', 'max:'.self::MAKS_SOAL],
            'jumlah_isian' => ['nullable', 'integer', 'min:1', 'max:'.self::MAKS_SOAL],
            'model' => ['required', 'string', 'max:120', 'regex:/^[a-zA-Z0-9_.:\-\/]+$/'],
            'hindari' => ['nullable', 'string', 'max:20000'],
            // Regenerate satu kartu tidak dicatat sebagai riwayat baru; sesi awal sudah mewakili batch tersebut.
            'regenerate' => ['sometimes', 'boolean'],
        ], [
            'subtes.required' => 'Pilih subtes.',
            'topik.required' => 'Pilih topik.',
            'tingkat.required' => 'Pilih tingkat kesulitan.',
            'jumlah.required' => 'Isi jumlah soal.',
            'tipe.required' => 'Pilih minimal satu tipe soal.',
            'model.required' => 'Model AI belum dipilih.',
            'model.regex' => 'Nama model tidak valid.',
        ]);

        $subtes = Subtes::where('kode_subtes', $data['subtes'])->first();

        if (! $subtes) {
            throw ValidationException::withMessages(['subtes' => 'Subtes tidak dikenal.']);
        }

        $topik = Topik::where('subtes_id', $subtes->id)->where('nama_topik', $data['topik'])->first();

        if (! $topik) {
            throw ValidationException::withMessages(['topik' => 'Topik tidak terdaftar untuk subtes ini.']);
        }

        $matematika = in_array($subtes->kode_subtes, GeneratorSoalAI::SUBTES_MATEMATIKA, true);

        if ($data['tipe'] !== 'pg' && ! $matematika) {
            throw ValidationException::withMessages([
                'tipe' => 'Tipe isian singkat hanya tersedia untuk subtes PK dan PM.',
            ]);
        }

        $distribusi = $data['distribusi'] ?? 'acak';

        if ($data['tipe'] === 'both') {
            if ($data['jumlah'] < 2) {
                throw ValidationException::withMessages([
                    'jumlah' => 'Campuran dua tipe membutuhkan minimal 2 soal.',
                ]);
            }

            if ($distribusi === 'manual') {
                $jumlahPg = (int) ($data['jumlah_pg'] ?? 0);
                $jumlahIsian = (int) ($data['jumlah_isian'] ?? 0);

                if ($jumlahPg < 1 || $jumlahIsian < 1) {
                    throw ValidationException::withMessages([
                        'jumlah' => 'Jumlah soal pilihan ganda dan isian singkat masing-masing minimal 1.',
                    ]);
                }

                if ($jumlahPg + $jumlahIsian !== $data['jumlah']) {
                    throw ValidationException::withMessages([
                        'jumlah' => 'Jumlah soal pilihan ganda + isian singkat harus sama dengan jumlah soal.',
                    ]);
                }
            } else {
                $jumlahPg = random_int(1, $data['jumlah'] - 1);
                $jumlahIsian = $data['jumlah'] - $jumlahPg;
            }
        } elseif ($data['tipe'] === 'isian') {
            $jumlahPg = 0;
            $jumlahIsian = $data['jumlah'];
        } else {
            $jumlahPg = $data['jumlah'];
            $jumlahIsian = 0;
        }

        if (! $ai->modelTersedia($data['model'])) {
            throw ValidationException::withMessages([
                'model' => 'Model tidak ada di daftar model gratis. Muat ulang daftar model lalu pilih lagi.',
            ]);
        }

        set_time_limit(300);

        try {
            $hasil = $ai->buatSoal([
                'kode_subtes' => $subtes->kode_subtes,
                'nama_subtes' => $subtes->nama_subtes,
                'topik' => $topik->nama_topik,
                'topik_id' => $topik->id,
                'tingkat' => $data['tingkat'],
                'jumlah' => (int) $data['jumlah'],
                'tipe' => $data['tipe'],
                'distribusi' => $distribusi,
                'jumlah_pg' => $jumlahPg,
                'jumlah_isian' => $jumlahIsian,
                'model' => $data['model'],
                'hindari' => $data['hindari'] ?? '',
            ]);
        } catch (GeneratorSoalException $e) {
            return response()->json(['kode' => $e->kode, 'pesan' => $e->getMessage()], $e->status);
        }

        if (! ($data['regenerate'] ?? false)) {
            $sesi = $this->catatSesi($subtes, $topik, $data, $hasil);

            if ($sesi) {
                $hasil['sesi_id'] = $sesi->id;
            }
        }

        return response()->json($hasil);
    }

    /**
     * Menyimpan jejak generate. Gagal mencatat riwayat tidak boleh membatalkan soal yang sudah dibuat AI.
     *
     * @param  array<string, mixed>  $data
     * @param  array<string, mixed>  $hasil
     */
    private function catatSesi(Subtes $subtes, Topik $topik, array $data, array $hasil): ?GeneratorSoal
    {
        if (! GeneratorSoal::tabelSiap()) {
            return null;
        }

        try {
            return GeneratorSoal::create([
                'editor_id' => Auth::id(),
                'subtes_id' => $subtes->id,
                'topik_id' => $topik->id,
                'tingkat_kesulitan' => $data['tingkat'],
                'tipe' => $data['tipe'],
                'tipe_soal' => $hasil['tipe_soal'],
                'model_ai' => $hasil['model'],
                'jumlah_soal' => $hasil['jumlah_soal'],
                'permintaan' => [
                    'jumlah' => (int) $data['jumlah'],
                    'distribusi' => $data['distribusi'] ?? 'acak',
                    'jumlah_pg' => $hasil['jumlah_pg'],
                    'jumlah_isian' => $hasil['jumlah_isian'],
                ],
                'hasil' => $hasil,
                'status' => 'dibuat',
                'jumlah_tersimpan' => 0,
                'kode_tersimpan' => [],
            ]);
        } catch (QueryException $e) {
            report($e);

            return null;
        }
    }

    /**
     * Menambah jumlah soal tersimpan pada sesi milik editor ini. Sesi diedit tanpa transaksi agar kegagalan riwayat
     * tidak membatalkan soal yang sudah masuk bank soal.
     *
     * @param  array<int, array<string, mixed>>  $daftarSoal
     */
    private function tandaiSesiTersimpan(?string $sesiId, array $daftarSoal): void
    {
        if ($sesiId === null || ! GeneratorSoal::tabelSiap()) {
            return;
        }

        $sesi = GeneratorSoal::whereKey($sesiId)
            ->where('editor_id', Auth::id())
            ->first();

        if (! $sesi) {
            return;
        }

        try {
            $kode = array_column($daftarSoal, 'kode_soal');
            $total = min($sesi->jumlah_soal, $sesi->jumlah_tersimpan + count($kode));

            $sesi->update([
                'jumlah_tersimpan' => $total,
                'kode_tersimpan' => [...($sesi->kode_tersimpan ?? []), ...$kode],
                'status' => $total >= $sesi->jumlah_soal ? 'tersimpan' : 'sebagian',
            ]);
        } catch (QueryException $e) {
            report($e);
        }
    }

    public function simpan(Request $request, ImportSoalExcel $importer): JsonResponse
    {
        $data = $request->validate([
            'subtes' => ['required', 'string', 'max:10'],
            'topik_id' => ['required', 'uuid'],
            'tingkat' => ['required', Rule::in(['mudah', 'sedang', 'sulit'])],
            'soal' => ['required', 'array', 'min:1', 'max:'.self::MAKS_SOAL],
            'soal.*.tipe' => ['required', Rule::in(['pilihan_ganda', 'isian_singkat'])],
            'soal.*.soal' => ['required', 'string', 'max:20000'],
            'soal.*.jawaban' => ['required', 'string', 'max:500'],
            'soal.*.hint' => ['nullable', 'string', 'max:20000'],
            'soal.*.pembahasan' => ['required', 'string', 'max:20000'],
            'soal.*.pilihan' => ['nullable', 'array'],
            'soal.*.pilihan.*' => ['nullable', 'string', 'max:5000'],
            // Sesi riwayat yang menerbitkan soal ini; opsional karena riwayat hanya pelengkap.
            'sesi_id' => ['nullable', 'uuid'],
        ], [
            'soal.required' => 'Pilih minimal satu soal untuk disimpan.',
            'soal.min' => 'Pilih minimal satu soal untuk disimpan.',
        ]);

        $subtes = Subtes::where('kode_subtes', $data['subtes'])->first();

        if (! $subtes) {
            throw ValidationException::withMessages(['subtes' => 'Subtes tidak dikenal.']);
        }

        $topik = Topik::where('subtes_id', $subtes->id)->whereKey($data['topik_id'])->first();

        if (! $topik) {
            throw ValidationException::withMessages(['topik_id' => 'Topik tidak terdaftar untuk subtes ini.']);
        }

        $matematika = in_array($subtes->kode_subtes, GeneratorSoalAI::SUBTES_MATEMATIKA, true);
        $awal = Soal::kodeBerikutnya($subtes);
        $nomorAwal = (int) substr($awal, (int) strrpos($awal, '-') + 1);
        $daftarSoal = [];
        $galat = [];

        set_time_limit(180);

        foreach ($data['soal'] as $i => $soal) {
            if ($soal['tipe'] === 'isian_singkat' && ! $matematika) {
                $galat["soal.{$i}"] = 'Isian singkat hanya tersedia untuk subtes PK dan PM.';

                continue;
            }

            $opsi = [];
            $kunciPg = null;

            if ($soal['tipe'] === 'pilihan_ganda') {
                $pilihan = is_array($soal['pilihan'] ?? null) ? $soal['pilihan'] : [];
                $terisi = [];

                foreach (ImportSoalExcel::LABEL_OPSI as $label) {
                    $teks = trim((string) ($pilihan[$label] ?? ''));

                    if ($teks !== '') {
                        $terisi[$label] = $teks;
                    }
                }

                if (count($terisi) < 2) {
                    $galat["soal.{$i}"] = 'Soal pilihan ganda memerlukan minimal 2 opsi berisi teks.';

                    continue;
                }

                $kunci = strtoupper(trim($soal['jawaban']));

                if (! isset($terisi[$kunci])) {
                    $galat["soal.{$i}"] = 'Kunci jawaban harus salah satu opsi A-E yang terisi.';

                    continue;
                }

                $kunciPg = $kunci;
                $opsi = array_map(
                    fn (string $label) => ['teks' => $terisi[$label] ?? '', 'gambar' => ''],
                    ImportSoalExcel::LABEL_OPSI,
                );
            }

            $kode = sprintf('%s-%03d', $subtes->kode_subtes, $nomorAwal + $i);

            $isian = [
                'topikId' => $topik->id,
                'tipe' => $soal['tipe'],
                'tingkatKesulitan' => $data['tingkat'],
                'teksSoal' => $soal['soal'],
                'gambarSoal' => '',
                'opsi' => $opsi,
                'kunciPg' => $kunciPg,
                'jawabanIsian' => $soal['tipe'] === 'isian_singkat' ? [$soal['jawaban']] : [],
                'hint' => $soal['hint'] ?? '',
                'pembahasan' => $soal['pembahasan'],
                'gambarPembahasan' => '',
            ];

            try {
                $hasil = $importer->periksaSatu(FormulirSoal::keKolom($isian, $subtes->kode_subtes, $kode, $topik->nama_topik));
            } catch (RuntimeException $e) {
                throw ValidationException::withMessages([
                    'umum' => 'Pemeriksaan rumus gagal: '.$e->getMessage(),
                ]);
            }

            if ($hasil['error']) {
                $pesan = FormulirSoal::pesanError($hasil['error'], $soal['tipe']);
                $galat["soal.{$i}"] = 'Soal '.($i + 1).': '.implode(' ', array_values($pesan));

                continue;
            }

            $daftarSoal[] = $hasil['soal'];
        }

        if ($galat) {
            throw ValidationException::withMessages($galat);
        }

        try {
            $importer->simpan($daftarSoal, status: 'draft', editorId: Auth::id(), hanyaBaru: true);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'umum' => 'Kode soal baru saja dipakai editor lain. Coba simpan lagi.',
            ]);
        } catch (QueryException $e) {
            report($e);

            throw ValidationException::withMessages([
                'umum' => 'Soal gagal disimpan karena masalah database. Coba lagi.',
            ]);
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['umum' => $e->getMessage()]);
        }

        $this->tandaiSesiTersimpan($data['sesi_id'] ?? null, $daftarSoal);

        return response()->json([
            'tersimpan' => count($daftarSoal),
            'kode' => array_column($daftarSoal, 'kode_soal'),
            'subtes' => $subtes->kode_subtes,
            'subtes_nama' => $subtes->nama_subtes,
        ]);
    }
}
