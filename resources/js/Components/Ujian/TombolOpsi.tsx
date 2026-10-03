import { OpsiJawaban } from '@/types/latihan';
import { TeksMatematika } from '@/Components/Ujian/KartuSoal';

export type StatusOpsi = 'default' | 'selected' | 'benar' | 'salah';

// Bagian opsi yang dipakai tombol: cukup untuk opsi Latihan (OpsiJawaban) maupun Try Out (OpsiTryOut, tanpa kunci).
type OpsiDasar = Pick<OpsiJawaban, 'id' | 'teks_opsi'> & { label: string; gambar_opsi?: string | null };

interface TombolOpsiProps<T extends OpsiDasar> {
    opsi: T;
    status?: StatusOpsi;
    disabled?: boolean;
    onPilih?: (opsi: T) => void;
    // Soal benar_salah: kotak centang di dalam bilah, bukan kotak huruf A/B/C di sampingnya.
    kotakCentang?: boolean;
    // Dipisah dari status karena setelah dikunci semua opsi berwarna benar/salah,
    // sedangkan centang harus tetap menunjukkan apa yang tadi dipilih siswa.
    dipilih?: boolean;
    // false: opsi netral tetap putih penuh walau disabled (halaman pembahasan), bukan sedikit redup.
    redup?: boolean;
}

// Gaya kotak huruf dan bilah opsi pilihan ganda (Figma node 706:7304 dan 725:8081).
const gayaStatus: Record<StatusOpsi, string> = {
    default: 'bg-white text-siswa-judul group-hover:-translate-y-0.5 group-hover:shadow-md',
    selected: 'bg-ujian-biru text-white',
    benar: 'bg-ujian-hijau text-white',
    salah: 'bg-ujian-merah text-white',
};

// Opsi yang tidak dipilih setelah jawaban dikunci: tetap putih, teksnya sedikit diredupkan.
const gayaRedup = 'bg-white text-siswa-judul/60';

// Bulatan ikon hasil (Figma node 725:8081, 759:784).
// padaWarna: di atas bilah hijau/merah → bulatan putih dengan glif berwarna;
// di atas bilah putih → bulatan merah tua dengan glif putih.
export function IkonHasil({ benar, padaWarna = true }: { benar: boolean; padaWarna?: boolean }) {
    const glif = benar ? 'M7.5 12.4l3 3 6-6.4' : 'M8.8 8.8l6.4 6.4m0-6.4l-6.4 6.4';
    const [isi, garis] = padaWarna ? ['#fff', benar ? '#4C9A3A' : '#D55252'] : [benar ? '#4C9A3A' : '#9B1C1C', '#fff'];

    return (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill={isi} />
            <path d={glif} fill="none" stroke={garis} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function Centang() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
    );
}

const KELAS_BILAH = 'rounded-[10px] shadow-panel transition-all duration-300 ease-out';

// Teks opsi beserta gambarnya bila ada (opsi Try Out boleh bergambar).
function IsiOpsi({ opsi }: { opsi: OpsiDasar }) {
    return (
        <span>
            <TeksMatematika teks={opsi.teks_opsi} />
            {opsi.gambar_opsi && <img src={opsi.gambar_opsi} alt={`Gambar opsi ${opsi.label}`} className="mt-2 max-h-40 max-w-full rounded-lg" />}
        </span>
    );
}

export default function TombolOpsi<T extends OpsiDasar>({
    opsi,
    status = 'default',
    disabled = false,
    onPilih,
    kotakCentang = false,
    dipilih = false,
    redup = true,
}: TombolOpsiProps<T>) {
    if (kotakCentang) {
        // Benar_salah setelah dikunci: pernyataan benar hijau dengan label putih,
        // pernyataan salah tetap putih dengan label merah (Figma node 759:784).
        const bilah =
            status === 'benar' ? 'bg-ujian-hijau text-white' : status === 'selected' ? 'bg-ujian-biru text-white' : 'bg-white text-siswa-judul';

        return (
            <button
                type="button"
                role="checkbox"
                aria-checked={dipilih}
                disabled={disabled}
                onClick={() => onPilih?.(opsi)}
                className={`group flex min-h-11 w-full overflow-hidden text-left text-[13px] font-semibold disabled:cursor-default ${KELAS_BILAH} ${
                    disabled ? '' : 'hover:-translate-y-0.5 hover:shadow-md'
                }`}
            >
                <span className="flex w-[46px] shrink-0 items-center justify-center border-r border-siswa-ujian-garis bg-white text-siswa-judul">
                    <span className={`transition duration-200 ${dipilih ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                        <Centang />
                    </span>
                </span>

                <span className={`flex flex-1 items-center justify-between gap-3 px-4 py-2.5 transition-colors duration-300 ${bilah}`}>
                    <IsiOpsi opsi={opsi} />

                    {status === 'benar' && (
                        <span className="flex shrink-0 animate-muncul-halus items-center gap-1.5 font-medium">
                            <IkonHasil benar /> Benar
                        </span>
                    )}
                    {status === 'salah' && (
                        <span className="flex shrink-0 animate-muncul-halus items-center gap-1.5 font-medium text-siswa-umpan-salah-teks">
                            <IkonHasil benar={false} padaWarna={false} /> Salah
                        </span>
                    )}
                </span>
            </button>
        );
    }

    const gaya = disabled && status === 'default' ? (redup ? gayaRedup : 'bg-white text-siswa-judul') : gayaStatus[status];

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onPilih?.(opsi)}
            aria-pressed={status === 'selected'}
            className="group flex w-full items-stretch gap-1.5 text-left text-[13px] font-semibold disabled:cursor-default md:gap-2"
        >
            <span className={`flex w-[46px] shrink-0 items-center justify-center ${KELAS_BILAH} ${gaya}`}>{opsi.label}</span>
            <span className={`flex min-h-11 flex-1 items-center justify-between gap-3 px-4 py-2.5 ${KELAS_BILAH} ${gaya}`}>
                <IsiOpsi opsi={opsi} />
                {status === 'benar' && (
                    <span className="animate-muncul-halus" role="img" aria-label="Jawaban benar">
                        <IkonHasil benar />
                    </span>
                )}
                {status === 'salah' && (
                    <span className="animate-muncul-halus" role="img" aria-label="Jawaban salah">
                        <IkonHasil benar={false} />
                    </span>
                )}
            </span>
        </button>
    );
}
