import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';

interface SubtesRingkas {
    id: string;
    kode: string | null;
    nama: string;
    deskripsi: string | null;
    jumlahTopik: number; // topik yang punya soal; 0 = belum bisa dikerjakan
}

interface PersiapanProps {
    subtesList: SubtesRingkas[];
}

// Warna per kode subtes, bukan per posisi kartu, supaya tetap benar saat urutan berubah.
const warnaSubtes: Record<string, string> = {
    PU: 'bg-[#DCE7F0]',
    PPU: 'bg-[#F3D6D6]',
    PBM: 'bg-[#EDF0D8]',
    PK: 'bg-[#DFDFF3]',
    LBI: 'bg-[#F2D6EC]',
    LBE: 'bg-[#F2EED8]',
    PM: 'bg-[#D9EFE0]',
};
const WARNA_CADANGAN = 'bg-[#DCE7F0]';

// Isi card subtes; sama untuk card yang bisa dan belum bisa dipencet.
function IsiCard({ subtes }: { subtes: SubtesRingkas }) {
    return (
        <>
            <div className="flex items-center gap-3">
                <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#1F2D5C] ${warnaSubtes[subtes.kode ?? ''] ?? WARNA_CADANGAN}`}
                >
                    {subtes.kode}
                </span>
                <span className="font-semibold leading-snug text-[#1F2D5C]">{subtes.nama}</span>
            </div>

            <p className="mt-3 text-xs text-gray-600">{subtes.deskripsi}</p>

            <p className="mt-auto pt-3 text-xs text-gray-500">
                {subtes.jumlahTopik > 0 ? `${subtes.jumlahTopik} Topik` : 'Segera hadir'}
            </p>
        </>
    );
}

// Pilih Subtes. Susunan saja, belum didesain.
export default function Persiapan({ subtesList }: PersiapanProps) {
    // Pesan sekali tampil dari backend (Inertia::flash), mis. sesi latihan sudah selesai atau kedaluwarsa.
    const { flash } = usePage();
    const pesanError = typeof flash.error === 'string' ? flash.error : null;

    return (
        <>
            <Head title="Pilih Subtes" />

            <h1 className="text-3xl font-bold text-[#1F2D5C]">Pilih Subtes</h1>
            <p className="mt-1 text-sm font-medium text-gray-600">Pilih subtest UTBK yang ingin kamu kerjakan hari ini!</p>

            {pesanError && (
                <div role="alert" className="mt-4 rounded-lg border border-[#E86565] bg-[#FDECEC] px-4 py-3 text-sm font-medium text-[#8A2B2B]">
                    {pesanError}
                </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {subtesList.map((subtes) =>
                    // Subtes tanpa topik bersoal belum bisa dikerjakan.
                    subtes.jumlahTopik > 0 && subtes.kode ? (
                        <Link
                            key={subtes.id}
                            href={route('latihan.mode', { subtes: subtes.kode })}
                            prefetch
                            className="flex min-h-[160px] flex-col rounded-xl bg-white p-4 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <IsiCard subtes={subtes} />
                        </Link>
                    ) : (
                        <div
                            key={subtes.id}
                            aria-disabled="true"
                            className="flex min-h-[160px] cursor-not-allowed flex-col rounded-xl bg-white p-4 opacity-60 shadow-md"
                        >
                            <IsiCard subtes={subtes} />
                        </div>
                    ),
                )}
            </div>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah dari/ke Beranda.
Persiapan.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
