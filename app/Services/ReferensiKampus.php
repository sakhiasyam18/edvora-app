<?php

namespace App\Services;

use App\Models\ProgramStudi;
use App\Models\Universitas;
use Illuminate\Support\Facades\Cache;

/**
 * Daftar PTN dan prodi aktif untuk pilihan tujuan siswa.
 *
 * Disimpan di cache file, bukan cache database: membaca Supabase butuh ±370 ms per query,
 * sedangkan data ini hanya berubah saat import. Panggil lupakan() setiap kali data berubah.
 *
 * Cache file ada di tiap mesin, sedangkan database dipakai bersama, jadi cache tetap kedaluwarsa
 * sendiri: mesin lain ikut memakai data baru paling lambat MENIT_CACHE menit setelah import.
 */
class ReferensiKampus
{
    public const KUNCI_CACHE = 'referensi-kampus';

    public const MENIT_CACHE = 10;

    /**
     * @return array<int, array{id: string, nama: string, prodi: array<int, array{id: string, nama: string, jenjang: string}>}>
     */
    public function universitasAktif(): array
    {
        $cache = Cache::store('file');
        $data = $cache->get(self::KUNCI_CACHE);

        if ($data === null) {
            $data = $this->muatDariDatabase();

            // Hasil kosong tidak disimpan: cache yang terbentuk sebelum data diisi akan menetap selamanya.
            if ($data !== []) {
                $cache->put(self::KUNCI_CACHE, $data, now()->addMinutes(self::MENIT_CACHE));
            }
        }

        return $data;
    }

    public function lupakan(): void
    {
        Cache::store('file')->forget(self::KUNCI_CACHE);
    }

    protected function muatDariDatabase(): array
    {
        $prodiAktif = fn ($query) => $query->where('is_aktif', true);

        return Universitas::query()
            ->where('is_aktif', true)
            // Universitas tanpa prodi aktif disembunyikan: siswa tidak akan bisa memilih prodinya.
            ->whereHas('programStudi', $prodiAktif)
            ->with(['programStudi' => fn ($query) => $prodiAktif($query)->orderBy('jenjang')->orderBy('nama_prodi')])
            ->orderBy('nama_universitas')
            ->get()
            ->map(fn (Universitas $universitas) => [
                'id' => $universitas->id,
                'nama' => $universitas->nama_universitas,
                'prodi' => $universitas->programStudi
                    ->map(fn (ProgramStudi $prodi) => [
                        'id' => $prodi->id,
                        'nama' => $prodi->nama_prodi,
                        'jenjang' => $prodi->jenjang,
                    ])
                    ->all(),
            ])
            ->all();
    }
}
