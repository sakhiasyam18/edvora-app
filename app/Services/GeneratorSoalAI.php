<?php

namespace App\Services;

use App\Exceptions\GeneratorSoalException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Menyusun soal UTBK lewat OpenRouter. Satu kelompok soal per tipe (pilihan ganda dan isian singkat); bila kedua
 * tipe diminta, keduanya dikirim bersamaan. Jumlah soal per kelompok dijaga ketat: kurang satu pun dianggap gagal
 * dan dicoba diperbaiki sekali.
 */
class GeneratorSoalAI
{
    // Subtes yang boleh memakai isian singkat.
    public const SUBTES_MATEMATIKA = ['PK', 'PM'];

    private const TIPE = [
        'pg' => 'Pilihan Ganda',
        'isian' => 'Isian Singkat',
    ];

    private const LABEL_TIPE = [
        'pg' => 'Pilihan Ganda',
        'isian' => 'Isian Singkat',
        'both' => 'Pilihan Ganda & Isian Singkat',
    ];

    private const KUNCI_CACHE = 'generator-soal:model';

    private const BATAS_MAKS_TOKEN = 20000;

    // Daftar cadangan bila OpenRouter tidak bisa dihubungi saat halaman dibuka. Semuanya model gratis.
    private const MODEL_CADANGAN = [
        ['id' => 'nvidia/nemotron-3-ultra-550b-a55b:free', 'nama' => 'Nemotron 3 Ultra 550B A55B', 'provider' => 'Nvidia', 'konteks' => null],
        ['id' => 'google/gemma-4-31b-it:free', 'nama' => 'Gemma 4 31B IT', 'provider' => 'Google', 'konteks' => null],
        ['id' => 'xingchen-agi/xing4.0-29b-a4b:free', 'nama' => 'Xing 4.0 29B A4B', 'provider' => 'Xingchen Agi', 'konteks' => null],
        ['id' => 'deepseek/deepseek-r1:free', 'nama' => 'DeepSeek R1', 'provider' => 'Deepseek', 'konteks' => null],
        ['id' => 'deepseek/deepseek-chat-v3-0324:free', 'nama' => 'DeepSeek V3 0324', 'provider' => 'Deepseek', 'konteks' => null],
        ['id' => 'google/gemini-2.0-flash-exp:free', 'nama' => 'Gemini 2.0 Flash', 'provider' => 'Google', 'konteks' => null],
        ['id' => 'meta-llama/llama-3.3-70b-instruct:free', 'nama' => 'Llama 3.3 70B Instruct', 'provider' => 'Meta Llama', 'konteks' => null],
        ['id' => 'qwen/qwen-2.5-72b-instruct:free', 'nama' => 'Qwen 2.5 72B Instruct', 'provider' => 'Qwen', 'konteks' => null],
        ['id' => 'mistralai/mistral-small-3.1-24b-instruct:free', 'nama' => 'Mistral Small 3.1 24B Instruct', 'provider' => 'Mistralai', 'konteks' => null],
    ];

    // Perintah LaTeX yang sering ditulis model sebagai escape JSON tunggal (\frac, \sqrt, ...).
    private const LATEX_COMMANDS = [
        'frac', 'dfrac', 'tfrac', 'sqrt', 'times', 'div', 'cdot', 'cdots', 'ldots', 'dots',
        'theta', 'beta', 'alpha', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta',
        'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'rho', 'sigma', 'tau', 'phi', 'chi', 'psi', 'omega',
        'Gamma', 'Delta', 'Theta', 'Lambda', 'Pi', 'Sigma', 'Phi', 'Psi', 'Omega',
        'le', 'leq', 'ge', 'geq', 'neq', 'ne', 'approx', 'equiv', 'propto', 'sim', 'cong',
        'pm', 'mp', 'infty', 'partial', 'nabla', 'sum', 'prod', 'int', 'oint', 'lim',
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'exp', 'min', 'max',
        'angle', 'triangle', 'circ', 'degree', 'perp', 'parallel', 'overline', 'underline',
        'vec', 'hat', 'bar', 'mathbb', 'mathrm', 'mathbf', 'mathit', 'text', 'operatorname',
        'begin', 'end', 'quad', 'qquad', 'left', 'right', 'big', 'Big', 'bigl', 'bigr',
        'to', 'rightarrow', 'leftarrow', 'Rightarrow', 'Leftarrow', 'leftrightarrow',
        'Leftrightarrow', 'implies', 'iff', 'because', 'therefore', 'forall', 'exists',
        'subset', 'subseteq', 'supset', 'supseteq', 'in', 'notin', 'cup', 'cap', 'emptyset',
        'binom', 'pmod', 'mod', 'bmod', 'space', 'displaystyle', 'textstyle',
    ];

