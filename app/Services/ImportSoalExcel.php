<?php

namespace App\Services;

use App\Models\OpsiJawaban;
use App\Models\Soal;
use App\Models\Subtes;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use RuntimeException;

/**
 * Membaca soal dari file Excel sesuai aturan pengisian yang disepakati tim,
 * lalu menyimpannya ke database dengan upsert berdasarkan kode_soal.
 */
class ImportSoalExcel
{
    public const NAMA_SHEET = 'Soal';

    // Label di kolom Tipe Soal (sama dengan dropdown di Excel) => nilai enum tipe_soal.
    public const TIPE_SOAL = [
        'pilihan_ganda' => 'pilihan_ganda',
        'benar_salah' => 'benar_salah',
        'isian_singkat' => 'isian_singkat',
    ];

    public const TINGKAT_KESULITAN = ['mudah', 'sedang', 'sulit'];

    public const LABEL_OPSI = ['A', 'B', 'C', 'D', 'E'];

    // Kolom ini boleh terisi di baris yang belum berisi soal (mis. diisi sampai bawah sheet).
    private const KOLOM_IDENTITAS = ['nama_subtes', 'kode_soal'];

    private const KOLOM_TEKS_MATEMATIKA = ['teks_soal', 'hint', 'pembahasan'];

    // Kolom tabel soal yang diisi dari Excel (selain kode_soal).
    private const KOLOM_SOAL = [
        'subtes_id', 'tipe', 'teks_soal', 'gambar_soal', 'kunci_jawaban', 'hint', 'pembahasan', 'tingkat_kesulitan',
    ];

    /**
     * @return array{
     *     sheet: string|null,
     *     peringatan: string[],
     *     error: array<int, array{baris: int|null, kolom: string|null, pesan: string}>,
     *     soal: array<int, array<string, mixed>>,
     *     dilewati: int,
     * }
     */
    public function periksa(string $path): array
    {
        $hasil = ['sheet' => null, 'peringatan' => [], 'error' => [], 'soal' => [], 'dilewati' => 0];

        $spreadsheet = IOFactory::createReader('Xlsx')->load($path);
        [$sheet, $kolom] = $this->pilihSheet($spreadsheet->getAllSheets(), $hasil);

        if (! $sheet) {
            return $hasil;
        }

        $hasil['sheet'] = $sheet->getTitle();
        $subtes = Subtes::pluck('id', 'kode_subtes')->all();
        $soalLama = Soal::pluck('id', 'kode_soal')->all();
        $batas = $this->batasPanjangKolom();
        $kodeDipakai = [];

        for ($baris = 2; $baris <= $sheet->getHighestDataRow(); $baris++) {
            $sel = [];
            foreach ($kolom as $kunci => $info) {
                $sel[$kunci] = $this->bacaSel($sheet, $info['huruf'].$baris);
            }

            if ($this->barisKosong($sel)) {
                $hasil['dilewati']++;

                continue;
            }

            $errorBaris = [];
            $tambahError = function (string $kunci, string $pesan) use (&$errorBaris, $baris, $kolom) {
                $errorBaris[] = ['baris' => $baris, 'kolom' => $kolom[$kunci]['nama'], 'pesan' => $pesan];
            };

            $soal = $this->periksaBaris($sel, $tambahError, $subtes, $batas, $kodeDipakai, $baris);

            if ($errorBaris) {
                array_push($hasil['error'], ...$errorBaris);
            } else {
                $soal['baris'] = $baris;
                $soal['sudah_ada'] = isset($soalLama[$soal['kode_soal']]);
                $hasil['soal'][] = $soal;
            }
        }

        return $hasil;
    }

