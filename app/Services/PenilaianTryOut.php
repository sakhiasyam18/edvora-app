<?php

namespace App\Services;

use App\Models\Pengerjaan;
use App\Models\TryOut;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Kalibrasi dan penilaian IRT satu paket Try Out yang sudah ditutup (RANCANGAN-irt.md 5.4). Matematikanya ada di
 * EstimasiIrt; kelas ini membaca jawaban dan menulis hasilnya. Idempoten: paket yang sudah dinilai dilewati.
 */
class PenilaianTryOut
{
    // Harus lebih besar dari SesiTryOut::TOLERANSI_DETIK, supaya kiriman otomatis subtes terakhir tidak tertolak
    // karena pengerjaannya sudah ditutup proses ini.
    public const JEDA_PENILAIAN_DETIK = 120;

    // Baris per query UPDATE massal; 1.000 baris × 3 nilai jauh di bawah batas 65.535 parameter Postgres.
    private const UKURAN_POTONGAN = 1000;

    public function __construct(private SesiTryOut $sesi) {}

    // Paket yang sudah lewat jeda setelah ditutup dan belum dinilai, urut waktu selesai.
    public static function paketSiap(CarbonInterface $sekarang): Builder
    {
        return TryOut::query()
            ->whereNull('dinilai_at')
            ->where('selesai_at', '<=', $sekarang->copy()->subSeconds(self::JEDA_PENILAIAN_DETIK))
            ->orderBy('selesai_at');
    }

    /**
     * @return array{peserta: int, subtes: array<int, array{nama: string, peserta: int, iterasi: int, konvergen: bool, a: float[], b: float[], skor: float[], geser: array<int, array{kode: string, label: string, b: float}>}>, ditulis: bool}
     */
    public function jalankan(TryOut $paket, bool $dryRun = false): array
    {
        if (! $dryRun) {
            // Siswa yang tidak kembali ditutup sebagai kosong (T14), supaya ikut dinilai dengan skor 0.
            Pengerjaan::where('try_out_id', $paket->id)
                ->where('status', 'berjalan')
                ->get()
                ->each(fn (Pengerjaan $p) => $this->sesi->tutupTanpaSesi($p));
        }

        $subtesPaket = $paket->subtesPaket()
            ->with(['subtes:id,nama_subtes', 'soal' => fn ($q) => $q->select('soal.id', 'soal.kode_soal', 'soal.tingkat_kesulitan')])
            ->get();

        // SelesaikanTryOut membuat satu baris pengerjaan_subtes per subtes paket untuk setiap pengerjaan selesai.
        $pengerjaanSubtes = DB::table('pengerjaan_subtes as ps')
            ->join('pengerjaan as p', 'p.id', '=', 'ps.pengerjaan_id')
            ->where('p.try_out_id', $paket->id)
            ->where('p.status', 'selesai')
            ->select('ps.id', 'ps.pengerjaan_id', 'ps.try_out_subtes_id')
            ->get();

        // Soal yang dijawab punya baris jawaban; soal kosong tidak. Dibaca dengan cursor supaya paket dengan ribuan
        // peserta tidak memuat semua baris ke memori sekaligus.
        $jawaban = self::kumpulkanJawaban(DB::table('jawaban_pengerjaan as j')
            ->join('pengerjaan_subtes as ps', 'ps.id', '=', 'j.pengerjaan_subtes_id')
            ->join('pengerjaan as p', 'p.id', '=', 'ps.pengerjaan_id')
            ->where('p.try_out_id', $paket->id)
            ->where('p.status', 'selesai')
            ->select('ps.try_out_subtes_id', 'j.pengerjaan_subtes_id', 'j.soal_id', 'j.is_correct')
            ->cursor());

        $parameter = [];
        $skorSubtes = [];
        $ringkasan = [];
        $psPerSubtes = $pengerjaanSubtes->groupBy('try_out_subtes_id');

        foreach ($subtesPaket as $tos) {
            $label = $tos->soal->pluck('tingkat_kesulitan', 'id')->all();
            // Jawaban untuk soal yang tidak ada di subtes paket ini diabaikan.
            $data = array_map(fn ($isi) => array_intersect_key($isi, $label), $jawaban[$tos->id] ?? []);
            $hasil = EstimasiIrt::kalibrasi($data, $label);
            $parameter += $hasil['parameter'];

            if (! $hasil['konvergen']) {
                Log::warning('Kalibrasi IRT belum konvergen', ['try_out_id' => $paket->id, 'try_out_subtes_id' => $tos->id]);
            }

            $skorIni = [];
            foreach ($psPerSubtes[$tos->id] ?? [] as $ps) {
                $respons = [];
                foreach ($data[$ps->id] ?? [] as $soalId => $u) {
                    $respons[] = $hasil['parameter'][$soalId] + ['u' => $u];
                }
                $skorIni[$ps->id] = EstimasiIrt::skor($respons);
            }
            $skorSubtes += $skorIni;

            $ringkasan[] = [
                'nama' => $tos->subtes->nama_subtes,
                'peserta' => count(array_filter($data)),
                'iterasi' => $hasil['iterasi'],
                'konvergen' => $hasil['konvergen'],
                'a' => array_column($hasil['parameter'], 'a'),
                'b' => array_column($hasil['parameter'], 'b'),
                'skor' => array_values($skorIni),
                'geser' => $this->geserTerbesar($hasil['parameter'], $label, $tos->soal->pluck('kode_soal', 'id')->all()),
            ];
        }

        // Rata-rata skor subtes yang tersimpan (sudah dibulatkan) atas semua subtes paket.
        $jumlahSubtes = max(1, $subtesPaket->count());
        $totalSkor = [];
        foreach ($pengerjaanSubtes->groupBy('pengerjaan_id') as $pengerjaanId => $baris) {
            $totalSkor[$pengerjaanId] = round($baris->sum(fn ($ps) => $skorSubtes[$ps->id] ?? 0.0) / $jumlahSubtes, 2);
        }

        $ditulis = false;
        if (! $dryRun) {
            $ditulis = DB::transaction(function () use ($paket, $parameter, $skorSubtes, $totalSkor) {
                // Kunci baris paket: proses kedua menunggu, lalu melihat dinilai_at sudah terisi dan berhenti.
                $terkunci = TryOut::whereKey($paket->id)->lockForUpdate()->first();
                if (! $terkunci || $terkunci->dinilai_at !== null) {
                    return false;
                }

                $this->updateMassal('soal', ['irt_a', 'irt_b'], array_map(fn ($p) => [round($p['a'], 6), round($p['b'], 6)], $parameter));
                $this->updateMassal('pengerjaan_subtes', ['skor_subtes'], array_map(fn ($s) => [$s], $skorSubtes));
                $this->updateMassal('pengerjaan', ['total_skor'], array_map(fn ($t) => [$t], $totalSkor));
                $terkunci->update(['dinilai_at' => now()]);

                return true;
            });
        }

        return ['peserta' => count($totalSkor), 'subtes' => $ringkasan, 'ditulis' => $ditulis];
    }

