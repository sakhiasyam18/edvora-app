import { Head, router } from '@inertiajs/react';
import { ReactNode } from 'react';
import LingkaranTahap, { keteranganSkor, TEKS_LABEL } from '@/Components/Gamifikasi/LingkaranTahap';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import { HasilLatihan, ModeLatihan, RingkasanTopikHasil, TopikPenguasaan } from '@/types/latihan';
import { dummyHasilLatihan } from '@/data/dummyLatihan';

interface HasilProps {
    // Sementara controller belum kirim props, jadi fallback ke dummy.
    hasil?: HasilLatihan;
    pengerjaan?: { id: string; subtes_id: string; jumlah_soal_dipilih: number; tipe: string; mode_latihan: ModeLatihan | null };
    // Satu per topik yang dikerjakan di sesi fleksibel; kosong untuk simulasi.
    ringkasanTopik?: RingkasanTopikHasil[];
    // Maks 3 topik subtes ini yang disarankan dilatih berikutnya (UCS1).
    rekomendasiTopik?: TopikPenguasaan[];
}

// Keadaan satu topik setelah sesi ini. Belum didesain.
function KartuTopik({ topik }: { topik: RingkasanTopikHasil }) {
    const naik = topik.perubahan !== null && topik.perubahan.ke > topik.perubahan.dari;

    return (
        <div className="flex w-full items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-md">
            <LingkaranTahap topik={topik} ukuran={56} />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600">Topik</p>
                <p className="text-lg font-semibold text-[#1F2D5C]">{topik.nama}</p>
                <p className="text-sm text-gray-700">
                    Tahap {topik.tahap} · {TEKS_LABEL[topik.label]} · {keteranganSkor(topik)}
                </p>
            </div>
            {topik.perubahan && (
                <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${naik ? 'bg-[#C5EBA8] text-[#2F5E1A]' : 'bg-[#FDECEC] text-[#B94040]'}`}>
                    {naik ? 'Naik' : 'Turun'} ke tahap {topik.perubahan.ke}
                </span>
            )}
        </div>
    );
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

export default function Hasil({ hasil = dummyHasilLatihan, pengerjaan, ringkasanTopik = [], rekomendasiTopik = [] }: HasilProps) {
    return (
        <LatihanLayout breadcrumb={['Latihan Soal', 'Hasil Pengerjaan']}>
            <Head title="Hasil Pengerjaan Soal" />

            <div className="mx-auto flex max-w-4xl flex-col items-center px-8 py-8">
                <Trofi />

                <h1 className="mt-4 text-center text-4xl font-bold text-[#1F2D5C]">Hasil Pengerjaan Soal</h1>
                <p className="mt-1 text-center text-sm font-medium text-[#445984]">
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

                {ringkasanTopik.length > 0 && (
                    <div className="mt-6 w-full space-y-3">
                        {ringkasanTopik.map((topik) => (
                            <KartuTopik key={topik.id} topik={topik} />
                        ))}
                    </div>
                )}

                {/* Daftar dasar, belum didesain. */}
                {rekomendasiTopik.length > 0 && (
                    <div className="mt-6 w-full rounded-xl bg-white px-5 py-4 shadow-md">
                        <p className="text-sm font-semibold text-[#1F2D5C]">Topik yang disarankan untuk dilatih berikutnya</p>
                        <ul className="mt-2 space-y-1 text-sm text-gray-700">
                            {rekomendasiTopik.map((topik) => (
                                <li key={topik.id}>
                                    {topik.nama} · Tahap {topik.tahap} · {TEKS_LABEL[topik.label]}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-6 flex w-full max-w-md flex-col gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            router.visit(
                                pengerjaan
                                    ? route('riwayat.detail', { pengerjaanId: pengerjaan.id })
                                    : route('riwayat.index'),
                            )
                        }
                        className="w-full rounded-lg bg-[#2E3F85] py-3 font-medium text-white shadow-md transition hover:bg-[#263573]"
                    >
                        Lihat Pembahasan
                    </button>
                    {/* Ulangi Latihan dihapus: soal hanya muncul sekali per siswa. */}
                    <button
                        type="button"
                        onClick={() => router.visit(route('dashboard'))}
                        className="w-full rounded-lg bg-white py-2.5 font-medium text-[#1F2D5C] shadow-md transition hover:bg-gray-50"
                    >
                        Kembali ke Beranda
                    </button>
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