    /**
     * Simpan soal hasil periksa() dalam satu transaksi. Soal dengan kode yang sudah ada diperbarui.
     *
     * @return array{baru: int, diperbarui: int}
     */
    public function simpan(array $soalList): array
    {
        // Query dibuat sesedikit mungkin: database ada di server jauh, jadi tiap query terasa.
        return DB::transaction(function () use ($soalList) {
            $soalLama = Soal::whereIn('kode_soal', array_column($soalList, 'kode_soal'))->get()->keyBy('kode_soal');
            $opsiLama = OpsiJawaban::whereIn('soal_id', $soalLama->pluck('id'))->get()->groupBy('soal_id');

            $jumlah = ['baru' => 0, 'diperbarui' => 0];
            $soalBaru = [];
            $opsiBaru = [];
            $opsiHapus = [];

            foreach ($soalList as $data) {
                $atribut = Arr::only($data, self::KOLOM_SOAL);
                $soal = $soalLama->get($data['kode_soal']);

                if (! $soal) {
                    $soalId = (string) Str::orderedUuid();
                    $soalBaru[] = $atribut + ['id' => $soalId, 'kode_soal' => $data['kode_soal'], 'editor_id' => null];

                    foreach ($data['opsi'] as $opsi) {
                        $opsiBaru[] = $opsi + ['id' => (string) Str::orderedUuid(), 'soal_id' => $soalId];
                    }

                    $jumlah['baru']++;

                    continue;
                }

                // save() hanya menjalankan query jika ada kolom yang berubah.
                $soal->fill($atribut)->save();
                $jumlah['diperbarui']++;

                $lama = ($opsiLama->get($soal->id) ?? collect())->keyBy('label');

                foreach ($data['opsi'] as $opsi) {
                    if ($o = $lama->pull($opsi['label'])) {
                        $o->fill($opsi)->save();
                    } else {
                        $opsiBaru[] = $opsi + ['id' => (string) Str::orderedUuid(), 'soal_id' => $soal->id];
                    }
                }

                foreach ($lama as $label => $o) {
                    $opsiHapus[$o->id] = "baris {$data['baris']} ({$soal->kode_soal}) opsi {$label}";
                }
            }

            $this->hapusOpsi($opsiHapus);

            foreach (array_chunk($soalBaru, 200) as $bagian) {
                DB::table('soal')->insert($bagian);
            }

            foreach (array_chunk($opsiBaru, 500) as $bagian) {
                DB::table('opsi_jawaban')->insert($bagian);
            }

            return $jumlah;
        });
    }

    /**
     * Opsi yang tidak ada lagi di Excel dihapus, kecuali sudah pernah dipilih siswa.
     *
     * @param  array<string, string>  $opsiHapus  id opsi => keterangan untuk pesan error
     */
    private function hapusOpsi(array $opsiHapus): void
    {
        if (! $opsiHapus) {
            return;
        }

        $id = array_keys($opsiHapus);
        $dipakai = DB::table('jawaban_pengerjaan')->whereIn('opsi_dipilih_id', $id)->pluck('opsi_dipilih_id')
            ->merge(DB::table('battle_jawaban')->whereIn('opsi_dipilih_id', $id)->pluck('opsi_dipilih_id'))
            ->countBy();

        if ($dipakai->isNotEmpty()) {
            $rincian = $dipakai->map(fn ($n, $opsiId) => "{$opsiHapus[$opsiId]} sudah dipilih di {$n} jawaban siswa")->implode('; ');

            throw new RuntimeException("Opsi tidak bisa dihapus: {$rincian}.");
        }

        OpsiJawaban::whereIn('id', $id)->delete();
    }

    /**
     * @param  Worksheet[]  $sheets
     * @return array{0: Worksheet|null, 1: array<string, array{huruf: string, nama: string}>}
     */
    private function pilihSheet(array $sheets, array &$hasil): array
    {
        $nama = self::NAMA_SHEET;

        foreach ($sheets as $sheet) {
            if ($sheet->getTitle() === $nama) {
                ['kolom' => $kolom, 'hilang' => $hilang] = $this->petakanHeader($sheet);

                foreach ($hilang as $header) {
                    $hasil['error'][] = ['baris' => 1, 'kolom' => null, 'pesan' => "Header \"{$header}\" tidak ditemukan."];
                }

                return $hilang ? [null, []] : [$sheet, $kolom];
            }
        }

        // Sementara: file lama belum memakai nama sheet "Soal", jadi cari sheet dengan header yang lengkap.
        foreach ($sheets as $sheet) {
            ['kolom' => $kolom, 'hilang' => $hilang] = $this->petakanHeader($sheet);

            if (! $hilang) {
                $hasil['peringatan'][] = "Sheet \"{$nama}\" tidak ditemukan, memakai sheet \"{$sheet->getTitle()}\". Ganti nama sheet menjadi \"{$nama}\".";

                return [$sheet, $kolom];
            }
        }

        $hasil['error'][] = ['baris' => null, 'kolom' => null, 'pesan' => "Tidak ada sheet \"{$nama}\" atau sheet dengan header soal yang lengkap."];

        return [null, []];
    }