    /**
     * Daftar model gratis beserta sumbernya. Hasil OpenRouter disimpan 10 menit; daftar cadangan 1 menit supaya
     * halaman tidak menunggu 15 detik setiap kali jaringan sedang bermasalah.
     *
     * @return array{models: array<int, array{id: string, nama: string, provider: string, konteks: int|null}>, sumber: string}
     */
    public function daftarModel(): array
    {
        $tersimpan = Cache::get(self::KUNCI_CACHE);

        if (is_array($tersimpan) && isset($tersimpan['models'])) {
            return $tersimpan;
        }

        try {
            $res = Http::acceptJson()->timeout(15)->get($this->alamat().'/models');

            if (! $res->ok()) {
                throw new \RuntimeException('HTTP '.$res->status());
            }

            $model = $this->petakanModel($res->json('data'));

            if (! $model) {
                throw new \RuntimeException('Daftar model gratis kosong.');
            }

            $hasil = ['models' => $model, 'sumber' => 'openrouter'];
            Cache::put(self::KUNCI_CACHE, $hasil, now()->addMinutes(10));

            return $hasil;
        } catch (\Throwable $e) {
            Log::warning('Generator soal: gagal memuat daftar model OpenRouter: '.$e->getMessage());

            $hasil = ['models' => self::MODEL_CADANGAN, 'sumber' => 'fallback'];
            Cache::put(self::KUNCI_CACHE, $hasil, now()->addMinute());

            return $hasil;
        }
    }

