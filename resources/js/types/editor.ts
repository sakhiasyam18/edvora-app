// resources/js/types/editor.ts
// Props halaman editor (AdminSoalController, UploadSoalController). Key camelCase, kecuali paginator Laravel.

import { TipeSoal } from '@/types/latihan';

export type StatusSoal = 'draft' | 'review' | 'published';
export type TingkatKesulitan = 'mudah' | 'sedang' | 'sulit';

export interface SubtesEditor {
    kode: string; // kode_subtes, mis. 'PU'
    nama: string;
}

export interface PilihanTopik {
    id: string;
    nama: string;
}

// Satu baris tabel Bank Soal.
export interface BarisSoal {
    kode: string;
    teks: string; // teks soal dipotong ±90 karakter, pindah baris jadi spasi
    topik: string;
    tipe: TipeSoal;
    tingkat: TingkatKesulitan;
    status: StatusSoal;
}

// Hasil paginate() Laravel seperti yang dikirim Inertia.
export interface Halaman<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface OpsiIsian {
    teks: string;
    gambar: string; // link gambar opsi (opsional)
}

// Isi formulir soal; dikirim apa adanya ke editor.soal.simpan / editor.soal.ubah, ditambah kodeSoal dan status.
// Server mengubahnya menjadi satu baris Excel (FormulirSoal.php), jadi aturannya sama dengan import Excel.
export interface IsianSoal {
    topikId: string;
    tipe: TipeSoal;
    tingkatKesulitan: TingkatKesulitan | '';
    teksSoal: string;
    gambarSoal: string;
    opsi: OpsiIsian[]; // selalu 5 baris: A–E; yang kosong tidak disimpan
    kunciPg: string; // pilihan_ganda: 'A'–'E', '' bila belum dipilih
    kunciBenar: boolean[]; // benar_salah: per opsi, true = pernyataan Benar
    kolomTabel: string[]; // majemuk_tabel: 2–4 judul kolom
    kunciKolom: (number | null)[]; // majemuk_tabel: nomor kolom kunci per pernyataan (mulai 1)
    jawabanIsian: string[]; // isian_singkat: semua jawaban yang diterima
    hint: string;
    pembahasan: string;
    gambarPembahasan: string;
}

// Satu kelompok masalah hasil periksa file, mis. "Wajib diisi." di baris 3–5.
export interface MasalahUpload {
    baris: string; // "3–5, 9", atau "-" bila bukan masalah satu baris
    kolom: string;
    pesan: string;
}

// editor.soal.upload.periksa (juga jawaban 422 editor.soal.upload bila file ternyata tidak valid).
export interface HasilPeriksaUpload {
    valid: boolean;
    pesan: string | null; // mis. file tanpa soal
    jumlahSoal: number;
    baru: number; // akan masuk sebagai Draft
    diperbarui: number; // kodenya sudah ada: isinya diperbarui, status tidak berubah
    kodeDiperbarui: string[]; // maksimal 30 kode
    jumlahTopik: number;
    barisError: number;
    jumlahMasalah: number;
    masalah: MasalahUpload[]; // maksimal 50 kelompok
    gambarKurang: string[]; // gambar yang disebut Excel tetapi belum ada di Storage, mis. 'PU/PU-104-A.png'
    peringatan: string[];
}

// editor.soal.upload berhasil.
export interface HasilSimpanUpload {
    baru: number;
    diperbarui: number;
    topikBaru: number;
}