    /**
     * Petakan header baris 1 ke huruf kolom.
     *
     * @return array{kolom: array<string, array{huruf: string, nama: string}>, hilang: string[]}
     */
    private function petakanHeader(Worksheet $sheet): array
    {
        $ditemukan = [];
        $iterator = $sheet->getRowIterator(1, 1)->current()->getCellIterator();
        $iterator->setIterateOnlyExistingCells(true);

        foreach ($iterator as $sel) {
            $nama = trim((string) $sel->getValue());
            if ($nama !== '') {
                $ditemukan[$this->normalisasiHeader($nama)] ??= ['huruf' => $sel->getColumn(), 'nama' => $nama];
            }
        }

        $kolom = [];
        $hilang = [];
        foreach ($this->daftarHeader() as $kunci => $header) {
            if (isset($ditemukan[$header])) {
                $kolom[$kunci] = $ditemukan[$header];
            } else {
                $hilang[] = $header;
            }
        }

        return ['kolom' => $kolom, 'hilang' => $hilang];
    }

    /** @return array<string, string> kunci internal => header yang sudah dinormalisasi */
    private function daftarHeader(): array
    {
        $header = [
            'nama_subtes' => 'nama subtes',
            'kode_soal' => 'kode soal',
            'tipe' => 'tipe soal',
            'teks_soal' => 'teks soal',
            'gambar_soal' => 'gambar soal',
        ];

        foreach (self::LABEL_OPSI as $label) {
            $huruf = strtolower($label);
            $header["opsi_{$huruf}_teks"] = "opsi {$huruf} - teks";
            $header["opsi_{$huruf}_gambar"] = "opsi {$huruf} - gambar";
        }

        return $header + [
            'kunci' => 'kunci jawaban',
            'hint' => 'hint',
            'pembahasan' => 'pembahasan',
            'tingkat_kesulitan' => 'tingkat kesulitan',
        ];
    }

    // "Opsi E – Teks (opsional)" => "opsi e - teks"
    private function normalisasiHeader(string $nama): string
    {
        $nama = preg_replace('/\([^)]*\)/u', '', $nama);
        $nama = preg_replace('/\s*[-–—]\s*/u', ' - ', $nama);

        return trim(preg_replace('/\s+/u', ' ', mb_strtolower($nama)));
    }

