interface PengaturJumlahSoalProps {
    nilai: number;
    bisaKurang: boolean;
    bisaTambah: boolean;
    onKurang: () => void;
    onTambah: () => void;
}

const KELAS_TOMBOL =
    'flex h-[33.096px] w-[33.949px] items-center justify-center rounded-[5px] border-[0.755px] border-siswa-garis-halus bg-siswa-panel-fleksibel shadow-ubin transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40';

/** Kotak "Jumlah Soal" di Mode Fleksibel dengan tombol kurang/tambah. Batasnya diatur halaman. */
export default function PengaturJumlahSoal({ nilai, bisaKurang, bisaTambah, onKurang, onTambah }: PengaturJumlahSoalProps) {
    return (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-subtes bg-siswa-panel-fleksibel py-[15px] pl-[14px] pr-[22px] shadow-kartu">
            <div className="flex items-center gap-[14px]">
                <span className="flex h-[53.839px] w-[55.529px] shrink-0 items-center justify-center rounded-item border-[0.755px] border-siswa-garis-halus bg-ubin-fleksibel shadow-ubin">
                    <img src="/images/ikon/soal.png" alt="" className="h-[40.643px] w-[40.643px] object-contain" />
                </span>
                <div>
                    <h3 className="text-[20px] font-semibold leading-tight text-siswa-judul-seksi">Jumlah Soal</h3>
                    <p className="mt-1 text-[14px] font-medium leading-tight text-siswa-teks">Pilih jumlah soal yang diinginkan</p>
                </div>
            </div>

            <div className="flex h-[47.869px] w-[155.233px] shrink-0 items-center justify-between rounded-lg border-[0.755px] border-siswa-garis-halus bg-white px-[7px] shadow-ubin">
                <button type="button" onClick={onKurang} disabled={!bisaKurang} aria-label="Kurangi jumlah soal" className={KELAS_TOMBOL}>
                    <img src="/images/ikon/kurang.png" alt="" className="h-[20.336px] w-[20.336px] object-contain" />
                </button>

                <span className="text-[20px] font-semibold leading-[19px] text-siswa-judul">{nilai}</span>

                {/* Ikon tambah disusun dari dua ikon kurang yang bersilangan, seperti di desain. */}
                <button type="button" onClick={onTambah} disabled={!bisaTambah} aria-label="Tambah jumlah soal" className={`${KELAS_TOMBOL} relative`}>
                    <img src="/images/ikon/kurang.png" alt="" className="absolute h-[21.224px] w-[21.224px] object-contain" />
                    <img src="/images/ikon/kurang.png" alt="" className="absolute h-[21.224px] w-[21.224px] rotate-90 object-contain" />
                </button>
            </div>
        </section>
    );
}
