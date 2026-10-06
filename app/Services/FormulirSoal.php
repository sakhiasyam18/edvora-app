<?php

namespace App\Services;

use App\Models\Soal;

/**
 * Formulir satu soal di halaman editor (tambah dan edit). Isinya diubah menjadi nilai kolom Excel lalu diperiksa
 * ImportSoalExcel::periksaSatu(), jadi aturannya sama persis dengan import Excel. Nama field memakai camelCase
 * karena dikirim dari React.
 */
class FormulirSoal
{
    // Kunci kolom importer => field formulir. Kolom lain (Nama Subtes, Kode Soal) dan error tanpa kolom masuk 'umum'.
    private const FIELD = [
        'topik' => 'topikId',
        'tipe' => 'tipe',
        'teks_soal' => 'teksSoal',
        'gambar_soal' => 'gambarSoal',
        'kolom_tabel' => 'kolomTabel',
        'kunci' => 'kunci',
        'hint' => 'hint',
        'pembahasan' => 'pembahasan',
        'gambar_pembahasan' => 'gambarPembahasan',
        'tingkat_kesulitan' => 'tingkatKesulitan',
    ];

    // Pengganti "Wajib diisi." untuk field yang dipilih dari daftar, bukan diketik.
    private const WAJIB_DIPILIH = [
        'topik' => 'Pilih topik.',
        'tipe' => 'Pilih tipe soal.',
        'tingkat_kesulitan' => 'Pilih tingkat kesulitan.',
    ];

    /**
     * Isi formulir => nilai kolom importer. Kunci jawaban ditulis seperti di Excel: huruf opsi (pilihan_ganda),
     * B/S per pernyataan (benar_salah), nomor kolom per pernyataan (majemuk_tabel), atau jawaban dipisah |
     * (isian_singkat).
     *
     * @param  array<string, mixed>  $isian  input request yang sudah divalidasi
     * @return array<string, string|null>
     */
    public static function keKolom(array $isian, string $kodeSubtes, string $kodeSoal, ?string $namaTopik): array
    {
        $tipe = (string) ($isian['tipe'] ?? '');
        $opsi = array_values($isian['opsi'] ?? []);

        $kolom = [
            'nama_subtes' => $kodeSubtes,
            'topik' => $namaTopik,
            'kode_soal' => $kodeSoal,
            'tipe' => $tipe,
            'teks_soal' => self::teks($isian['teksSoal'] ?? null),
            'gambar_soal' => self::teks($isian['gambarSoal'] ?? null),
            'kolom_tabel' => null,
            'kunci' => null,
            'hint' => self::teks($isian['hint'] ?? null),
            'pembahasan' => self::teks($isian['pembahasan'] ?? null),
            'gambar_pembahasan' => self::teks($isian['gambarPembahasan'] ?? null),
            'tingkat_kesulitan' => self::teks($isian['tingkatKesulitan'] ?? null),
        ];

        // Isi opsi yang tertinggal saat tipe diganti ke isian singkat tidak ikut diperiksa maupun disimpan.
        $terisi = [];
        foreach (ImportSoalExcel::LABEL_OPSI as $i => $label) {
            $huruf = strtolower($label);
            $teks = $tipe === 'isian_singkat' ? null : self::teks($opsi[$i]['teks'] ?? null);
            $gambar = $tipe === 'isian_singkat' ? null : self::teks($opsi[$i]['gambar'] ?? null);
            $kolom["opsi_{$huruf}_teks"] = $teks;
            $kolom["opsi_{$huruf}_gambar"] = $gambar;

            if ($teks !== null || $gambar !== null) {
                $terisi[] = $i;
            }
        }

        $kolom['kunci'] = match ($tipe) {
            'pilihan_ganda' => self::teks($isian['kunciPg'] ?? null),
            'benar_salah' => $terisi ? implode(',', array_map(fn ($i) => empty($isian['kunciBenar'][$i]) ? 'S' : 'B', $terisi)) : null,
            'majemuk_tabel' => self::kunciTabel($terisi, $isian['kunciKolom'] ?? []),
            'isian_singkat' => self::jawabanIsian($isian['jawabanIsian'] ?? []),
            default => null,
        };

        if ($tipe === 'majemuk_tabel') {
            $kolom['kolom_tabel'] = self::teks(implode('|', array_map(fn ($k) => trim((string) $k), $isian['kolomTabel'] ?? [])));
        }

        return $kolom;
    }

    /**
     * Error periksaSatu() => satu pesan per field formulir (Inertia hanya menampilkan pesan pertama tiap field).
     * Beberapa kalimat untuk pengisi Excel diganti dengan kalimat yang cocok untuk formulir.
     *
     * @param  array<string, string[]>  $error  kunci kolom importer => pesan
     * @return array<string, string>
     */
    public static function pesanError(array $error, string $tipe): array
    {
        $pesan = [];
        foreach ($error as $kunci => $daftar) {
            foreach ($daftar as $p) {
                if (($p = self::pesanFormulir((string) $kunci, $p, $tipe)) !== null) {
                    $pesan[self::namaField((string) $kunci)][] = $p;
                }
            }
        }

        return array_map(fn ($d) => implode(' ', array_unique($d)), $pesan);
    }

