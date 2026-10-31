<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SoalFactory extends Factory
{
    public function definition(): array
    {
        return [
            'kode_soal' => 'SOAL-' . strtoupper(Str::random(6)),
            'subtes_id' => null, // Biarkan null jika tabel subtes belum disiapkan di seeder
            'editor_id' => null,
            'tipe' => $this->faker->randomElement(['pilihan_ganda', 'isian_singkat', 'majemuk']),
            'teks_soal' => $this->faker->paragraph(),
            'pembahasan' => $this->faker->sentence(),
            'tingkat_kesulitan' => $this->faker->randomElement(['mudah', 'sedang', 'sulit']),
            'status' => 'published',
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}