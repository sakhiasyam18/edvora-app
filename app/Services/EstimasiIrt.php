<?php

namespace App\Services;

/**
 * Item Response Theory 2PL untuk Try Out (RANCANGAN-irt.md 5.1–5.3, SDD 5.3.5). Fungsi statis murni tanpa
 * database supaya bisa diuji dengan PHPUnit biasa. Penilaian memakai EAP; kalibrasi memakai MML-EM dengan
 * prior dari label tingkat kesulitan editor.
 */
class EstimasiIrt
{
    // Grid θ SDD 5.3.5: −4 sampai 4, langkah 0,1 (81 titik).
    public const THETA_MIN = -4.0;

    public const THETA_MAKS = 4.0;

    public const THETA_LANGKAH = 0.1;

    public const SKOR_TENGAH = 500;

    public const SKOR_SKALA = 125;

    public const SKOR_MIN = 0;

    public const SKOR_MAKS = 1000;

    // Parameter awal dari label editor (I5) dan prior kalibrasi (I6).
    public const A_AWAL = 1.0;

    public const B_AWAL = ['mudah' => -1.0, 'sedang' => 0.0, 'sulit' => 1.0];

    public const PRIOR_SD_LN_A = 0.5;

    public const PRIOR_SD_B = 1.0;

    public const BATAS_A = [0.2, 4.0];

    public const BATAS_B = [-4.0, 4.0];

    public const TOLERANSI_KONVERGEN = 0.001;

    public const MAKS_ITERASI = 100;

    // Fisher scoring per soal di M-step: jumlah langkah, batas besar langkah, dan syarat berhenti.
    private const MAKS_LANGKAH_NEWTON = 10;

    private const BATAS_LANGKAH_LN_A = 0.5;

    private const BATAS_LANGKAH_B = 1.0;

    private const TOLERANSI_NEWTON = 1e-6;

    /**
     * @return float[] titik θ dari THETA_MIN sampai THETA_MAKS
     */
    public static function grid(): array
    {
        $jumlah = (int) round((self::THETA_MAKS - self::THETA_MIN) / self::THETA_LANGKAH);
        $grid = [];
        for ($k = 0; $k <= $jumlah; $k++) {
            $grid[] = self::THETA_MIN + $k * self::THETA_LANGKAH;
        }

        return $grid;
    }

    /**
     * Bobot posterior ternormalisasi di setiap titik grid: bobot awal e^(−θ²/2) × kecocokan (SDD 5.3.5 b–c).
     * Dihitung dalam log supaya tidak underflow. Dipakai bersama oleh EAP dan E-step kalibrasi.
     *
     * @param  array<int, array{a: float, b: float, u: int}>  $respons  hanya soal yang dijawab
     * @return float[]
     */
    public static function posterior(array $respons): array
    {
        $log = self::logPrior();
        foreach (self::grid() as $k => $theta) {
            foreach ($respons as $r) {
                $log[$k] += self::logPeluang($r['a'], $r['b'], $theta, (int) $r['u']);
            }
        }

        return self::normalkan($log);
    }

    /**
     * θ̂ EAP (SDD 5.3.5 d). null bila tidak ada soal yang dijawab.
     *
     * @param  array<int, array{a: float, b: float, u: int}>  $respons
     */
    public static function eap(array $respons): ?float
    {
        if ($respons === []) {
            return null;
        }

        $grid = self::grid();
        $theta = 0.0;
        foreach (self::posterior($respons) as $k => $bobot) {
            $theta += $grid[$k] * $bobot;
        }

        return $theta;
    }

    /**
     * Skor subtes SDD 5.3.5: 500 + 125θ̂ dibatasi 0–1000, dibulatkan 2 desimal. Semua kosong → 0, karena tanpa
     * pengecekan ini EAP mengembalikan θ = 0 (skor 500).
     *
     * @param  array<int, array{a: float, b: float, u: int}>  $respons
     */
    public static function skor(array $respons): float
    {
        $theta = self::eap($respons);
        if ($theta === null) {
            return (float) self::SKOR_MIN;
        }

        return round(self::batasi(self::SKOR_TENGAH + self::SKOR_SKALA * $theta, self::SKOR_MIN, self::SKOR_MAKS), 2);
    }

