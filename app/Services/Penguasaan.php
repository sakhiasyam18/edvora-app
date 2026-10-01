<?php

namespace App\Services;

use InvalidArgumentException;

/**
 * Skor penguasaan dan tahap per siswa × topik, khusus mode fleksibel.
 *
 * Jendela = 20 jawaban terakhir siswa di satu topik, satu jawaban per soal (yang terbaru).
 * Jendela tidak dikosongkan saat pindah tahap: jawaban baru menggeser yang paling lama masuk.
 * Skor dan tahap baru dinilai setelah jendela berisi 20 jawaban.
 *
 * Satu jawaban di jendela berbentuk ['soal' => kode_soal, 'tingkat' => 'mudah'|'sedang'|'sulit',
 * 'benar' => bool, 'hint' => bool], diurutkan dari yang paling lama masuk.
 */
class Penguasaan
{
    public const JENDELA = 20;

    // Urutan kunci juga urutan masuk jawaban di dalam satu sesi: mudah, sedang, sulit.
    public const BOBOT = ['mudah' => 1.0, 'sedang' => 2.0, 'sulit' => 3.0];

    public const NILAI_HINT = 0.5;

    public const BATAS_NAIK = 75;

    public const BATAS_TURUN = 35;

    public const TAHAP_AWAL = 1;

    public const TAHAP_AKHIR = 3;

    // Porsi soal yang disajikan di tiap tahap, dalam persen. Tahap membuka satu tingkat baru
    // dan tetap memuat tingkat di bawahnya.
    public const PORSI_PER_TAHAP = [
        1 => ['mudah' => 100],
        2 => ['mudah' => 40, 'sedang' => 60],
        3 => ['mudah' => 20, 'sedang' => 30, 'sulit' => 50],
    ];

    // Topik yang belum dikuasai setelah sekian soal di tahap yang sama menjadi prioritas rekomendasi.
    public const BATAS_PRIORITAS = 60;

    /**
     * Skor = 100 × Σ(bobot × nilai) / Σ(bobot), atas jawaban yang diberikan.
     * Tidak memeriksa isi jendela; untuk skor yang ditampilkan, pakai skorJendela().
     */
    public static function skor(array $jawaban): float
    {
        $pembilang = 0.0;
        $penyebut = 0.0;

        foreach ($jawaban as $j) {
            $bobot = self::bobot($j['tingkat']);
            $pembilang += $bobot * self::nilai($j['benar'], $j['hint'] ?? false);
            $penyebut += $bobot;
        }

        return $penyebut > 0 ? round(100 * $pembilang / $penyebut, 2) : 0.0;
    }

    /**
     * Skor jendela, atau null bila jendela belum berisi 20 jawaban (belum cukup data).
     */
    public static function skorJendela(array $jendela): ?float
    {
        $jendela = self::potongJendela($jendela);

        return count($jendela) < self::JENDELA ? null : self::skor($jendela);
    }

    /**
     * Masukkan jawaban satu sesi ke jendela.
     * Di dalam sesi, jawaban masuk berurutan mudah, sedang, sulit, lalu menurut kode soal.
     * Soal yang dijawab ulang pindah ke posisi terbaru. Jawaban yang tergeser keluar tidak dihitung lagi.
     */
    public static function geserJendela(array $jendela, array $jawabanSesi): array
    {
        $urutanTingkat = array_flip(array_keys(self::BOBOT));

        foreach ($jawabanSesi as $j) {
            self::bobot($j['tingkat']);
        }

        usort($jawabanSesi, fn ($a, $b) => [$urutanTingkat[$a['tingkat']], $a['soal']] <=> [$urutanTingkat[$b['tingkat']], $b['soal']]);

        $dijawabUlang = array_column($jawabanSesi, 'soal');
        $sisa = array_filter($jendela, fn ($j) => ! in_array($j['soal'], $dijawabUlang, true));

        return self::potongJendela([...array_values($sisa), ...$jawabanSesi]);
    }

    /**
     * Tahap setelah sesi selesai. $skor null berarti jendela belum berisi 20 jawaban, jadi tahap tetap.
     */
    public static function tahapBerikutnya(int $tahap, ?float $skor): int
    {
        if ($skor === null) {
            return $tahap;
        }

        if ($skor >= self::BATAS_NAIK && $tahap < self::TAHAP_AKHIR) {
            return $tahap + 1;
        }

        if ($skor < self::BATAS_TURUN && $tahap > self::TAHAP_AWAL) {
            return $tahap - 1;
        }

        return $tahap;
    }

    public static function dikuasai(int $tahap, ?float $skor): bool
    {
        return $tahap === self::TAHAP_AKHIR && $skor !== null && $skor >= self::BATAS_NAIK;
    }

