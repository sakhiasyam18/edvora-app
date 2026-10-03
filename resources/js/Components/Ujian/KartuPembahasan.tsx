import { TeksMatematika } from '@/Components/Ujian/KartuSoal';

export type StatusPembahasan = 'benar' | 'salah' | 'kosong';

const GLIF: Record<StatusPembahasan, string> = {
    benar: 'M7.5 12.4l3 3 6-6.4',
    salah: 'M8.8 8.8l6.4 6.4m0-6.4l-6.4 6.4',
    kosong: 'M7.5 12h9',
};

// Warna bulatan dipakai sebagai fill SVG, jadi berupa hex (sama dengan token siswa-umpan-*-teks / siswa-ikon-salah).
const KARTU: Record<StatusPembahasan, { judul: string; latar: string; teks: string; warna: string }> = {
    benar: { judul: 'Jawaban Benar', latar: 'bg-siswa-umpan-benar', teks: 'text-siswa-umpan-benar-teks', warna: '#4C9A3A' },
    salah: { judul: 'Jawaban Salah', latar: 'bg-siswa-umpan-salah', teks: 'text-siswa-umpan-salah-teks', warna: '#9B1C1C' },
    kosong: { judul: 'Tidak Dijawab', latar: 'bg-siswa-umpan-kosong', teks: 'text-siswa-teks', warna: '#6B7285' },
};

interface KartuPembahasanProps {
    status: StatusPembahasan;
    kunci?: string | null; // siap tampil: "A. Vierzna", "Vierzna dan Dewi", atau kunci isian
    pembahasan: string;
}

// Kartu umpan balik setelah jawaban dikunci (Figma node 725:8081, 759:784); dipakai halaman ujian dan pembahasan.
export default function KartuPembahasan({ status, kunci, pembahasan }: KartuPembahasanProps) {
    const kartu = KARTU[status];

    return (
        <section className={`mt-5 animate-muncul-halus rounded-[14px] px-5 py-4 shadow-kartu md:px-6 md:py-5 ${kartu.latar}`}>
            <h3 className={`flex items-center gap-3 text-base font-semibold md:text-lg ${kartu.teks}`}>
                <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill={kartu.warna} />
                    <path d={GLIF[status]} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {kartu.judul}
            </h3>

            <div className="pl-10 text-[13px] text-siswa-judul">
                {kunci && (
                    <p className="font-semibold">
                        Kunci Jawaban: <TeksMatematika teks={kunci} />
                    </p>
                )}

                <h4 className="mt-4 font-semibold">Pembahasan</h4>
                <p className="mt-1 font-medium leading-relaxed">
                    <TeksMatematika teks={pembahasan} />
                </p>
            </div>
        </section>
    );
}