    /**
     * Matriks jawaban dari baris query yang dibaca satu per satu. Yang disimpan hanya angka 0/1, bukan objek baris,
     * supaya paket dengan ribuan peserta muat di memori.
     *
     * @param  iterable<object>  $baris  kolom try_out_subtes_id, pengerjaan_subtes_id, soal_id, is_correct
     * @return array<string, array<string, array<string, int>>> try_out_subtes_id => pengerjaan_subtes_id => soal_id => 0|1
     */
    public static function kumpulkanJawaban(iterable $baris): array
    {
        $jawaban = [];
        foreach ($baris as $j) {
            $jawaban[$j->try_out_subtes_id][$j->pengerjaan_subtes_id][$j->soal_id] = $j->is_correct ? 1 : 0;
        }

        return $jawaban;
    }

    /**
     * UPDATE banyak baris berdasarkan id, satu query per potongan:
     * UPDATE t SET k1 = v.k1, ... FROM (VALUES (?::uuid, ?::numeric, ...), ...) AS v(id, k1, ...) WHERE t.id = v.id
     *
     * @param  string[]  $kolom  kolom numeric yang diisi
     * @param  array<string, array<int, float>>  $nilai  id => nilai kolom, urut sesuai $kolom
     */
    private function updateMassal(string $tabel, array $kolom, array $nilai): void
    {
        $set = implode(', ', array_map(fn ($k) => "{$k} = v.{$k}", $kolom));
        $tempat = '(?::uuid'.str_repeat(', ?::numeric', count($kolom)).')';

        foreach (array_chunk($nilai, self::UKURAN_POTONGAN, true) as $potongan) {
            $binding = [];
            foreach ($potongan as $id => $isi) {
                array_push($binding, $id, ...$isi);
            }

            DB::update(
                "UPDATE {$tabel} AS t SET {$set} FROM (VALUES ".implode(', ', array_fill(0, count($potongan), $tempat))
                .') AS v(id, '.implode(', ', $kolom).') WHERE t.id = v.id',
                $binding,
            );
        }
    }

    /**
     * Lima soal dengan b yang paling jauh bergeser dari label, untuk ringkasan perintah.
     *
     * @param  array<string, array{a: float, b: float}>  $parameter
     * @param  array<string, string>  $label
     * @param  array<string, string>  $kode
     * @return array<int, array{kode: string, label: string, b: float}>
     */
    private function geserTerbesar(array $parameter, array $label, array $kode): array
    {
        $daftar = [];
        foreach ($parameter as $soalId => $p) {
            $daftar[] = [
                'kode' => $kode[$soalId] ?? $soalId,
                'label' => $label[$soalId],
                'b' => $p['b'],
                'selisih' => abs($p['b'] - EstimasiIrt::B_AWAL[$label[$soalId]]),
            ];
        }
        usort($daftar, fn ($x, $y) => $y['selisih'] <=> $x['selisih']);

        return array_map(fn ($d) => ['kode' => $d['kode'], 'label' => $d['label'], 'b' => $d['b']], array_slice($daftar, 0, 5));
    }
}
