<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBiodataRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'namaLengkap' => ['required', 'string', 'max:255'],
            'kelas' => ['required', 'string', 'max:50'],
            'jenisKelamin' => ['required', 'string', 'max:20'],
            'universitasTujuanId' => ['required', 'string'],
            'prodiTujuanId' => ['required', 'string'],
        ];
    }
}