<?php

namespace App\Services;

use App\Models\OpsiJawaban;
use App\Models\Soal;
use App\Models\Subtes;
use App\Models\Topik;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use RuntimeException;

/**
 * Membaca soal dari file Excel sesuai aturan pengisian yang disepakati tim,
 * lalu menyimpannya ke database dengan upsert berdasarkan kode_soal.
 *
 * Setiap soal wajib punya topik. Topik baru didaftarkan di sheet "Topik" pada file yang sama
 * (Nama Subtes, Nama Topik, Urutan, dan opsional Jumlah Soal Simulasi); topik yang sudah ada di database
 * cukup ditulis namanya.
 *
 * Gambar tidak disisipkan di Excel. Editor mengunggahnya dulu ke bucket gambar soal di Supabase Storage,
 * lalu menulis link-nya di kolom gambar. Yang disimpan ke database hanya link itu.
 */
class ImportSoalExcel
{
    public const NAMA_SHEET = 'Soal';

    public const NAMA_SHEET_TOPIK = 'Topik';

    private const PESAN_GAMBAR_SISIPAN = 'Gambar disisipkan langsung di Excel. Unggah gambarnya ke Storage, lalu tulis link-nya di kolom gambar.';

    // Label di kolom Tipe Soal (sama dengan dropdown di Excel) => nilai enum tipe_soal.
    public const TIPE_SOAL = [
        'pilihan_ganda' => 'pilihan_ganda',
        'benar_salah' => 'benar_salah',
        'isian_singkat' => 'isian_singkat',
        'majemuk_tabel' => 'majemuk_tabel',
    ];

    public const TINGKAT_KESULITAN = ['mudah', 'sedang', 'sulit'];

    public const LABEL_OPSI = ['A', 'B', 'C', 'D', 'E'];

    // Kolom ini boleh terisi di baris yang belum berisi soal (mis. diisi sampai bawah sheet).
    private const KOLOM_IDENTITAS = ['nama_subtes', 'topik', 'kode_soal'];

    private const KOLOM_TEKS_MATEMATIKA = ['teks_soal', 'hint', 'pembahasan'];

    // Kolom yang ditambahkan belakangan. File dari template lama tanpa kolom ini tetap diterima; isinya dianggap kosong.
    private const KOLOM_OPSIONAL = ['gambar_pembahasan', 'kolom_tabel'];

    // Bila kolom ini tidak ada di file, isinya di soal yang sudah ada tidak diubah.
    private const KOLOM_DIPERTAHANKAN = ['gambar_pembahasan'];

    // Kolom tabel soal yang diisi dari Excel (selain kode_soal).
    private const KOLOM_SOAL = [
        'subtes_id', 'topik_id', 'tipe', 'teks_soal', 'gambar_soal', 'kunci_jawaban', 'hint', 'pembahasan',
        'gambar_pembahasan', 'kolom_tabel', 'tingkat_kesulitan',
    ];

    public function __construct(
        private PemeriksaLinkGambar $pemeriksaLink,
        private PemeriksaRumus $pemeriksaRumus,
    ) {}

