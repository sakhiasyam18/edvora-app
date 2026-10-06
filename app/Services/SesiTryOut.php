<?php

namespace App\Services;

use App\Models\Pengerjaan;
use App\Models\TryOut;
use Carbon\CarbonImmutable;
use LogicException;

/**
 * Posisi siswa di Try Out: subtes aktif, batas waktunya, dan subtes yang sudah ditutup (RANCANGAN-tryout.md 5.3–5.6).
 * Jawaban disimpan di session 'tryout.{pengerjaanId}.subtes' sampai SelesaikanTryOut menulisnya ke database.
 * Inti perhitungannya fungsi statis murni (posisi(), terimaKiriman()) supaya bisa diuji tanpa database.
 */
class SesiTryOut
{
    // Jeda jaringan yang masih diterima setelah batas subtes, untuk kirim otomatis saat waktu habis.
    public const TOLERANSI_DETIK = 30;

    public function __construct(private SelesaikanTryOut $selesaikan) {}

    public static function kunciSesi(string $pengerjaanId): string
    {
        return "tryout.{$pengerjaanId}";
    }

    /**
     * Hitung subtes aktif dari catatan session dan jam. Session hilang = catatan kosong: posisi dihitung dari jam,
     * seolah setiap subtes memakai waktu penuh sejak pengerjaan dimulai, dan jawaban subtes sebelumnya kosong.
     *
     * @param  array<int, array{id: string, menit: float}>  $subtesList  subtes paket, urut
     * @param  array<string, array{mulai: string, selesai: ?string, jawaban: array}>  $catatan
     * @return array{catatan: array, aktif: ?string, batas: ?CarbonImmutable, selesai: bool, waktuSelesai: ?CarbonImmutable}
     */
    public static function posisi(array $subtesList, array $catatan, CarbonImmutable $mulaiPengerjaan, CarbonImmutable $selesaiAt, CarbonImmutable $sekarang): array
    {
        // Kursor = saat subtes berikutnya dimulai.
        $kursor = $mulaiPengerjaan;

        foreach ($subtesList as $subtes) {
            $c = $catatan[$subtes['id']] ?? null;

            if ($c !== null && $c['selesai'] !== null) {
                $kursor = CarbonImmutable::parse($c['selesai']);

                continue;
            }

            // Periode berakhir sebelum subtes ini dimulai: subtes ini dan sisanya tidak dikerjakan.
            if ($kursor->gte($selesaiAt)) {
                break;
            }

            $mulai = $c !== null ? CarbonImmutable::parse($c['mulai']) : $kursor;
            $akhir = $mulai->addSeconds((int) round($subtes['menit'] * 60));
            $batas = $akhir->lt($selesaiAt) ? $akhir : $selesaiAt;
            $jawaban = $c['jawaban'] ?? [];

            if ($sekarang->lt($batas)) {
                $catatan[$subtes['id']] = ['mulai' => $mulai->toIso8601String(), 'selesai' => null, 'jawaban' => $jawaban];

                return ['catatan' => $catatan, 'aktif' => $subtes['id'], 'batas' => $batas, 'selesai' => false, 'waktuSelesai' => null];
            }

            // Waktu subtes habis tanpa dikirim: ditutup pada batasnya dengan jawaban yang sudah tercatat.
            $catatan[$subtes['id']] = ['mulai' => $mulai->toIso8601String(), 'selesai' => $batas->toIso8601String(), 'jawaban' => $jawaban];
            $kursor = $batas;
        }

        return ['catatan' => $catatan, 'aktif' => null, 'batas' => null, 'selesai' => true, 'waktuSelesai' => $kursor];
    }

