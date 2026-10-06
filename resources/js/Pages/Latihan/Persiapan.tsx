import { Head, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import KartuSubtes, { SubtesRingkas } from '@/Components/Latihan/KartuSubtes';

interface PersiapanProps {
    subtesList: SubtesRingkas[];
}

// Pilih Subtes, mengikuti desain Figma node 641:3459.
export default function Persiapan({ subtesList }: PersiapanProps) {
    // Pesan sekali tampil dari backend (Inertia::flash), mis. sesi latihan sudah selesai atau kedaluwarsa.
    const { flash } = usePage();
    const pesanError = typeof flash.error === 'string' ? flash.error : null;

    return (
        <>
            <Head title="Pilih Subtes" />

            <div className="w-full font-poppins">
                <h1 className="pt-[15px] text-[24px] font-semibold leading-tight text-siswa-judul-seksi">Pilih Subtes</h1>
                <p className="mt-[9px] text-[15px] font-medium leading-tight text-siswa-teks">
                    Pilih subtest UTBK yang ingin kamu kerjakan hari ini!
                </p>

                {pesanError && (
                    <div role="alert" className="mt-4 rounded-lg border border-[#E86565] bg-[#FDECEC] px-4 py-3 text-sm font-medium text-[#8A2B2B]">
                        {pesanError}
                    </div>
                )}

                {/* 1 kolom saat sidebar tampil di layar sempit (md), 3 kolom seperti desain di layar lebar.
                    Jarak antar kartu disamakan dengan Beranda (21px). */}
                <div className="mt-[23px] grid grid-cols-1 gap-[21px] sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {subtesList.map((subtes) => (
                        <KartuSubtes key={subtes.id} subtes={subtes} />
                    ))}
                </div>
            </div>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah dari/ke Beranda.
Persiapan.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