    /**
     * Link gambar ikut diperiksa di sini (diunduh), jadi butuh koneksi internet. Rumus LaTeX diperiksa dengan
     * KaTeX lewat Node.js.
     *
     * @param  int|null  $maksBaris  batas baris soal (upload dari web); lebih dari itu file langsung ditolak
     * @return array{
     *     sheet: string|null,
     *     peringatan: string[],
     *     error: array<int, array{baris: int|null, kolom: string|null, pesan: string}>,
     *     peringatan_baris: array<int, array{baris: int, kolom: string, pesan: string}>,
     *     soal: array<int, array<string, mixed>>,
     *     topik: array<int, array{kode_subtes: string, subtes_id: string, nama_topik: string, urutan: int, jumlah_soal_simulasi?: int|null}>,
     *     dilewati: int,
     *     jumlah_gambar: int,
     *     jumlah_rumus: int,
     *     gambar_belum_ada: string[],
     * }
     */
    public function periksa(string $path, ?int $maksBaris = null): array
    {
        $hasil = [
            'sheet' => null, 'peringatan' => [], 'error' => [], 'peringatan_baris' => [], 'soal' => [], 'topik' => [],
            'dilewati' => 0, 'jumlah_gambar' => 0, 'jumlah_rumus' => 0, 'gambar_belum_ada' => [],
        ];

        // Sel yang hanya berformat tanpa isi tidak dimuat. Template SA diformat sampai ribuan baris; tanpa ini
        // membacanya butuh belasan detik dan hampir 100 MB memori. Sel berisi nilai, rumus, atau gambar tetap dibaca.
        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadEmptyCells(false);
        $spreadsheet = $reader->load($path);
        [$sheet, $kolom] = $this->pilihSheet($spreadsheet->getAllSheets(), $hasil);

        if (! $sheet) {
            return $hasil;
        }

        $hasil['sheet'] = $sheet->getTitle();
        $this->periksaGambarSisipan($sheet, $kolom, $hasil);
        $subtes = Subtes::pluck('id', 'kode_subtes')->all();
        // Topik yang dikenal: yang sudah ada di database ditambah isi sheet Topik di file ini.
        $hasil['topik'] = $this->periksaSheetTopik($spreadsheet, $subtes, $hasil);
        $this->periksaProporsiSimulasi($hasil['topik'], $hasil);
        $topik = $this->petaTopik($subtes, $hasil['topik']);
        $soalLama = Soal::pluck('id', 'kode_soal')->all();
        $batas = $this->batasPanjangKolom();
        $kodeDipakai = [];
        // Link gambar dan rumus => baris dan kolom yang memakainya; diperiksa sekaligus setelah semua baris dibaca.
        $tautan = [];
        $rumusDipakai = [];
        $kosongBeruntun = 0;
        $jumlahBaris = 0;
        $opsionalHilang = array_diff(self::KOLOM_OPSIONAL, array_keys($kolom));

        for ($baris = 2; $baris <= $sheet->getHighestDataRow(); $baris++) {
            $sel = array_fill_keys($opsionalHilang, ['nilai' => null, 'masalah' => null, 'kosong' => true]);
            foreach ($kolom as $kunci => $info) {
                $sel[$kunci] = $this->bacaSel($sheet, $info['huruf'].$baris);
            }

            if ($this->barisKosong($sel)) {
                $hasil['dilewati']++;
                $kosongBeruntun++;

                continue;
            }

            $kosongBeruntun = 0;

            // File yang terlalu besar ditolak tanpa memeriksa sisanya.
            if ($maksBaris !== null && ++$jumlahBaris > $maksBaris) {
                $hasil['error'][] = ['baris' => $baris, 'kolom' => null,
                    'pesan' => "File berisi lebih dari {$maksBaris} baris soal. Bagi soalnya ke beberapa file."];
                $hasil['soal'] = [];

                return $hasil;
            }

            $errorBaris = [];
            $tambahError = function (string $kunci, string $pesan) use (&$errorBaris, $baris, $kolom) {
                $errorBaris[] = ['baris' => $baris, 'kolom' => $kolom[$kunci]['nama'], 'pesan' => $pesan];
            };

            $soal = Arr::except(
                $this->periksaBaris($sel, $tambahError, $subtes, $topik, $batas, $kodeDipakai, $baris),
                array_intersect($opsionalHilang, self::KOLOM_DIPERTAHANKAN),
            );

            foreach ($this->linkGambar($soal) as $kunci => $url) {
                $tautan[$url][] = ['baris' => $baris, 'kolom' => $kolom[$kunci]['nama']];

                if ($pesan = self::masalahLokasiGambar($url, $soal['kode_subtes'], $soal['kode_soal'])) {
                    $tambahError($kunci, $pesan);
                }
            }

            foreach ($this->kolomRumus() as $kunci) {
                foreach (TeksMatematika::rumus((string) $sel[$kunci]['nilai']) as $rumus) {
                    $rumusDipakai[$rumus][] = ['baris' => $baris, 'kolom' => $kolom[$kunci]['nama']];

                    if (TeksMatematika::miripDolarBiasa($rumus)) {
                        $hasil['peringatan_baris'][] = ['baris' => $baris, 'kolom' => $kolom[$kunci]['nama'],
                            'pesan' => "Rumus \"\${$rumus}\$\" diakhiri spasi. Kalau maksudnya tanda dolar biasa (mis. harga), tulis \\$."];
                    }
                }
            }

            if ($errorBaris) {
                array_push($hasil['error'], ...$errorBaris);
            } else {
                $soal['baris'] = $baris;
                $soal['sudah_ada'] = isset($soalLama[$soal['kode_soal']]);
                $hasil['soal'][] = $soal;
            }
        }

        // Baris kosong di ujung sheet (mis. baris template yang sudah diformat Text) bukan baris yang dilewati.
        $hasil['dilewati'] -= $kosongBeruntun;

        $this->periksaRumus($rumusDipakai, $hasil);
        $this->periksaLink($tautan, $hasil);

        // Error dari luar periksaBaris() (gambar mengambang, link bermasalah) juga membuat barisnya tidak valid.
        $barisError = array_flip(array_filter(array_column($hasil['error'], 'baris')));
        $hasil['soal'] = array_values(array_filter($hasil['soal'], fn ($s) => ! isset($barisError[$s['baris']])));

        return $hasil;
    }

    /**
     * Periksa satu soal dari formulir halaman editor dengan aturan yang sama seperti satu baris Excel, termasuk
     * rumus (KaTeX) dan link gambar. Kode soal yang sudah ada berarti soal itu yang diperbarui.
     *
     * @param  array<string, string|null>  $nilai  kunci kolom (lihat daftarHeader()) => isi; yang tidak ada dianggap kosong
     * @return array{soal: array<string, mixed>|null, error: array<string, string[]>} error per kunci kolom ('' = umum)
     */
    public function periksaSatu(array $nilai): array
    {
        $sel = [];
        foreach (array_keys($this->daftarHeader()) as $kunci) {
            $isi = trim(str_replace(["\r\n", "\r"], "\n", (string) ($nilai[$kunci] ?? '')));
            $sel[$kunci] = ['nilai' => $isi === '' ? null : $isi, 'masalah' => null, 'kosong' => $isi === ''];
        }

        $error = [];
        $tambahError = function (string $kunci, string $pesan) use (&$error) {
            $error[$kunci][] = $pesan;
        };

        $subtes = Subtes::pluck('id', 'kode_subtes')->all();
        $kodeDipakai = [];
        $soal = $this->periksaBaris($sel, $tambahError, $subtes, $this->petaTopik($subtes, []), $this->batasPanjangKolom(), $kodeDipakai, 1);

        // Rumus dan link diperiksa seperti di periksa(); kolomnya diisi kunci internal, bukan judul kolom Excel.
        $tautan = [];
        foreach ($this->linkGambar($soal) as $kunci => $url) {
            $tautan[$url][] = ['baris' => 1, 'kolom' => $kunci];

            if ($pesan = self::masalahLokasiGambar($url, $soal['kode_subtes'], $soal['kode_soal'])) {
                $tambahError($kunci, $pesan);
            }
        }

        $rumusDipakai = [];
        foreach ($this->kolomRumus() as $kunci) {
            foreach (TeksMatematika::rumus((string) $sel[$kunci]['nilai']) as $rumus) {
                $rumusDipakai[$rumus][] = ['baris' => 1, 'kolom' => $kunci];
            }
        }

        $hasil = ['error' => [], 'jumlah_gambar' => 0, 'jumlah_rumus' => 0, 'gambar_belum_ada' => []];
        $this->periksaRumus($rumusDipakai, $hasil);
        $this->periksaLink($tautan, $hasil);

        foreach ($hasil['error'] as $e) {
            $tambahError($e['kolom'] ?? '', $e['pesan']);
        }

        return ['soal' => $error ? null : $soal, 'error' => $error];
    }

