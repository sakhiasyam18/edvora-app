<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Requests\UpdateBiodataRequest;
use App\Models\Siswa;
use App\Services\ReferensiKampus;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Menampilkan halaman profil siswa.
     */
    public function show(
        Request $request,
        ReferensiKampus $referensi
    ): Response {
        $user = $request->user();

        // Halaman ini hanya boleh diakses oleh akun siswa.
        abort_unless($user->role === 'siswa', 403);

        $siswa = $user->siswa;

        return Inertia::render('Akun/Profil', [
            // Data dari tabel users
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],

            // Data dari tabel siswa
            'siswa' => [
                'namaLengkap' => $siswa?->nama_lengkap ?? $user->name ?? '',
                'kelas' => $siswa?->kelas,
                'jenisKelamin' => $siswa?->jenis_kelamin,

                // XP dan point
                'xp' => $siswa?->xp ?? 0,
                'point' => $siswa?->point ?? 0,

                // ID universitas dan program studi
                'universitasTujuanId' => $siswa?->universitas_tujuan_id,
                'prodiTujuanId' => $siswa?->prodi_tujuan_id,

                // Informasi universitas tujuan
                'universitas' => $siswa?->universitasTujuan
                    ? [
                        'id' => $siswa->universitasTujuan->id,
                        'nama' => $siswa->universitasTujuan->nama_universitas,
                        'singkatan' => $siswa->universitasTujuan->singkatan,
                    ]
                    : null,

                // Informasi program studi tujuan
                'prodi' => $siswa?->prodiTujuan
                    ? [
                        'id' => $siswa->prodiTujuan->id,
                        'nama' => $siswa->prodiTujuan->nama_prodi,
                        'jenjang' => $siswa->prodiTujuan->jenjang,
                    ]
                    : null,
            ],

            // Daftar universitas dan program studi aktif
            'universitasList' => $referensi->universitasAktif(),

            // Daftar pilihan kelas
            'pilihanKelas' => collect(Siswa::PILIHAN_KELAS)
                ->map(
                    fn (string $label, int|string $nilai) => [
                        'nilai' => (string) $nilai,
                        'label' => $label,
                    ]
                )
                ->values(),
        ]);
    }
    public function profilUtama(
    Request $request
): Response {
    $user = $request->user();

    abort_unless($user->role === 'siswa', 403);

    $siswa = $user->siswa;

    return Inertia::render('Akun/ProfilUtama', [
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ],

        'siswa' => [
            'namaLengkap' => $siswa?->nama_lengkap ?? $user->name ?? '',
            'kelas' => $siswa?->kelas,
            'jenisKelamin' => $siswa?->jenis_kelamin,
            'xp' => $siswa?->xp ?? 0,
            'point' => $siswa?->point ?? 0,

            'universitasTujuanId' => $siswa?->universitas_tujuan_id,
            'prodiTujuanId' => $siswa?->prodi_tujuan_id,

            'universitas' => $siswa?->universitasTujuan
                ? [
                    'id' => $siswa->universitasTujuan->id,
                    'nama' => $siswa->universitasTujuan->nama_universitas,
                    'singkatan' => $siswa->universitasTujuan->singkatan,
                ]
                : null,

            'prodi' => $siswa?->prodiTujuan
                ? [
                    'id' => $siswa->prodiTujuan->id,
                    'nama' => $siswa->prodiTujuan->nama_prodi,
                    'jenjang' => $siswa->prodiTujuan->jenjang,
                ]
                : null,
        ],
    ]);
}
    /**
     * Menyimpan perubahan biodata siswa.
     */
    public function updateBiodata(
        UpdateBiodataRequest $request
    ): RedirectResponse {
        $data = $request->validated();

        $user = $request->user();

        // Hanya akun siswa yang boleh mengubah biodata.
        abort_unless($user->role === 'siswa', 403);

        DB::transaction(function () use ($data, $user) {
            $siswa = $user->siswa;

            // Jika data siswa belum ada, buat data baru.
            if (!$siswa) {
                $siswa = Siswa::create([
                    'user_id' => $user->id,
                    'xp' => 0,
                    'point' => 0,
                    'streak_saat_ini' => 0,
                ]);
            }

            // Update biodata pada tabel siswa.
            $siswa->update([
                'nama_lengkap' => $data['namaLengkap'],
                'kelas' => $data['kelas'],
                'jenis_kelamin' => $data['jenisKelamin'],
                'universitas_tujuan_id' => $data['universitasTujuanId'],
                'prodi_tujuan_id' => $data['prodiTujuanId'],
            ]);

            // Sinkronkan nama pada tabel users.
            $user->update([
                'name' => $data['namaLengkap'],
            ]);
        });

        return back()->with(
            'status',
            'Data biodata berhasil diperbarui.'
        );
    }

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     *
     * Method profile bawaan Laravel.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}