<?php

namespace App\Http\Controllers;

use App\Services\AnalitikSoal;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Dashboard Analitik editor (UCS9): ringkasan soal dan jawaban, topik dengan akurasi terendah, dan stok soal per
 * topik. Semua dihitung langsung dari tabel soal dan jawaban_pengerjaan (latihan dan Try Out).
 */
class AnalitikController extends Controller
{
    public function index(): Response
    {
        $status = DB::selectOne(<<<'SQL'
            select count(*) filter (where status = 'published') as published,
                   count(*) filter (where status = 'draft') as draft,
                   count(*) as total
            from soal
            SQL);

        $jawaban = DB::selectOne(<<<'SQL'
            select count(j.id) as jumlah, count(distinct p.user_id) as siswa
            from jawaban_pengerjaan j
            join pengerjaan p on p.id = j.pengerjaan_id
            SQL);

        return Inertia::render('Editor/Analitik', [
            'ringkasan' => [
                'published' => (int) $status->published,
                'draft' => (int) $status->draft,
                'totalSoal' => (int) $status->total,
                'jawaban' => (int) $jawaban->jumlah,
                'siswa' => (int) $jawaban->siswa,
            ],
            ...$this->butir(),
            'heatmap' => $this->heatmap(),
            'hariHeatmap' => AnalitikSoal::HARI_HEATMAP,
            'stokTopik' => $this->stokTopik(),
            'target' => ['topik' => AnalitikSoal::TARGET_TOPIK, 'tingkat' => AnalitikSoal::TARGET_TINGKAT],
            'minRespon' => AnalitikSoal::MIN_RESPON,
        ]);
    }

    /**
     * Butir yang sudah cukup data, dan yang di antaranya bermasalah (AnalitikSoal::alasanBermasalah()).
     *
     * @return array{butirCukupData: int, butirBermasalah: array<int, array{kode: string, alasan: string}>}
     */
    private function butir(): array
    {
        $baris = DB::select(<<<'SQL'
            select q.kode_soal, count(j.id) as respon, avg(j.is_correct::int) as p, q.irt_a
            from jawaban_pengerjaan j
            join soal q on q.id = j.soal_id
            group by q.id, q.kode_soal, q.irt_a
            having count(j.id) >= ?
            order by length(q.kode_soal), q.kode_soal
            SQL, [AnalitikSoal::MIN_RESPON]);

        $bermasalah = [];
        foreach ($baris as $b) {
            $alasan = AnalitikSoal::alasanBermasalah((float) $b->p, $b->irt_a === null ? null : (float) $b->irt_a);

            if ($alasan !== null) {
                $bermasalah[] = ['kode' => $b->kode_soal, 'alasan' => $alasan];
            }
        }

        return ['butirCukupData' => count($baris), 'butirBermasalah' => $bermasalah];
    }

    /**
     * Topik dengan akurasi terendah dalam HARI_HEATMAP hari terakhir.
     *
     * @return array<int, array{kodeSubtes: string, topik: string, akurasi: float, jawaban: int}>
     */
    private function heatmap(): array
    {
        $baris = DB::select(<<<'SQL'
            select s.kode_subtes, t.nama_topik, count(j.id) as jawaban, avg(j.is_correct::int) * 100 as akurasi
            from jawaban_pengerjaan j
            join soal q on q.id = j.soal_id
            join topik t on t.id = q.topik_id
            join subtes s on s.id = t.subtes_id
            where j.waktu_menjawab >= now() - make_interval(days => ?)
            group by s.kode_subtes, t.id, t.nama_topik
            having count(j.id) >= ?
            order by akurasi, jawaban desc
            limit ?
            SQL, [AnalitikSoal::HARI_HEATMAP, AnalitikSoal::MIN_JAWABAN_TOPIK, AnalitikSoal::MAKS_TOPIK_HEATMAP]);

        return array_map(fn ($b) => [
            'kodeSubtes' => $b->kode_subtes,
            'topik' => $b->nama_topik,
            'akurasi' => round((float) $b->akurasi, 1),
            'jawaban' => (int) $b->jawaban,
        ], $baris);
    }

    /**
     * Stok soal setiap topik. Yang dihitung untuk target hanya soal published, karena hanya itu yang sampai ke siswa.
     *
     * @return array<int, array<string, mixed>>
     */
    private function stokTopik(): array
    {
        $baris = DB::select(<<<'SQL'
            select s.kode_subtes, t.id, t.nama_topik,
                   count(q.id) filter (where q.status = 'published') as published,
                   count(q.id) filter (where q.status = 'published' and q.tingkat_kesulitan = 'mudah') as mudah,
                   count(q.id) filter (where q.status = 'published' and q.tingkat_kesulitan = 'sedang') as sedang,
                   count(q.id) filter (where q.status = 'published' and q.tingkat_kesulitan = 'sulit') as sulit,
                   count(q.id) filter (where q.status = 'draft') as draft
            from topik t
            join subtes s on s.id = t.subtes_id
            left join soal q on q.topik_id = t.id
            group by s.kode_subtes, s.urutan, t.id, t.nama_topik, t.urutan
            order by s.urutan, t.urutan, t.nama_topik
            SQL);

        return array_map(fn ($b) => [
            'id' => $b->id,
            'kodeSubtes' => $b->kode_subtes,
            'topik' => $b->nama_topik,
            'published' => (int) $b->published,
            'draft' => (int) $b->draft,
            'perTingkat' => ['mudah' => (int) $b->mudah, 'sedang' => (int) $b->sedang, 'sulit' => (int) $b->sulit],
        ], $baris);
    }
}
