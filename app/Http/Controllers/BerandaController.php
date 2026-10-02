<?php

namespace App\Http\Controllers;

use App\Models\Siswa;
use App\Models\Subtes;
use App\Services\LevelXp;
use App\Services\Penguasaan;
use App\Services\RekomendasiTopik;
use App\Services\RingkasanPenguasaan;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    public function index(RingkasanPenguasaan $ringkasan, RekomendasiTopik $rekomendasi): Response
    {
        $userId = Auth::id();
        // Akun tanpa baris siswa (admin, akun lama) dianggap 0 XP dan 0 poin.
        $siswa = Siswa::whereKey($userId)->first(['xp', 'point']);
        $subtesList = Subtes::orderBy('urutan')->get(['id', 'kode_subtes', 'nama_subtes']);
        // subtes_id => topik beserta tahap dan skor siswa, dalam satu query untuk semua subtes.
        $topikPerSubtes = $ringkasan->perSubtes($userId);

        return Inertia::render('Dashboard/Siswa', [
            'level' => LevelXp::dariXp((int) ($siswa?->xp ?? 0))['level'],
            'poin' => (int) ($siswa?->point ?? 0),
            'rekomendasi' => array_map(fn (array $topik) => [
                'topikId' => $topik['id'],
                'kodeSubtes' => $topik['kodeSubtes'],
                'namaTopik' => $topik['nama'],
                'persen' => Penguasaan::persen($topik['tahap'], $topik['skor']),
            ], $rekomendasi->teratas($subtesList, $topikPerSubtes)),
            'penguasaanSubtes' => $subtesList
                ->map(fn (Subtes $subtes) => $this->penguasaanSubtes($subtes, $topikPerSubtes[$subtes->id] ?? []))
                ->values(),
        ]);
    }

    /**
     * Persen satu subtes = rata-rata persen semua topiknya yang punya soal.
     * Topik yang belum cukup data ikut dihitung 0, jadi lingkaran hanya penuh bila semua topik dikuasai.
     *
     * @return array{kode: ?string, nama: string, persen: float, adaData: bool}
     */
    private function penguasaanSubtes(Subtes $subtes, array $topikList): array
    {
        $topikList = array_values(array_filter($topikList, fn (array $topik) => $topik['adaSoal']));
        $persen = array_map(fn (array $topik) => Penguasaan::persen($topik['tahap'], $topik['skor']), $topikList);

        return [
            'kode' => $subtes->kode_subtes,
            'nama' => $subtes->nama_subtes,
            'persen' => $persen === [] ? 0.0 : round(array_sum($persen) / count($persen), 1),
            'adaData' => collect($topikList)->contains(fn (array $topik) => $topik['skor'] !== null),
        ];
    }
}
