<?php

namespace App\Services;

use App\Models\Avatar;
use App\Models\AvatarSiswa;
use App\Models\Siswa;
use App\Models\TransaksiPoin;
use Illuminate\Support\Facades\DB;

/**
 * Toko avatar (UCS5 2b, SDD 5.3.7, RANCANGAN-badge-avatar.md bagian 5). Level akun membuka avatar; avatar didapat
 * dengan membeli memakai point. Default tidak disimpan di tabel avatar: avatar_aktif_id kosong berarti Default.
 */
class TokoAvatar
{
    public const GAMBAR_DEFAULT = [
        'perempuan' => '/images/avatar/default-perempuan.webp',
        'laki-laki' => '/images/avatar/default-laki-laki.webp',
    ];

    /**
     * Status satu avatar di toko (spec 5.1). Avatar yang sudah dimiliki tidak pernah terkunci, walaupun level_minimal
     * kelak dinaikkan tim.
     */
    public static function status(int $level, int $levelMinimal, bool $dimiliki, bool $dipakai): string
    {
        return match (true) {
            $dipakai => 'dipakai',
            $dimiliki => 'dimiliki',
            $level < $levelMinimal => 'terkunci',
            default => 'terbuka',
        };
    }

    /**
     * URL avatar aktif siswa dalam satu query, untuk bulatan profil di topbar semua halaman (shared props Inertia).
     * Akun tanpa baris siswa (admin, editor) dan siswa yang belum memakai avatar sama-sama mendapat Default.
     */
    public static function urlGambarSiswa(string $userId): string
    {
        $baris = DB::table('siswa as s')
            ->leftJoin('avatar as a', 'a.id', '=', 's.avatar_aktif_id')
            ->where('s.user_id', $userId)
            ->first(['s.jenis_kelamin', 'a.gambar_perempuan', 'a.gambar_laki_laki']);

        $avatar = $baris?->gambar_laki_laki === null
            ? null
            : new Avatar(['gambar_perempuan' => $baris->gambar_perempuan, 'gambar_laki_laki' => $baris->gambar_laki_laki]);

        return self::urlGambar($avatar, $baris?->jenis_kelamin);
    }

    /** Versi gambar sesuai jenis kelamin; $avatar null = Default. Jenis kelamin kosong memakai versi laki-laki. */
    public static function urlGambar(?Avatar $avatar, ?string $jenisKelamin): string
    {
        $perempuan = $jenisKelamin === 'perempuan';

        if ($avatar === null) {
            return self::GAMBAR_DEFAULT[$perempuan ? 'perempuan' : 'laki-laki'];
        }

        return $perempuan ? $avatar->gambar_perempuan : $avatar->gambar_laki_laki;
    }

    /**
     * Isi halaman Toko Avatar: Default lalu katalog, urut level, harga, dan nama.
     *
     * @return array<int, array{id: ?string, nama: string, gambarUrl: string, hargaPoint: int, levelMinimal: int, terkunci: bool, dimiliki: bool, dipakai: bool}>
     */
    public function daftar(Siswa $siswa): array
    {
        $level = LevelXp::dariXp((int) $siswa->xp)['level'];
        $dimiliki = AvatarSiswa::where('user_id', $siswa->user_id)->pluck('avatar_id')->all();

        $katalog = Avatar::orderBy('level_minimal')->orderBy('harga_point')->orderBy('nama')->get()
            ->map(fn (Avatar $a) => self::kartu($a, $level, $siswa->jenis_kelamin, in_array($a->id, $dimiliki, true), $siswa->avatar_aktif_id === $a->id))
            ->all();

        return [self::kartu(null, $level, $siswa->jenis_kelamin, true, $siswa->avatar_aktif_id === null), ...$katalog];
    }

    /**
     * Beli satu avatar dalam satu transaksi (UCS5 2b.2a, SDD FR32). Null bila berhasil, atau pesan gagal yang dikenal.
     * Error lain (avatar tidak ada, avatar sudah dimiliki melanggar UNIQUE) dilempar ke pemanggil; transaksinya batal.
     */
    public function beli(string $userId, string $avatarId): ?string
    {
        return DB::transaction(function () use ($userId, $avatarId) {
            $avatar = Avatar::findOrFail($avatarId);
            $xp = (int) Siswa::whereKey($userId)->value('xp');

            if (LevelXp::dariXp($xp)['level'] < $avatar->level_minimal) {
                return 'Level XP tidak mencukupi';
            }

            // Cek dan potong saldo dalam satu statement: dua pembelian bersamaan tidak bisa sama-sama lolos.
            $terpotong = Siswa::whereKey($userId)
                ->where('point', '>=', $avatar->harga_point)
                ->update(['point' => DB::raw('point - '.$avatar->harga_point)]);

            if ($terpotong === 0) {
                return 'Point tidak mencukupi';
            }

            AvatarSiswa::create(['user_id' => $userId, 'avatar_id' => $avatar->id, 'dibeli_at' => now()]);

            TransaksiPoin::create([
                'user_id' => $userId,
                'jumlah' => -$avatar->harga_point,
                'sumber_tipe' => 'avatar',
                'avatar_id' => $avatar->id,
                'created_at' => now(),
            ]);

            return null;
        });
    }

    /** Pakai avatar milik siswa; null = kembali ke Default (UCS5 2b.3). False bila avatar itu bukan miliknya. */
    public function pakai(string $userId, ?string $avatarId): bool
    {
        $query = Siswa::whereKey($userId);

        if ($avatarId !== null) {
            // Cek kepemilikan dan ganti avatar dalam satu statement.
            $query->whereExists(fn ($q) => $q->select(DB::raw(1))
                ->from('siswa_avatar')
                ->where('siswa_avatar.user_id', $userId)
                ->where('siswa_avatar.avatar_id', $avatarId));
        }

        return $query->update(['avatar_aktif_id' => $avatarId]) > 0;
    }

    /** @return array{id: ?string, nama: string, gambarUrl: string, hargaPoint: int, levelMinimal: int, terkunci: bool, dimiliki: bool, dipakai: bool} */
    private static function kartu(?Avatar $avatar, int $level, ?string $jenisKelamin, bool $dimiliki, bool $dipakai): array
    {
        $levelMinimal = $avatar?->level_minimal ?? 1;

        return [
            'id' => $avatar?->id,
            'nama' => $avatar?->nama ?? 'Default',
            'gambarUrl' => self::urlGambar($avatar, $jenisKelamin),
            'hargaPoint' => $avatar?->harga_point ?? 0,
            'levelMinimal' => $levelMinimal,
            'terkunci' => self::status($level, $levelMinimal, $dimiliki, $dipakai) === 'terkunci',
            'dimiliki' => $dimiliki,
            'dipakai' => $dipakai,
        ];
    }
}
