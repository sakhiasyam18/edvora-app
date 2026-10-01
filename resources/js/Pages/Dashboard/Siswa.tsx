import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';

interface TopikRekomendasi {
    topikId: string;
    kodeSubtes: string | null;
    namaTopik: string;
    persen: number;
}

interface PenguasaanSubtes {
    kode: string | null;
    nama: string;
    persen: number; // 0–100, rata-rata semua topik subtes itu
    adaData: boolean; // false = belum ada topik dengan 20 jawaban fleksibel
}

interface SiswaProps {
    judul?: string;
    level: number;
    poin: number;
    rekomendasi: TopikRekomendasi[]; // maks 3; kosong bila belum pernah latihan fleksibel
    penguasaanSubtes: PenguasaanSubtes[];
}

// Isi Beranda. Susunan saja, belum didesain.
export default function Siswa({ judul = 'Beranda', level, poin, rekomendasi, penguasaanSubtes }: SiswaProps) {
    const user = usePage<any>().props.auth.user;

    return (
        <>
            <Head title={judul} />

            <div className="w-full max-w-[1000px] space-y-5">
                {/* Sapaan, Level, dan Poin */}
                <section className="flex items-center justify-between gap-4 rounded-xl bg-white px-6 py-5 shadow-md">
                    <div>
                        <h1 className="text-2xl font-bold text-[#19386F] md:text-3xl">
                            Halo, {user?.name || 'Siswa'}!
                        </h1>
                        <p className="mt-1 text-sm font-medium text-[#445984]">
                            Siap kejar target Drill Soal?
                        </p>
                    </div>

                    <dl className="flex gap-3 text-center">
                        <div className="rounded-lg border px-4 py-2">
                            <dt className="text-xs text-gray-600">Level</dt>
                            <dd className="text-xl font-bold text-[#19386F]">{level}</dd>
                        </div>
                        <div className="rounded-lg border px-4 py-2">
                            <dt className="text-xs text-gray-600">Poin</dt>
                            <dd className="text-xl font-bold text-[#19386F]">{poin}</dd>
                        </div>
                    </dl>
                </section>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {/* Latihan Soal */}
                    <Link
                        href={route('latihan.index')}
                        prefetch
                        className="group relative flex min-h-[180px] flex-col rounded-xl bg-white px-5 py-5 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                    >
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C7E9FA]">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#548CC8"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-7 w-7"
                            >
                                <rect
                                    x="5"
                                    y="3"
                                    width="14"
                                    height="18"
                                    rx="2"
                                />
                                <path d="M9 7h6" />
                                <path d="M9 17h6" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-bold text-[#203766]">
                            Latihan Soal
                        </h2>

                        <p className="mt-1 max-w-[190px] text-sm leading-snug text-[#536078]">
                            Kerjakan soal latihan sesuai subtest yang
                            kamu inginkan!
                        </p>
                    </Link>

                    {/* Try Out: ada atau tidaknya event try out ditentukan di halaman Try Out, bukan di kartu ini. */}
                    <Link
                        href={route('tryout.index')}
                        className="group relative flex min-h-[180px] flex-col rounded-xl bg-white px-5 py-5 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                    >
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#CDF3B9]">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#70A95B"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-7 w-7"
                            >
                                <path d="M6 2h8l4 4v16H6Z" />
                                <path d="M14 2v5h5" />
                                <path d="M9 12h6" />
                                <path d="M9 16h6" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-bold text-[#203766]">
                            Try Out
                        </h2>

                        <p className="mt-1 max-w-[190px] text-sm leading-snug text-[#536078]">
                            Latih kemampuan kamu dan dapatkan pengalaman
                            ujian sesungguhnya dengan timer!
                        </p>
                    </Link>

                    {/* Direkomendasikan: 3 topik yang paling perlu dilatih dari semua subtes. */}
                    <section className="rounded-xl bg-white px-5 py-5 shadow-md">
                        <h2 className="text-lg font-bold text-[#203766]">Direkomendasikan</h2>

                        {rekomendasi.length > 0 ? (
                            <ul className="mt-3 space-y-2">
                                {rekomendasi.map((topik) => (
                                    <li key={topik.topikId} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                                        <span className="font-semibold text-[#3F6FB5]">{topik.kodeSubtes}</span>
                                        <span className="text-[#203766]">{topik.namaTopik}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-3 text-sm text-[#536078]">
                                Selesaikan latihan mode fleksibel untuk mendapatkan rekomendasi topik.
                            </p>
                        )}
                    </section>
                </div>

                {/* Penguasaan Per Subtes. Lingkaran dikerjakan frontend; sementara memakai progress bawaan. */}
                <section className="rounded-xl bg-white px-6 py-5 shadow-md">
                    <h2 className="text-lg font-bold text-[#203766]">Penguasaan Per Subtes</h2>

                    <ul className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-7">
                        {penguasaanSubtes.map((subtes) => (
                            <li key={subtes.kode ?? subtes.nama} className="text-center">
                                <progress
                                    max={100}
                                    value={subtes.persen}
                                    aria-label={`Penguasaan ${subtes.nama}`}
                                    className="w-full"
                                />
                                <p className="text-lg font-bold text-[#203766]">{Math.round(subtes.persen)}%</p>
                                <p className="font-semibold text-[#3F6FB5]">{subtes.kode}</p>
                                <p className="text-xs text-[#536078]">{subtes.nama}</p>
                                {!subtes.adaData && (
                                    <p className="mt-1 text-[10px] text-gray-500">Belum cukup data</p>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah ke halaman siswa lain.
Siswa.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