    /**
     * Baca satu sel sebagai teks. Sel yang diubah Excel (rumus, tanggal, desimal) diberi catatan masalah.
     *
     * @return array{nilai: string|null, masalah: string|null, kosong: bool}
     */
    private function bacaSel(Worksheet $sheet, string $koordinat): array
    {
        if (! $sheet->cellExists($koordinat)) {
            return ['nilai' => null, 'masalah' => null, 'kosong' => true];
        }

        $sel = $sheet->getCell($koordinat);
        $nilai = $sel->getValue();
        $masalah = null;

        if ($sel->isFormula()) {
            $masalah = 'Berisi rumus. Salin sebagai nilai (Paste Values), jangan pakai rumus.';
            // Hasil rumus terakhir dari Excel tetap dipakai agar pemeriksaan lain ikut berjalan.
            $nilai = $sel->getOldCalculatedValue();
        } elseif ($sel->getDataType() === DataType::TYPE_ERROR) {
            return ['nilai' => null, 'masalah' => "Berisi error Excel {$nilai}.", 'kosong' => false];
        }

        if ($nilai instanceof RichText) {
            $nilai = $nilai->getPlainText();
        }

        if ($nilai === null || $nilai === '') {
            return ['nilai' => null, 'masalah' => $masalah, 'kosong' => $masalah === null];
        }

        if (is_bool($nilai)) {
            return ['nilai' => null, 'masalah' => 'Berisi TRUE/FALSE. Format sel sebagai Text lalu ketik ulang.', 'kosong' => false];
        }

        if (is_int($nilai) || is_float($nilai)) {
            if (! $sel->isFormula() && Date::isDateTime($sel)) {
                return ['nilai' => null, 'masalah' => 'Diubah Excel menjadi tanggal/jam. Format sel sebagai Text lalu ketik ulang.', 'kosong' => false];
            }

            if (is_float($nilai) && (floor($nilai) != $nilai || abs($nilai) >= 1e15)) {
                return ['nilai' => null, 'masalah' => "Tersimpan sebagai angka desimal ({$nilai}). Format sel sebagai Text lalu ketik ulang.", 'kosong' => false];
            }

            $nilai = (string) (int) $nilai;
        }

        $nilai = trim(str_replace(["\r\n", "\r"], "\n", (string) $nilai));

        return ['nilai' => $nilai === '' ? null : $nilai, 'masalah' => $masalah, 'kosong' => $nilai === '' && $masalah === null];
    }

    private function barisKosong(array $sel): bool
    {
        foreach (Arr::except($sel, self::KOLOM_IDENTITAS) as $isi) {
            if (! $isi['kosong']) {
                return false;
            }
        }

        return true;
    }

