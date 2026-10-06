import { ReactNode } from 'react';

type VarianPanel = 'fleksibel' | 'simulasi' | 'remedial' | 'terkunci';

// Latar panel per mode, dari token di tailwind.config.js.
const LATAR: Record<VarianPanel, string> = {
    fleksibel: 'bg-siswa-panel-fleksibel',
    simulasi: 'bg-panel-simulasi',
    remedial: 'bg-panel-remedial',
    terkunci: 'bg-siswa-panel-terkunci',
};

// Warna kotak ikon saat di-hover: versi pucat warna tiap mode. Ikonnya sendiri tidak berubah warna.
const AKSEN_HOVER: Record<VarianPanel, string> = {
    fleksibel: 'hover:bg-siswa-ikon-hover-fleksibel',
    simulasi: 'hover:bg-siswa-ikon-hover-simulasi',
    remedial: 'hover:bg-siswa-ikon-hover-remedial',
    terkunci: 'hover:bg-siswa-ikon-hover-terkunci',
};

interface PanelModeProps {
    varian: VarianPanel;
    ikon: ReactNode; // isi kotak ikon putih di kiri
    judul: string;
    keterangan: string;
    children?: ReactNode; // mis. kotak info Jumlah Soal / Waktu / Topik
}

/** Panel penjelasan satu mode latihan: kotak ikon, judul, keterangan, lalu isi tambahan di bawahnya. */
export default function PanelMode({ varian, ikon, judul, keterangan, children }: PanelModeProps) {
    return (
        <section className={`rounded-panel px-[28px] py-[30px] shadow-kartu ${LATAR[varian]}`}>
            <div className="flex items-start gap-6">
                {/* Hover: latar kotak memudar ke warna pucat mode dan ikon membesar sedikit, keduanya 300ms; warna ikon tetap. */}
                <span
                    className={`group/ikon flex h-[76.31px] w-[78.705px] shrink-0 items-center justify-center rounded-subtes border-[0.755px] border-siswa-garis-halus bg-white shadow-ubin transition-colors duration-300 ease-out ${AKSEN_HOVER[varian]}`}
                >
                    <span className="flex items-center justify-center transition-transform duration-300 ease-out group-hover/ikon:scale-110">
                        {ikon}
                    </span>
                </span>
                <div>
                    <h3 className="text-[20px] font-semibold leading-tight text-siswa-judul-seksi">{judul}</h3>
                    <p className="mt-[6px] max-w-[697px] text-[14px] font-medium leading-normal text-siswa-teks">{keterangan}</p>
                </div>
            </div>

            {children && <div className="mt-[26px]">{children}</div>}
        </section>
    );
}
