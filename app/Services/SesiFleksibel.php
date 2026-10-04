<?php

namespace App\Services;

use App\Models\JawabanPengerjaan;
use App\Models\Pengerjaan;
use App\Models\Soal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Latihan fleksibel yang disimpan di database (RANCANGAN-RENCANA-save-fleksibel.md bagian 5.3). Pengerjaan dibuat
 * berstatus berjalan saat Mulai, setiap Simpan Jawaban langsung menulis satu baris jawaban, dan XP diberikan saat
 * Selesaikan. Jawaban di sesi yang masih berjalan tidak terbaca pemilih soal, remedial, maupun penguasaan, karena
 * semuanya hanya membaca pengerjaan 'selesai'.
 */
class SesiFleksibel
{
    public function __construct(private PenilaianLatihan $penilaian) {}

    /** Sesi fleksibel berjalan milik siswa di satu subtes; paling banyak satu (SF5). */
    public function aktif(string $userId, string $subtesId): ?Pengerjaan
    {
        return $this->milikSiswa($userId)->where('status', 'berjalan')->where('subtes_id', $subtesId)->first();
    }

    /** Sesi fleksibel berjalan milik siswa. Null bila tidak ada, sudah selesai, atau milik siswa lain. */
    public function cari(string $userId, string $id): ?Pengerjaan
    {
        return $this->milikSiswa($userId)->where('status', 'berjalan')->whereKey($id)->first();
    }

    /** Pengerjaan fleksibel milik siswa dalam status apa pun, untuk Selesaikan yang dikirim ulang (SF14). */
    public function milik(string $userId, string $id): ?Pengerjaan
    {
        return $this->milikSiswa($userId)->whereKey($id)->first();
    }

    /**
     * Buat sesi berjalan (SF2). Null bila index pengerjaan_fleksibel_berjalan_satu menolak, mis. Mulai diklik dua kali.
     * ON CONFLICT DO NOTHING tidak melempar error, jadi transaksi pemanggil tidak ikut batal.
     *
     * @param  string[]  $soalIds  urut tampil
     */
    public function buat(string $userId, string $subtesId, array $soalIds, bool $iceBreakingAktif): ?Pengerjaan
    {
        $id = (new Pengerjaan)->newUniqueId();

        $masuk = DB::table('pengerjaan')->insertOrIgnore([
            'id' => $id,
            'user_id' => $userId,
            'tipe' => 'latihan_bebas',
            'status' => 'berjalan',
            'subtes_id' => $subtesId,
            'jumlah_soal_dipilih' => count($soalIds),
            'ice_breaking_aktif' => $iceBreakingAktif,
            'started_at' => now(),
            'total_skor' => 0,
            'mode_latihan' => 'fleksibel',
            // Literal array Postgres: insert lewat query builder tidak mengubah array PHP menjadi uuid[].
            'soal_ids' => '{'.implode(',', $soalIds).'}',
        ]);

        return $masuk === 1 ? Pengerjaan::find($id) : null;
    }

    /**
     * Isi halaman kerjakan selain soal (SF4): jawaban yang sudah tersimpan beserta umpan baliknya, dan teks hint yang
     * sudah dibuka. $soalList adalah soal yang dimuat controller untuk props; kunci dan pembahasan tetap terbaca dari
     * model walaupun sudah di-makeHidden. Soal yang sudah dihapus dari bank dilewati.
     *
     * @param  Collection<int, Soal>  $soalList  dengan opsiJawaban urut `urutan`
     * @return array{jawabanTersimpan: array<int, array{soalId: string, opsiIds: string[], jawabanIsian: ?string, hasil: array}>, hintTerbuka: array<string, string>}
     */
    public function muat(Pengerjaan $p, Collection $soalList): array
    {
        $soalMap = $soalList->keyBy('id');
        $jawaban = JawabanPengerjaan::where('pengerjaan_id', $p->id)
            ->get(['soal_id', 'opsi_dipilih_id', 'opsi_dipilih_ids', 'jawaban_isian', 'is_correct'])
            ->keyBy('soal_id');

        $tersimpan = [];
        foreach ($p->soal_ids as $soalId) {
            $j = $jawaban->get($soalId);
            $soal = $soalMap->get($soalId);

            if ($j && $soal) {
                $tersimpan[] = [
                    'soalId' => $soalId,
                    'opsiIds' => $j->opsi_dipilih_id !== null ? [$j->opsi_dipilih_id] : $j->opsi_dipilih_ids,
                    'jawabanIsian' => $j->jawaban_isian,
                    'hasil' => PembahasanPengerjaan::umpanBalikSoal($soal, (bool) $j->is_correct),
                ];
            }
        }

        $hintTerbuka = [];
        foreach ($p->hint_soal_ids as $soalId) {
            $hint = $soalMap->get($soalId)?->hint;

            if (filled($hint)) {
                $hintTerbuka[$soalId] = $hint;
            }
        }

        return ['jawabanTersimpan' => $tersimpan, 'hintTerbuka' => $hintTerbuka];
    }

