<?php

namespace App\Http\Controllers;

use App\Models\Subtes;
use App\Services\Penguasaan;
use App\Services\RekomendasiTopik;
use App\Services\RingkasanPenguasaan;
use App\Services\SoalRemedial;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Halaman Perkembangan Belajar (UCS4, RANCANGAN-perkembangan.md): total soal, antrean remedial, tren skor
 * Try Out, heatmap penguasaan topik, dan rekomendasi topik.
 */
class PerkembanganController extends Controller
{
    public function index(RingkasanPenguasaan $ringkasan, RekomendasiTopik $rekomendasi, SoalRemedial $remedial): Response
    {
        // DUMMY-PERKEMBANGAN: uji tampilan Task 6. Hapus seluruh blok ini sebelum commit.
        if (app()->isLocal() && request()->has('dummy')) {
            $tryOut = fn (int $n, ?float $skor) => [
                'id' => "dummy-{$n}",
                'judul' => "Try Out EDVORA {$n}",
                'selesaiPada' => "2026-0{$n}-10T01:00:00+00:00",
                'periodeSelesai' => "2026-0{$n}-15T16:59:00+00:00",
                'skor' => $skor,
            ];

            return Inertia::render('Perkembangan/Index', [
                'totalSoalDikerjakan' => 175,
                'remedial' => ['total' => 23, 'perSubtes' => [
                    ['kode' => 'PK', 'nama' => 'Pengetahuan Kuantitatif', 'jumlah' => 12],
                    ['kode' => null, 'nama' => 'Subtes tanpa kode', 'jumlah' => 11],
                ]],
                'tryOutList' => match (request('dummy')) {
                    '0' => [],
                    '1' => [$tryOut(1, 712.0)],
                    default => [$tryOut(1, 612.0), $tryOut(2, 845.5), $tryOut(3, null), $tryOut(4, 430.0), $tryOut(5, null)],
                },
                'penguasaan' => [
                    ['kode' => 'PU', 'nama' => 'Penalaran Umum', 'persen' => 40.6, 'topikList' => [
                        ['id' => 'd1', 'nama' => 'Penalaran Deduktif', 'persen' => 7.3, 'label' => 'belum_dikuasai', 'nJendela' => 20],
                        ['id' => 'd2', 'nama' => 'Penalaran Induktif', 'persen' => 0.0, 'label' => 'belum_cukup_data', 'nJendela' => 12],
                        ['id' => 'd3', 'nama' => 'Penalaran Kuantitatif', 'persen' => 55.0, 'label' => 'berkembang', 'nJendela' => 20],
                        ['id' => 'd4', 'nama' => 'Logika', 'persen' => 100.0, 'label' => 'dikuasai', 'nJendela' => 20],
                    ]],
                    ['kode' => null, 'nama' => 'Subtes tanpa kode', 'persen' => 0.0, 'topikList' => [
                        ['id' => 'd5', 'nama' => 'Topik subtes tanpa kode', 'persen' => 0.0, 'label' => 'belum_cukup_data', 'nJendela' => 0],
                    ]],
                    ['kode' => 'PK', 'nama' => 'Pengetahuan Kuantitatif', 'persen' => 0.0, 'topikList' => []],
                ],
                'batasJendela' => 20,
                'rekomendasi' => [
                    ['topikId' => 'd1', 'kodeSubtes' => 'PU', 'namaTopik' => 'Penalaran Deduktif', 'persen' => 7.3],
                    ['topikId' => 'd9', 'kodeSubtes' => null, 'namaTopik' => 'Topik tanpa kode subtes', 'persen' => 0.0],
                ],
            ]);
        }

        $userId = Auth::id();
        $subtesList = Subtes::orderBy('urutan')->get(['id', 'kode_subtes', 'nama_subtes']);
        // subtes_id => topik beserta tahap dan skor siswa, dalam satu query untuk semua subtes.
        $topikPerSubtes = $ringkasan->perSubtes($userId);
        // subtes_id => jumlah soal remedial, dalam satu query; subtes tanpa soal remedial tidak ada.
        $remedialPerSubtes = $remedial->jumlahPerSubtes($userId);

        return Inertia::render('Perkembangan/Index', [
            'totalSoalDikerjakan' => $this->totalSoalDikerjakan($userId),
            'remedial' => [
                'total' => array_sum($remedialPerSubtes),
                // Isi pop-up "Latih Soal Yang Salah": remedial dikerjakan per subtes (SDD 5.3.3).
                'perSubtes' => $subtesList
                    ->filter(fn (Subtes $subtes) => isset($remedialPerSubtes[$subtes->id]))
                    ->map(fn (Subtes $subtes) => [
                        'kode' => $subtes->kode_subtes,
                        'nama' => $subtes->nama_subtes,
                        'jumlah' => $remedialPerSubtes[$subtes->id],
                    ])
                    ->values(),
            ],
            'tryOutList' => $this->tryOutList($userId),
            'penguasaan' => $subtesList
                ->map(fn (Subtes $subtes) => $this->penguasaanSubtes($subtes, $topikPerSubtes[$subtes->id] ?? []))
                ->values(),
            'batasJendela' => Penguasaan::JENDELA,
            // Sama dengan card Direkomendasikan di Beranda: 3 topik lintas subtes.
            'rekomendasi' => array_map(fn (array $topik) => [
                'topikId' => $topik['id'],
                'kodeSubtes' => $topik['kodeSubtes'],
                'namaTopik' => $topik['nama'],
                'persen' => Penguasaan::persen($topik['tahap'], $topik['skor']),
            ], $rekomendasi->teratas($subtesList, $topikPerSubtes)),
        ]);
    }

