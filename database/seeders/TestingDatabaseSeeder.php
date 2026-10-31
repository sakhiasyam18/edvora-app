<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Soal;
use Illuminate\Support\Facades\Hash;

class TestingDatabaseSeeder extends Seeder
{
    public function run()
    {
        // 1. Akun Admin Tiruan
        User::create([
            'name' => 'Admin Testing',
            'email' => 'admin@testing.com',
            'password' => Hash::make('password123'),
            'role' => 'admin', // Sesuaikan jika nama kolom role berbeda
        ]);

        // 2. Akun Editor Tiruan (Untuk pengujian Cypress Elma dkk & API Indah)
        User::create([
            'name' => 'Editor Testing',
            'email' => 'editor@testing.com',
            'password' => Hash::make('password123'),
            'role' => 'editor',
        ]);

        // 3. Akun Siswa Tiruan (Untuk pengujian Gamifikasi & E2E Latihan)
        User::create([
            'name' => 'Siswa Testing',
            'email' => 'siswa@testing.com',
            'password' => Hash::make('password123'),
            'role' => 'siswa',
            // 'xp' => 0,    // Hapus tanda komentar jika kolom ini wajib diisi saat insert
            // 'point' => 0, 
        ]);
        
        Soal::factory(50)->create([
            'status' => 'published', // Sesuaikan jika nama kolom status di databasemu berbeda
        ]);
    }
}