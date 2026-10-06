<?php

namespace App\Services;

use App\Models\JawabanPengerjaan;
use App\Models\Pengerjaan;
use App\Models\PengerjaanSubtes;
use App\Models\TryOutSubtes;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Satu-satunya jalur yang menulis jawaban Try Out ke database (RANCANGAN-tryout.md 5.7). Dipanggil saat subtes
 * terakhir dikirim, saat periode berakhir, atau saat penutupan lazy. Idempoten: pengerjaan yang sudah selesai
 * dilewati, sehingga XP tidak tercatat dua kali.
 */
class SelesaikanTryOut
{
    public function __construct(private PenilaianLatihan $penilaian, private PemeriksaBadge $badge) {}

    /**
     * @param  array<string, array{mulai: ?string, selesai: ?string, jawaban: array<string, array{opsiIds: string[], jawabanIsian: ?string, pilihanKolom?: array<string, int>}>}>  $catatan
     */
    public function jalankan(Pengerjaan $pengerjaan, array $catatan, CarbonInterface $waktuSelesai): void
    {
        $baru = DB::transaction(function () use ($pengerjaan, $catatan, $waktuSelesai) {
            // Kunci baris: penutupan lazy dan kirim otomatis bisa berjalan bersamaan; yang kedua melihat 'selesai'.
            $p = Pengerjaan::whereKey($pengerjaan->id)->lockForUpdate()->first();
            if (! $p || $p->status !== 'berjalan') {
                return false;
            }

            $subtesPaket = TryOutSubtes::where('try_out_id', $p->try_out_id)
                ->orderBy('urutan')
                ->with(['soal' => fn ($q) => $q
                    ->select('soal.id', 'soal.tipe', 'soal.kunci_jawaban', 'soal.tingkat_kesulitan')
                    ->with('opsiJawaban:id,soal_id,is_kunci,kunci_kolom')])
                ->get();

            $jawabanModel = new JawabanPengerjaan;
            $baris = [];
            $totalXp = 0;
            $totalPoin = 0;

            foreach ($subtesPaket as $tryOutSubtes) {
                $c = $catatan[$tryOutSubtes->id] ?? null;

                $pengerjaanSubtes = PengerjaanSubtes::create([
                    'pengerjaan_id' => $p->id,
                    'try_out_subtes_id' => $tryOutSubtes->id,
                    // Subtes yang tidak sempat dimulai (periode berakhir lebih dulu) tidak punya waktu.
                    'waktu_mulai' => $c['mulai'] ?? null,
                    'waktu_selesai' => $c['selesai'] ?? null,
                    'skor_subtes' => null,
                ]);

                foreach ($tryOutSubtes->soal as $soal) {
                    $j = $c['jawaban'][$soal->id] ?? null;
                    if ($j === null) {
                        continue;
                    }

                    $hasil = PenilaianJawaban::nilai(
                        $soal->tipe,
                        $soal->opsiJawaban->pluck('id')->all(),
                        $soal->opsiJawaban->where('is_kunci', true)->pluck('id')->all(),
                        $soal->kunci_jawaban,
                        $j['opsiIds'] ?? [],
                        $j['jawabanIsian'] ?? null,
                        // Majemuk_tabel: semua pernyataan harus sesuai kolom kuncinya (MajemukTabel::benar).
                        $soal->opsiJawaban->pluck('kunci_kolom', 'id')->all(),
                        $j['pilihanKolom'] ?? [],
                    );
                    if ($hasil === null) {
                        continue;
                    }

                    // Hint tidak ada di Try Out.
                    $hadiah = PenilaianLatihan::hadiah($soal->tingkat_kesulitan, $hasil['benar'], false);

                    $baris[] = [
                        'id' => $jawabanModel->newUniqueId(),
                        'pengerjaan_id' => $p->id,
                        'pengerjaan_subtes_id' => $pengerjaanSubtes->id,
                        'soal_id' => $soal->id,
                        // Bulk insert melewati mutator Eloquent; kolom per tipe soal dari kolomJawaban().
                        ...JawabanPengerjaan::kolomJawaban($soal->tipe, $hasil['opsiIds'], $hasil['jawabanIsian'], $hasil['pilihanKolom']),
                        'is_correct' => $hasil['benar'],
                        'skor' => $hadiah['poin'],
                        'waktu_menjawab' => $c['selesai'] ?? $waktuSelesai->toIso8601String(),
                        'pakai_hint' => false,
                    ];

                    $totalXp += $hadiah['xp'];
                    $totalPoin += $hadiah['poin'];
                }
            }

            if ($baris !== []) {
                JawabanPengerjaan::insert($baris);
            }

            $this->penilaian->catatHadiah($p->user_id, $p->id, $totalXp, $totalPoin, $waktuSelesai);

            // total_skor tetap NULL sampai skor IRT dihitung setelah paket ditutup (T15).
            $p->update(['status' => 'selesai', 'finished_at' => $waktuSelesai]);

            return true;
        });

        session()->forget(SesiTryOut::kunciSesi($pengerjaan->id));

        // Debut TO dan jumlah soal (RANCANGAN-badge-avatar.md 4.4). Siswa diambil dari pengerjaan, karena penilaian
        // batch juga menutup pengerjaan siswa lain. Benar/salah Try Out diperiksa lagi saat paket dinilai.
        if ($baru) {
            $this->badge->periksa($pengerjaan->user_id, $waktuSelesai);
        }
    }
}