    /**
     * Nilai dan simpan satu jawaban (SF2). Jawaban yang sudah tersimpan tidak dinilai ulang: ON CONFLICT DO NOTHING
     * mempertahankan baris lama, lalu balasan dibentuk dari baris itu (SF14).
     *
     * @param  array<int, string>  $opsiIds
     * @return array{benar: bool, kunciOpsiIds: string[], kunci: string, pembahasan: ?string}
     *
     * @throws ValidationException soal bukan bagian sesi, atau jawaban kosong
     */
    public function jawab(Pengerjaan $p, string $soalId, array $opsiIds, ?string $jawabanIsian): array
    {
        if (! in_array($soalId, $p->soal_ids, true)) {
            throw ValidationException::withMessages(['soalId' => 'Soal ini bukan bagian dari sesi latihan.']);
        }

        $soal = Soal::with(['opsiJawaban' => fn ($q) => $q->orderBy('urutan')])
            ->findOrFail($soalId, ['id', 'tipe', 'kunci_jawaban', 'pembahasan', 'tingkat_kesulitan']);

        $hasil = PenilaianJawaban::nilai(
            $soal->tipe,
            $soal->opsiJawaban->pluck('id')->all(),
            $soal->opsiJawaban->where('is_kunci', true)->pluck('id')->all(),
            $soal->kunci_jawaban,
            $opsiIds,
            $jawabanIsian,
        );

        if ($hasil === null) {
            throw ValidationException::withMessages(['jawaban' => 'Jawaban tidak boleh kosong.']);
        }

        $pakaiHint = in_array($soalId, $p->hint_soal_ids, true);

        $masuk = DB::table('jawaban_pengerjaan')->insertOrIgnore([
            'id' => (new JawabanPengerjaan)->newUniqueId(),
            'pengerjaan_id' => $p->id,
            'pengerjaan_subtes_id' => null,
            'soal_id' => $soalId,
            ...JawabanPengerjaan::kolomJawaban($soal->tipe, $hasil['opsiIds'], $hasil['jawabanIsian']),
            'is_correct' => $hasil['benar'],
            // Poin jawaban ini; XP dihitung ulang saat Selesaikan (SF10).
            'skor' => PenilaianLatihan::hadiah($soal->tingkat_kesulitan, $hasil['benar'], $pakaiHint)['poin'],
            'waktu_menjawab' => now(),
            'pakai_hint' => $pakaiHint,
        ]);

        $benar = $masuk === 1
            ? $hasil['benar']
            : (bool) JawabanPengerjaan::where('pengerjaan_id', $p->id)->where('soal_id', $soalId)->value('is_correct');

        return PembahasanPengerjaan::umpanBalikSoal($soal, $benar);
    }

    /**
     * Catat bahwa hint soal ini dibuka (SF9). Tidak dicatat bila sudah tercatat, atau bila soal sudah dijawab karena
     * nilainya sudah final. Keanggotaan soal di sesi diperiksa pemanggil.
     */
    public function bukaHint(Pengerjaan $p, string $soalId): void
    {
        DB::update(<<<'SQL'
            update pengerjaan set hint_soal_ids = array_append(hint_soal_ids, ?::uuid)
            where id = ?
              and not (?::uuid = any(hint_soal_ids))
              and not exists (select 1 from jawaban_pengerjaan j where j.pengerjaan_id = pengerjaan.id and j.soal_id = ?::uuid)
            SQL, [$soalId, $p->id, $soalId, $soalId]);
    }

    /**
     * Selesaikan sesi (SF10). Baris pengerjaan dikunci dulu, jadi permintaan kedua yang datang bersamaan menunggu,
     * lalu melihat status 'selesai' dan tidak memberi XP lagi (SF14). Penguasaan topik diperbarui pemanggil sesudah
     * transaksi, sama seperti jalur session.
     *
     * @return array{0: Pengerjaan, 1: string[]} pengerjaan, dan topik yang punya jawaban (kosong bila sudah selesai)
     */
    public function selesaikan(Pengerjaan $p): array
    {
        return DB::transaction(function () use ($p) {
            $p = Pengerjaan::lockForUpdate()->findOrFail($p->id);

            if ($p->status !== 'berjalan') {
                return [$p, []];
            }

            $baris = DB::table('jawaban_pengerjaan as j')
                ->join('soal as q', 'q.id', '=', 'j.soal_id')
                ->where('j.pengerjaan_id', $p->id)
                ->get(['j.is_correct', 'j.pakai_hint', 'j.skor', 'q.tingkat_kesulitan', 'q.topik_id']);

            $xp = 0;
            $poin = 0;
            foreach ($baris as $b) {
                $xp += PenilaianLatihan::hadiah($b->tingkat_kesulitan, (bool) $b->is_correct, (bool) $b->pakai_hint)['xp'];
                $poin += (int) $b->skor;
            }

            $selesai = now();
            $p->update(['status' => 'selesai', 'finished_at' => $selesai, 'total_skor' => $poin]);
            $this->penilaian->catatHadiah($p->user_id, $p->id, $xp, $poin, $selesai);

            return [$p, array_values(array_unique($baris->pluck('topik_id')->all()))];
        });
    }

    /** Pengerjaan latihan fleksibel milik siswa. */
    private function milikSiswa(string $userId): Builder
    {
        return Pengerjaan::where('user_id', $userId)->where('mode_latihan', 'fleksibel');
    }
}