    /**
     * Catat kiriman Simpan Soal, Simpan Jawaban, atau waktu habis untuk satu subtes.
     * - Subtes aktif: jawaban dicatat, subtes ditutup sekarang, dan subtes berikutnya dimulai sekarang.
     * - Subtes yang baru ditutup otomatis (paling lama TOLERANSI_DETIK setelah batas, belum punya jawaban):
     *   jawaban tetap dicatat.
     * - Selain itu (tab lama, tombol Back, subtes yang belum dimulai) kiriman diabaikan.
     *
     * @param  array<string, array{opsiIds: string[], jawabanIsian: ?string, pilihanKolom: array<string, int>}>  $jawaban  soal_id => jawaban, sudah disaring ke soal subtes ini
     */
    public static function terimaKiriman(array $subtesList, array $catatan, CarbonImmutable $mulaiPengerjaan, CarbonImmutable $selesaiAt, CarbonImmutable $sekarang, string $subtesId, array $jawaban): array
    {
        $catatan = self::posisi($subtesList, $catatan, $mulaiPengerjaan, $selesaiAt, $sekarang)['catatan'];
        $c = $catatan[$subtesId] ?? null;
        $aktif = $c !== null && $c['selesai'] === null;

        if ($aktif) {
            $catatan[$subtesId] = ['mulai' => $c['mulai'], 'selesai' => $sekarang->toIso8601String(), 'jawaban' => $jawaban];

            // Subtes berikutnya mulai sekarang; posisi() di bawah menyelesaikan pengerjaan bila ini subtes terakhir.
            $ids = array_column($subtesList, 'id');
            $berikut = $ids[array_search($subtesId, $ids, true) + 1] ?? null;
            if ($berikut !== null && $sekarang->lt($selesaiAt)) {
                $catatan[$berikut] = ['mulai' => $sekarang->toIso8601String(), 'selesai' => null, 'jawaban' => []];
            }
        } elseif ($c !== null && $c['jawaban'] === []
            && $sekarang->lte(CarbonImmutable::parse($c['selesai'])->addSeconds(self::TOLERANSI_DETIK))) {
            $catatan[$subtesId]['jawaban'] = $jawaban;
        }

        return self::posisi($subtesList, $catatan, $mulaiPengerjaan, $selesaiAt, $sekarang);
    }

    /**
     * Penutupan lazy (T14): hitung posisi satu pengerjaan berjalan, simpan catatannya ke session, dan selesaikan
     * pengerjaan bila waktunya sudah habis.
     */
    public function rapikan(Pengerjaan $pengerjaan): array
    {
        [$subtesList, $mulai, $selesaiAt] = $this->konteks($pengerjaan);
        $catatan = session(self::kunciSesi($pengerjaan->id).'.subtes', []);

        return $this->simpan($pengerjaan, self::posisi($subtesList, $catatan, $mulai, $selesaiAt, CarbonImmutable::now()));
    }

    /**
     * @param  array<string, array{opsiIds: string[], jawabanIsian: ?string, pilihanKolom: array<string, int>}>  $jawaban
     */
    public function terima(Pengerjaan $pengerjaan, string $subtesId, array $jawaban): array
    {
        [$subtesList, $mulai, $selesaiAt] = $this->konteks($pengerjaan);
        $catatan = session(self::kunciSesi($pengerjaan->id).'.subtes', []);

        return $this->simpan($pengerjaan, self::terimaKiriman($subtesList, $catatan, $mulai, $selesaiAt, CarbonImmutable::now(), $subtesId, $jawaban));
    }

    // Pengerjaan Try Out siswa yang masih berjalan; dipanggil di awal daftar Try Out dan Riwayat.
    public function rapikanMilik(string $userId): void
    {
        Pengerjaan::where('user_id', $userId)
            ->where('tipe', 'try_out')
            ->where('status', 'berjalan')
            ->get()
            ->each(fn (Pengerjaan $p) => $this->rapikan($p));
    }

    /**
     * Penutupan saat paket dinilai (RANCANGAN-irt.md 5.4). Proses batch tidak bisa membaca session siswa, jadi
     * pengerjaan diselesaikan dengan catatan kosong, sama dengan jalur session hilang (T14).
     */
    public function tutupTanpaSesi(Pengerjaan $pengerjaan): void
    {
        [$subtesList, $mulai, $selesaiAt] = $this->konteks($pengerjaan);
        $posisi = self::posisi($subtesList, [], $mulai, $selesaiAt, CarbonImmutable::now());

        if (! $posisi['selesai']) {
            throw new LogicException("Pengerjaan {$pengerjaan->id} belum bisa ditutup: periode paket belum berakhir.");
        }

        $this->selesaikan->jalankan($pengerjaan, $posisi['catatan'], $posisi['waktuSelesai']);
    }

    /**
     * @return array{0: array<int, array{id: string, menit: float}>, 1: CarbonImmutable, 2: CarbonImmutable}
     */
    private function konteks(Pengerjaan $pengerjaan): array
    {
        $tryOut = TryOut::with('subtesPaket:id,try_out_id,urutan,waktu_menit')->findOrFail($pengerjaan->try_out_id);

        return [
            $tryOut->subtesPaket->map(fn ($s) => ['id' => $s->id, 'menit' => $s->waktu_menit])->all(),
            CarbonImmutable::instance($pengerjaan->started_at),
            CarbonImmutable::instance($tryOut->selesai_at),
        ];
    }

    private function simpan(Pengerjaan $pengerjaan, array $posisi): array
    {
        if ($posisi['selesai']) {
            // SelesaikanTryOut menghapus session ini setelah jawaban tersimpan.
            $this->selesaikan->jalankan($pengerjaan, $posisi['catatan'], $posisi['waktuSelesai']);
        } else {
            session()->put(self::kunciSesi($pengerjaan->id).'.subtes', $posisi['catatan']);
        }

        return $posisi;
    }
}
