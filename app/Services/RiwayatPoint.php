<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Riwayat point di Akun Pribadi (SDD FR29). Keterangan dibuat dari sumber transaksi, dengan label jenis sesi yang
 * sama seperti halaman Riwayat (FilterRiwayat::JENIS).
 */
class RiwayatPoint
{
    /**
     * Transaksi point terbaru siswa: positif = didapat, negatif = dipakai membeli avatar.
     *
     * @return array<int, array{id: string, tanggal: string, keterangan: string, jumlah: int}>
     */
    public function terbaru(string $userId, int $batas = 10): array
    {
        return DB::table('point_transactions as t')
            ->leftJoin('pengerjaan as p', 'p.id', '=', 't.pengerjaan_id')
            ->leftJoin('subtes as s', 's.id', '=', 'p.subtes_id')
            ->leftJoin('try_out as o', 'o.id', '=', 'p.try_out_id')
            ->leftJoin('avatar as a', 'a.id', '=', 't.avatar_id')
            ->where('t.user_id', $userId)
            ->orderByDesc('t.created_at')
            ->limit($batas)
            ->get(['t.id', 't.created_at', 't.jumlah', 't.sumber_tipe', 'p.mode_latihan', 's.nama_subtes', 'o.judul', 'a.nama as nama_avatar'])
            ->map(fn ($b) => [
                'id' => $b->id,
                'tanggal' => Carbon::parse($b->created_at)->toIso8601String(),
                'keterangan' => self::keterangan($b->sumber_tipe, $b->mode_latihan, $b->nama_subtes, $b->judul, $b->nama_avatar),
                'jumlah' => (int) $b->jumlah,
            ])
            ->all();
    }

    public static function keterangan(string $sumber, ?string $mode, ?string $namaSubtes, ?string $judulTryOut, ?string $namaAvatar): string
    {
        if ($sumber === 'avatar') {
            return 'Beli avatar '.$namaAvatar;
        }

        if ($judulTryOut !== null) {
            return 'Try Out · '.$judulTryOut;
        }

        $jenis = FilterRiwayat::JENIS[$mode ?? ''] ?? 'Latihan';

        return $namaSubtes !== null ? $jenis.' · '.$namaSubtes : $jenis;
    }
}
