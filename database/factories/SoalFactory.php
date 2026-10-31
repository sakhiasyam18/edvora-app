<?php
namespace Database\Factories;

use App\Models\Subtes;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SoalFactory extends Factory
{
    public function definition(): array
    {
        return [
            'kode_soal' => 'SOAL-' . strtoupper(Str::random(8)),
            // Mengambil subtes yang ada agar foreign key tidak error
            'subtes_id' => Subtes::first()?->id,
            'editor_id' => null,
            // Nilai enum yang valid: pilihan_ganda, isian_singkat, benar_salah, majemuk_tabel
            'tipe' => $this->faker->randomElement(['pilihan_ganda', 'benar_salah']),
            'teks_soal' => $this->faker->paragraph(),
            'pembahasan' => $this->faker->sentence(),
            'tingkat_kesulitan' => $this->faker->randomElement(['mudah', 'sedang', 'sulit']),
            // Kunci jawaban null untuk selain isian_singkat (mengikuti CHECK constraint database)
            'kunci_jawaban' => null,
            'status' => 'published',
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}