    public function modelTersedia(string $id): bool
    {
        foreach ($this->daftarModel()['models'] as $model) {
            if ($model['id'] === $id) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array{kode_subtes: string, nama_subtes: string, topik: string, topik_id: string, tingkat: string, jumlah: int, tipe: string, distribusi: string, jumlah_pg: int, jumlah_isian: int, model: string, hindari?: string}  $input
     * @return array<string, mixed>
     */
    public function buatSoal(array $input): array
    {
        $this->kunci();

        $grupList = [];
        if ($input['jumlah_pg'] > 0) {
            $grupList['pg'] = $this->siapkanGrup('pg', $input['jumlah_pg'], $input);
        }
        if ($input['jumlah_isian'] > 0) {
            $grupList['isian'] = $this->siapkanGrup('isian', $input['jumlah_isian'], $input);
        }

        // Dua kelompok dikirim bersamaan supaya waktu tunggu tidak berlipat.
        $awal = count($grupList) === 2 ? $this->kirimSerentak($grupList) : [];

        $soal = [];
        foreach ($grupList as $kunci => $grup) {
            $konten = null;

            if (isset($awal[$kunci]['galat'])) {
                $galat = $awal[$kunci]['galat'];

                if ($galat->kode === 'model_limit' || $galat->kode !== 'empty_response') {
                    throw $galat;
                }
            } else {
                $konten = $awal[$kunci]['konten'] ?? null;
            }

            $soal = [...$soal, ...$this->prosesGrup($grup, $konten)];
        }

        if ($input['tipe'] === 'both' && $input['distribusi'] === 'acak') {
            $soal = $this->acak($soal);
        }

        foreach ($soal as $i => $item) {
            $soal[$i]['nomor'] = $i + 1;
        }

        return [
            'subtes' => $input['nama_subtes'],
            'kode_subtes' => $input['kode_subtes'],
            'topik' => $input['topik'],
            'topik_id' => $input['topik_id'],
            'tingkat_kesulitan' => ucfirst($input['tingkat']),
            'tipe_soal' => self::LABEL_TIPE[$input['tipe']] ?? $input['tipe'],
            'jumlah_soal' => count($soal),
            'jumlah_pg' => $input['jumlah_pg'],
            'jumlah_isian' => $input['jumlah_isian'],
            'soal' => $soal,
            'model' => $input['model'],
            'dibuat' => now()->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array{tipe: string, label: string, jumlah: int, model: string, pesan: array<int, array{role: string, content: string}>, maks_token: int, aturan_tambahan: string}
     */
    private function siapkanGrup(string $tipe, int $jumlah, array $input): array
    {
        $isIsian = $tipe === 'isian';
        $label = self::TIPE[$tipe];
        $tingkat = ucfirst($input['tingkat']);
        $aturanTipe = $isIsian
            ? 'Tipe soal ISIAN SINGKAT: jawaban harus sangat singkat, 1-3 kata atau satu angka/ekspresi matematika sederhana. Jangan beri pilihan jawaban.'
            : 'Tipe soal PILIHAN GANDA: sediakan tepat 5 opsi (A, B, C, D, E). Hanya satu opsi yang benar dan pengecoh harus masuk akal.';
        $skemaPilihan = $isIsian
            ? 'null'
            : '{"A": "opsi A", "B": "opsi B", "C": "opsi C", "D": "opsi D", "E": "opsi E"}';
        $contohJawaban = $isIsian ? 'jawaban singkat' : 'A';

        $sistem = strtr(<<<'PROMPT'
Anda adalah penulis soal UTBK-SNBT (Seleksi Nasional Berdasarkan Tes) profesional di Indonesia. Anda menyusun soal bermutu tinggi yang setara dengan soal resmi UTBK.

ATURAN WAJIB:
1. Tulis soal dalam Bahasa Indonesia yang baku dan jelas, dengan konteks yang relevan bagi siswa SMA Indonesia.
2. Setiap soal harus orisinal, tidak menyalin soal UTBK resmi yang sudah beredar.
3. {ATURAN_TIPE}
4. Pembahasan harus runtut dan menjelaskan langkah/cara menemukan jawaban, 40-120 kata.
5. Variasikan tingkat kognitif soal (bukan sekadar hafalan), sesuai tingkat kesulitan yang diminta.
6. Untuk soal yang memuat bacaan/teks stimulus, sertakan teks dalam field "soal" sebelum pertanyaan.
7. Hasilkan TEPAT {JUMLAH} soal dengan topik yang sama namun isi yang berbeda.
8. Bungkus setiap ekspresi matematika dengan $...$ (termasuk pada pilihan jawaban), dan tulis backslash ganda di dalam string JSON (contoh: $\\frac{1}{2}$, $\\sqrt{2}$).
9. VERIFIKASI: hitung ulang setiap jawaban dan pastikan opsi yang benar benar-benar ada di antara pilihan A-E serta sesuai dengan pembahasan. Jika ragu atau opsi tidak konsisten, ganti soal dengan yang lebih aman.
10. Isi "hint" dengan petunjuk singkat yang membantu tanpa membocorkan jawaban; boleh berupa string kosong.
11. Balas HANYA dengan satu objek JSON valid. Tanpa markdown, tanpa kode blok, tanpa teks tambahan.

SKEMA JSON:
{
  "subtes": "{NAMA_SUBTES}",
  "topik": "{TOPIK}",
  "tingkat_kesulitan": "{TINGKAT}",
  "tipe_soal": "{LABEL_TIPE}",
  "jumlah_soal": {JUMLAH},
  "soal": [
    {
      "nomor": 1,
      "soal": "isi soal lengkap",
      "pilihan": {SKEMA_PILIHAN},
      "jawaban": "{CONTOH_JAWABAN}",
      "hint": "petunjuk singkat (boleh kosong)",
      "pembahasan": "pembahasan langkah demi langkah"
    }
  ]
}
PROMPT, [
            '{ATURAN_TIPE}' => $aturanTipe,
            '{JUMLAH}' => (string) $jumlah,
            '{NAMA_SUBTES}' => $input['nama_subtes'],
            '{TOPIK}' => $input['topik'],
            '{TINGKAT}' => $tingkat,
            '{LABEL_TIPE}' => $label,
            '{SKEMA_PILIHAN}' => $skemaPilihan,
            '{CONTOH_JAWABAN}' => $contohJawaban,
        ]);

        $ingatan = $isIsian
            ? '- Ingat: isian singkat, jawaban 1-3 kata/angka, field "pilihan" bernilai null.'
            : '- Ingat: 5 pilihan ganda (A-E), "jawaban" berisi huruf opsi yang benar.';

        $hindari = trim((string) ($input['hindari'] ?? ''));
        $hindari = $hindari === ''
            ? ''
            : "\n- Jangan mengulang atau menyalin soal berikut; buat soal baru dengan isi yang berbeda:\n\"".Str::limit($hindari, 1200).'"';

        $pengguna = strtr(<<<'PROMPT'
Buatkan {JUMLAH} soal UTBK dengan spesifikasi berikut:
- Subtes: {NAMA_SUBTES} ({KODE_SUBTES})
- Topik: {TOPIK}
- Tingkat kesulitan: {TINGKAT}
- Tipe soal: {LABEL_TIPE}
{INGATAN}{HINDARI}

Kembalikan hanya JSON sesuai skema.
PROMPT, [
            '{JUMLAH}' => (string) $jumlah,
            '{NAMA_SUBTES}' => $input['nama_subtes'],
            '{KODE_SUBTES}' => $input['kode_subtes'],
            '{TOPIK}' => $input['topik'],
            '{TINGKAT}' => $tingkat,
            '{LABEL_TIPE}' => $label,
            '{INGATAN}' => $ingatan,
            '{HINDARI}' => $hindari,
        ]);

        return [
            'tipe' => $tipe,
            'label' => $label,
            'jumlah' => $jumlah,
            'model' => $input['model'],
            'pesan' => [
                ['role' => 'system', 'content' => $sistem],
                ['role' => 'user', 'content' => $pengguna],
            ],
            'maks_token' => min(16000, 1400 + $jumlah * 900),
            'aturan_tambahan' => $isIsian ? '' : ', "pilihan" berisi A-E',
        ];
    }

    /**
     * @param  array<string, array<string, mixed>>  $grupList
     * @return array<string, array{konten?: string, galat?: GeneratorSoalException}>
     */
    private function kirimSerentak(array $grupList): array
    {
        $jawaban = Http::pool(function (Pool $pool) use ($grupList) {
            foreach ($grupList as $kunci => $grup) {
                $pool->as($kunci)
                    ->withToken($this->kunci())
                    ->acceptJson()
                    ->withHeaders($this->headerPermintaan())
                    ->timeout($this->batasWaktu())
                    ->post($this->alamat().'/chat/completions', [
                        'model' => $grup['model'],
                        'messages' => $grup['pesan'],
                        'temperature' => 0.55,
                        'max_tokens' => $grup['maks_token'],
                    ]);
            }
        });

        $hasil = [];
        foreach ($grupList as $kunci => $grup) {
            try {
                $hasil[$kunci] = ['konten' => $this->bacaJawaban($jawaban[$kunci] ?? null)];
            } catch (GeneratorSoalException $e) {
                $hasil[$kunci] = ['galat' => $e];
            }
        }

        return $hasil;
    }

    /**
     * @param  array<string, mixed>  $grup
     * @return array<int, array<string, mixed>>
     */
    private function prosesGrup(array $grup, ?string $konten): array
    {
        if ($konten === null) {
            $konten = $this->mintaKonten($grup, $grup['pesan'], $grup['maks_token'], 0.55);
        }

        try {
            return $this->uraikan($konten, $grup);
        } catch (GeneratorSoalException $e) {
            if ($e->kode === 'model_limit') {
                throw $e;
            }

            // Satu kali perbaikan, seperti generator versi Node.
            $pesan = [
                ...$grup['pesan'],
                ['role' => 'assistant', 'content' => $konten],
                [
                    'role' => 'user',
                    'content' => 'Respons Anda bermasalah: '.$e->getMessage()
                        .' Pastikan JSON valid dan setiap soal punya "soal", "jawaban", "pembahasan"'.$grup['aturan_tambahan']
                        .'. Hasilkan TEPAT '.$grup['jumlah'].' soal '.$grup['label'].' dan balas HANYA dengan JSON.',
                ],
            ];

            $konten = $this->mintaKonten($grup, $pesan, $grup['maks_token'], 0.3);

            return $this->uraikan($konten, $grup);
        }
    }

    /**
     * @param  array<string, mixed>  $grup
     * @param  array<int, array{role: string, content: string}>  $pesan
     */
    private function mintaKonten(array $grup, array $pesan, int $maksToken, float $suhu): string
    {
        $maks = $maksToken;

        for ($i = 0; $i < 2; $i++) {
            try {
                return $this->kirimSatu($grup, $pesan, $maks, $suhu);
            } catch (GeneratorSoalException $e) {
                // Model reasoning kadang menghabiskan seluruh anggaran token sebelum menulis jawaban.
                if ($e->kode !== 'empty_response' || $i === 1) {
                    throw $e;
                }

                $maks = min(self::BATAS_MAKS_TOKEN, $maks * 2);
            }
        }

        throw new GeneratorSoalException('Model tidak mengembalikan isi soal.', 'empty_response', 502);
    }

    /**
     * @param  array<string, mixed>  $grup
     * @param  array<int, array{role: string, content: string}>  $pesan
     */
    private function kirimSatu(array $grup, array $pesan, int $maksToken, float $suhu): string
    {
        try {
            $res = Http::withToken($this->kunci())
                ->acceptJson()
                ->withHeaders($this->headerPermintaan())
                ->timeout($this->batasWaktu())
                ->post($this->alamat().'/chat/completions', [
                    'model' => $grup['model'],
                    'messages' => $pesan,
                    'temperature' => $suhu,
                    'max_tokens' => $maksToken,
                ]);
        } catch (ConnectionException) {
            throw new GeneratorSoalException(
                'Koneksi ke OpenRouter gagal atau melewati batas waktu. Coba lagi.',
                'provider_error',
                504,
            );
        }

        return $this->bacaJawaban($res);
    }

    private function bacaJawaban(mixed $jawaban): string
    {
        if ($jawaban instanceof ConnectionException) {
            throw new GeneratorSoalException(
                'Koneksi ke OpenRouter gagal atau melewati batas waktu. Coba lagi.',
                'provider_error',
                504,
            );
        }

        if (! $jawaban instanceof Response) {
            throw new GeneratorSoalException('Respons OpenRouter tidak terbaca. Coba lagi.', 'provider_error', 502);
        }

        $status = $jawaban->status();

        if ($status >= 400) {
            $pesan = (string) ($jawaban->json('error.message') ?? $jawaban->json('message') ?? '');
            if ($pesan === '') {
                $pesan = Str::limit(strip_tags($jawaban->body()), 300) ?: 'HTTP '.$status;
            }

            if ($this->masalahLimit($status, $pesan)) {
                throw new GeneratorSoalException(
                    'Model sedang mencapai batas penggunaan (limit). Coba model lain.',
                    'model_limit',
                    429,
                );
            }

            throw new GeneratorSoalException('OpenRouter menolak permintaan: '.$pesan, 'provider_error', 502);
        }

        $konten = $jawaban->json('choices.0.message.content');

        if (is_array($konten)) {
            $konten = collect($konten)
                ->map(fn ($bagian) => is_array($bagian) ? (string) ($bagian['text'] ?? '') : (string) $bagian)
                ->implode('');
        }

        if (! is_string($konten) || trim($konten) === '') {
            throw new GeneratorSoalException(
                'Model tidak mengembalikan konten soal. Coba lagi atau pilih model lain.',
                'empty_response',
                502,
            );
        }

        return $konten;
    }

    private function masalahLimit(int $status, string $pesan): bool
    {
        return $status === 429
            || $status === 402
            || preg_match('/rate.?limit|quota|credit|insufficient|too many requests|limit reached|exceeded/i', $pesan) === 1;
    }

    /**
     * @param  array<string, mixed>  $grup
     * @return array<int, array<string, mixed>>
     */
    private function uraikan(string $konten, array $grup): array
    {
        $data = $this->ambilJson($konten);
        $daftar = array_is_list($data) ? $data : ($data['soal'] ?? null);

        if (! is_array($daftar)) {
            throw new GeneratorSoalException('Struktur JSON tidak memiliki array "soal".', 'invalid_json', 502);
        }

        $soal = [];
        foreach ($daftar as $item) {
            if (! is_array($item)) {
                continue;
            }

            $normal = $this->normalisasiSoal($item, $grup['tipe'], $grup['label']);

            if ($normal !== null) {
                $soal[] = $normal;
            }

            if (count($soal) >= $grup['jumlah']) {
                break;
            }
        }

        if (count($soal) < $grup['jumlah']) {
            throw new GeneratorSoalException(
                'Model hanya menghasilkan '.count($soal).' dari '.$grup['jumlah'].' soal '.$grup['label'].'.',
                'incomplete',
                502,
            );
        }

        return $soal;
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, mixed>|null
     */
    private function normalisasiSoal(array $raw, string $tipe, string $label): ?array
    {
        $soal = trim((string) ($raw['soal'] ?? $raw['question'] ?? ''));
        $jawaban = trim((string) ($raw['jawaban'] ?? $raw['answer'] ?? ''));
        $hint = is_string($raw['hint'] ?? null) ? trim($raw['hint']) : '';
        $pembahasan = trim((string) ($raw['pembahasan'] ?? $raw['explanation'] ?? ''));

        if ($soal === '' || $jawaban === '' || $pembahasan === '') {
            return null;
        }

        $hasil = [
            'nomor' => 0,
            'tipe' => $tipe === 'isian' ? 'isian_singkat' : 'pilihan_ganda',
            'tipe_soal' => $label,
            'soal' => $soal,
            'pilihan' => null,
            'jawaban' => $jawaban,
            'hint' => $hint,
            'pembahasan' => $pembahasan,
        ];

        if ($tipe === 'pg') {
            $sumber = $raw['pilihan'] ?? $raw['options'] ?? $raw['choices'] ?? null;
            $opsi = [];

            if (is_array($sumber)) {
                if (array_is_list($sumber)) {
                    foreach (array_slice($sumber, 0, 5) as $i => $pilihan) {
                        $teks = is_array($pilihan) ? ($pilihan['teks'] ?? $pilihan['text'] ?? '') : $pilihan;
                        $teks = trim((string) $teks);

                        if ($teks !== '') {
                            $opsi[chr(65 + $i)] = $teks;
                        }
                    }
                } else {
                    foreach ($sumber as $kunci => $pilihan) {
                        $huruf = strtoupper(trim((string) $kunci));

                        if (preg_match('/^[A-E]$/', $huruf) !== 1) {
                            continue;
                        }

                        $teks = is_array($pilihan) ? ($pilihan['teks'] ?? $pilihan['text'] ?? '') : $pilihan;
                        $teks = trim((string) $teks);

                        if ($teks !== '') {
                            $opsi[$huruf] = $teks;
                        }
                    }
                    ksort($opsi);
                }
            }

            if (count($opsi) < 2) {
                return null;
            }

            // Terima jawaban berupa huruf, "A.", "opsi B", atau teks opsi lengkap.
            $kunci = null;
            if (preg_match('/\b([A-E])\b/', strtoupper($jawaban), $cocok) === 1) {
                $kunci = $cocok[1];
            }

            if ($kunci === null || ! isset($opsi[$kunci])) {
                $kunci = null;
                foreach ($opsi as $huruf => $teks) {
                    if (mb_strtolower($teks) === mb_strtolower($jawaban)) {
                        $kunci = $huruf;
                        break;
                    }
                }
            }

            if ($kunci === null) {
                return null;
            }

            $hasil['pilihan'] = $opsi;
            $hasil['jawaban'] = $kunci;
        } else {
            $jawaban = preg_replace('/^(jawaban|answer)\s*[:=]\s*/i', '', $jawaban) ?? $jawaban;
            $jawaban = trim($jawaban, " \t\n\r\0\x0B\"'");

            if ($jawaban === '') {
                return null;
            }

            $hasil['jawaban'] = $jawaban;
        }

        return $hasil;
    }

    /**
     * @return array<mixed>
     */
    private function ambilJson(string $teks): array
    {
        $bersih = trim($teks);
        $bersih = preg_replace('/^```(?:json)?\s*/i', '', $bersih) ?? $bersih;
        $bersih = preg_replace('/\s*```$/i', '', $bersih) ?? $bersih;
        $bersih = trim($this->perbaikiEscape($bersih));

        $data = json_decode($bersih, true);
        if (is_array($data)) {
            return $data;
        }

        $awal = strpos($bersih, '[');
        $akhir = strrpos($bersih, ']');
        if ($awal !== false && $akhir !== false && $akhir > $awal) {
            $data = json_decode(substr($bersih, $awal, $akhir - $awal + 1), true);
            if (is_array($data)) {
                return $data;
            }
        }

        $awal = strpos($bersih, '{');
        $akhir = strrpos($bersih, '}');
        if ($awal !== false && $akhir !== false && $akhir > $awal) {
            $data = json_decode(substr($bersih, $awal, $akhir - $awal + 1), true);
            if (is_array($data)) {
                return $data;
            }
        }

        throw new GeneratorSoalException('Respons model bukan JSON yang valid.', 'invalid_json', 502);
    }

    // Model sering menulis \frac, \sqrt, dst. sebagai escape JSON tunggal (tidak valid).
    private function perbaikiEscape(string $teks): string
    {
        $polaLatex = '/(?<!\\\\)\\\\(?:'.implode('|', self::LATEX_COMMANDS).')(?![a-zA-Z])/u';
        $teks = preg_replace($polaLatex, '\\\\$0', $teks) ?? $teks;

        $polaEscape = '/(?<!\\\\)\\\\(?!["\\\\\/bfnrt]|u[0-9a-fA-F]{4})/u';

        return preg_replace($polaEscape, '\\\\$0', $teks) ?? $teks;
    }

    /**
     * @param  array<int, mixed>  $data
     * @return array<int, array{id: string, nama: string, provider: string, konteks: int|null}>
     */
    private function petakanModel(mixed $data): array
    {
        if (! is_array($data)) {
            return [];
        }

        $model = [];

        foreach ($data as $item) {
            if (! is_array($item) || ! is_string($item['id'] ?? null) || ! $this->gratis($item)) {
                continue;
            }

            $id = $item['id'];

            if ($id === 'openrouter/free' || preg_match('/content-safety|moderation/i', $id) === 1) {
                continue;
            }

            if (! $this->teksSaja($item)) {
                continue;
            }

            $model[] = [
                'id' => $id,
                'nama' => $this->namaModel($item),
                'provider' => $this->namaProvider($id),
                'konteks' => isset($item['context_length']) ? (int) $item['context_length'] : null,
            ];
        }

        $prioritas = [
            'nvidia/nemotron-3-ultra-550b-a55b:free',
            'google/gemma-4-31b-it:free',
            'xingchen-agi/xing4.0-29b-a4b:free',
        ];

        usort($model, function (array $a, array $b) use ($prioritas) {
            $urutanA = array_search($a['id'], $prioritas, true);
            $urutanB = array_search($b['id'], $prioritas, true);
            $urutanA = $urutanA === false ? PHP_INT_MAX : $urutanA;
            $urutanB = $urutanB === false ? PHP_INT_MAX : $urutanB;

            return $urutanA <=> $urutanB ?: strcasecmp($a['nama'], $b['nama']);
        });

        return $model;
    }

    /**
     * @param  array<string, mixed>  $model
     */
    private function gratis(array $model): bool
    {
        if (str_ends_with((string) ($model['id'] ?? ''), ':free')) {
            return true;
        }

        $harga = $model['pricing'] ?? null;

        return is_array($harga)
            && is_numeric($harga['prompt'] ?? null)
            && is_numeric($harga['completion'] ?? null)
            && (float) $harga['prompt'] === 0.0
            && (float) $harga['completion'] === 0.0;
    }

    /**
     * @param  array<string, mixed>  $model
     */
    private function teksSaja(array $model): bool
    {
        $keluaran = $model['architecture']['output_modalities'] ?? null;

        if (! is_array($keluaran)) {
            return true;
        }

        return in_array('text', $keluaran, true) && array_diff($keluaran, ['text']) === [];
    }

    /**
     * @param  array<string, mixed>  $model
     */
    private function namaModel(array $model): string
    {
        $nama = trim((string) ($model['name'] ?? ''));
        $nama = preg_replace('/\s*\(free\)\s*$/i', '', $nama) ?? $nama;
        $nama = preg_replace('/^[^:]{2,30}:\s*/', '', $nama) ?? $nama;

        if ($nama !== '') {
            return $nama;
        }

        $id = (string) ($model['id'] ?? 'model');
        $nama = preg_replace('/:free$/', '', $id) ?? $id;
        $nama = Str::afterLast($nama, '/');

        return Str::headline(str_replace(['-', '_'], ' ', $nama));
    }

    private function namaProvider(string $id): string
    {
        $provider = explode('/', $id)[0] ?: 'openrouter';

        return Str::headline(str_replace(['-', '_'], ' ', $provider));
    }

    /**
     * @param  array<int, array<string, mixed>>  $daftar
     * @return array<int, array<string, mixed>>
     */
    private function acak(array $daftar): array
    {
        for ($i = count($daftar) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$daftar[$i], $daftar[$j]] = [$daftar[$j], $daftar[$i]];
        }

        return $daftar;
    }

    private function kunci(): string
    {
        $kunci = (string) config('services.openrouter.api_key');

        if ($kunci === '') {
            throw new GeneratorSoalException(
                'OPENROUTER_API_KEY belum diisi di .env server. Isi kuncinya lalu jalankan php artisan config:clear.',
                'missing_key',
                503,
            );
        }

        return $kunci;
    }

    private function alamat(): string
    {
        return rtrim((string) config('services.openrouter.url', 'https://openrouter.ai/api/v1'), '/');
    }

    private function batasWaktu(): int
    {
        return max(30, (int) config('services.openrouter.timeout', 180));
    }

    /**
     * @return array<string, string>
     */
    private function headerPermintaan(): array
    {
        return [
            'HTTP-Referer' => (string) config('app.url', 'http://localhost'),
            'X-Title' => 'Edvora Generator Soal',
        ];
    }
}