    /** @return array<string, mixed> data soal yang siap disimpan (hanya valid jika tidak ada error) */
    private function periksaBaris(array $sel, callable $tambahError, array $subtes, array $batas, array &$kodeDipakai, int $baris): array
    {
        $nilai = [];
        foreach ($sel as $kunci => $isi) {
            if ($isi['masalah']) {
                $tambahError($kunci, $isi['masalah']);
            }
            $nilai[$kunci] = $isi['nilai'];
        }

        $wajib = function (string $kunci) use ($sel, $nilai, $tambahError): bool {
            if ($nilai[$kunci] === null) {
                if (! $sel[$kunci]['masalah']) {
                    $tambahError($kunci, 'Wajib diisi.');
                }

                return false;
            }

            return true;
        };

        // Nama Subtes
        $kodeSubtes = null;
        if ($wajib('nama_subtes')) {
            if (isset($subtes[$nilai['nama_subtes']])) {
                $kodeSubtes = $nilai['nama_subtes'];
            } else {
                $tambahError('nama_subtes', "Kode subtes \"{$nilai['nama_subtes']}\" tidak dikenal. Pilihan: ".implode(', ', array_keys($subtes)).'.');
            }
        }

        // Kode Soal
        $kodeSoal = $nilai['kode_soal'];
        if ($wajib('kode_soal')) {
            if (! preg_match('/^([A-Z]+)-\d{3,}$/', $kodeSoal, $cocok)) {
                $tambahError('kode_soal', "\"{$kodeSoal}\" tidak sesuai format <kode subtes>-<3 digit>, contoh PK-001.");
            } elseif ($kodeSubtes && $cocok[1] !== $kodeSubtes) {
                $tambahError('kode_soal', "Awalan \"{$cocok[1]}\" tidak sesuai Nama Subtes \"{$kodeSubtes}\".");
            }

            if ($batas['soal.kode_soal'] && mb_strlen($kodeSoal) > $batas['soal.kode_soal']) {
                $tambahError('kode_soal', "Lebih dari {$batas['soal.kode_soal']} karakter.");
            }

            if (isset($kodeDipakai[$kodeSoal])) {
                $tambahError('kode_soal', "{$kodeSoal} sudah dipakai di baris {$kodeDipakai[$kodeSoal]}.");
            } else {
                $kodeDipakai[$kodeSoal] = $baris;
            }
        }

        // Tipe Soal
        $tipe = null;
        if ($wajib('tipe')) {
            $label = preg_replace('/\s+/u', ' ', mb_strtolower($nilai['tipe']));
            $tipe = array_change_key_case(self::TIPE_SOAL)[$label] ?? null;

            if (! $tipe) {
                $tambahError('tipe', "\"{$nilai['tipe']}\" tidak dikenal. Pilihan: ".implode(', ', array_keys(self::TIPE_SOAL)).'.');
            }
        }

        $wajib('teks_soal');
        $wajib('pembahasan');

        // Tingkat Kesulitan
        $kesulitan = null;
        if ($wajib('tingkat_kesulitan')) {
            $kesulitan = mb_strtolower($nilai['tingkat_kesulitan']);

            if (! in_array($kesulitan, self::TINGKAT_KESULITAN, true)) {
                $tambahError('tingkat_kesulitan', "\"{$nilai['tingkat_kesulitan']}\" tidak dikenal. Pilihan: Mudah, Sedang, Sulit.");
            }
        }

        $this->periksaGambar($nilai['gambar_soal'], 'gambar_soal', $batas['soal.gambar_soal'], $tambahError);

        foreach (self::KOLOM_TEKS_MATEMATIKA as $kunci) {
            $this->periksaTandaDolar($nilai[$kunci], $kunci, $tambahError);
        }

        // Opsi A–E
        $opsi = [];
        foreach (self::LABEL_OPSI as $i => $label) {
            $huruf = strtolower($label);
            $teks = $nilai["opsi_{$huruf}_teks"];
            $gambar = $nilai["opsi_{$huruf}_gambar"];

            $this->periksaTandaDolar($teks, "opsi_{$huruf}_teks", $tambahError);
            $this->periksaGambar($gambar, "opsi_{$huruf}_gambar", $batas['opsi_jawaban.gambar_opsi'], $tambahError);

            $opsi[$label] = [
                'label' => $label,
                'teks_opsi' => $teks ?? '',
                'gambar_opsi' => $gambar,
                'is_kunci' => false,
                'urutan' => $i + 1,
                'terisi' => $teks !== null || $gambar !== null
                    || $sel["opsi_{$huruf}_teks"]['masalah'] || $sel["opsi_{$huruf}_gambar"]['masalah'],
            ];
        }

        $kunciJawaban = $tipe ? $this->periksaKunci($tipe, $nilai['kunci'], $sel['kunci']['masalah'] !== null, $opsi, $tambahError) : null;

        return [
            'kode_soal' => $kodeSoal,
            'kode_subtes' => $kodeSubtes,
            'subtes_id' => $kodeSubtes ? $subtes[$kodeSubtes] : null,
            'tipe' => $tipe,
            'teks_soal' => $nilai['teks_soal'],
            'gambar_soal' => $nilai['gambar_soal'],
            'kunci_jawaban' => $kunciJawaban,
            'hint' => $nilai['hint'],
            'pembahasan' => $nilai['pembahasan'],
            'tingkat_kesulitan' => $kesulitan,
            'opsi' => array_values(array_map(
                fn ($o) => Arr::except($o, 'terisi'),
                array_filter($opsi, fn ($o) => $o['terisi'])
            )),
        ];
    }

