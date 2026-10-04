<?php

namespace App\Services;

use App\Models\JawabanPengerjaan;
use App\Models\Pengerjaan;
use App\Models\Soal;
use App\Models\TryOutSubtes;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Isi halaman pembahasan satu pengerjaan: setiap soal sesi beserta jawaban siswa, status, dan kunci siap tampil.
 * Soal kosong hanya diketahui dari pengerjaan.soal_ids; sesi lama tanpa kolom itu hanya memuat soal yang dijawab.
 */
class PembahasanPengerjaan
{
    /**
     * @return array<int, array<string, mixed>> urut nomor soal
     */
    public function untuk(Pengerjaan $pengerjaan): array
    {
        $jawaban = JawabanPengerjaan::where('pengerjaan_id', $pengerjaan->id)
            ->get(['soal_id', 'opsi_dipilih_id', 'opsi_dipilih_ids', 'jawaban_isian', 'is_correct', 'waktu_menjawab'])
            ->keyBy('soal_id');

        $urutan = self::urutanSoal($pengerjaan->soal_ids, $jawaban->map(fn ($j) => (string) $j->waktu_menjawab)->all());

        return $this->susun($urutan, $jawaban);
    }

    /**
     * Pembahasan satu subtes Try Out (RANCANGAN-peringkat-pembahasan-tryout.md 4.3): semua soal subtes paket sesuai
     * urutan try_out_soal, termasuk yang dikosongkan, karena pengerjaan Try Out tidak menyimpan soal_ids.
     *
     * @return array<int, array<string, mixed>> urut nomor soal
     */
    public function untukSubtesTryOut(Pengerjaan $pengerjaan, TryOutSubtes $tryOutSubtes): array
    {
        $urutan = DB::table('try_out_soal')
            ->where('try_out_subtes_id', $tryOutSubtes->id)
            ->orderBy('urutan')
            ->pluck('soal_id')
            ->all();

        $jawaban = JawabanPengerjaan::where('pengerjaan_id', $pengerjaan->id)
            ->whereIn('soal_id', $urutan)
            ->get(['soal_id', 'opsi_dipilih_id', 'opsi_dipilih_ids', 'jawaban_isian', 'is_correct'])
            ->keyBy('soal_id');

        return $this->susun($urutan, $jawaban);
    }

    /**
     * @param  string[]  $urutan  id soal urut nomor
     * @param  Collection<string, JawabanPengerjaan>  $jawaban  soal_id => jawaban
     * @return array<int, array<string, mixed>>
     */
    private function susun(array $urutan, Collection $jawaban): array
    {
        $soalMap = Soal::with(['opsiJawaban' => fn ($q) => $q->orderBy('urutan')])
            ->whereIn('id', $urutan)
            ->get(['id', 'tipe', 'teks_soal', 'gambar_soal', 'pembahasan', 'kunci_jawaban'])
            ->keyBy('id');

        $hasil = [];
        foreach ($urutan as $soalId) {
            // Soal yang sudah dihapus dari bank soal dilewati.
            if ($soal = $soalMap->get($soalId)) {
                $hasil[] = self::satuSoal($soal, $jawaban->get($soalId));
            }
        }

        return $hasil;
    }

    /**
     * Urutan nomor soal: daftar soal sesi bila tersimpan (termasuk yang kosong); untuk sesi lama,
     * soal yang dijawab diurutkan menurut waktu menjawab lalu id.
     *
     * @param  string[]  $soalIds  pengerjaan.soal_ids
     * @param  array<string, string>  $waktuDijawab  soal_id => waktu menjawab
     * @return string[]
     */
    public static function urutanSoal(array $soalIds, array $waktuDijawab): array
    {
        if ($soalIds !== []) {
            return array_values($soalIds);
        }

        $ids = array_map('strval', array_keys($waktuDijawab));
        usort($ids, fn ($a, $b) => [$waktuDijawab[$a], $a] <=> [$waktuDijawab[$b], $b]);

        return $ids;
    }

    /** Soal tanpa baris jawaban berarti dibiarkan kosong. */
    public static function status(?bool $benar): string
    {
        return match ($benar) {
            true => 'benar',
            false => 'salah',
            null => 'kosong',
        };
    }

    /**
     * Kunci siap tampil: "A. Vierzna" (pilihan ganda), "Vierzna dan Dewi" (benar_salah: semua pernyataan
     * yang benar), atau alternatif pertama kunci isian. "-" bila soal tidak punya kunci.
     *
     * @param  array<int, array{label: string, teks_opsi: string, is_kunci: bool}>  $opsi  urut `urutan`
     */
    public static function teksKunci(string $tipe, array $opsi, ?string $kunciJawaban): string
    {
        if ($tipe === 'isian_singkat') {
            return PenilaianIsian::kunciTampil($kunciJawaban) ?: '-';
        }

        $kunci = array_values(array_filter($opsi, fn (array $o) => $o['is_kunci']));
        if ($kunci === []) {
            return '-';
        }

        if ($tipe === 'benar_salah') {
            $teks = array_column($kunci, 'teks_opsi');
            $terakhir = array_pop($teks);

            return $teks === [] ? $terakhir : implode(', ', $teks).' dan '.$terakhir;
        }

        return "{$kunci[0]['label']}. {$kunci[0]['teks_opsi']}";
    }

    private static function satuSoal(Soal $soal, ?JawabanPengerjaan $jawaban): array
    {
        $opsi = $soal->opsiJawaban->map(fn ($o) => [
            'id' => $o->id,
            'label' => $o->label,
            'teks_opsi' => $o->teks_opsi,
            'is_kunci' => (bool) $o->is_kunci,
        ])->all();

        return [
            'id' => $soal->id,
            'tipe' => $soal->tipe,
            'teks_soal' => $soal->teks_soal,
            'gambar_soal' => $soal->gambar_soal,
            'pembahasan' => $soal->pembahasan,
            'opsi_jawaban' => $opsi,
            'kunci' => self::teksKunci($soal->tipe, $opsi, $soal->kunci_jawaban),
            'status' => self::status($jawaban?->is_correct),
            'jawaban' => [
                // Pilihan ganda menyimpan satu opsi, benar_salah menyimpan himpunan opsi.
                'opsiIds' => match (true) {
                    $jawaban === null => [],
                    $jawaban->opsi_dipilih_id !== null => [$jawaban->opsi_dipilih_id],
                    default => $jawaban->opsi_dipilih_ids,
                },
                'isian' => $jawaban?->jawaban_isian,
            ],
        ];
    }
}
