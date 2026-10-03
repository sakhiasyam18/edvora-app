import { ReactNode } from 'react';

export type StatusJawabanSoal = 'benar' | 'salah' | null;

interface NavigasiSoalProps {
    jumlahSoal: number;
    indeksAktif: number;
    sudahDijawab: (indeks: number) => boolean;
    onPilih: (indeks: number) => void;
    // Nama subtes di pil putih di atas kartu.
    judul?: string;
    aksiBawah?: ReactNode;
    // Hanya diisi mode fleksibel, saat jawaban sudah dikunci dan boleh ketahuan benar/salahnya.
    statusJawaban?: (indeks: number) => StatusJawabanSoal;
    // Try Out: timer di kanan pil judul.
    judulKanan?: ReactNode;
    // Try Out: warna bulatan sendiri (terjawab biru, ragu-ragu kuning). undefined = gaya bawaan.
    gayaNomor?: (indeks: number) => string | undefined;
    // Try Out tidak memakai keterangan warna.
    tanpaKeterangan?: boolean;
    // Tombol di antara bulatan dan Sebelumnya/Lanjutkan (Ragu-ragu di Try Out).
    aksiTengah?: ReactNode;
}

const gayaBulatan: Record<'benar' | 'salah', string> = {
    benar: 'border-transparent bg-ujian-hijau text-white',
    salah: 'border-transparent bg-ujian-merah text-white',
};

// Tombol biru bergradasi (Sebelumnya, Lanjutkan, Kembali di modal Hint).
export const KELAS_TOMBOL_BIRU =
    'rounded-lg bg-ujian-biru font-semibold text-white shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:brightness-105 active:translate-y-0 disabled:pointer-events-none disabled:border disabled:border-siswa-ujian-garis disabled:bg-white disabled:bg-none disabled:text-siswa-teks-redup disabled:shadow-none';

interface TombolNavigasiSoalProps {
    jumlahSoal: number;
    indeksAktif: number;
    onPilih: (indeks: number) => void;
}

// Pindah antar soal; dirender di kartu Navigasi Soal, di bawah bulatan nomor soal.
export function TombolNavigasiSoal({ jumlahSoal, indeksAktif, onPilih }: TombolNavigasiSoalProps) {
    const gaya = `${KELAS_TOMBOL_BIRU} h-9 px-2 text-xs lg:text-[13px]`;

    return (
        <div className="grid grid-cols-2 gap-1.5">
            <button type="button" className={gaya} disabled={indeksAktif === 0} onClick={() => onPilih(indeksAktif - 1)}>
                ← Sebelumnya
            </button>
            <button type="button" className={gaya} disabled={indeksAktif === jumlahSoal - 1} onClick={() => onPilih(indeksAktif + 1)}>
                Lanjutkan →
            </button>
        </div>
    );
}

function Keterangan({ titik, label }: { titik: string; label: string }) {
    return (
        <span className="flex items-center gap-1">
            <span className={`h-2 w-2 shrink-0 rounded-full ${titik}`} />
            {label}
        </span>
    );
}

// Panel kanan halaman pengerjaan: pil nama subtes dan kartu "Navigasi Soal". Dirender di slot sidebar LatihanLayout.
export function NavigasiSoal({
    jumlahSoal,
    indeksAktif,
    sudahDijawab,
    onPilih,
    judul,
    aksiBawah,
    statusJawaban,
    judulKanan,
    gayaNomor,
    tanpaKeterangan = false,
    aksiTengah,
}: NavigasiSoalProps) {
    return (
        <div className="animate-muncul-halus">
            {judul && (
                <div
                    className={`mb-2.5 flex min-h-10 items-center justify-between gap-3 rounded-[10px] bg-white text-[13px] font-semibold text-siswa-judul ${
                        judulKanan ? 'py-1.5 pl-4 pr-1.5 shadow-kartu' : 'border border-siswa-ujian-garis px-4'
                    }`}
                >
                    <span className="truncate">{judul}</span>
                    {judulKanan}
                </div>
            )}

            <div className="rounded-[14px] bg-white p-4 shadow-kartu lg:p-5">
                <h3 className="text-[13px] font-semibold text-siswa-judul">Navigasi Soal</h3>

                <div className="mt-3 grid grid-cols-5 gap-2">
                    {Array.from({ length: jumlahSoal }, (_, i) => {
                        const aktif = i === indeksAktif;
                        const terjawab = sudahDijawab(i);
                        const status = statusJawaban?.(i) ?? null;
                        const gayaBawaan = status
                            ? gayaBulatan[status]
                            : terjawab
                              ? 'border-transparent bg-siswa-titik-terisi text-white'
                              : 'border-siswa-ujian-garis bg-white text-siswa-teks hover:border-edvora-primary hover:text-edvora-primary';
                        const gaya = gayaNomor?.(i) ?? gayaBawaan;
                        const labelStatus = status ? `, jawaban ${status}` : terjawab ? ', sudah dijawab' : '';
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onPilih(i)}
                                aria-current={aktif ? 'step' : undefined}
                                aria-label={`Soal ${i + 1}${labelStatus}`}
                                className={`mx-auto flex aspect-square w-full max-w-[40px] items-center justify-center rounded-full border text-[13px] font-medium transition duration-200 hover:scale-105 ${gaya} ${
                                    aktif ? 'ring-2 ring-edvora-primary/60 ring-offset-2' : ''
                                }`}
                            >
                                {i + 1}
                            </button>
                        );
                    })}
                </div>

                {/* Mode simulasi (tanpa statusJawaban) tidak pernah menampilkan benar/salah, jadi hanya Kosong dan Terisi, rata kiri. */}
                {!tanpaKeterangan && (
                    <div className={`mt-3 flex flex-wrap gap-y-1 text-[10px] text-siswa-teks ${statusJawaban ? 'justify-between gap-x-3' : 'justify-start gap-x-5'}`}>
                        {statusJawaban && (
                            <>
                                <Keterangan titik="bg-siswa-titik-benar" label="Benar" />
                                <Keterangan titik="bg-siswa-titik-salah" label="Salah" />
                            </>
                        )}
                        <Keterangan titik="border border-siswa-titik-terisi bg-white" label="Kosong" />
                        <Keterangan titik="bg-siswa-titik-terisi" label="Terisi" />
                    </div>
                )}

                {aksiTengah && <div className="mt-4">{aksiTengah}</div>}

                <div className="mt-4">
                    <TombolNavigasiSoal jumlahSoal={jumlahSoal} indeksAktif={indeksAktif} onPilih={onPilih} />
                </div>

                {aksiBawah && <div className="mt-2.5">{aksiBawah}</div>}
            </div>
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
        <div className="flex flex-col">
            <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 px-1">
                <h2 className="text-xl font-semibold text-siswa-judul lg:text-[22px]">{judul}</h2>
                {aksiHeader}
            </div>

            <div className="mt-2">{children}</div>

            {(footerKiri || footerKanan) && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <div>{footerKiri}</div>
                    <div className="ml-auto">{footerKanan}</div>
                </div>
            )}
        </div>
    );
}