    /**
     * Kalibrasi satu subtes dengan MML-EM dan prior dari label (RANCANGAN-irt.md 5.2).
     *
     * @param  array<string, array<string, int>>  $jawaban  peserta => [soalId => 0|1]; soal kosong tidak ada
     * @param  array<string, string>  $label  soalId => 'mudah'|'sedang'|'sulit', semua soal subtes paket
     * @return array{parameter: array<string, array{a: float, b: float}>, iterasi: int, konvergen: bool}
     */
    public static function kalibrasi(array $jawaban, array $label): array
    {
        $param = [];
        foreach ($label as $soalId => $tingkat) {
            $param[$soalId] = ['a' => self::A_AWAL, 'b' => self::B_AWAL[$tingkat]];
        }

        // Jawaban untuk soal di luar $label diabaikan; peserta yang mengosongkan seluruh subtes tidak memberi data.
        $jawaban = array_filter(array_map(fn ($isi) => array_intersect_key($isi, $label), $jawaban));
        if ($jawaban === []) {
            return ['parameter' => $param, 'iterasi' => 0, 'konvergen' => true];
        }

        $grid = self::grid();
        $logPrior = self::logPrior();
        $nol = array_fill(0, count($grid), 0.0);

        for ($iterasi = 1; $iterasi <= self::MAKS_ITERASI; $iterasi++) {
            // ln P dan ln(1 − P) setiap soal di setiap titik, dihitung sekali per iterasi.
            $tabel = [];
            foreach ($param as $soalId => $p) {
                foreach ($grid as $k => $theta) {
                    $tabel[$soalId][1][$k] = self::logPeluang($p['a'], $p['b'], $theta, 1);
                    $tabel[$soalId][0][$k] = self::logPeluang($p['a'], $p['b'], $theta, 0);
                }
            }

            // E-step: posterior tiap peserta, dijumlahkan per soal karena jumlah penjawab tiap soal berbeda.
            $n = $r = array_fill_keys(array_keys($param), $nol);
            foreach ($jawaban as $isi) {
                $log = $logPrior;
                foreach ($isi as $soalId => $u) {
                    foreach ($tabel[$soalId][(int) $u] as $k => $nilai) {
                        $log[$k] += $nilai;
                    }
                }
                $post = self::normalkan($log);

                foreach ($isi as $soalId => $u) {
                    foreach ($post as $k => $bobot) {
                        $n[$soalId][$k] += $bobot;
                        if ((int) $u === 1) {
                            $r[$soalId][$k] += $bobot;
                        }
                    }
                }
            }

            // M-step: soal tanpa penjawab tetap memakai parameter awal.
            $ubah = 0.0;
            foreach ($param as $soalId => $p) {
                if (array_sum($n[$soalId]) <= 0.0) {
                    continue;
                }

                $baru = self::mStep($p['a'], $p['b'], self::B_AWAL[$label[$soalId]], $n[$soalId], $r[$soalId], $grid);
                $ubah = max($ubah, abs($baru['a'] - $p['a']), abs($baru['b'] - $p['b']));
                $param[$soalId] = $baru;
            }

            if ($ubah < self::TOLERANSI_KONVERGEN) {
                return ['parameter' => $param, 'iterasi' => $iterasi, 'konvergen' => true];
            }
        }

        return ['parameter' => $param, 'iterasi' => self::MAKS_ITERASI, 'konvergen' => false];
    }

    /**
     * M-step satu soal: maksimalkan kecocokan dengan data ditambah prior label, dengan Fisher scoring pada (ln a, b).
     *
     * @param  float[]  $n  perkiraan jumlah penjawab di tiap titik grid
     * @param  float[]  $r  perkiraan jumlah penjawab benar di tiap titik grid
     * @param  float[]  $grid
     * @return array{a: float, b: float}
     */
    private static function mStep(float $a, float $b, float $bLabel, array $n, array $r, array $grid): array
    {
        $lnA = log($a);
        $lnAMin = log(self::BATAS_A[0]);
        $lnAMaks = log(self::BATAS_A[1]);
        $varLnA = self::PRIOR_SD_LN_A ** 2;
        $varB = self::PRIOR_SD_B ** 2;

        for ($langkah = 0; $langkah < self::MAKS_LANGKAH_NEWTON; $langkah++) {
            $a = exp($lnA);
            $s1 = $s2 = $w0 = $w1 = $w2 = 0.0;
            foreach ($grid as $k => $theta) {
                $d = $theta - $b;
                $p = 1 / (1 + exp(-$a * $d));
                $e = $r[$k] - $n[$k] * $p;
                $w = $n[$k] * $p * (1 - $p);
                $s1 += $e * $d;
                $s2 += $e;
                $w0 += $w;
                $w1 += $w * $d;
                $w2 += $w * $d * $d;
            }

            // Gradien dan informasi Fisher (data + prior). Prior membuat matriksnya selalu definit positif.
            $gA = $a * $s1 - $lnA / $varLnA;
            $gB = -$a * $s2 - ($b - $bLabel) / $varB;
            $iAA = $a * $a * $w2 + 1 / $varLnA;
            $iBB = $a * $a * $w0 + 1 / $varB;
            $iAB = -$a * $a * $w1;
            $det = $iAA * $iBB - $iAB * $iAB;

            $dA = self::batasi(($iBB * $gA - $iAB * $gB) / $det, -self::BATAS_LANGKAH_LN_A, self::BATAS_LANGKAH_LN_A);
            $dB = self::batasi(($iAA * $gB - $iAB * $gA) / $det, -self::BATAS_LANGKAH_B, self::BATAS_LANGKAH_B);
            $lnA = self::batasi($lnA + $dA, $lnAMin, $lnAMaks);
            $b = self::batasi($b + $dB, self::BATAS_B[0], self::BATAS_B[1]);

            if (abs($dA) < self::TOLERANSI_NEWTON && abs($dB) < self::TOLERANSI_NEWTON) {
                break;
            }
        }

        return ['a' => exp($lnA), 'b' => $b];
    }

    /**
     * @return float[] ln bobot awal −θ²/2 di setiap titik grid
     */
    private static function logPrior(): array
    {
        return array_map(fn ($theta) => -$theta * $theta / 2, self::grid());
    }

    // ln P(θ) untuk benar, ln(1 − P(θ)) untuk salah, dengan P(θ) = 1 / (1 + e^(−a(θ − b))).
    private static function logPeluang(float $a, float $b, float $theta, int $u): float
    {
        $z = $a * ($theta - $b);

        return $u === 1 ? -self::log1pExp(-$z) : -self::log1pExp($z);
    }

    // ln(1 + e^x) tanpa overflow untuk x besar.
    private static function log1pExp(float $x): float
    {
        return $x > 0 ? $x + log1p(exp(-$x)) : log1p(exp($x));
    }

    /**
     * @param  float[]  $log
     * @return float[]
     */
    private static function normalkan(array $log): array
    {
        $maks = max($log);
        $bobot = array_map(fn ($l) => exp($l - $maks), $log);
        $jumlah = array_sum($bobot);

        return array_map(fn ($w) => $w / $jumlah, $bobot);
    }

    private static function batasi(float $nilai, float $min, float $maks): float
    {
        return max($min, min($maks, $nilai));
    }
}
