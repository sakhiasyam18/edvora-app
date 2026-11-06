// resources/js/types/generator.ts
// Props dan hasil halaman Editor/GeneratorSoal (GeneratorSoalController). Key mengikuti respons JSON server.

export type TingkatGenerator = 'mudah' | 'sedang' | 'sulit';
export type TipeGenerator = 'pg' | 'isian' | 'both';
export type DistribusiGenerator = 'acak' | 'manual';
export type TipeSoalAI = 'pilihan_ganda' | 'isian_singkat';
export type StatusRiwayatGenerator = 'dibuat' | 'sebagian' | 'tersimpan';

export interface PilihanTopikGenerator {
    id: string;
    nama: string;
}

export interface SubtesGenerator {
    kode: string;
    nama: string;
    bolehIsian: boolean; // hanya PK dan PM
    topik: PilihanTopikGenerator[];
}

export interface ModelAI {
    id: string;
    nama: string;
    provider: string;
    konteks: number | null; // context_length OpenRouter
}

export interface DaftarModelAI {
    models: ModelAI[];
    sumber: 'openrouter' | 'fallback';
}

// Satu soal hasil generate. pilihan null untuk isian singkat.
export interface SoalAI {
    nomor: number;
    tipe: TipeSoalAI;
    tipe_soal: string;
    soal: string;
    pilihan: Record<string, string> | null;
    jawaban: string;
    hint: string;
    pembahasan: string;
}

export interface HasilGenerator {
    subtes: string;
    kode_subtes: string;
    topik: string;
    topik_id: string;
    tingkat_kesulitan: string;
    tipe_soal: string;
    jumlah_soal: number;
    jumlah_pg: number;
    jumlah_isian: number;
    soal: SoalAI[];
    model: string;
    dibuat: string;
    // id sesi riwayat (tabel generator_soal); null bila migrasi riwayat belum dijalankan.
    sesi_id?: string | null;
}

// Satu baris riwayat generate milik editor.
export interface RiwayatGenerator {
    id: string;
    subtes: string;
    subtes_nama: string;
    topik: string;
    tingkat: string;
    tipe_soal: string;
    model: string;
    jumlah_soal: number;
    jumlah_tersimpan: number;
    status: StatusRiwayatGenerator;
    dibuat: string | null;
}

export interface HasilSimpanGenerator {
    tersimpan: number;
    kode: string[];
    subtes: string;
    subtes_nama: string;
}
