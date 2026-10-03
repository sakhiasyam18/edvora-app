// Warna kotak ikon mengikuti mode panelnya.
const UBIN = {
    simulasi: 'bg-siswa-ubin-simulasi',
    remedial: 'bg-siswa-ubin-remedial',
} as const;

interface KotakInfoProps {
    varian: keyof typeof UBIN;
    ikon: string; // berkas ikon putih dari desain
    judul: string;
    isi: string;
}

/** Kotak info kecil di panel mode (Jumlah Soal, Waktu Pengerjaan, Topik). */
export default function KotakInfo({ varian, ikon, judul, isi }: KotakInfoProps) {
    return (
        <div className="flex min-h-[73.6px] items-center gap-[18px] rounded-subtes border-[0.755px] border-siswa-garis-halus bg-white px-[9px] py-[9px] shadow-ubin">
            <span className={`flex h-[53.839px] w-[55.529px] shrink-0 items-center justify-center rounded-item border-[0.755px] border-siswa-garis-halus shadow-ubin ${UBIN[varian]}`}>
                <img src={ikon} alt="" className="h-[40.643px] w-[40.643px] object-contain" />
            </span>
            <div className="text-[14px] leading-normal text-siswa-judul">
                <p className="font-medium">{judul}</p>
                <p className="font-bold">{isi}</p>
            </div>
        </div>
    );
}
