import { StatusSoal, TingkatKesulitan } from '@/types/editor';
import { TipeSoal } from '@/types/latihan';

// Nama tipe soal di halaman editor. benar_salah ditulis "Majemuk Kompleks" (centang) seperti di desain.
export const LABEL_TIPE: Record<TipeSoal, string> = {
    pilihan_ganda: 'Pilihan Ganda',
    benar_salah: 'Majemuk Kompleks',
    majemuk_tabel: 'Majemuk Tabel',
    isian_singkat: 'Isian Singkat',
};

export const LABEL_TINGKAT: Record<TingkatKesulitan, string> = {
    mudah: 'Mudah',
    sedang: 'Sedang',
    sulit: 'Sulit',
};

export const LABEL_STATUS: Record<StatusSoal, string> = {
    draft: 'Draft',
    review: 'Review',
    published: 'Published',
};