    /**
     * Soal berbeda yang pernah dijawab di pengerjaan selesai, semua mode termasuk Try Out (P3).
     * Jawaban kosong tidak punya baris, dan soal yang dijawab ulang di remedial dihitung sekali.
     */
    private function totalSoalDikerjakan(string $userId): int
    {
        return (int) DB::selectOne(<<<'SQL'
            select count(distinct j.soal_id) as jumlah
            from jawaban_pengerjaan j
            join pengerjaan p on p.id = j.pengerjaan_id
            where p.user_id = ? and p.status = 'selesai'
            SQL, [$userId])->jumlah;
    }

    /**
     * Try Out yang sudah selesai, urut waktu selesai. skor null = belum dinilai IRT (RANCANGAN-tryout.md T15).
     *
     * @return array<int, array{id: string, judul: string, selesaiPada: string, periodeSelesai: string, skor: ?float}>
     */
    private function tryOutList(string $userId): array
    {
        $baris = DB::select(<<<'SQL'
            select t.id, t.judul, t.selesai_at, p.finished_at, p.total_skor
            from pengerjaan p
            join try_out t on t.id = p.try_out_id
            where p.user_id = ? and p.tipe = 'try_out' and p.status = 'selesai'
            order by p.finished_at
            SQL, [$userId]);

        // Postgres mengirim timestamptz sebagai teks ("2026-10-03 01:00:00+00"); diubah ke ISO agar
        // formatWaktuWib() di browser bisa membacanya.
        return array_map(fn (object $b) => [
            'id' => $b->id,
            'judul' => $b->judul,
            'selesaiPada' => CarbonImmutable::parse($b->finished_at)->toIso8601String(),
            'periodeSelesai' => CarbonImmutable::parse($b->selesai_at)->toIso8601String(),
            'skor' => $b->total_skor === null ? null : (float) $b->total_skor,
        ], $baris);
    }

    /**
     * Satu subtes di heatmap: persen subtes dan topik yang punya soal, urut topik.urutan.
     * Warna card dibaca frontend dari label (P10); nJendela untuk keterangan "n/20 soal" (P12).
     */
    private function penguasaanSubtes(Subtes $subtes, array $topikList): array
    {
        $topikList = array_values(array_filter($topikList, fn (array $topik) => $topik['adaSoal']));

        return [
            'kode' => $subtes->kode_subtes,
            'nama' => $subtes->nama_subtes,
            'persen' => Penguasaan::persenSubtes($topikList)['persen'],
            'topikList' => array_map(fn (array $topik) => [
                'id' => $topik['id'],
                'nama' => $topik['nama'],
                'persen' => Penguasaan::persen($topik['tahap'], $topik['skor']),
                'label' => $topik['label'],
                'nJendela' => $topik['nJendela'],
            ], $topikList),
        ];
    }
}
