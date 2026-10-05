<?php

namespace App\Services;

/**
 * Aturan Dashboard Analitik editor (UCS9): kapan butir soal punya cukup data, kapan butir dianggap bermasalah,
 * dan target stok soal per topik. Fungsi murni; query-nya ada di AnalitikController.
 */
class AnalitikSoal
{
    // Butir dengan jawaban sebanyak ini atau lebih dianggap cukup data untuk dinilai.
    public const MIN_RESPON = 30;

    // Tingkat kesukaran (proporsi jawaban benar) di luar rentang ini patut dicek: kunci salah atau soal terlalu mudah.
    public const P_TERLALU_SULIT = 0.10;

    public const P_TERLALU_MUDAH = 0.95;

    // Daya beda IRT (soal.irt_a) di bawah ini: soal kurang membedakan siswa yang paham dan yang tidak.
    public const IRT_A_RENDAH = 0.5;

    // Target stok soal published per topik, dan per tingkat kesulitan di dalam topik.
    public const TARGET_TOPIK = 30;

    public const TARGET_TINGKAT = 10;

    // Heatmap: akurasi jawaban dalam sekian hari terakhir, hanya topik dengan jawaban sebanyak ini atau lebih.
    public const HARI_HEATMAP = 30;

    public const MIN_JAWABAN_TOPIK = 5;

    public const MAKS_TOPIK_HEATMAP = 12;

    /**
     * Alasan butir yang sudah cukup data dianggap bermasalah, atau null bila wajar.
     *
     * @param  float  $p  proporsi jawaban benar, 0–1
     * @param  float|null  $irtA  daya beda hasil kalibrasi IRT; null bila belum dikalibrasi
     */
    public static function alasanBermasalah(float $p, ?float $irtA): ?string
    {
        if ($p < self::P_TERLALU_SULIT) {
            return 'Hampir semua siswa salah ('.self::persen($p).' benar). Cek kuncinya.';
        }

        if ($p > self::P_TERLALU_MUDAH) {
            return 'Hampir semua siswa benar ('.self::persen($p).' benar). Soal terlalu mudah.';
        }

        if ($irtA !== null && $irtA < self::IRT_A_RENDAH) {
            return 'Daya beda rendah (a = '.number_format($irtA, 2, ',', '.').').';
        }

        return null;
    }

    // 0.517 => "51,7%"
    private static function persen(float $p): string
    {
        return number_format($p * 100, 1, ',', '.').'%';
    }
}
