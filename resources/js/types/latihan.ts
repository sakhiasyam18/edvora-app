// resources/js/types/latihan.ts

export type ModeLatihan = 'fleksibel' | 'simulasi';
export type TipeSoal = 'pilihan_ganda' | 'isian_singkat';

export interface OpsiJawaban {
  id: number;
  label: 'A' | 'B' | 'C' | 'D' | 'E';
  teksOpsi: string;
}

export interface Soal {
  id: number;
  subtesId: number;
  tipeSoal: TipeSoal;
  teksSoal: string;
  gambarUrl?: string;
  opsi: OpsiJawaban[];          // hanya untuk pilihan_ganda, selalu 5 (A-E)
  pembahasan: string;
}

export interface KonfigurasiSesiLatihan {
  subtesId: number;
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
