<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Kegagalan generator soal AI yang sudah diterjemahkan untuk editor. Kode dipakai frontend untuk membedakan
 * model limit (pindah model otomatis) dari masalah lain.
 */
class GeneratorSoalException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $kode = 'provider_error',
        public readonly int $status = 502,
    ) {
        parent::__construct($message);
    }
}
