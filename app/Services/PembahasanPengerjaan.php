<?php

namespace App\Services;

use App\Models\JawabanPengerjaan;
use App\Models\Pengerjaan;
use App\Models\Soal;

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
            ->get(['soal_id', 'opsi_dipilih_id', 'opsi_dipilih_ids', 'jawaban_isian', 'pilihan_kolom', 'is_correct', 'waktu_menjawab'])
            ->keyBy('soal_id');

        $urutan = self::urutanSoal($pengerjaan->soal_ids, $jawaban->map(fn ($j) => (string) $j->waktu_menjawab)->all());

        $soalMap = Soal::with(['opsiJawaban' => fn ($q) => $q->orderBy('urutan')])
            ->whereIn('id', $urutan)
            ->get(['id', 'tipe', 'teks_soal', 'gambar_soal', 'pembahasan', 'gambar_pembahasan', 'kunci_jawaban', 'kolom_tabel'])
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
     * yang benar), "1. Benar; 2. Salah" (majemuk_tabel: kolom kunci tiap pernyataan), atau alternatif pertama
     * kunci isian. "-" bila soal tidak punya kunci.
     *
     * @param  array<int, array{label: string, teks_opsi: string, is_kunci: bool, kunci_kolom?: ?int}>  $opsi  urut `urutan`
     * @param  string[]|null  $kolomTabel  judul kolom soal majemuk_tabel
     */
    public static function teksKunci(string $tipe, array $opsi, ?string $kunciJawaban, ?array $kolomTabel = null): string
    {
        if ($tipe === 'isian_singkat') {
            return PenilaianIsian::kunciTampil($kunciJawaban) ?: '-';
        }

        if ($tipe === 'majemuk_tabel') {
            $baris = [];
            foreach (array_values($opsi) as $i => $o) {
                $baris[] = ($i + 1).'. '.($kolomTabel[($o['kunci_kolom'] ?? 0) - 1] ?? '-');
            }

            return $baris === [] ? '-' : implode('; ', $baris);
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
            'gambar_opsi' => $o->gambar_opsi,
            'is_kunci' => (bool) $o->is_kunci,
            'kunci_kolom' => $o->kunci_kolom,
        ])->all();

        return [
            'id' => $soal->id,
            'tipe' => $soal->tipe,
            'teks_soal' => $soal->teks_soal,
            'gambar_soal' => $soal->gambar_soal,
            'pembahasan' => $soal->pembahasan,
            'gambar_pembahasan' => $soal->gambar_pembahasan,
            'kolom_tabel' => $soal->kolom_tabel,
            'opsi_jawaban' => $opsi,
            'kunci' => self::teksKunci($soal->tipe, $opsi, $soal->kunci_jawaban, $soal->kolom_tabel),
            'status' => self::status($jawaban?->is_correct),
            'jawaban' => [
                // Pilihan ganda menyimpan satu opsi, benar_salah menyimpan himpunan opsi.
                'opsiIds' => match (true) {
                    $jawaban === null => [],
                    $jawaban->opsi_dipilih_id !== null => [$jawaban->opsi_dipilih_id],
                    default => $jawaban->opsi_dipilih_ids,
                },
                'isian' => $jawaban?->jawaban_isian,
                // Majemuk_tabel: { idOpsi: nomor kolom }.
                'pilihanKolom' => $jawaban?->pilihan_kolom,
            ],
        ];
    }
}
