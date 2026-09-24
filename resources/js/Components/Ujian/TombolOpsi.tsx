import { OpsiJawaban } from '@/types/latihan';
import { TeksMatematika } from '@/Components/Ujian/KartuSoal';

export type StatusOpsi = 'default' | 'selected' | 'benar' | 'salah';

interface TombolOpsiProps {
    opsi: OpsiJawaban;
    status?: StatusOpsi;
    disabled?: boolean;
    onPilih?: (opsi: OpsiJawaban) => void;
}

const gayaStatus: Record<StatusOpsi, string> = {
    default: 'bg-white text-[#1F2D5C] border-gray-200 group-hover:border-[#5B86DB]',
    selected: 'bg-[#2E3F85] text-white border-[#2E3F85]',
    benar: 'bg-[#34C759] text-[#26355D] border-[#2AA94B]',
    salah: 'bg-[#F07676] text-[#26355D] border-[#E05B5B]',
};

// Opsi yang tidak dipilih setelah jawaban dikunci tampil redup.
const gayaRedup = 'bg-[#A5ABB0] text-[#9A9FA2] border-[#9A9FA2]';

export default function TombolOpsi({ opsi, status = 'default', disabled = false, onPilih }: TombolOpsiProps) {
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
