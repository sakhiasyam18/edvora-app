<?php

namespace App\Http\Controllers;

use App\Models\Subtes;
use App\Models\Soal;
use App\Models\Pengerjaan;
use App\Models\JawabanPengerjaan;
use App\Models\Siswa;
use App\Services\PenilaianIsian;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class LatihanSoalController extends Controller
{
    public function index()
    {
        // soal_exists (boolean) hanya untuk menonaktifkan kartu; jumlah soal sengaja tidak dikirim.
        $subtes = Subtes::withExists('soal')->orderBy('urutan')->get();
        return Inertia::render('Latihan/Persiapan', [
            'subtes' => $subtes
        ]);
    }

    public function ujian(Request $request)
    {
        $subtesId = $request->get('subtesId');
        
        if (!$subtesId) {
            return redirect()->route('latihan.index');
        }

        $subtes = Subtes::findOrFail($subtesId);
        
        $jumlahSoal = (int) $request->get('jumlahSoal', 10);
        
        $soalList = Soal::with(['opsiJawaban' => fn($q) => $q->orderBy('urutan')])
            ->where('subtes_id', $subtesId)
            ->inRandomOrder()
            ->take($jumlahSoal)
            ->get();

        // Jaring pengaman bila URL dibuka langsung untuk subtes tanpa soal.
        if ($soalList->isEmpty()) {
            return redirect()->route('latihan.index');
        }

        $mode = $request->get('mode') === 'simulasi' ? 'simulasi' : 'fleksibel';
        
        $konfigurasi = [
            'subtesId' => $subtesId,
            'namaSubtes' => $subtes->nama_subtes,
            'mode' => $mode,
            'jumlahSoal' => $soalList->count(),
        ];

        if ($mode === 'simulasi') {
            $konfigurasi['waktuPengerjaanMenit'] = (int) $request->get('waktuPengerjaanMenit', 20);
        } else {
            $konfigurasi['iceBreakingAktif'] = $request->get('iceBreakingAktif') === 'true';
        }

        return Inertia::render('Latihan/Ujian', [
            'subtes' => $subtes,
            'soalList' => $soalList,
            'konfigurasi' => $konfigurasi,
        ]);
    }

    public function simpanJawaban(Request $request)
    {
        if ($request->get('aksi') === 'keluar') {
            return redirect()->route('dashboard');
        }

        // Jawaban isian dibatasi satu kata atau bilangan bulat; 100 karakter sudah sangat longgar.
        $request->validate([
            'jawaban' => ['array'],
            'jawaban.*.jawabanIsian' => ['nullable', 'string', 'max:100'],
        ]);

        // Array of { soalId, opsiIds: [], jawabanIsian: string|null }
        $jawabanList = $request->get('jawaban', []);
        $subtesId = $request->get('subtesId');
        $iceBreakingAktif = $request->boolean('iceBreakingAktif');

        $pengerjaan = DB::transaction(function () use ($jawabanList, $subtesId, $iceBreakingAktif) {
            $p = Pengerjaan::create([
                'user_id' => Auth::id(),
                'tipe' => 'latihan_bebas',
                'status' => 'selesai',
                'subtes_id' => $subtesId,
                'jumlah_soal_dipilih' => count($jawabanList),
                'ice_breaking_aktif' => $iceBreakingAktif,
                'started_at' => now(),
                'finished_at' => now(),
                'total_skor' => 0
            ]);

            // Ambil semua soal beserta opsinya sekali jalan - hindari N+1 query.
            $soalMap = Soal::with('opsiJawaban:id,soal_id,is_kunci')
                ->whereIn('id', array_column($jawabanList, 'soalId'))
                ->get(['id', 'tipe', 'kunci_jawaban'])
                ->keyBy('id');

            $jawabanModel = new JawabanPengerjaan;
            $waktuMenjawab = now()->toDateTimeString();
            $baris = [];
            $jumlahBenar = 0;
            $totalSkor = 0;

            foreach ($jawabanList as $j) {
                $soal = $soalMap[$j['soalId']] ?? null;
                if (! $soal) {
                    continue;
                }

                $dipilih = [];
                $teksIsian = null;

                if ($soal->tipe === 'isian_singkat') {
                    // Pangkas tepi termasuk non-breaking space; huruf besar-kecil disimpan apa adanya.
                    $teksIsian = preg_replace('/^[\p{Z}\s]+|[\p{Z}\s]+$/u', '', (string) ($j['jawabanIsian'] ?? ''));

                    // Jawaban kosong tidak dicatat, sama seperti soal ber-opsi yang dilewati.
                    if (PenilaianIsian::normalisasi($teksIsian) === '') {
                        continue;
                    }

                    $isCorrect = PenilaianIsian::cocok($teksIsian, $soal->kunci_jawaban ?? '');
                } else {
                    // Sementara: terima bentuk lama { opsiId } sampai semua klien memakai opsiIds.
                    $dikirim = $j['opsiIds'] ?? (isset($j['opsiId']) ? [$j['opsiId']] : []);

                    // Kolom array tidak punya FK, jadi hanya terima opsi yang memang milik soal ini.
                    $dipilih = array_values(array_intersect($dikirim, $soal->opsiJawaban->pluck('id')->all()));
                    $kunci = $soal->opsiJawaban->where('is_kunci', true)->pluck('id')->all();
                    sort($dipilih);
                    sort($kunci);

                    // Semua-atau-nol; pilihan ganda = himpunan beranggota satu.
                    // $kunci !== [] mencegah soal tanpa kunci terbaca benar lewat [] === [].
                    $isCorrect = $kunci !== [] && $dipilih === $kunci;
                }

                $skor = $isCorrect ? 10 : 0;

                $baris[] = [
                    'id' => $jawabanModel->newUniqueId(),
                    'pengerjaan_id' => $p->id,
                    'pengerjaan_subtes_id' => null,
                    'soal_id' => $j['soalId'],
                    // Bulk insert melewati mutator Eloquent, jadi format array Postgres ditulis manual.
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

            $p->update(['total_skor' => $totalSkor]);

            $xpDidapat = ($jumlahBenar * 15) + 10;

            Siswa::where('user_id', Auth::id())->update([
                'xp' => DB::raw('xp + ' . (int) $xpDidapat),
                'point' => DB::raw('point + ' . (int) $totalSkor),
            ]);

            return $p;
        });

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
            'pengerjaan' => $pengerjaan
        ]);
    }
}