    /**
     * Periksa opsi dan kunci sesuai tipe soal, lalu tandai is_kunci pada $opsi.
     * Mengembalikan nilai kolom soal.kunci_jawaban (hanya terisi untuk isian singkat).
     */
    private function periksaKunci(string $tipe, ?string $kunci, bool $kunciBermasalah, array &$opsi, callable $tambahError): ?string
    {
        $terisi = array_keys(array_filter($opsi, fn ($o) => $o['terisi']));

        if ($tipe === 'isian_singkat') {
            if ($terisi) {
                $tambahError('opsi_'.strtolower($terisi[0]).'_teks', 'Opsi harus kosong untuk tipe isian_singkat.');
            }

            if ($kunci === null) {
                $kunciBermasalah || $tambahError('kunci', 'Wajib diisi dengan jawaban yang benar.');

                return null;
            }

            $jawaban = array_map('trim', explode('|', $kunci));
            if (in_array('', $jawaban, true)) {
                $tambahError('kunci', 'Ada jawaban kosong di antara tanda |.');
            }

            return implode('|', $jawaban);
        }

        $jenis = $tipe === 'benar_salah' ? 'pernyataan' : 'opsi';

        // Opsi harus berurutan dari A tanpa ada yang dilewati.
        $terakhir = $terisi ? end($terisi) : null;
        foreach (self::LABEL_OPSI as $label) {
            if ($label === $terakhir) {
                break;
            }
            if (! $opsi[$label]['terisi']) {
                $tambahError('opsi_'.strtolower($label).'_teks', "Opsi {$label} kosong padahal Opsi {$terakhir} terisi. Isi {$jenis} berurutan dari A.");
            }
        }

        if (count($terisi) < 2) {
            $tambahError('opsi_a_teks', "Minimal 2 {$jenis}.");
        }

        if ($kunci === null) {
            $kunciBermasalah || $tambahError('kunci', 'Wajib diisi.');

            return null;
        }

        if ($tipe === 'pilihan_ganda') {
            $huruf = strtoupper($kunci);

            if (! in_array($huruf, self::LABEL_OPSI, true)) {
                $tambahError('kunci', "\"{$kunci}\" tidak valid. Kunci pilihan_ganda harus 1 huruf A–E, contoh C.");
            } elseif (! $opsi[$huruf]['terisi']) {
                $tambahError('kunci', "Kunci {$huruf} menunjuk opsi yang kosong.");
            } else {
                $opsi[$huruf]['is_kunci'] = true;
            }

            return null;
        }

        // Pilihan Ganda Kompleks: satu B/S per pernyataan yang terisi, berurutan.
        $nilaiKunci = array_map(fn ($k) => strtoupper(trim($k)), explode(',', $kunci));

        if (array_diff($nilaiKunci, ['B', 'S'])) {
            $tambahError('kunci', "\"{$kunci}\" tidak valid. Kunci benar_salah berisi B atau S dipisah koma, contoh B,S,B.");
        } elseif (count($nilaiKunci) !== count($terisi)) {
            $tambahError('kunci', 'Ada '.count($terisi).' pernyataan, tetapi kunci berisi '.count($nilaiKunci)." nilai ({$kunci}).");
        } else {
            foreach ($terisi as $i => $label) {
                $opsi[$label]['is_kunci'] = $nilaiKunci[$i] === 'B';
            }
        }

        return null;
    }

    private function periksaGambar(?string $url, string $kunci, ?int $batas, callable $tambahError): void
    {
        if ($url === null) {
            return;
        }

        if (! str_starts_with($url, 'https://') || ! filter_var($url, FILTER_VALIDATE_URL)) {
            $tambahError($kunci, 'Harus berupa URL lengkap yang diawali https://.');
        } elseif ($batas && mb_strlen($url) > $batas) {
            $tambahError($kunci, 'URL lebih dari '.$batas.' karakter ('.mb_strlen($url).').');
        }
    }

    private function periksaTandaDolar(?string $teks, string $kunci, callable $tambahError): void
    {
        if ($teks !== null && substr_count($teks, '$') % 2 === 1) {
            $tambahError($kunci, 'Tanda $ tidak berpasangan. Tanda $ hanya untuk mengapit rumus, contoh $\\frac{1}{2}$.');
        }
    }

    /** @return array<string, int|null> batas panjang kolom varchar; null berarti tanpa batas */
    private function batasPanjangKolom(): array
    {
        $batas = ['soal.kode_soal' => null, 'soal.gambar_soal' => null, 'opsi_jawaban.gambar_opsi' => null];

        $kolom = DB::select("
            select table_name, column_name, character_maximum_length as panjang
            from information_schema.columns
            where table_schema = 'public'
              and table_name || '.' || column_name in ('soal.kode_soal', 'soal.gambar_soal', 'opsi_jawaban.gambar_opsi')
        ");

        foreach ($kolom as $k) {
            $batas["{$k->table_name}.{$k->column_name}"] = $k->panjang;
        }

        return $batas;
    }
}
