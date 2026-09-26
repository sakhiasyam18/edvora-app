// resources/js/types/latihan.ts

export type ModeLatihan = 'fleksibel' | 'simulasi';
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
}

export interface KonfigurasiSesiLatihan {
  sesiId?: string;                // dibuat server di ujian(); dipakai latihan.cek dan latihan.simpan
  subtesId: string | number;
  namaSubtes: string;
  mode: ModeLatihan;
  jumlahSoal: number;
  waktuPengerjaanMenit?: number;  // dipakai kalau mode === 'simulasi'
  iceBreakingAktif?: boolean;     // dipakai kalau mode === 'fleksibel'
}

export interface HasilLatihan {
  jumlahBenar: number;
  jumlahSalah: number;
  poin: number;
  xpDidapat: number;
}
