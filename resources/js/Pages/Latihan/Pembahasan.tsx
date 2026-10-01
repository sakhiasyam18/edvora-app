import React, { useState } from 'react';
import { Link } from '@inertiajs/react';

interface OpsiJawaban {
    id: string;
    teks_opsi: string;
    is_kunci: boolean;
    urutan: number;
}

interface Soal {
    id: string;
    pertanyaan?: string;
    teks_soal?: string;
    soal?: string;
    pembahasan?: string;
    tipe: string;
    opsiJawaban?: OpsiJawaban[];
    opsi_jawaban?: OpsiJawaban[];
}

interface JawabanPengerjaan {
    id: string;
    soal_id: string;
    opsi_dipilih_id?: string;
    jawaban_isian?: string;
    is_correct: boolean;
    soal?: Soal;
}

interface Subtes {
    id: string;
    nama_subtes: string;
}

interface PengerjaanProps {
    pengerjaan?: {
        id: string;
        total_skor: number;
        subtes?: Subtes;
        jawaban_pengerjaan?: JawabanPengerjaan[];
        jawabanPengerjaan?: JawabanPengerjaan[];
    };
    auth?: {
        user?: {
            name?: string;
        };
    };
}

export default function Pembahasan({ pengerjaan, auth }: PengerjaanProps) {
    // Ambil data jawaban pengerjaan
    const daftarJawaban =
        pengerjaan?.jawaban_pengerjaan ||
        pengerjaan?.jawabanPengerjaan ||
        [];

    const [indeksAktif, setIndeksAktif] = useState(0);

    const jawabanAktif = daftarJawaban[indeksAktif];
    const soalAktif = jawabanAktif?.soal;

    // Teks Soal
    const teksPertanyaan =
        soalAktif?.teks_soal ||
        soalAktif?.soal ||
        soalAktif?.pertanyaan ||
        'Pertanyaan tidak tersedia';

    // Daftar Opsi Jawaban
    const opsiList = soalAktif?.opsiJawaban || soalAktif?.opsi_jawaban || [];

    // Initial Nama User untuk Avatar Header (Default: A)
    const initialUser = auth?.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'A';

    return (
        <div className="flex min-h-screen flex-col bg-[#E9F3FF] font-['Plus_Jakarta_Sans',sans-serif] text-[#1E293B]">
            {/* 1. TOP HEADER */}
            <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-200 bg-white px-8">
                {/* Logo & Breadcrumb */}
                <div className="flex items-center gap-8">
                    <div className="text-3xl font-black tracking-wider text-[#2B4184]">
                        EDVORA
                    </div>
                    <div className="h-8 w-[1px] bg-gray-200" />
                    <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Link href="/dashboard" className="hover:text-[#2B4184]">
                            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l1.293 1.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                        </Link>
                        <span>&gt;</span>
                        <Link href="/dashboard" className="hover:text-[#2B4184]">
                            Latihan Soal
                        </Link>
                        <span>&gt;</span>
                        <span className="font-semibold text-gray-700">
                            {pengerjaan?.subtes?.nama_subtes || 'Pengetahuan Kuantitatif'}
                        </span>
                    </nav>
                </div>

                {/* Avatar Profile */}
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5C82E6] text-lg font-bold text-white shadow-sm">
                        {initialUser}
                    </div>
                </div>
            </header>

            {/* 2. MAIN CONTAINER WITH SIDEBAR */}
            <div className="flex flex-1">
                {/* SIDEBAR KIRI - NAVIGASI NOMOR SOAL */}
                <aside className="w-72 bg-[#2B4184] p-6 text-white shadow-inner">
                    <h2 className="mb-6 text-lg font-bold tracking-wide">Nomor Soal</h2>

                    <div className="grid grid-cols-5 gap-3">
                        {daftarJawaban.map((item, idx) => {
                            const isAktif = idx === indeksAktif;
                            const isBenar = item.is_correct;

                            // Merah jika salah (#EF6161), Hijau jika benar (#A3E682 / #86EFAC)
                            let bgStyle = isBenar
                                ? 'bg-[#86EFAC] text-[#166534]'
                                : 'bg-[#EF6161] text-white';

                            let ringStyle = isAktif
                                ? 'ring-4 ring-white ring-offset-2 ring-offset-[#2B4184] scale-105 z-10'
                                : '';

                            return (
                                <button
                                    key={item.id || idx}
                                    type="button"
                                    onClick={() => setIndeksAktif(idx)}
                                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${bgStyle} ${ringStyle}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* KONTEN UTAMA */}
                <main className="flex-1 p-10">
                    {daftarJawaban.length === 0 ? (
                        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                            <p className="text-gray-500">Data pembahasan tidak ditemukan.</p>
                        </div>
                    ) : (
                        <div className="mx-auto max-w-4xl space-y-6">
                            {/* Judul Subtes */}
                            <h1 className="text-2xl font-black text-[#1E293B]">
                                {pengerjaan?.subtes?.nama_subtes || 'Pengetahuan Kuantitatif'}
                            </h1>

                            {/* Badge Nomor Soal */}
                            <div>
                                <span className="inline-block rounded-full border border-gray-300 bg-white px-5 py-1.5 text-sm font-bold text-gray-700 shadow-sm">
                                    Soal Nomor {indeksAktif + 1}
                                </span>
                            </div>

                            {/* Teks Pertanyaan */}
                            <div className="text-lg font-bold leading-relaxed text-[#1E293B]">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: teksPertanyaan,
                                    }}
                                />
                            </div>

                            {/* Pilihan Opsi / Isian */}
                            <div className="space-y-3 pt-2">
                                {soalAktif?.tipe === 'isian_singkat' ? (
                                    <div className="rounded-xl border border-gray-300 bg-white p-4">
                                        <p className="text-xs text-gray-500">Jawaban Kamu:</p>
                                        <p className="text-base font-bold text-gray-800">
                                            {jawabanAktif?.jawaban_isian || '-'}
                                        </p>
                                    </div>
                                ) : (
                                    opsiList.map((opsi, index) => {
                                        const labelOpsi = String.fromCharCode(65 + index); // A, B, C, D, E
                                        const isDipilih = jawabanAktif?.opsi_dipilih_id === opsi.id;
                                        const isKunci = opsi.is_kunci;

                                        // Default Opsi (Netral)
                                        let bgCircle = 'bg-gray-100 border-gray-300 text-gray-500';
                                        let bgBox = 'bg-[#E2E8F0] border-gray-300 text-gray-400';
                                        let iconNode = null;

                                        if (isKunci) {
                                            // Opsi Benar (Hijau EDVORA)
                                            bgCircle = 'bg-[#BBF7D0] border-[#86EFAC] text-gray-700 font-bold';
                                            bgBox = 'bg-[#BBF7D0] border-[#86EFAC] text-gray-800 font-medium';
                                            iconNode = (
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#16A34A] text-white">
                                                    ✓
                                                </div>
                                            );
                                        } else if (isDipilih && !isKunci) {
                                            // Opsi Salah yang Dipilih User (Merah EDVORA)
                                            bgCircle = 'bg-[#FCA5A5] border-[#F87171] text-white font-bold';
                                            bgBox = 'bg-[#FCA5A5] border-[#F87171] text-gray-900 font-medium';
                                            iconNode = (
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DC2626] text-white">
                                                    ✕
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={opsi.id || index} className="flex items-center gap-3">
                                                {/* Abjad A/B/C/D/E */}
                                                <div
                                                    className={`flex h-12 w-12 items-center justify-center rounded-xl border text-base ${bgCircle}`}
                                                >
                                                    {labelOpsi}
                                                </div>

                                                {/* Teks Opsi */}
                                                <div
                                                    className={`flex flex-1 items-center justify-between rounded-2xl border px-5 py-3.5 ${bgBox}`}
                                                >
                                                    <span
                                                        dangerouslySetInnerHTML={{ __html: opsi.teks_opsi }}
                                                    />
                                                    {iconNode}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* KOTAK PEMBAHASAN */}
                            <div className="relative mt-8 rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
                                {/* Label Pembahasan Floating Badge */}
                                <div className="absolute -top-4 left-4 rounded-lg bg-[#2B4184] px-4 py-1 text-sm font-bold text-white shadow-sm">
                                    Pembahasan
                                </div>

                                <div className="mt-2 text-sm font-medium leading-relaxed text-gray-700">
                                    {soalAktif?.pembahasan ? (
                                        <div
                                            className="prose max-w-none"
                                            dangerouslySetInnerHTML={{ __html: soalAktif.pembahasan }}
                                        />
                                    ) : (
                                        <p className="italic text-gray-500">
                                            Tidak ada pembahasan khusus untuk soal ini.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* NAVIGATION BUTTONS FOOTER */}
                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    disabled={indeksAktif === 0}
                                    onClick={() => setIndeksAktif((prev) => prev - 1)}
                                    className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-40"
                                >
                                    &larr; Kembali
                                </button>

                                <button
                                    type="button"
                                    disabled={indeksAktif === daftarJawaban.length - 1}
                                    onClick={() => setIndeksAktif((prev) => prev + 1)}
                                    className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-40"
                                >
                                    Lanjut &rarr;
                                </button>

                                <Link
                                    href="/dashboard"
                                    className="rounded-lg bg-[#F87171] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#EF4444]"
                                >
                                    Kembali ke Beranda
                                </Link>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}