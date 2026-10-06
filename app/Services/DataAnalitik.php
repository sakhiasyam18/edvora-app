<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Data Dashboard Analitik editor (UCS9). Dihitung sekali sehari pukul 00.00 WIB oleh edvora:hitung-analitik dan
 * disimpan di cache; halaman hanya membaca hasilnya. Bila scheduler sempat mati, halaman menghitungnya sendiri
 * saat dibuka pertama kali hari itu.
 */
class DataAnalitik
{
    private const KUNCI_CACHE = 'analitik_editor';

    /** @return array<string, mixed> data terakhir, dihitung ulang dulu bila sudah basi */
    public function ambil(): array
    {
        $tersimpan = Cache::get(self::KUNCI_CACHE);
        $dihitungPada = isset($tersimpan['dihitungPada']) ? Carbon::parse($tersimpan['dihitungPada']) : null;

        return AnalitikSoal::perluDihitungUlang($dihitungPada, now()) ? $this->perbarui() : $tersimpan;
    }

    /** @return array<string, mixed> */
    public function perbarui(): array
    {
        $data = $this->hitung(now());
        Cache::forever(self::KUNCI_CACHE, $data);

        return $data;
    }

    /** @return array<string, mixed> props halaman Editor/Analitik (camelCase) */
    private function hitung(Carbon $sekarang): array
    {
        $soal = DB::selectOne(<<<'SQL'
            select count(*) filter (where status = 'published') as published,
                   count(*) filter (where status = 'draft') as draft,
                   count(*) as total
            from soal
            SQL);

        $stokTopik = $this->stokTopik();
        $dari = $sekarang->copy()->subDays(AnalitikSoal::HARI_HEATMAP);

        return [
            'dihitungPada' => $sekarang->toIso8601String(),
            'ringkasan' => [
                'published' => (int) $soal->published,
                'draft' => (int) $soal->draft,
                'total' => (int) $soal->total,
                'jumlahTopik' => count($stokTopik),
                'jumlahSubtes' => DB::table('subtes')->count(),
            ],
            'stok' => [
                'topikKurang' => AnalitikSoal::kekuranganTopik($stokTopik),
                'targetTingkat' => AnalitikSoal::TARGET_TINGKAT,
            ],
            'heatmap' => $this->heatmap($dari),
            'rentangHeatmap' => ['dari' => $dari->toIso8601String(), 'sampai' => $sekarang->toIso8601String()],
            'penguasaan' => $this->penguasaan(),
        ];
    }

    /**
     * Soal published setiap topik per tingkat; hanya soal published yang sampai ke siswa.
     *
     * @return array<int, array{kodeSubtes: string, topik: string, mudah: int, sedang: int, sulit: int}>
     */
    private function stokTopik(): array
    {
        $baris = DB::select(<<<'SQL'
            select s.kode_subtes, t.nama_topik,
                   count(q.id) filter (where q.tingkat_kesulitan = 'mudah') as mudah,
                   count(q.id) filter (where q.tingkat_kesulitan = 'sedang') as sedang,
                   count(q.id) filter (where q.tingkat_kesulitan = 'sulit') as sulit
            from topik t
            join subtes s on s.id = t.subtes_id
            left join soal q on q.topik_id = t.id and q.status = 'published'
            group by s.kode_subtes, s.urutan, t.id, t.nama_topik, t.urutan
            order by s.urutan, t.urutan, t.nama_topik
            SQL);

        return array_map(fn ($b) => [
            'kodeSubtes' => $b->kode_subtes,
            'topik' => $b->nama_topik,
            'mudah' => (int) $b->mudah,
            'sedang' => (int) $b->sedang,
            'sulit' => (int) $b->sulit,
        ], $baris);
    }

    /**
     * Topik dengan akurasi terendah sejak $dari (pemetaan kesulitan soal per topik).
     *
     * @return array<int, array{kodeSubtes: string, topik: string, akurasi: float, jawaban: int}>
     */
    private function heatmap(Carbon $dari): array
    {
        $baris = DB::select(<<<'SQL'
            select s.kode_subtes, t.nama_topik, count(j.id) as jawaban, avg(j.is_correct::int) * 100 as akurasi
            from jawaban_pengerjaan j
            join soal q on q.id = j.soal_id
            join topik t on t.id = q.topik_id
            join subtes s on s.id = t.subtes_id
            where j.waktu_menjawab >= ?
            group by s.kode_subtes, t.id, t.nama_topik
            having count(j.id) >= ?
            order by akurasi, jawaban desc
            limit ?
            SQL, [$dari, AnalitikSoal::MIN_JAWABAN_TOPIK, AnalitikSoal::MAKS_TOPIK_HEATMAP]);

        return array_map(fn ($b) => [
            'kodeSubtes' => $b->kode_subtes,
            'topik' => $b->nama_topik,
            'akurasi' => round((float) $b->akurasi, 1),
            'jawaban' => (int) $b->jawaban,
        ], $baris);
    }

    /**
     * Rata-rata penguasaan siswa setiap subtes, urut subtes. persen null = belum ada siswa dengan skor di subtes itu.
     *
     * @return array<int, array{kode: string, nama: string, persen: float|null, siswa: int}>
     */
    private function penguasaan(): array
    {
        $topikPerSubtes = [];
        foreach (DB::select(<<<'SQL'
            select t.id, t.subtes_id from topik t
            where exists (select 1 from soal q where q.topik_id = t.id and q.status = 'published')
            SQL) as $t) {
            $topikPerSubtes[$t->subtes_id][] = $t->id;
        }

        $baris = array_map(fn ($b) => [
            'user_id' => $b->user_id,
            'subtes_id' => $b->subtes_id,
            'topik_id' => $b->topik_id,
            'tahap' => (int) $b->tahap,
            'skor' => $b->skor === null ? null : (float) $b->skor,
        ], DB::select(<<<'SQL'
            select pt.user_id, t.subtes_id, pt.topik_id, pt.tahap, pt.skor
            from penguasaan_topik pt
            join topik t on t.id = pt.topik_id
            SQL));

        $rata = AnalitikSoal::rataPenguasaan($topikPerSubtes, $baris);

        return DB::table('subtes')->orderBy('urutan')->get(['id', 'kode_subtes', 'nama_subtes'])
            ->map(fn ($s) => [
                'kode' => $s->kode_subtes,
                'nama' => $s->nama_subtes,
                'persen' => $rata[$s->id]['persen'] ?? null,
                'siswa' => $rata[$s->id]['siswa'] ?? 0,
            ])
            ->all();
    }
}
