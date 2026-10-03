<?php

namespace App\Services;

use App\Models\Subtes;
use App\Models\TryOut;
use App\Models\TryOutSubtes;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Random\Randomizer;
use RuntimeException;

/**
 * Menyusun paket Try Out dari bank soal (RANCANGAN-tryout.md bagian 4). Dipanggil edvora:buat-tryout, nanti juga
 * halaman editor (UCS8). Soal paket sama untuk semua siswa dan dipilih sekali saat paket dibuat.
 */
class PenyusunPaketTryOut
{
    // Satu baris satu aturan; ditampilkan bernomor di pop-up Try Out.
    public const PERATURAN_DEFAULT = "Subtes dikerjakan berurutan dan tidak dapat dibuka kembali setelah selesai.\n"
        ."Setiap subtes memiliki waktu masing-masing; jawaban dikirim otomatis saat waktu habis.\n"
        ."Jawaban dikirim otomatis saat periode Try Out berakhir, walaupun waktu subtes masih tersisa.\n"
        .'Skor dihitung dengan IRT dan tersedia setelah periode Try Out ditutup.';

    /**
     * Susunan soal ketujuh subtes tanpa menyimpan.
     *
     * @return array<int, array{subtes: Subtes, menit: float, soalIds: string[], kurang: int, segar: int, rincian: array<string, array<string, int>>}>
     */
    public function susun(?float $menitPerSubtes = null, ?Randomizer $acak = null): array
    {
        $acak ??= new Randomizer;
        $hasil = [];

        foreach (Subtes::orderBy('urutan')->get() as $subtes) {
            // Soal published yang belum dipakai paket mana pun, beserta berapa kali pernah dijawab (siapa pun, mode apa pun).
            $baris = DB::select(<<<'SQL'
                select soal.id, soal.topik_id, soal.tingkat_kesulitan::text as tingkat,
                       (select count(*) from jawaban_pengerjaan j where j.soal_id = soal.id) as dijawab
                from soal
                where soal.subtes_id = ? and soal.status = 'published'
                  and not exists (select 1 from try_out_soal t where t.soal_id = soal.id)
                SQL, [$subtes->id]);

            $kandidat = array_map(fn ($b) => [
                'id' => $b->id,
                'topik_id' => $b->topik_id,
                'tingkat' => $b->tingkat,
                'dijawab' => (int) $b->dijawab,
            ], $baris);
            $kuota = DB::table('topik')->where('subtes_id', $subtes->id)->pluck('jumlah_soal_simulasi', 'id')->all();

            $soalIds = PemilihSoal::susunSimulasi($kandidat, $kuota, $subtes->jumlah_soal, $acak);

            $info = array_column($kandidat, null, 'id');
            $rincian = [];
            $segar = 0;
            foreach ($soalIds as $id) {
                $k = $info[$id];
                $rincian[$k['topik_id']][$k['tingkat']] = ($rincian[$k['topik_id']][$k['tingkat']] ?? 0) + 1;
                $segar += $k['dijawab'] === 0 ? 1 : 0;
            }

            $hasil[] = [
                'subtes' => $subtes,
                'menit' => $menitPerSubtes ?? $subtes->waktu_default_menit,
                'soalIds' => $soalIds,
                'kurang' => max(0, $subtes->jumlah_soal - count($soalIds)),
                'segar' => $segar,
                'rincian' => $rincian,
            ];
        }

        return $hasil;
    }

    /**
     * Susun lalu simpan paket dalam satu transaksi. Paket ditolak seluruhnya bila satu subtes kekurangan soal.
     */
    public function buat(string $judul, string $peraturan, CarbonInterface $mulaiAt, CarbonInterface $selesaiAt, ?string $dibuatOleh = null, ?float $menitPerSubtes = null): TryOut
    {
        $susunan = $this->susun($menitPerSubtes);

        $kurang = array_filter($susunan, fn ($s) => $s['kurang'] > 0);
        if ($kurang !== []) {
            throw new RuntimeException('Stok soal kurang: '.implode('; ', array_map(
                fn ($s) => "{$s['subtes']->kode_subtes} butuh {$s['subtes']->jumlah_soal}, tersedia ".count($s['soalIds']),
                $kurang,
            )).'.');
        }

        return DB::transaction(function () use ($susunan, $judul, $peraturan, $mulaiAt, $selesaiAt, $dibuatOleh) {
            // Eloquent menulis tanggal tanpa zona waktu, jadi simpan dalam UTC (APP_TIMEZONE).
            $tryOut = TryOut::create([
                'judul' => $judul,
                'peraturan' => $peraturan,
                'mulai_at' => CarbonImmutable::instance($mulaiAt)->utc(),
                'selesai_at' => CarbonImmutable::instance($selesaiAt)->utc(),
                'dibuat_oleh' => $dibuatOleh,
            ]);

            foreach ($susunan as $s) {
                $tryOutSubtes = TryOutSubtes::create([
                    'try_out_id' => $tryOut->id,
                    'subtes_id' => $s['subtes']->id,
                    'urutan' => $s['subtes']->urutan,
                    'jumlah_soal' => count($s['soalIds']),
                    'waktu_menit' => $s['menit'],
                ]);

                // UNIQUE (soal_id) menolak soal yang sudah dipakai paket lain, termasuk saat dua paket dibuat bersamaan.
                DB::table('try_out_soal')->insert(array_map(
                    fn ($soalId, $i) => ['try_out_subtes_id' => $tryOutSubtes->id, 'soal_id' => $soalId, 'urutan' => $i + 1],
                    $s['soalIds'],
                    array_keys($s['soalIds']),
                ));
            }

            return $tryOut;
        });
    }
}
