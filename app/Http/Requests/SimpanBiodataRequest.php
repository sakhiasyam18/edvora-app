<?php

namespace App\Http\Requests;

use App\Models\Siswa;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Validasi form Biodata. Payload memakai camelCase, sama dengan props halaman.
 */
class SimpanBiodataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'siswa';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // Nilai universitas dipakai di query exists prodi. Postgres menolak teks yang bukan uuid
        // dengan error SQL, jadi diganti null agar validasi prodi gagal dengan pesan biasa.
        $universitasId = $this->input('universitasTujuanId');
        $universitasId = is_string($universitasId) && Str::isUuid($universitasId) ? $universitasId : null;

        return [
            // Maks. 50 karena nama juga disalin ke users.name, yang di Supabase bertipe varchar(50).
            'namaLengkap' => ['required', 'string', 'max:50'],
            'kelas' => ['required', Rule::in(array_keys(Siswa::PILIHAN_KELAS))],
            'jenisKelamin' => ['required', Rule::in(['laki-laki', 'perempuan'])],
            // bail + uuid sebelum exists, dengan alasan yang sama.
            'universitasTujuanId' => [
                'bail', 'required', 'uuid',
                Rule::exists('universitas', 'id')->where('is_aktif', true),
            ],
            'prodiTujuanId' => [
                'bail', 'required', 'uuid',
                Rule::exists('program_studi', 'id')
                    ->where('is_aktif', true)
                    ->where('universitas_id', $universitasId),
            ],
        ];
    }

    /**
     * Ditulis sendiri karena proyek belum punya terjemahan bahasa Indonesia (folder lang/).
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $universitas = 'Pilih universitas tujuan dari daftar.';
        $prodi = 'Pilih program studi dari universitas yang dipilih.';

        return [
            'namaLengkap.required' => 'Nama lengkap wajib diisi.',
            'namaLengkap.string' => 'Nama lengkap wajib diisi.',
            'namaLengkap.max' => 'Nama lengkap maksimal 50 karakter.',
            'kelas.required' => 'Pilih kelas dari daftar.',
            'kelas.in' => 'Pilih kelas dari daftar.',
            'jenisKelamin.required' => 'Pilih jenis kelamin.',
            'jenisKelamin.in' => 'Pilih jenis kelamin.',
            'universitasTujuanId.required' => $universitas,
            'universitasTujuanId.uuid' => $universitas,
            'universitasTujuanId.exists' => $universitas,
            'prodiTujuanId.required' => $prodi,
            'prodiTujuanId.uuid' => $prodi,
            'prodiTujuanId.exists' => $prodi,
        ];
    }
}
