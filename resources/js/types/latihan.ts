// resources/js/types/latihan.ts

export type ModeLatihan = 'fleksibel' | 'simulasi' | 'remedial';
export type TipeSoal = 'pilihan_ganda' | 'isian_singkat' | 'benar_salah';

export interface OpsiJawaban {
  id: string | number;
  label: 'A' | 'B' | 'C' | 'D' | 'E';
  teks_opsi: string; // Database mapped
  is_kunci: boolean;
}

export interface Soal {
  id: string | number;
  subtes_id: string | number;
  tipe: TipeSoal; // DB mapped
  teks_soal: string; // DB mapped
  gambar_soal?: string; // DB mapped
  opsi_jawaban: OpsiJawaban[]; // DB mapped relation
  pembahasan: string;
  ada_hint?: boolean; // teks hint tidak ikut dikirim; diambil lewat latihan.hint supaya pemakaiannya tercatat
}

export interface KonfigurasiSesiLatihan {
  sesiId?: string;                // id sesi di session (remedial, simulasi) atau id pengerjaan (fleksibel); dipakai latihan.jawab, latihan.hint, latihan.simpan
  subtesId: string | number;
  namaSubtes: string;
  topikIds?: string[];            // mode fleksibel: minimal satu topik
  namaTopik?: string | null;      // dari server: "Semua topik" atau nama topik yang dipilih
  mode: ModeLatihan;
  jumlahSoal: number;
  waktuPengerjaanMenit?: number;  // dipakai kalau mode === 'simulasi'
  iceBreakingAktif?: boolean;     // dipakai kalau mode bukan simulasi
}

// Balasan latihan.jawab, sekaligus isi JawabanTersimpan.hasil (RANCANGAN-RENCANA-save-fleksibel.md 6.1).
// Dikirim setelah jawaban final, jadi halaman ujian tidak menerima kunci sebelum siswa menjawab.
export interface UmpanBalikJawaban {
  benar: boolean;
  kunciOpsiIds: string[];         // opsi ber-kunci, untuk mewarnai pilihan; kosong untuk isian
  kunci: string;                  // siap tampil: "A. Vierzna", "Vierzna dan Dewi", kunci isian, atau "-"
  pembahasan: string | null;
}

// Prop halaman kerjakan fleksibel: jawaban yang sudah tersimpan saat siswa melanjutkan sesi.
export interface JawabanTersimpan {
  soalId: string;
  opsiIds: string[];
  jawabanIsian: string | null;
  hasil: UmpanBalikJawaban;
}

// Dibaca dari tahap, bukan dari skor saja: skor 80 di tahap 1 (soal mudah) belum berarti dikuasai.
export type LabelPenguasaan = 'belum_cukup_data' | 'belum_dikuasai' | 'berkembang' | 'dikuasai';

// Keadaan siswa di satu topik mode fleksibel (RingkasanPenguasaan di backend).
export interface TopikPenguasaan {
  id: string;
  nama: string;
  adaSoal: boolean;
  tahap: 1 | 2 | 3;               // 1 mudah, 2 sedang, 3 sulit
  skor: number | null;            // null sampai 20 soal terakhir di topik ini terkumpul
  skorSementara: number | null;   // skor dari jawaban yang sudah ada; hanya untuk urutan rekomendasi
  proporsi: number;               // porsi topik di UTBK (0–1); 0 bila belum ditentukan
  nJendela: number;               // 0–20 soal terakhir yang dihitung
  nDiTahap: number;               // soal yang dikerjakan sejak tahap terakhir berubah
  isiLingkaran: number | null;    // 0–1 menuju batas naik tahap; null selama skor belum ada
  label: LabelPenguasaan;
}

export interface RingkasanTopikHasil extends TopikPenguasaan {
  perubahan: { dari: number; ke: number } | null; // naik/turun tahap di sesi ini
}

export interface HasilLatihan {
  jumlahBenar: number;
  jumlahSalah: number;
  poin: number;
  xpDidapat: number;
}
