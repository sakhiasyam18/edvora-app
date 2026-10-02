// Props halaman Try Out (RANCANGAN-tryout.md bagian 6). Nama kolom soal mengikuti database.
import { TipeSoal } from '@/types/latihan';

export type StatusPengerjaanTryOut = 'belum' | 'berjalan' | 'selesai';

export interface PaketTryOut {
    id: string;
    judul: string;
    totalSoal: number;
    totalMenit: number;
    selesaiAt: string; // ISO; ditampilkan dalam WIB lewat formatWaktuWib()
    peraturan: string[];
    statusPengerjaan: StatusPengerjaanTryOut;
    waktuCukup: boolean; // false: Try Out akan terpotong di akhir periode
}

export interface OpsiTryOut {
    id: string;
    label: string;
    teks_opsi: string;
    gambar_opsi: string | null;
}

// Tanpa kunci, pembahasan, dan hint.
export interface SoalTryOut {
    id: string;
    tipe: TipeSoal;
    teks_soal: string;
    gambar_soal: string | null;
    opsi: OpsiTryOut[];
}

export interface SubtesAktifTryOut {
    id: string; // id try_out_subtes
    nama: string;
    urutan: number;
    jumlahSubtes: number;
    terakhir: boolean;
}

export interface JawabanTryOut {
    opsiIds: string[];
    jawabanIsian: string | null;
}

export interface HasilSubtesTryOut {
    id: string;
    nama: string;
    jumlahSoal: number;
    benar: number;
    salah: number;
    kosong: number;
}
