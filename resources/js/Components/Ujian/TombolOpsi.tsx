import { OpsiJawaban } from '@/types/latihan';
import { TeksMatematika } from '@/Components/Ujian/KartuSoal';

export type StatusOpsi = 'default' | 'selected' | 'benar' | 'salah';

interface TombolOpsiProps {
    opsi: OpsiJawaban;
    status?: StatusOpsi;
    disabled?: boolean;
    onPilih?: (opsi: OpsiJawaban) => void;
    // Soal benar_salah: kotak centang di dalam bilah, bukan kotak huruf A/B/C di sampingnya.
    kotakCentang?: boolean;
    // Dipisah dari status karena setelah dikunci semua opsi berwarna benar/salah,
    // sedangkan centang harus tetap menunjukkan apa yang tadi dipilih siswa.
    dipilih?: boolean;
}

const gayaStatus: Record<StatusOpsi, string> = {
    default: 'bg-white text-[#1F2D5C] border-gray-200 group-hover:border-[#A5ABB0]',
    selected: 'bg-[#2E3F85] text-white border-[#2E3F85]',
    benar: 'bg-[#34C759] text-[#26355D] border-[#2AA94B]',
    salah: 'bg-[#F07676] text-[#26355D] border-[#E05B5B]',
};

// Opsi yang tidak dipilih setelah jawaban dikunci tampil redup.
const gayaRedup = 'bg-[#E5E5E5] text-[#9A9FA2] border-[#9A9FA2]';

// Varian kotak centang: hijaunya lebih lembut karena bilahnya lebar dan memuat teks panjang.
const gayaStatusKotak: Record<StatusOpsi, string> = {
    default: 'bg-white text-[#1F2D5C] border-gray-200 hover:border-[#A5ABB0]',
    selected: 'bg-[#2E3F85] text-white border-[#2E3F85]',
    benar: 'bg-[#C5EBA8] text-[#1F2D5C] border-[#A9DC85]',
    salah: 'bg-[#F07676] text-white border-[#E05B5B]',
};

// Lingkaran navy dengan glif putih; dipakai di bilah opsi benar_salah dan di bilah hasil isian.
export function IkonHasil({ benar }: { benar: boolean }) {
    return (
        <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="#26355D" />
            <path
                d={benar ? 'M7.5 12.4l3 3 6-6.4' : 'M8.5 8.5l7 7m0-7l-7 7'}
                fill="none"
                stroke="#fff"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function TombolOpsi({
    opsi,
    status = 'default',
    disabled = false,
    onPilih,
    kotakCentang = false,
    dipilih = false,
}: TombolOpsiProps) {
    if (kotakCentang) {
        const hasil = status === 'benar' || status === 'salah';

        return (
            <button
                type="button"
                role="checkbox"
                aria-checked={dipilih}
                disabled={disabled}
                onClick={() => onPilih?.(opsi)}
                className="flex w-full text-left disabled:cursor-default"
            >
                <span className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 shadow-sm transition ${gayaStatusKotak[status]}`}>
                    <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition ${
                            dipilih ? 'border-white bg-[#2E3F85] text-white' : 'border-gray-300 bg-white'
                        }`}
                    >
                        {dipilih && (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12.5l4.5 4.5L19 7" />
                            </svg>
                        )}
                    </span>

                    <span className="flex-1">
                        <TeksMatematika teks={opsi.teks_opsi} />
                    </span>

                    {hasil && (
                        <span className="flex shrink-0 items-center gap-2 font-medium">
                            <IkonHasil benar={status === 'benar'} />
                            {status === 'benar' ? 'Benar' : 'Salah'}
                        </span>
                    )}
                </span>
            </button>
        );
    }

    const gaya = disabled && status === 'default' ? gayaRedup : gayaStatus[status];

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onPilih?.(opsi)}
            aria-pressed={status === 'selected'}
            className="group flex w-full items-stretch gap-2 text-left disabled:cursor-default"
        >
            <span className={`flex w-10 shrink-0 items-center justify-center rounded-lg border font-medium shadow-sm transition ${gaya}`}>
                {opsi.label}
            </span>
            <span className={`flex flex-1 items-center justify-between gap-3 rounded-lg border px-4 py-2 shadow-sm transition ${gaya}`}>
                <span>
                    <TeksMatematika teks={opsi.teks_opsi} />
                </span>
                {status === 'benar' && (
                    <svg className="h-5 w-5 shrink-0 text-[#26355D]" viewBox="0 0 24 24" fill="currentColor" aria-label="Jawaban benar">
                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.5 14.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
                    </svg>
                )}
                {status === 'salah' && (
                    <svg className="h-5 w-5 shrink-0 text-[#26355D]" viewBox="0 0 24 24" fill="currentColor" aria-label="Jawaban salah">
                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.3 12.9l-1.4 1.4-2.9-2.9-2.9 2.9-1.4-1.4 2.9-2.9-2.9-2.9 1.4-1.4 2.9 2.9 2.9-2.9 1.4 1.4-2.9 2.9 2.9 2.9z" />
                    </svg>
                )}
            </span>
        </button>
    );
}
