<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Siswa;
use App\Models\AdminEditor;
use App\Models\Subtes;
use App\Models\Soal;
use Illuminate\Support\Facades\Hash;

class TestingDatabaseSeeder extends Seeder
{
    public function run()
    {
        // 1. Akun Admin Tiruan
        User::firstOrCreate(
            ['email' => 'admin@testing.com'],
            [
                'name' => 'Admin Testing',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        // 2. Akun Editor Tiruan (role di database adalah admin_editor)
        $editor = User::firstOrCreate(
            ['email' => 'editor@testing.com'],
            [
                'name' => 'Editor Testing',
                'password' => Hash::make('password123'),
                'role' => 'admin_editor',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        AdminEditor::firstOrCreate(
            ['user_id' => $editor->id],
            ['nama_lengkap' => 'Editor Testing']
        );

        // 3. Akun Siswa Tiruan (wajib dibuat profil di tabel siswa untuk testing gameplay/latihan)
        $siswa = User::firstOrCreate(
            ['email' => 'siswa@testing.com'],
            [
                'name' => 'Siswa Testing',
                'password' => Hash::make('password123'),
                'role' => 'siswa',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        Siswa::firstOrCreate(
            ['user_id' => $siswa->id],
            [
                'nama_lengkap' => 'Siswa Testing',
                'xp' => 0,
                'point' => 0,
                'streak_saat_ini' => 0,
            ]
        );
        
        // 4. Pastikan ada subtes tujuan karena subtes_id di tabel soal bertipe NOT NULL
        $subtes = Subtes::first() ?? Subtes::create([
            'nama_subtes' => 'Penalaran Umum',
            'kode_subtes' => 'PU',
            'urutan' => 1,
            'waktu_default_menit' => 30,
            'jumlah_soal' => 30,
        ]);

        // 5. Buat 50 soal dummy dengan subtes_id yang valid
        Soal::factory(50)->create([
            'subtes_id' => $subtes->id,
            'status' => 'published',
        ]);
    }
}