    // "opsi_c_gambar" => "opsi.2.gambar", "teks_soal" => "teksSoal"
    public static function namaField(string $kunci): string
    {
        if (preg_match('/^opsi_([a-e])_(teks|gambar)$/', $kunci, $m)) {
            return 'opsi.'.(ord($m[1]) - ord('a')).'.'.$m[2];
        }

        return self::FIELD[$kunci] ?? 'umum';
    }

    /**
     * Soal tersimpan => isi awal formulir edit. Opsi selalu lima baris (A–E); yang tidak ada berisi teks kosong.
     *
     * @return array<string, mixed>
     */
    public static function dariSoal(Soal $soal): array
    {
        $opsiPerLabel = $soal->opsiJawaban->keyBy('label');
        $opsi = array_map(fn ($label) => $opsiPerLabel->get($label), ImportSoalExcel::LABEL_OPSI);

        return [
            'topikId' => $soal->topik_id,
            'tipe' => $soal->tipe,
            'tingkatKesulitan' => $soal->tingkat_kesulitan,
            'teksSoal' => $soal->teks_soal,
            'gambarSoal' => $soal->gambar_soal ?? '',
            'opsi' => array_map(fn ($o) => ['teks' => $o?->teks_opsi ?? '', 'gambar' => $o?->gambar_opsi ?? ''], $opsi),
            'kunciPg' => $soal->tipe === 'pilihan_ganda' ? ($opsiPerLabel->firstWhere('is_kunci', true)?->label ?? '') : '',
            'kunciBenar' => array_map(fn ($o) => (bool) $o?->is_kunci, $opsi),
            'kolomTabel' => $soal->kolom_tabel ?? MajemukTabel::KOLOM_BAWAAN,
            'kunciKolom' => array_map(fn ($o) => $o?->kunci_kolom, $opsi),
            'jawabanIsian' => $soal->kunci_jawaban === null ? [''] : explode('|', $soal->kunci_jawaban),
            'hint' => $soal->hint ?? '',
            'pembahasan' => $soal->pembahasan ?? '',
            'gambarPembahasan' => $soal->gambar_pembahasan ?? '',
        ];
    }

    private static function pesanFormulir(string $kunci, string $pesan, string $tipe): ?string
    {
        if ($pesan === 'Wajib diisi.' && isset(self::WAJIB_DIPILIH[$kunci])) {
            return self::WAJIB_DIPILIH[$kunci];
        }

        if ($kunci === 'kunci' && $pesan === 'Wajib diisi.') {
            return match ($tipe) {
                'pilihan_ganda' => 'Pilih satu opsi sebagai kunci jawaban.',
                'majemuk_tabel' => 'Pilih kolom kunci untuk setiap pernyataan.',
                // benar_salah tanpa pernyataan: masalahnya sudah dilaporkan di opsi ("Minimal 2 pernyataan").
                default => null,
            };
        }

        // Pesan Kolom Tabel di Excel menyebut tanda |, yang tidak terlihat di formulir.
        if ($kunci === 'kolom_tabel' && str_contains($pesan, 'dipisah |')) {
            return 'Isi 2–'.MajemukTabel::MAKS_KOLOM.' judul kolom.';
        }

        if ($kunci === 'kolom_tabel' && str_contains($pesan, 'di antara tanda |')) {
            return 'Judul kolom tidak boleh kosong.';
        }

        return $pesan;
    }

    // Nomor kolom kunci setiap pernyataan yang terisi; null bila ada pernyataan yang belum diberi kunci.
    private static function kunciTabel(array $terisi, array $kunciKolom): ?string
    {
        $nomor = [];
        foreach ($terisi as $i) {
            if (! is_numeric($kunciKolom[$i] ?? null)) {
                return null;
            }

            $nomor[] = (int) $kunciKolom[$i];
        }

        return $nomor ? implode(',', $nomor) : null;
    }

    // Kotak jawaban yang kosong dilewati; jawaban yang memuat | dipecah, sama seperti di Excel.
    private static function jawabanIsian(array $jawaban): ?string
    {
        $semua = [];
        foreach ($jawaban as $j) {
            foreach (explode('|', (string) self::teks($j)) as $bagian) {
                if (($bagian = trim($bagian)) !== '') {
                    $semua[] = $bagian;
                }
            }
        }

        return $semua ? implode('|', $semua) : null;
    }

    private static function teks(mixed $nilai): ?string
    {
        $nilai = is_scalar($nilai) ? trim((string) $nilai) : '';

        return $nilai === '' ? null : $nilai;
    }
}