    /**
     * Isi lingkaran 0–1 menuju batas naik, atau null bila jendela belum penuh
     * (frontend lalu menampilkan "n dari 20 soal").
     */
    public static function isiLingkaran(?float $skor): ?float
    {
        return $skor === null ? null : min(1.0, $skor / self::BATAS_NAIK);
    }

    /**
     * Label dibaca dari tahap, karena skor 80 di tahap 1 (soal mudah) tidak setara dengan skor 80 di tahap 3.
     */
    public static function label(int $tahap, ?float $skor): string
    {
        return match (true) {
            $skor === null => 'belum_cukup_data',
            self::dikuasai($tahap, $skor) => 'dikuasai',
            $tahap === self::TAHAP_AWAL => 'belum_dikuasai',
            default => 'berkembang',
        };
    }

    /**
     * Keadaan satu topik setelah satu sesi selesai. $jendela sudah memuat jawaban sesi itu (lihat geserJendela()).
     * $nSejakTahap = jumlah soal yang dikerjakan sejak tahap terakhir berubah, termasuk sesi ini;
     * kembali 0 bila tahap berubah di sesi ini.
     *
     * @return array{tahap: int, skor: ?float, n_jendela: int, n_di_tahap: int, berubah: bool}
     */
    public static function setelahSesi(int $tahap, array $jendela, int $nSejakTahap): array
    {
        $skor = self::skorJendela($jendela);
        $tahapBaru = self::tahapBerikutnya($tahap, $skor);
        $berubah = $tahapBaru !== $tahap;

        return [
            'tahap' => $tahapBaru,
            'skor' => $skor,
            'n_jendela' => count(self::potongJendela($jendela)),
            'n_di_tahap' => $berubah ? 0 : $nSejakTahap,
            'berubah' => $berubah,
        ];
    }

    /**
     * Topik prioritas: belum dikuasai padahal sudah 60 soal dikerjakan di tahap yang sama,
     * mis. masih di tahap 1 setelah 60 soal. Frontend menampilkannya paling atas.
     */
    public static function prioritas(int $tahap, ?float $skor, int $nDiTahap): bool
    {
        return ! self::dikuasai($tahap, $skor) && $nDiTahap >= self::BATAS_PRIORITAS;
    }

    /**
     * Urutan rekomendasi: topik prioritas dulu, lalu tahap terendah, lalu skor terendah.
     * Topik yang belum punya skor ditaruh sesudah yang sudah punya di tahap yang sama; yang setara tetap di urutan asal.
     *
     * @param  array<int, array{tahap: int, skor: ?float, prioritas: bool}>  $topikList
     */
    public static function urutkanRekomendasi(array $topikList): array
    {
        usort($topikList, fn ($a, $b) => [! $a['prioritas'], $a['tahap'], $a['skor'] === null, $a['skor'] ?? 0.0]
            <=> [! $b['prioritas'], $b['tahap'], $b['skor'] === null, $b['skor'] ?? 0.0]);

        return $topikList;
    }

    /**
     * Jumlah soal per tingkat untuk satu sesi, sesuai porsi tahap.
     * Sisa pembulatan diberikan ke tingkat dengan pecahan terbesar; bila sama, ke tingkat yang lebih sulit.
     *
     * @return array<string, int> tingkat => jumlah soal, urut mudah ke sulit
     */
    public static function jatahSoal(int $tahap, int $jumlahSoal): array
    {
        $porsi = self::PORSI_PER_TAHAP[$tahap] ?? throw new InvalidArgumentException("Tahap {$tahap} tidak dikenal.");

        $jatah = [];
        $pecahan = [];
        foreach ($porsi as $tingkat => $persen) {
            $tepat = $jumlahSoal * $persen / 100;
            $jatah[$tingkat] = (int) floor($tepat);
            $pecahan[$tingkat] = $tepat - $jatah[$tingkat];
        }

        // Dibalik dulu supaya tingkat yang lebih sulit menang saat pecahannya sama (usort stabil).
        $urutan = array_reverse(array_keys($pecahan));
        usort($urutan, fn ($a, $b) => $pecahan[$b] <=> $pecahan[$a]);

        foreach (array_slice($urutan, 0, $jumlahSoal - array_sum($jatah)) as $tingkat) {
            $jatah[$tingkat]++;
        }

        return $jatah;
    }

    public static function nilai(bool $benar, bool $pakaiHint): float
    {
        if (! $benar) {
            return 0.0;
        }

        return $pakaiHint ? self::NILAI_HINT : 1.0;
    }

    public static function bobot(string $tingkat): float
    {
        return self::BOBOT[$tingkat] ?? throw new InvalidArgumentException("Tingkat kesulitan \"{$tingkat}\" tidak dikenal.");
    }

    // Jendela hanya memuat 20 jawaban terakhir; yang lebih lama tidak dihitung lagi.
    private static function potongJendela(array $jendela): array
    {
        return array_values(array_slice($jendela, -self::JENDELA));
    }
}
