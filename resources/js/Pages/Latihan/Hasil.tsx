import { Head, router } from '@inertiajs/react';
import { ReactNode } from 'react';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import { HasilLatihan } from '@/types/latihan';
import { dummyHasilLatihan } from '@/data/dummyLatihan';

interface HasilProps {
    // Sementara controller belum kirim props, jadi fallback ke dummy.
    hasil?: HasilLatihan;
    pengerjaan?: { id: string };
}

function KartuStat({ ikon, label, nilai }: { ikon: ReactNode; label: string; nilai: string | number }) {
    return (
        <div className="flex flex-col items-center rounded-xl bg-white px-4 py-5 text-center shadow-md">
            {ikon}
            <p className="mt-3 text-xs font-medium text-gray-600">{label}</p>
            <p className="mt-1 text-3xl font-bold text-[#1F2D5C]">{nilai}</p>
        </div>
    );
}

export default function Hasil({ hasil = dummyHasilLatihan, pengerjaan }: HasilProps) {
    // Konfigurasi sesi dibawa Ujian lewat query param, untuk tombol Ulangi Latihan.
    const querySesi = window.location.search;

    return (
        <LatihanLayout breadcrumb={['Latihan Soal', 'Hasil Pengerjaan']}>
            <Head title="Hasil Pengerjaan Soal" />

            <div className="mx-auto flex max-w-4xl flex-col items-center px-8 py-8">
                <Trofi />

                <h1 className="mt-4 text-center text-4xl font-bold text-[#1F2D5C]">Hasil Pengerjaan Soal</h1>
                <p className="mt-1 text-center text-sm font-medium text-white">
                    Kerja Bagus! Terus tingkatkan kemampuanmu dan berkembang setiap harinya!
                </p>

                <div className="mt-6 grid w-full grid-cols-2 gap-4 md:grid-cols-4">
                    <KartuStat
                        label="Jawaban Benar"
                        nilai={hasil.jumlahBenar}
                        ikon={
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6BAF4E] text-white">
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                                </svg>
                            </span>
                        }
                    />
                    <KartuStat
                        label="Jawaban Salah"
                        nilai={hasil.jumlahSalah}
                        ikon={
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B94040] text-white">
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                    <path d="M6 6l12 12M18 6L6 18" />
                                </svg>
                            </span>
                        }
                    />
                    <KartuStat
                        label="Poin"
                        nilai={hasil.poin}
                        ikon={
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DDE9F7] text-[#3F6FB5]">
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 2h10l-2 6H9L7 2zm5 7a6.5 6.5 0 110 13 6.5 6.5 0 010-13zm0 2.8l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4 1.2-2.4z" />
                                </svg>
                            </span>
                        }
                    />
                    <KartuStat
                        label="XP diperoleh"
                        nilai={`+${hasil.xpDidapat} XP`}
                        ikon={
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DCDDF7] text-sm font-bold text-[#2E3F85]">
                                XP
                            </span>
                        }
                    />
                </div>

                <div className="mt-6 flex w-full max-w-md flex-col gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            router.visit(
                                pengerjaan
                                    ? route('riwayat.pembahasan', { id: pengerjaan.id })
                                    : route('riwayat.pembahasan'),
                            )
                        }
                        className="w-full rounded-lg bg-[#2E3F85] py-3 font-medium text-white shadow-md transition hover:bg-[#263573]"
                    >
                        Lihat Pembahasan
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => router.visit(querySesi ? route('latihan.ujian') + querySesi : route('latihan.persiapan'))}
                            className="rounded-lg bg-white py-2.5 font-medium text-[#1F2D5C] shadow-md transition hover:bg-gray-50"
                        >
                            Ulangi Latihan
                        </button>
                        <button
                            type="button"
                            onClick={() => router.visit(route('dashboard'))}
                            className="rounded-lg bg-[#2E3F85] py-2.5 font-medium text-white shadow-md transition hover:bg-[#263573]"
                        >
                            Kembali ke Beranda
                        </button>
                    </div>
                </div>
            </div>
        </LatihanLayout>
    );
}

function Trofi() {
    return (
        <svg className="h-36 w-36" viewBox="0 0 120 120" aria-hidden="true">
            <ellipse cx="60" cy="112" rx="30" ry="5" fill="#1F2D5C" opacity="0.2" />
            <path d="M30 22c-14 0-18 8-16 17 2 10 12 16 22 17" fill="none" stroke="#F2B233" strokeWidth="7" strokeLinecap="round" />
            <path d="M90 22c14 0 18 8 16 17-2 10-12 16-22 17" fill="none" stroke="#F2B233" strokeWidth="7" strokeLinecap="round" />
            <path d="M28 14h64v22c0 20-14 36-32 36S28 56 28 36V14z" fill="#F7C548" />
            <path d="M60 14h32v22c0 20-14 36-32 36V14z" fill="#F2B233" />
            <rect x="53" y="70" width="14" height="16" fill="#E0A020" />
            <path d="M40 86h40l4 14H36l4-14z" fill="#F2B233" />
            <rect x="32" y="98" width="56" height="9" rx="2" fill="#E0A020" />
            <circle cx="60" cy="38" r="13" fill="#FFE08A" stroke="#E0A020" strokeWidth="2" />
            <text x="60" y="44" textAnchor="middle" fontSize="16" fontWeight="700" fill="#C98A10" fontFamily="Poppins, sans-serif">1</text>
        </svg>
    );
}
