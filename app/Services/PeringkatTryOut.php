<?php

namespace App\Services;

use App\Models\TryOut;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Peringkat Try Out umum dan khusus (RANCANGAN-peringkat-pembahasan-tryout.md 5.3). Pembacaan URL dan pemotongan
 * halaman berupa fungsi statis murni supaya bisa diuji tanpa database.
 */
class PeringkatTryOut
{
    public const PER_HALAMAN = 10;

    public const JUMLAH_PODIUM = 3;

    // Nilai selain 'khusus' (kosong, salah ketik, array) dianggap peringkat umum.
    public static function bacaJenis(mixed $nilai): string
    {
        return $nilai === 'khusus' ? 'khusus' : 'umum';
    }

    // Hanya bilangan bulat positif yang diterima; selain itu halaman 1.
    public static function bacaHalaman(mixed $nilai): int
    {
        return is_string($nilai) && ctype_digit($nilai) && (int) $nilai >= 1 ? (int) $nilai : 1;
    }

    public static function halamanTerakhir(int $total): int
    {
        return max(1, (int) ceil($total / self::PER_HALAMAN));
    }

    /**
     * Nomor baris (ROW_NUMBER) yang tampil di satu halaman. Halaman 1: podium 1–3 dan daftar 4–10; halaman
     * berikutnya hanya daftar 10 baris, jadi setiap halaman tetap memuat 10 peserta.
     *
     * @return array{podium: ?array{0: int, 1: int}, daftar: array{0: int, 1: int}}
     */
    public static function rentang(int $halaman): array
    {
        $akhir = $halaman * self::PER_HALAMAN;

        return $halaman === 1
            ? ['podium' => [1, self::JUMLAH_PODIUM], 'daftar' => [self::JUMLAH_PODIUM + 1, $akhir]]
            : ['podium' => null, 'daftar' => [$akhir - self::PER_HALAMAN + 1, $akhir]];
    }

    /**
     * @return array{jenis: string, tujuanSaya: ?array{universitas: string, prodi: string}, podium: array<int, array<string, mixed>>, daftar: array<int, array<string, mixed>>, posisiSaya: ?array{peringkat: int, totalPeserta: int}, halaman: array{sekarang: int, terakhir: int}}
     */
    public function untuk(TryOut $paket, string $userId, string $jenis, int $halaman): array
    {
        $prodiId = null;
        $tujuanSaya = null;

        if ($jenis === 'khusus') {
            // Prodi dibaca dari data siswa di server, bukan dari URL (leaderboard K4).
            $tujuan = DB::table('siswa as s')
                ->join('program_studi as ps', 'ps.id', '=', 's.prodi_tujuan_id')
                ->join('universitas as u', 'u.id', '=', 'ps.universitas_id')
                ->where('s.user_id', $userId)
                ->first(['ps.id', 'ps.jenjang', 'ps.nama_prodi', 'u.nama_universitas']);

            if (! $tujuan) {
                return [
                    'jenis' => $jenis,
                    'tujuanSaya' => null,
                    'podium' => [],
                    'daftar' => [],
                    'posisiSaya' => null,
                    'halaman' => ['sekarang' => 1, 'terakhir' => 1],
                ];
            }

            $prodiId = $tujuan->id;
            $tujuanSaya = ['universitas' => $tujuan->nama_universitas, 'prodi' => "{$tujuan->jenjang} {$tujuan->nama_prodi}"];
        }

        $peringkat = $this->queryPeringkat($paket->id, $prodiId);
        $total = DB::query()->fromSub($peringkat, 'r')->count();
        $terakhir = self::halamanTerakhir($total);
        $halaman = min($halaman, $terakhir);
        $rentang = self::rentang($halaman);

        $ambil = fn (array $baris) => DB::query()->fromSub($peringkat, 'r')
            ->whereBetween('baris', $baris)
            ->orderBy('baris')
            ->get()
            ->map(fn ($b) => $this->barisTampil($b, $userId))
            ->all();
        $saya = DB::query()->fromSub($peringkat, 'r')->where('user_id', $userId)->first();

        return [
            'jenis' => $jenis,
            'tujuanSaya' => $tujuanSaya,
            'podium' => $rentang['podium'] === null ? [] : $ambil($rentang['podium']),
            'daftar' => $ambil($rentang['daftar']),
            'posisiSaya' => $saya ? ['peringkat' => (int) $saya->peringkat, 'totalPeserta' => $total] : null,
            'halaman' => ['sekarang' => $halaman, 'terakhir' => $terakhir],
        ];
    }

    /**
     * Semua peserta selesai paket ini beserta peringkatnya (leaderboard 9.2). RANK() memberi angka yang sama untuk
     * skor seri; ROW_NUMBER() dengan pengurut tambahan membuat pemotongan halaman stabil.
     */
    private function queryPeringkat(string $paketId, ?string $prodiId): Builder
    {
        return DB::table('pengerjaan as p')
            ->join('siswa as s', 's.user_id', '=', 'p.user_id')
            ->leftJoin('program_studi as ps', 'ps.id', '=', 's.prodi_tujuan_id')
            ->leftJoin('universitas as u', 'u.id', '=', 'ps.universitas_id')
            ->where('p.try_out_id', $paketId)
            ->where('p.status', 'selesai')
            ->whereNotNull('p.total_skor')
            ->when($prodiId !== null, fn ($q) => $q->where('s.prodi_tujuan_id', $prodiId))
            ->select('p.user_id', 's.nama_lengkap', 'u.nama_universitas', 'ps.jenjang', 'ps.nama_prodi', 'p.total_skor')
            ->selectRaw('RANK() OVER (ORDER BY p.total_skor DESC) AS peringkat')
            ->selectRaw('ROW_NUMBER() OVER (ORDER BY p.total_skor DESC, s.nama_lengkap, p.user_id) AS baris');
    }

    /**
     * @return array{peringkat: int, nama: string, universitas: ?string, prodi: ?string, skor: float, saya: bool}
     */
    private function barisTampil(object $b, string $userId): array
    {
        return [
            'peringkat' => (int) $b->peringkat,
            'nama' => $b->nama_lengkap,
            'universitas' => $b->nama_universitas,
            'prodi' => $b->nama_prodi === null ? null : "{$b->jenjang} {$b->nama_prodi}",
            'skor' => (float) $b->total_skor,
            'saya' => $b->user_id === $userId,
        ];
    }
}
