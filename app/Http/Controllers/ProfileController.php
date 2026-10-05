<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Requests\SimpanBiodataRequest;
use App\Models\Siswa;
use App\Services\LevelXp;
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
                    fn(string $label, int|string $nilai) => [
                        'nilai' => (string) $nilai,
                        'label' => $label,
                    ]
                )
                ->values(),
        ]);
    }

    /**
     * Akun Pribadi: ringkasan profil, level XP, dan biodata siswa.
     */
    public function profilUtama(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user->role === 'siswa', 403);

        $siswa = $user->siswa;
        $xp = (int) ($siswa?->xp ?? 0);

        return Inertia::render('Akun/ProfilUtama', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],

            'siswa' => [
                'namaLengkap' => $siswa?->nama_lengkap ?? $user->name ?? '',
                'kelas' => $siswa?->kelas,
                'kelasLabel' => Siswa::PILIHAN_KELAS[$siswa?->kelas ?? ''] ?? null,
                'jenisKelamin' => $siswa?->jenis_kelamin,
                'xp' => $xp,
                'point' => (int) ($siswa?->point ?? 0),

                'universitas' => $siswa?->universitasTujuan
                    ? [
                        'id' => $siswa->universitasTujuan->id,
                        'nama' => $siswa->universitasTujuan->nama_universitas,
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

            'bergabung' => $user->created_at?->toDateString(),
            'level' => LevelXp::dariXp($xp),

            // Badge disesuaikan warnanya menjadi hitam (bg-slate-900)
            'badges' => [
                [
                    'id' => '1',
                    'nama' => 'Pemenang Kuis',
                    'deskripsi' => 'Skor tertinggi kuis mingguan',
                    'xpBonus' => 500,
                    'warnaHexagon' => 'bg-slate-900 text-slate-900',
                    'ikon' => 'star',
                    'tercapai' => true,
                    'diraihPada' => $siswa?->created_at ? $siswa->created_at->format('d M Y') : '05 Okt 2026',
                ],
                [
                    'id' => '2',
                    'nama' => 'Ahli Logika',
                    'deskripsi' => 'Menyelesaikan 50 soal analitis',
                    'xpBonus' => 400,
                    'warnaHexagon' => 'bg-slate-900 text-slate-900',
                    'ikon' => 'code',
                    'tercapai' => true,
                    'diraihPada' => '28 Nov 2023',
                ],
                [
                    'id' => '3',
                    'nama' => 'Rajin Belajar',
                    'deskripsi' => 'Login 30 hari berturut-turut',
                    'xpBonus' => 600,
                    'warnaHexagon' => 'bg-slate-900 text-slate-900',
                    'ikon' => 'academic',
                    'tercapai' => true,
                    'diraihPada' => '15 Jan 2024',
                ],
                [
                    'id' => '4',
                    'nama' => 'Analisis Hebat',
                    'deskripsi' => 'Akurasi jawaban di atas 95%',
                    'xpBonus' => 450,
                    'warnaHexagon' => 'bg-slate-900 text-slate-900',
                    'ikon' => 'trending-up',
                    'tercapai' => true,
                    'diraihPada' => '02 Feb 2024',
                ],
            ],
        ]);
    }

    /**
     * Menyimpan perubahan biodata siswa.
     */
    public function updateBiodata(
        // Aturan sama dengan form Biodata saat daftar, karena kolom yang diubah sama persis.
        SimpanBiodataRequest $request
    ): RedirectResponse {
        $data = $request->validated();

        $user = $request->user();

        // Hanya akun siswa yang boleh mengubah biodata.
        abort_unless($user->role === 'siswa', 403);

        DB::transaction(function () use ($data, $user) {
            $siswa = $user->siswa;

            // Jika data siswa belum ada, buat data baru.
            if (! $siswa) {
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

        // Kembali ke halaman Edit Biodata, yang menampilkan pop-up berhasil; tombol OK-nya menuju Akun Pribadi.
        Inertia::flash('sukses', 'Biodata anda sudah diperbarui');

        return redirect()->route('akun.profil');
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

    /**
     * Menampilkan daftar koleksi badge siswa.
     */
    public function badge(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user->role === 'siswa', 403);

        $siswa = $user->siswa;

        // Dalam implementasi database nyata, kamu bisa query dari tabel `badges` dan `badge_siswa`
        // Di bawah ini adalah struktur data dinamis sesuai kebutuhan desain UI
        $badges = [
            [
                'id' => '1',
                'nama' => 'Pemenang Kuis',
                'deskripsi' => 'Skor tertinggi kuis mingguan',
                'xpBonus' => 500,
                'warnaHexagon' => 'bg-amber-500 text-amber-500',
                'ikon' => 'star',
                'tercapai' => true,
                'diraihPada' => $siswa?->created_at ? $siswa->created_at->format('d M Y') : '12 Okt 2023',
                'progress' => null,
            ],
            [
                'id' => '2',
                'nama' => 'Ahli Logika',
                'deskripsi' => 'Menyelesaikan 50 soal analitis',
                'xpBonus' => 400,
                'warnaHexagon' => 'bg-sky-500 text-sky-500',
                'ikon' => 'code',
                'tercapai' => true,
                'diraihPada' => '28 Nov 2023',
                'progress' => null,
            ],
            [
                'id' => '3',
                'nama' => 'Rajin Belajar',
                'deskripsi' => 'Login 30 hari berturut-turut',
                'xpBonus' => 600,
                'warnaHexagon' => 'bg-purple-600 text-purple-600',
                'ikon' => 'academic',
                'tercapai' => true,
                'diraihPada' => '15 Jan 2024',
                'progress' => null,
            ],
            [
                'id' => '4',
                'nama' => 'Analisis Hebat',
                'deskripsi' => 'Akurasi jawaban di atas 95%',
                'xpBonus' => 450,
                'warnaHexagon' => 'bg-emerald-500 text-emerald-500',
                'ikon' => 'trending-up',
                'tercapai' => true,
                'diraihPada' => '02 Feb 2024',
                'progress' => null,
            ],
            [
                'id' => '5',
                'nama' => 'Juara Kelas',
                'deskripsi' => 'Peringkat 1 leaderboard kelas',
                'xpBonus' => 750,
                'warnaHexagon' => 'bg-pink-500 text-pink-500',
                'ikon' => 'crown',
                'tercapai' => true,
                'diraihPada' => '10 Mar 2024',
                'progress' => null,
            ],
            [
                'id' => '6',
                'nama' => 'Master Eksplorasi',
                'deskripsi' => 'Menjelajahi semua modul pembelajaran',
                'xpBonus' => 350,
                'warnaHexagon' => 'bg-orange-500 text-orange-500',
                'ikon' => 'compass',
                'tercapai' => true,
                'diraihPada' => '25 Mar 2024',
                'progress' => null,
            ],
            [
                'id' => '7',
                'nama' => 'Kolektor Tugas',
                'deskripsi' => 'Mengumpulkan 20 tugas tepat waktu',
                'xpBonus' => 300,
                'warnaHexagon' => 'bg-teal-500 text-teal-500',
                'ikon' => 'check-badge',
                'tercapai' => true,
                'diraihPada' => '04 Apr 2024',
                'progress' => null,
            ],
            [
                'id' => '8',
                'nama' => 'Pejuang Malam',
                'deskripsi' => 'Selesaikan sesi belajar malam intensif',
                'xpBonus' => 250,
                'warnaHexagon' => 'bg-indigo-600 text-indigo-600',
                'ikon' => 'moon',
                'tercapai' => true,
                'diraihPada' => '18 Mei 2024',
                'progress' => null,
            ],
            // Badge yang masih terkunci (Locked)
            [
                'id' => '9',
                'nama' => 'Grandmaster Kuis',
                'deskripsi' => 'Raih skor sempurna pada 10 kuis beruntun',
                'xpBonus' => 1000,
                'warnaHexagon' => 'bg-gray-300 text-gray-300',
                'ikon' => 'lock',
                'tercapai' => false,
                'diraihPada' => null,
                'progress' => [
                    'saatIni' => 7,
                    'target' => 10,
                    'label' => '7/10',
                ],
            ],
            [
                'id' => '10',
                'nama' => 'Legenda Semester',
                'deskripsi' => 'Pertahankan ranking 1 selama satu semester',
                'xpBonus' => 1500,
                'warnaHexagon' => 'bg-gray-300 text-gray-300',
                'ikon' => 'lock',
                'tercapai' => false,
                'diraihPada' => null,
                'progress' => [
                    'saatIni' => 4,
                    'target' => 6,
                    'label' => '4/6 Bulan',
                ],
            ],
            [
                'id' => '11',
                'nama' => 'Super Mentor',
                'deskripsi' => 'Bantu jawab 25 diskusi kawan sekelas',
                'xpBonus' => 500,
                'warnaHexagon' => 'bg-gray-300 text-gray-300',
                'ikon' => 'lock',
                'tercapai' => false,
                'diraihPada' => null,
                'progress' => [
                    'saatIni' => 12,
                    'target' => 25,
                    'label' => '12/25',
                ],
            ],
            [
                'id' => '12',
                'nama' => 'Kolektor Sempurna',
                'deskripsi' => 'Buka semua lencana belajar kelas 12',
                'xpBonus' => 2000,
                'warnaHexagon' => 'bg-gray-300 text-gray-300',
                'ikon' => 'lock',
                'tercapai' => false,
                'diraihPada' => null,
                'progress' => [
                    'saatIni' => 8,
                    'target' => 11,
                    'label' => '8/11',
                ],
            ],
        ];

        return Inertia::render('Akun/Badge', [
            'badges' => $badges,
        ]);
    }

    /**
     * Menampilkan daftar avatar & toko avatar siswa.
     */
    public function avatar(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user->role === 'siswa', 403);

        $siswa = $user->siswa;

        // Daftar 8 avatar sesuai desain
        $avatars = [
            [
                'id' => '1',
                'nama' => 'Astronot Bintang',
                'deskripsi' => 'Jelajahi kosmos pengetahuan tanpa batas dengan setelan astronot antariksa modern.',
                'hargaPoint' => 100,
                'rarity' => 'EPIK',
                'gambarUrl' => '/images/avatars/astronot-bintang.png',
                'dimiliki' => false,
                'dipakai' => false,
            ],
            [
                'id' => '2',
                'nama' => 'Mecha Cerdas',
                'deskripsi' => 'Robot canggih siap membantumu menyelesaikan latihan soal dengan presisi.',
                'hargaPoint' => 100,
                'rarity' => 'LANGKA',
                'gambarUrl' => '/images/avatars/mecha-cerdas.png',
                'dimiliki' => false,
                'dipakai' => false,
            ],
            [
                'id' => '3',
                'nama' => 'Profesor Cilik',
                'deskripsi' => 'Kecerdasan akademis tinggi dan haus akan ilmu pengetahuan baru.',
                'hargaPoint' => 100,
                'rarity' => 'LANGKA',
                'gambarUrl' => '/images/avatars/profesor-cilik.png',
                'dimiliki' => false,
                'dipakai' => false,
            ],
            [
                'id' => '4',
                'nama' => 'Penyihir Kuis',
                'deskripsi' => 'Menguasai sihir jawaban tepat untuk menaklukkan kuis tersulit.',
                'hargaPoint' => 100,
                'rarity' => 'EPIK',
                'gambarUrl' => '/images/avatars/penyihir-kuis.png',
                'dimiliki' => false,
                'dipakai' => false,
            ],
            [
                'id' => '5',
                'nama' => 'Juara Literasi',
                'deskripsi' => 'Pencinta buku dan teks bacaan dengan pemahaman mendalam.',
                'hargaPoint' => 100,
                'rarity' => 'DAPATKAN',
                'gambarUrl' => '/images/avatars/juara-literasi.png',
                'dimiliki' => false,
                'dipakai' => false,
            ],
            [
                'id' => '6',
                'nama' => 'Kucing Genius',
                'deskripsi' => 'Kucing imut dengan intuisi tajam dalam memecahkan soal.',
                'hargaPoint' => 100,
                'rarity' => 'DAPATKAN',
                'gambarUrl' => '/images/avatars/kucing-genius.png',
                'dimiliki' => false,
                'dipakai' => false,
            ],
            [
                'id' => '7',
                'nama' => 'Kadet Pelajar',
                'deskripsi' => 'Semangat belajar tinggi siap menaklukkan berbagai rintangan.',
                'hargaPoint' => 100,
                'rarity' => 'DAPATKAN',
                'gambarUrl' => '/images/avatars/kadet-pelajar.png',
                'dimiliki' => true,
                'dipakai' => false,
            ],
            [
                'id' => '8',
                'nama' => 'Ninja Koding',
                'deskripsi' => 'Ahli strategi, penyelesaian masalah, dan logika tingkat tinggi.',
                'hargaPoint' => 100,
                'rarity' => 'LEGENDA',
                'gambarUrl' => '/images/avatars/ninja-koding.png',
                'dimiliki' => true,
                'dipakai' => true,
            ],
        ];

        // Render ke file Akun/Avatar.tsx
        return Inertia::render('Akun/Avatar', [
            'totalPoint' => (int) ($siswa?->point ?? $user->point ?? 2354),
            'avatars' => $avatars,
        ]);
    }
}
