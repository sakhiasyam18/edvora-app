<?php

namespace App\Services;

/**
 * Laporan HTML untuk dicek editor sebelum import: semua soal beserta gambar, rumus, opsi, kunci, hint, dan pembahasan.
 *
 * Importer hanya bisa memastikan link gambar hidup dan rumus bisa dirender, bukan bahwa gambarnya cocok dengan soal
 * atau rumusnya benar secara isi. Gambar dimuat dari link-nya dan rumus dirender KaTeX versi frontend (dari CDN),
 * jadi laporan ini menunjukkan apa yang nanti dilihat siswa. Laporan memuat kunci jawaban: jangan dibagikan ke siswa.
 */
class PratinjauSoal
{
    /**
     * @param  array<int, array<string, mixed>>  $soalList  hasil ImportSoalExcel::periksa()
     * @return array<int, array<string, mixed>>
     */
    public static function bergambar(array $soalList): array
    {
        return array_values(array_filter(
            $soalList,
            fn ($s) => $s['gambar_soal'] !== null || ($s['gambar_pembahasan'] ?? null) !== null
                || array_filter(array_column($s['opsi'], 'gambar_opsi'))
        ));
    }

    /**
     * @param  array<int, array<string, mixed>>  $soalList  hasil ImportSoalExcel::periksa()
     */
    public function html(array $soalList, string $judul): string
    {
        $e = fn (?string $teks) => htmlspecialchars((string) $teks, ENT_QUOTES, 'UTF-8');
        $gambar = fn (string $url, string $alt) => '<a href="'.$e($url).'" target="_blank"><img src="'.$e($url).'" alt="'.$e($alt).'" loading="lazy"></a>';
        $kartu = [];

        foreach ($soalList as $s) {
            $opsi = '';

            foreach ($s['opsi'] as $o) {
                $isiOpsi = $this->teks($o['teks_opsi'])
                    .($o['gambar_opsi'] ? '<br>'.$gambar($o['gambar_opsi'], "Gambar opsi {$o['label']}") : '');

                // Majemuk_tabel: satu baris per pernyataan, kolom kuncinya ditandai.
                if ($s['tipe'] === 'majemuk_tabel') {
                    $opsi .= '<tr><td>'.$isiOpsi.'</td>';
                    foreach (array_keys($s['kolom_tabel'] ?? []) as $i) {
                        $opsi .= ($o['kunci_kolom'] === $i + 1 ? '<td class="kunci">✓ Kunci</td>' : '<td></td>');
                    }
                    $opsi .= '</tr>';

                    continue;
                }

                // Benar_salah: setiap pernyataan bernilai Benar atau Salah; tipe lain hanya menandai kuncinya.
                $tanda = $s['tipe'] === 'benar_salah' ? ($o['is_kunci'] ? 'Benar' : 'Salah') : ($o['is_kunci'] ? 'Kunci' : null);
                $opsi .= '<li><b>'.$e($o['label']).'.</b> '.$isiOpsi
                    .($tanda ? ' <span class="kunci">('.$tanda.')</span>' : '')
                    .'</li>';
            }

            if ($opsi !== '') {
                $opsi = $s['tipe'] === 'majemuk_tabel'
                    ? '<table><tr><th>Pernyataan</th><th>'.implode('</th><th>', array_map($e, $s['kolom_tabel'] ?? [])).'</th></tr>'.$opsi.'</table>'
                    : '<ol>'.$opsi.'</ol>';
            }

            $info = "{$s['kode_subtes']} · {$s['nama_topik']} · {$s['tipe']} · {$s['tingkat_kesulitan']} · baris {$s['baris']}";
            $kartu[] = '<section><h2>'.$e($s['kode_soal']).' <small>'.$e($info).'</small></h2>'
                .($s['gambar_soal'] ? $gambar($s['gambar_soal'], "Gambar soal {$s['kode_soal']}") : '')
                .'<p>'.$this->teks($s['teks_soal']).'</p>'
                .$opsi
                .($s['kunci_jawaban'] !== null ? '<p class="kunci">Kunci: '.$e($s['kunci_jawaban']).'</p>' : '')
                .($s['hint'] !== null ? '<p class="tambahan"><b>Hint:</b> '.$this->teks($s['hint']).'</p>' : '')
                .'<p class="tambahan"><b>Pembahasan:</b> '.$this->teks($s['pembahasan']).'</p>'
                .(($s['gambar_pembahasan'] ?? null) ? $gambar($s['gambar_pembahasan'], "Gambar pembahasan {$s['kode_soal']}") : '')
                .'</section>';
        }

        $isi = $kartu ? implode("\n", $kartu) : '<p>Tidak ada soal di file ini.</p>';
        $jumlah = count($kartu).' soal, '.count(self::bergambar($soalList)).' bergambar';
        $katex = 'https://cdn.jsdelivr.net/npm/katex@'.$this->versiKatex().'/dist';

        return <<<HTML
            <!doctype html>
            <html lang="id">
            <head>
            <meta charset="utf-8">
            <title>Pratinjau soal: {$e($judul)}</title>
            <link rel="stylesheet" href="{$katex}/katex.min.css">
            <script defer src="{$katex}/katex.min.js"></script>
            <style>
                body { font-family: system-ui, sans-serif; max-width: 860px; margin: 24px auto; padding: 0 16px; color: #1F2D5C; line-height: 1.5; }
                section { border: 1px solid #d6dbe4; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
                h2 { font-size: 18px; margin: 0 0 8px; } small { font-weight: normal; color: #667; }
                img { max-width: 100%; max-height: 320px; border: 1px solid #e3e6ea; margin: 6px 0; }
                li { margin-bottom: 6px; } .kunci { color: #2F5E1A; font-weight: 600; }
                .tambahan { font-size: 14px; color: #3d4a6b; }
                table { border-collapse: collapse; width: 100%; margin: 8px 0; }
                th, td { border: 1px solid #d6dbe4; padding: 6px 10px; text-align: left; vertical-align: top; }
                th { background: #eef1f7; } td.kunci { background: #e3f4d6; }
            </style>
            </head>
            <body>
            <h1>Pratinjau soal</h1>
            <p>{$e($judul)} · {$e($jumlah)}. Cek apakah setiap gambar cocok dengan soalnya, rumus tampil benar, dan kuncinya tepat. Berisi kunci jawaban: jangan dibagikan ke siswa.</p>
            {$isi}
            <script>
            // Rumus tampil sebagai teks \$...\$ sampai KaTeX dimuat; tanpa internet tetap terbaca sebagai teks.
            document.addEventListener('DOMContentLoaded', function () {
                if (!window.katex) return;
                document.querySelectorAll('.rumus').forEach(function (el) {
                    katex.render(el.dataset.tex, el, { throwOnError: false, errorColor: '#B94040' });
                });
            });
            </script>
            </body>
            </html>
            HTML;
    }

    // Teks dengan aturan $ yang sama seperti di aplikasi: bagian rumus diberi span untuk dirender KaTeX.
    private function teks(?string $teks): string
    {
        $html = '';

        foreach (TeksMatematika::pecah((string) $teks) as $bagian) {
            $isi = htmlspecialchars($bagian['isi'], ENT_QUOTES, 'UTF-8');
            $html .= $bagian['rumus'] ? '<span class="rumus" data-tex="'.$isi.'">$'.$isi.'$</span>' : nl2br($isi);
        }

        return $html;
    }

    // Versi KaTeX yang terpasang untuk frontend, supaya pratinjau merender rumus persis seperti aplikasi.
    private function versiKatex(): string
    {
        $paket = json_decode((string) @file_get_contents(base_path('node_modules/katex/package.json')), true);

        return is_array($paket) && is_string($paket['version'] ?? null) ? $paket['version'] : '0.18.7';
    }
}