    /**
     * Simpan topik dan soal hasil periksa() dalam satu transaksi. Soal dengan kode yang sudah ada diperbarui.
     * Tanpa $status, soal baru berstatus draft (default kolom) dan status soal yang sudah ada tidak diubah.
     *
     * @param  string|null  $status  status untuk semua soal di $soalList (draft/published)
     * @param  string|null  $editorId  pembuat soal baru (admin_editor.user_id); soal yang sudah ada tidak diubah
     * @param  bool  $hanyaBaru  tolak bila ada kode yang sudah dipakai (soal baru dari formulir), bukan memperbaruinya
     * @return array{baru: int, diperbarui: int, topik_baru: int, topik_diperbarui: int}
     */
    public function simpan(array $soalList, array $topikList = [], ?string $status = null, ?string $editorId = null, bool $hanyaBaru = false): array
    {
        // Query dibuat sesedikit mungkin: database ada di server jauh, jadi tiap query terasa.
        return DB::transaction(function () use ($soalList, $topikList, $status, $editorId, $hanyaBaru) {
            [$idTopik, $jumlahTopik] = $this->simpanTopik($topikList);

            $soalLama = Soal::whereIn('kode_soal', array_column($soalList, 'kode_soal'))->get()->keyBy('kode_soal');

            // Kode yang dipakai transaksi lain sesudah query ini tetap ditolak oleh unique index kode_soal.
            if ($hanyaBaru && $soalLama->isNotEmpty()) {
                throw new RuntimeException('Kode '.$soalLama->keys()->implode(', ').' sudah dipakai soal lain. Muat ulang halaman untuk mendapat kode baru.');
            }
            $opsiLama = OpsiJawaban::whereIn('soal_id', $soalLama->pluck('id'))->get()->groupBy('soal_id');

            $jumlah = ['baru' => 0, 'diperbarui' => 0] + $jumlahTopik;
            $soalBaru = [];
            $opsiBaru = [];
            $opsiHapus = [];

            foreach ($soalList as $data) {
                $data['topik_id'] = $idTopik[$data['subtes_id'].'|'.mb_strtolower($data['nama_topik'])];
                $atribut = Arr::only($data, self::KOLOM_SOAL) + ($status === null ? [] : ['status' => $status]);
                $soal = $soalLama->get($data['kode_soal']);

                if (! $soal) {
                    $soalId = (string) Str::orderedUuid();
                    // Insert massal melewati cast Eloquent, jadi kolom jsonb ditulis sebagai JSON.
                    $kolomTabel = isset($atribut['kolom_tabel']) ? json_encode($atribut['kolom_tabel'], JSON_UNESCAPED_UNICODE) : null;
                    $soalBaru[] = ['kolom_tabel' => $kolomTabel] + $atribut
                        + ['id' => $soalId, 'kode_soal' => $data['kode_soal'], 'editor_id' => $editorId];

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

                // Soal dari formulir web tidak punya nomor baris.
                foreach ($lama as $label => $o) {
                    $opsiHapus[$o->id] = "{$soal->kode_soal} opsi {$label}".(isset($data['baris']) ? " (baris {$data['baris']})" : '');
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
     * Topik yang soal mudahnya kurang dari satu jendela penilaian. Siswa tahap 1 hanya diberi soal mudah
     * dan jendela menghitung satu jawaban per soal, jadi skor mereka di topik ini tidak akan pernah terhitung.
     *
     * @return array<int, array{kode_subtes: string, nama_topik: string, mudah: int}>
     */
    public function topikKurangSoalMudah(): array
    {
        $baris = DB::select(<<<'SQL'
            select s.kode_subtes, t.nama_topik, count(q.id) filter (where q.tingkat_kesulitan = 'mudah') as mudah
            from topik t
            join subtes s on s.id = t.subtes_id
            left join soal q on q.topik_id = t.id
            group by s.kode_subtes, s.urutan, t.nama_topik, t.urutan
            having count(q.id) filter (where q.tingkat_kesulitan = 'mudah') < ?
            order by s.urutan, t.urutan
            SQL, [Penguasaan::JENDELA]);

        return array_map(fn ($b) => ['kode_subtes' => $b->kode_subtes, 'nama_topik' => $b->nama_topik, 'mudah' => (int) $b->mudah], $baris);
    }

    /**
     * Upload dari halaman Bank Soal satu subtes: soal dan topik subtes lain dijadikan error, supaya tidak ikut
     * tersimpan tanpa disadari editor.
     *
     * @param  array<string, mixed>  $hasil  hasil periksa()
     * @return array<string, mixed>
     */
    public static function batasiSubtes(array $hasil, string $kodeSubtes): array
    {
        $soal = [];
        foreach ($hasil['soal'] as $s) {
            if ($s['kode_subtes'] === $kodeSubtes) {
                $soal[] = $s;
            } else {
                $hasil['error'][] = ['baris' => $s['baris'], 'kolom' => 'Nama Subtes',
                    'pesan' => "Soal {$s['kode_subtes']} tidak bisa diunggah dari Bank Soal {$kodeSubtes}. Unggah dari halaman Bank Soal {$s['kode_subtes']}."];
            }
        }

        foreach ($hasil['topik'] as $t) {
            if ($t['kode_subtes'] !== $kodeSubtes) {
                $hasil['error'][] = ['baris' => null, 'kolom' => 'Sheet '.self::NAMA_SHEET_TOPIK,
                    'pesan' => "Topik \"{$t['nama_topik']}\" milik {$t['kode_subtes']} tidak bisa didaftarkan dari Bank Soal {$kodeSubtes}."];
            }
        }

        $hasil['soal'] = $soal;
        $hasil['topik'] = array_values(array_filter($hasil['topik'], fn ($t) => $t['kode_subtes'] === $kodeSubtes));

        return $hasil;
    }

    /**
     * Kelompokkan error atau peringatan yang sama agar laporan tetap ringkas, mis. "Wajib diisi" di baris 3–40.
     * Dipakai laporan edvora:import-soal dan hasil upload di halaman Bank Soal.
     *
     * @param  array<int, array{baris: int|null, kolom: string|null, pesan: string}>  $daftar
     * @return array<int, array{baris: string, kolom: string, pesan: string}> urut baris pertama; '-' bila tanpa baris/kolom
     */
    public static function kelompokkanMasalah(array $daftar): array
    {
        return collect($daftar)
            ->groupBy(fn ($e) => $e['kolom']."\0".$e['pesan'])
            ->map(fn ($grup) => [
                'baris' => self::rentangBaris($grup->pluck('baris')->filter()->all()) ?: '-',
                'kolom' => $grup[0]['kolom'] ?? '-',
                'pesan' => $grup[0]['pesan'],
                'urut' => $grup->min('baris') ?? 0,
            ])
            ->sortBy('urut')
            ->map(fn ($e) => Arr::except($e, 'urut'))
            ->values()
            ->all();
    }

    // [3, 4, 5, 9] => "3–5, 9"
    private static function rentangBaris(array $baris): string
    {
        sort($baris);
        $rentang = [];

        foreach ($baris as $b) {
            $akhir = array_key_last($rentang);

            if ($akhir !== null && $rentang[$akhir][1] === $b - 1) {
                $rentang[$akhir][1] = $b;
            } elseif ($akhir === null || $rentang[$akhir][1] !== $b) {
                $rentang[] = [$b, $b];
            }
        }

        return implode(', ', array_map(fn ($r) => $r[0] === $r[1] ? $r[0] : "{$r[0]}–{$r[1]}", $rentang));
    }

    /**
     * Topik dari sheet Topik: yang baru disisipkan, yang sudah ada diperbarui nama, urutan, dan jumlah soal
     * simulasinya (bila kolomnya ada).
     * Hasilnya peta "subtes_id|nama topik huruf kecil" => id topik (semua topik), beserta jumlahnya.
     *
     * @return array{0: array<string, string>, 1: array{topik_baru: int, topik_diperbarui: int}}
     */
    private function simpanTopik(array $topikList): array
    {
        $peta = [];
        foreach (Topik::all() as $t) {
            $peta[$t->subtes_id.'|'.mb_strtolower($t->nama_topik)] = $t;
        }

        $jumlah = ['topik_baru' => 0, 'topik_diperbarui' => 0];
        $baru = [];

        foreach ($topikList as $t) {
            $kunci = $t['subtes_id'].'|'.mb_strtolower($t['nama_topik']);
            $ada = $peta[$kunci] ?? null;

            if ($ada instanceof Topik) {
                $ubah = ['nama_topik' => $t['nama_topik'], 'urutan' => $t['urutan']];
                // Tanpa kolom Jumlah Soal Simulasi di sheet, nilai yang tersimpan tidak diubah.
                if (array_key_exists('jumlah_soal_simulasi', $t)) {
                    $ubah['jumlah_soal_simulasi'] = $t['jumlah_soal_simulasi'];
                }

                $ada->fill($ubah);
                if ($ada->isDirty()) {
                    $ada->save();
                    $jumlah['topik_diperbarui']++;
                }

                continue;
            }

            $id = (string) Str::orderedUuid();
            $baru[] = [
                'id' => $id,
                'subtes_id' => $t['subtes_id'],
                'nama_topik' => $t['nama_topik'],
                'urutan' => $t['urutan'],
                'jumlah_soal_simulasi' => $t['jumlah_soal_simulasi'] ?? null,
            ];
            $peta[$kunci] = $id;
            $jumlah['topik_baru']++;
        }

        if ($baru) {
            DB::table('topik')->insert($baru);
        }

        return [array_map(fn ($t) => $t instanceof Topik ? $t->id : $t, $peta), $jumlah];
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
     * Baca sheet "Topik" (Nama Subtes, Nama Topik, Urutan, dan opsional Jumlah Soal Simulasi). Sheet ini boleh
     * tidak ada bila semua topik yang dipakai soal sudah ada di database.
     *
     * @return array<int, array{kode_subtes: string, subtes_id: string, nama_topik: string, urutan: int, jumlah_soal_simulasi?: int|null}>
     */
    private function periksaSheetTopik(Spreadsheet $spreadsheet, array $subtes, array &$hasil): array
    {
        $sheet = $spreadsheet->getSheetByName(self::NAMA_SHEET_TOPIK);

        if (! $sheet) {
            return [];
        }

        $daftar = ['nama_subtes' => 'nama subtes', 'nama_topik' => 'nama topik', 'urutan' => 'urutan'];
        ['kolom' => $kolom, 'hilang' => $hilang] = $this->petakanHeader($sheet, $daftar);

        foreach ($hilang as $header) {
            $hasil['error'][] = ['baris' => 1, 'kolom' => 'Sheet '.self::NAMA_SHEET_TOPIK, 'pesan' => "Header \"{$header}\" tidak ditemukan."];
        }

        if ($hilang) {
            return [];
        }

        // Kolom opsional: tanpa kolom ini, jumlah soal simulasi topik yang sudah ada tidak diubah.
        $opsional = $this->petakanHeader($sheet, ['jumlah_soal_simulasi' => 'jumlah soal simulasi'])['kolom'];
        $kolom += $opsional;
        $adaKolomSimulasi = $opsional !== [];

        $topik = [];
        $dipakai = [];

        for ($baris = 2; $baris <= $sheet->getHighestDataRow(); $baris++) {
            $sel = [];
            foreach ($kolom as $kunci => $info) {
                $sel[$kunci] = $this->bacaSel($sheet, $info['huruf'].$baris);
            }

            if (! array_filter($sel, fn ($isi) => ! $isi['kosong'])) {
                continue;
            }

            $galat = [];
            $tambahError = function (string $kunci, string $pesan) use (&$galat, $baris, $kolom) {
                $galat[] = ['baris' => $baris, 'kolom' => $kolom[$kunci]['nama'].' (sheet '.self::NAMA_SHEET_TOPIK.')', 'pesan' => $pesan];
            };

            foreach ($sel as $kunci => $isi) {
                if ($isi['masalah']) {
                    $tambahError($kunci, $isi['masalah']);
                } elseif ($isi['nilai'] === null && $kunci !== 'jumlah_soal_simulasi') {
                    $tambahError($kunci, 'Wajib diisi.');
                }
            }

            $kodeSubtes = $sel['nama_subtes']['nilai'];
            $nama = $sel['nama_topik']['nilai'];
            $urutan = $sel['urutan']['nilai'];

            if ($kodeSubtes !== null && ! isset($subtes[$kodeSubtes])) {
                $tambahError('nama_subtes', "Kode subtes \"{$kodeSubtes}\" tidak dikenal. Pilihan: ".implode(', ', array_keys($subtes)).'.');
            }

            if ($urutan !== null && ! ctype_digit($urutan)) {
                $tambahError('urutan', "\"{$urutan}\" bukan bilangan bulat positif.");
            }

            $jumlahSimulasi = $sel['jumlah_soal_simulasi']['nilai'] ?? null;
            if ($jumlahSimulasi !== null && (! ctype_digit($jumlahSimulasi) || (int) $jumlahSimulasi === 0)) {
                $tambahError('jumlah_soal_simulasi', "\"{$jumlahSimulasi}\" bukan bilangan bulat positif.");
            }

            if ($kodeSubtes !== null && $nama !== null) {
                $kunciTopik = $kodeSubtes.'|'.mb_strtolower($nama);
                if (isset($dipakai[$kunciTopik])) {
                    $tambahError('nama_topik', "Topik \"{$nama}\" untuk {$kodeSubtes} sudah ada di baris {$dipakai[$kunciTopik]}.");
                }
                $dipakai[$kunciTopik] ??= $baris;
            }

            if ($galat) {
                array_push($hasil['error'], ...$galat);

                continue;
            }

            $baru = ['kode_subtes' => $kodeSubtes, 'subtes_id' => $subtes[$kodeSubtes], 'nama_topik' => $nama, 'urutan' => (int) $urutan];
            if ($adaKolomSimulasi) {
                $baru['jumlah_soal_simulasi'] = $jumlahSimulasi === null ? null : (int) $jumlahSimulasi;
            }
            $topik[] = $baru;
        }

        return $topik;
    }

    /**
     * Peringatan bila jumlah soal simulasi topik suatu subtes (isi database ditimpa isi sheet Topik) belum lengkap
     * atau totalnya tidak sama dengan jumlah soal simulasi subtes. Simulasi subtes itu lalu memakai pembagian rata
     * (PemilihSoal::simulasi()). Subtes yang belum satu pun topiknya diisi tidak diperingatkan.
     */
    private function periksaProporsiSimulasi(array $topikSheet, array &$hasil): void
    {
        $nilai = [];
        foreach (Topik::get(['subtes_id', 'nama_topik', 'jumlah_soal_simulasi']) as $t) {
            $nilai[$t->subtes_id][mb_strtolower($t->nama_topik)] = $t->jumlah_soal_simulasi;
        }

        foreach ($topikSheet as $t) {
            $kunci = mb_strtolower($t['nama_topik']);
            if (array_key_exists('jumlah_soal_simulasi', $t)) {
                $nilai[$t['subtes_id']][$kunci] = $t['jumlah_soal_simulasi'];
            } else {
                $nilai[$t['subtes_id']][$kunci] ??= null;
            }
        }

        foreach (Subtes::orderBy('urutan')->get(['id', 'kode_subtes', 'jumlah_soal']) as $s) {
            $kuota = $nilai[$s->id] ?? [];
            if (array_filter($kuota, fn ($n) => $n !== null) === [] || PemilihSoal::kuotaLengkap($kuota, (int) $s->jumlah_soal)) {
                continue;
            }

            $hasil['peringatan'][] = "Jumlah soal simulasi topik {$s->kode_subtes} belum lengkap atau totalnya bukan {$s->jumlah_soal}; "
                ."simulasi {$s->kode_subtes} memakai pembagian rata.";
        }
    }

    /**
     * Topik yang boleh dipakai soal: yang sudah ada di database ditambah isi sheet Topik.
     *
     * @return array<string, array<string, string>> kode subtes => [nama topik huruf kecil => nama topik]
     */
    private function petaTopik(array $subtes, array $dariSheet): array
    {
        $kodeSubtes = array_flip($subtes);
        $peta = [];

        foreach (Topik::orderBy('urutan')->get(['subtes_id', 'nama_topik']) as $t) {
            if (isset($kodeSubtes[$t->subtes_id])) {
                $peta[$kodeSubtes[$t->subtes_id]][mb_strtolower($t->nama_topik)] = $t->nama_topik;
            }
        }

        foreach ($dariSheet as $t) {
            $peta[$t['kode_subtes']][mb_strtolower($t['nama_topik'])] = $t['nama_topik'];
        }

        return $peta;
    }

    /**
     * Petakan header baris 1 ke huruf kolom. Tanpa $daftar, yang dipakai adalah header sheet Soal.
     *
     * @param  array<string, string>|null  $daftar  kunci internal => header yang sudah dinormalisasi
     * @return array{kolom: array<string, array{huruf: string, nama: string}>, hilang: string[]}
     */
    private function petakanHeader(Worksheet $sheet, ?array $daftar = null): array
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
        foreach ($daftar ?? $this->daftarHeader() as $kunci => $header) {
            if (isset($ditemukan[$header])) {
                $kolom[$kunci] = $ditemukan[$header];
            } elseif ($daftar !== null || ! in_array($kunci, self::KOLOM_OPSIONAL, true)) {
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
            'topik' => 'topik',
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
            'kolom_tabel' => 'kolom tabel',
            'kunci' => 'kunci jawaban',
            'hint' => 'hint',
            'pembahasan' => 'pembahasan',
            'gambar_pembahasan' => 'gambar pembahasan',
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

        // Gambar "Place in Cell": nilai selnya objek gambar, bukan teks.
        if ($sel->getDataType() === DataType::TYPE_DRAWING_IN_CELL) {
            return ['nilai' => null, 'masalah' => self::PESAN_GAMBAR_SISIPAN, 'kosong' => false];
        }

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
    private function periksaBaris(array $sel, callable $tambahError, array $subtes, array $topik, array $batas, array &$kodeDipakai, int $baris): array
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

        // Topik, dicocokkan tanpa membedakan huruf besar/kecil
        $namaTopik = null;
        if ($wajib('topik') && $kodeSubtes) {
            $pilihan = $topik[$kodeSubtes] ?? [];
            $namaTopik = $pilihan[mb_strtolower($nilai['topik'])] ?? null;

            if ($namaTopik === null) {
                $tambahError('topik', $pilihan
                    ? "Topik \"{$nilai['topik']}\" tidak dikenal untuk {$kodeSubtes}. Pilihan: ".implode(', ', $pilihan).'.'
                    : "Belum ada topik untuk {$kodeSubtes}. Tambahkan dulu di sheet \"".self::NAMA_SHEET_TOPIK.'".');
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

        $gambarSoal = $this->periksaGambar($nilai['gambar_soal'], 'gambar_soal', $batas['soal.gambar_soal'], $tambahError);
        $gambarPembahasan = $this->periksaGambar(
            $nilai['gambar_pembahasan'], 'gambar_pembahasan', $batas['soal.gambar_pembahasan'], $tambahError,
        );

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

            $opsi[$label] = [
                'label' => $label,
                'teks_opsi' => $teks ?? '',
                'gambar_opsi' => $this->periksaGambar($gambar, "opsi_{$huruf}_gambar", $batas['opsi_jawaban.gambar_opsi'], $tambahError),
                'is_kunci' => false,
                'kunci_kolom' => null,
                'urutan' => $i + 1,
                'terisi' => $teks !== null || $gambar !== null
                    || $sel["opsi_{$huruf}_teks"]['masalah'] || $sel["opsi_{$huruf}_gambar"]['masalah'],
            ];
        }

        // Kolom Tabel hanya untuk majemuk_tabel; kosong berarti Benar|Salah.
        $kolomTabel = null;
        if ($tipe === 'majemuk_tabel') {
            $kolomTabel = MajemukTabel::kolom($nilai['kolom_tabel']);

            if ($pesan = MajemukTabel::masalahKolom($kolomTabel)) {
                $tambahError('kolom_tabel', $pesan);
                $kolomTabel = null;
            }
        } elseif ($tipe !== null && $nilai['kolom_tabel'] !== null) {
            $tambahError('kolom_tabel', 'Kolom Tabel hanya diisi untuk tipe majemuk_tabel.');
        }

        $kunciJawaban = $tipe ? $this->periksaKunci($tipe, $nilai['kunci'], $sel['kunci']['masalah'] !== null, $opsi, $tambahError, $kolomTabel) : null;

        return [
            'kode_soal' => $kodeSoal,
            'kode_subtes' => $kodeSubtes,
            'subtes_id' => $kodeSubtes ? $subtes[$kodeSubtes] : null,
            'nama_topik' => $namaTopik,
            'tipe' => $tipe,
            'teks_soal' => $nilai['teks_soal'],
            'gambar_soal' => $gambarSoal,
            'kunci_jawaban' => $kunciJawaban,
            'hint' => $nilai['hint'],
            'pembahasan' => $nilai['pembahasan'],
            'gambar_pembahasan' => $gambarPembahasan,
            'kolom_tabel' => $kolomTabel,
            'tingkat_kesulitan' => $kesulitan,
            'opsi' => array_values(array_map(
                fn ($o) => Arr::except($o, 'terisi'),
                array_filter($opsi, fn ($o) => $o['terisi'])
            )),
        ];
    }

    /**
     * Periksa opsi dan kunci sesuai tipe soal, lalu tandai is_kunci (majemuk_tabel: kunci_kolom) pada $opsi.
     * Mengembalikan nilai kolom soal.kunci_jawaban (hanya terisi untuk isian singkat).
     *
     * @param  string[]|null  $kolomTabel  judul kolom soal majemuk_tabel; null bila Kolom Tabel bermasalah
     */
    private function periksaKunci(string $tipe, ?string $kunci, bool $kunciBermasalah, array &$opsi, callable $tambahError, ?array $kolomTabel = null): ?string
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

        $jenis = $tipe === 'pilihan_ganda' ? 'opsi' : 'pernyataan';

        // Opsi harus berurutan dari A tanpa ada yang dilewati. Tanpa opsi sama sekali cukup pesan "Minimal 2" di bawah.
        $terakhir = $terisi ? end($terisi) : null;
        foreach ($terakhir === null ? [] : self::LABEL_OPSI as $label) {
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

        // Majemuk tabel: satu kolom per pernyataan yang terisi, berurutan (huruf awal judul kolom atau nomornya).
        if ($tipe === 'majemuk_tabel') {
            // Kolom Tabel yang bermasalah sudah dilaporkan; kunci baru bisa dibaca setelah kolomnya benar.
            if ($kolomTabel === null) {
                return null;
            }

            [$nomor, $pesan] = MajemukTabel::kunci($kunci, $kolomTabel);

            if ($pesan) {
                $tambahError('kunci', $pesan);
            } elseif (count($nomor) !== count($terisi)) {
                $tambahError('kunci', 'Ada '.count($terisi).' pernyataan, tetapi kunci berisi '.count($nomor)." nilai ({$kunci}).");
            } else {
                foreach ($terisi as $i => $label) {
                    $opsi[$label]['kunci_kolom'] = $nomor[$i];
                }
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

    /**
     * Ubah isi sel gambar menjadi link lengkap ke bucket gambar soal. Diterima link lengkap (diawali
     * GAMBAR_SOAL_URL) atau bagian sesudahnya, mis. PK/PK-034.png. Isi file-nya diperiksa di periksaLink().
     *
     * @return string|null link lengkap, atau null bila sel kosong atau isinya ditolak
     */
    private function periksaGambar(?string $isi, string $kunci, ?int $batas, callable $tambahError): ?string
    {
        if ($isi === null) {
            return null;
        }

        $dasar = rtrim((string) config('services.supabase.url_gambar_soal'), '/');

        if ($dasar === '') {
            $tambahError($kunci, 'GAMBAR_SOAL_URL belum diisi di .env, jadi link gambar belum bisa diperiksa.');

            return null;
        }

        if (preg_match('#^https?://#i', $isi)) {
            if (preg_match('#^https?://(drive|docs)\.google\.com/#i', $isi)) {
                $tambahError($kunci, 'Link Google Drive tidak bisa ditampilkan sebagai gambar. Unggah gambarnya ke Storage, lalu pakai link dari sana.');

                return null;
            }

            if (! str_starts_with($isi, $dasar.'/')) {
                $tambahError($kunci, "Link harus ke Storage gambar soal ({$dasar}/...). Gambar dari situs lain tidak diterima.");

                return null;
            }

            $jalur = substr($isi, strlen($dasar) + 1);
        } else {
            $jalur = ltrim($isi, '/');
        }

        if (! preg_match('#^[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*\.(png|jpe?g|webp)$#i', $jalur)) {
            $tambahError($kunci, "\"{$jalur}\" tidak sesuai aturan nama: folder dan file hanya berisi huruf, angka, - dan _, diakhiri .png, .jpg, atau .webp. Contoh: PK/PK-034.png.");

            return null;
        }

        $url = $dasar.'/'.$jalur;

        if ($batas && mb_strlen($url) > $batas) {
            $tambahError($kunci, 'Link lebih dari '.$batas.' karakter ('.mb_strlen($url).').');

            return null;
        }

        return $url;
    }

    /**
     * Gambar mengambang (Place over Cells) di sheet Soal ditolak, karena gambar soal ditulis sebagai link.
     * Baris 1 (header) diabaikan. Gambar "Place in Cell" ditolak lewat bacaSel().
     */
    private function periksaGambarSisipan(Worksheet $sheet, array $kolom, array &$hasil): void
    {
        $namaKolom = array_column($kolom, 'nama', 'huruf');

        foreach ($sheet->getDrawingCollection() as $gambar) {
            [$huruf, $baris] = Coordinate::coordinateFromString($gambar->getCoordinates());

            if ((int) $baris > 1) {
                $hasil['error'][] = ['baris' => (int) $baris, 'kolom' => $namaKolom[$huruf] ?? "Kolom {$huruf}", 'pesan' => self::PESAN_GAMBAR_SISIPAN];
            }
        }
    }

    /**
     * Unduh setiap link gambar sekali, lalu laporkan masalahnya di semua baris yang memakainya.
     *
     * @param  array<string, array<int, array{baris: int, kolom: string}>>  $tautan
     */
    private function periksaLink(array $tautan, array &$hasil): void
    {
        $hasil['jumlah_gambar'] = count($tautan);

        if (! $tautan) {
            return;
        }

        foreach ($this->pemeriksaLink->periksa(array_keys($tautan)) as $url => $masalah) {
            if ($masalah === null) {
                continue;
            }

            // Gambar yang belum diunggah ditawarkan untuk diunggah dari modal upload Excel.
            if (PemeriksaLinkGambar::belumAda($masalah)) {
                $hasil['gambar_belum_ada'][] = (string) $url;
            }

            foreach ($tautan[$url] as $pakai) {
                $hasil['error'][] = ['baris' => $pakai['baris'], 'kolom' => $pakai['kolom'], 'pesan' => $masalah];
            }
        }
    }

    /**
     * Link gambar yang sudah lolos aturan nama di satu baris soal.
     *
     * @return array<string, string> kunci kolom (gambar_soal, opsi_a_gambar, ..., gambar_pembahasan) => link
     */
    private function linkGambar(array $soal): array
    {
        $link = $soal['gambar_soal'] ? ['gambar_soal' => $soal['gambar_soal']] : [];

        foreach ($soal['opsi'] as $opsi) {
            if ($opsi['gambar_opsi']) {
                $link['opsi_'.strtolower($opsi['label']).'_gambar'] = $opsi['gambar_opsi'];
            }
        }

        if ($soal['gambar_pembahasan'] ?? null) {
            $link['gambar_pembahasan'] = $soal['gambar_pembahasan'];
        }

        return $link;
    }

    /**
     * Satu file gambar hanya untuk satu soal: file ada di folder subtes soalnya dan namanya diawali kode soal
     * (PK/PK-034.png, PK/PK-034-A.png). Lokasi lain biasanya gambar yang salah tempel, mis. PK-043.png di baris PK-034.
     */
    public static function masalahLokasiGambar(string $url, ?string $kodeSubtes, ?string $kodeSoal): ?string
    {
        $path = (string) parse_url($url, PHP_URL_PATH);
        $nama = basename($path);

        if ($kodeSubtes !== null && basename(dirname($path)) !== $kodeSubtes) {
            return "Gambar soal {$kodeSubtes} harus ada di folder {$kodeSubtes}: tulis {$kodeSubtes}/{$nama}.";
        }

        if ($kodeSoal !== null && ! preg_match('/^'.preg_quote($kodeSoal, '/').'(?!\d)/i', $nama)) {
            return "Nama file \"{$nama}\" tidak diawali {$kodeSoal}. Pastikan gambarnya memang untuk soal ini. "
                ."Satu file hanya untuk satu soal; kalau gambarnya sama dengan soal lain, salin filenya dan beri nama yang diawali {$kodeSoal}.";
        }

        return null;
    }

    private function periksaTandaDolar(?string $teks, string $kunci, callable $tambahError): void
    {
        if ($teks !== null && ($pesan = TeksMatematika::masalah($teks))) {
            $tambahError($kunci, $pesan);
        }
    }

    /** @return string[] kunci kolom yang boleh berisi rumus $...$ */
    private function kolomRumus(): array
    {
        return [...self::KOLOM_TEKS_MATEMATIKA, ...array_map(fn ($label) => 'opsi_'.strtolower($label).'_teks', self::LABEL_OPSI)];
    }

    /**
     * Rumus yang ditolak KaTeX tampil mentah di layar siswa, jadi diperiksa dengan KaTeX versi frontend.
     * Kalau Node.js tidak bisa dijalankan, import ditolak: lebih baik tertunda daripada rumus rusak masuk.
     *
     * @param  array<string, array<int, array{baris: int, kolom: string}>>  $rumusDipakai
     */
    private function periksaRumus(array $rumusDipakai, array &$hasil): void
    {
        $hasil['jumlah_rumus'] = count($rumusDipakai);

        if (! $rumusDipakai) {
            return;
        }

        try {
            $masalah = $this->pemeriksaRumus->periksa(array_map('strval', array_keys($rumusDipakai)));
        } catch (RuntimeException $e) {
            $hasil['error'][] = ['baris' => null, 'kolom' => null,
                'pesan' => "Rumus tidak bisa diperiksa: {$e->getMessage()} Pastikan Node.js terpasang dan npm install sudah dijalankan."];

            return;
        }

        foreach ($masalah as $rumus => $pesan) {
            if ($pesan === null) {
                continue;
            }

            $rumus = (string) $rumus;
            $tampil = mb_strlen($rumus) > 60 ? mb_substr($rumus, 0, 57).'…' : $rumus;

            foreach ($rumusDipakai[$rumus] as $pakai) {
                $hasil['error'][] = ['baris' => $pakai['baris'], 'kolom' => $pakai['kolom'],
                    'pesan' => "Rumus \"\${$tampil}\$\" tidak bisa ditampilkan ({$pesan}). Periksa pasangan kurung { } dan ejaan perintah seperti \\frac."];
            }
        }
    }

    /** @return array<string, int|null> batas panjang kolom varchar; null berarti tanpa batas */
    private function batasPanjangKolom(): array
    {
        $batas = ['soal.kode_soal' => null, 'soal.gambar_soal' => null, 'soal.gambar_pembahasan' => null, 'opsi_jawaban.gambar_opsi' => null];

        $kolom = DB::select("
            select table_name, column_name, character_maximum_length as panjang
            from information_schema.columns
            where table_schema = 'public'
              and table_name || '.' || column_name in ('soal.kode_soal', 'soal.gambar_soal', 'soal.gambar_pembahasan', 'opsi_jawaban.gambar_opsi')
        ");

        foreach ($kolom as $k) {
            $batas["{$k->table_name}.{$k->column_name}"] = $k->panjang;
        }

        return $batas;
    }
}
