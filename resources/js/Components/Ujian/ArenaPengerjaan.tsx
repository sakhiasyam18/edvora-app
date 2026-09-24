import { ReactNode } from 'react';

export type StatusJawabanSoal = 'benar' | 'salah' | null;

interface NavigasiSoalProps {
    jumlahSoal: number;
    indeksAktif: number;
    sudahDijawab: (indeks: number) => boolean;
    onPilih: (indeks: number) => void;
    aksiBawah?: ReactNode;
    // Hanya diisi mode fleksibel, saat jawaban sudah dikunci dan boleh ketahuan benar/salahnya.
    statusJawaban?: (indeks: number) => StatusJawabanSoal;
}

const gayaBulatan: Record<'benar' | 'salah', string> = {
    benar: 'border-white bg-[#34C759] text-[#26355D]',
    salah: 'border-white bg-[#F07676] text-[#26355D]',
};

// Isi sidebar "Nomor Soal"; dirender di slot sidebar LatihanLayout.
export function NavigasiSoal({ jumlahSoal, indeksAktif, sudahDijawab, onPilih, aksiBawah, statusJawaban }: NavigasiSoalProps) {
    const gayaTombolKecil = 'rounded bg-white px-2 py-1 text-[10px] font-medium text-[#1F2D5C] shadow disabled:opacity-50';

    return (
        <div className="flex h-full flex-col">
            <h3 className="text-lg font-medium">Nomor Soal</h3>

            <div className="mt-3 grid grid-cols-5 gap-2">
                {Array.from({ length: jumlahSoal }, (_, i) => {
                    const aktif = i === indeksAktif;
                    const terjawab = sudahDijawab(i);
                    const status = statusJawaban?.(i) ?? null;
                    const gaya = status
                        ? gayaBulatan[status]
                        : terjawab || aktif
                          ? 'border-white bg-[#5B86DB] text-white'
                          : 'border-white bg-white text-[#1F2D5C]';
                    const labelStatus = status ? `, jawaban ${status}` : terjawab ? ', sudah dijawab' : '';
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onPilih(i)}
                            aria-current={aktif ? 'step' : undefined}
                            aria-label={`Soal ${i + 1}${labelStatus}`}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-medium transition ${gaya} ${
                                aktif ? 'ring-2 ring-[#9CC0F5] ring-offset-2 ring-offset-[#2E3F85]' : ''
                            }`}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 flex gap-2">
                <button type="button" className={gayaTombolKecil} disabled={indeksAktif === 0} onClick={() => onPilih(indeksAktif - 1)}>
                    ← Kembali
                </button>
                <button type="button" className={gayaTombolKecil} disabled={indeksAktif === jumlahSoal - 1} onClick={() => onPilih(indeksAktif + 1)}>
                    Lanjut →
                </button>
            </div>

            {aksiBawah && <div className="mt-auto pt-6">{aksiBawah}</div>}
        </div>
    );
}

interface ArenaPengerjaanProps {
    judul: string;
    aksiHeader?: ReactNode;
    footerKiri?: ReactNode;
    footerKanan?: ReactNode;
    children: ReactNode;
}

export default function ArenaPengerjaan({ judul, aksiHeader, footerKiri, footerKanan, children }: ArenaPengerjaanProps) {
    return (
        <div className="flex min-h-full flex-col px-8 py-6">
            <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold text-[#1F2D5C]">{judul}</h2>
                {aksiHeader}
            </div>

            <div className="mt-2 flex-1">{children}</div>

            {(footerKiri || footerKanan) && (
                <div className="mt-6 flex items-end justify-between gap-4">
                    <div>{footerKiri}</div>
                    <div>{footerKanan}</div>
                </div>
            )}
        </div>
    );
}
