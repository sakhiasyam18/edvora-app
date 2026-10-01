import React from 'react';
import { Head, Link } from '@inertiajs/react';

interface JawabanPengerjaan {
    id: string;
    is_correct: boolean;
    skor: number;
}

interface Subtes {
    id: string;
    nama_subtes: string;
}

interface Pengerjaan {
    id: string;
    subtes_id: string;
    jumlah_soal_dipilih: number;
    total_skor: number;
    started_at: string;
    finished_at: string;
    subtes?: Subtes;
    jawaban_pengerjaan?: JawabanPengerjaan[];
}

interface HasilData {
    jumlahBenar: number;
    jumlahSalah: number;
    poin: number;
    xpDidapat: number;
}

interface Props {
    hasil: HasilData;
    pengerjaan: Pengerjaan;
}

export default function Hasil({ hasil, pengerjaan }: Props) {
    // 1. Ambil Nama Subtes
    const subtesNama = pengerjaan?.subtes?.nama_subtes || 'Penalaran Umum';

    // 2. Hitung statistik
    const totalSoal = pengerjaan?.jumlah_soal_dipilih || 0;
    const jawabanBenar = hasil?.jumlahBenar ?? 0;
    const jawabanSalah = hasil?.jumlahSalah ?? 0;

    // Jawaban kosong dihitung dari sisa total soal yang tidak dijawab/dicatat
    const totalDijawab = jawabanBenar + jawabanSalah;
    const jawabanKosong = Math.max(0, totalSoal - totalDijawab);

    // 3. Format Durasi Waktu Pengerjaan
    const formatWaktu = (start?: string, end?: string) => {
        if (!start || !end) return '-';
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const diffSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000));

        const menit = Math.floor(diffSeconds / 60);
        const detik = diffSeconds % 60;

        if (menit > 0) {
            return `${menit}m ${detik}s`;
        }
        return `${detik}s`;
    };

    const waktuPengerjaan = formatWaktu(pengerjaan?.started_at, pengerjaan?.finished_at);

    // 4. Deteksi Mode berdasarkan Jumlah Soal (Jika totalSoal 30/UTBK = Simulasi)
    // Atau Kamu bisa sesuaikan teks ini sesuai preferensi
    const modeText = totalSoal >= 20 ? 'Mode Simulasi' : 'Mode Fleksibel';

    return (
        <>
            <Head title={`Hasil Pengerjaan - ${subtesNama}`} />
            <div className="flex min-h-screen flex-col bg-[#EBF3FC] font-['Plus_Jakarta_Sans',sans-serif] text-[#1E293B]">
                {/* HEADER / NAVIGASI BAR */}
                <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2B4184] text-lg font-black text-white">
                            E
                        </div>
                    </div>

                    {/* BREADCRUMB NAVIGASI DINAMIS */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                        <Link href="/dashboard" className="text-gray-400 transition hover:text-gray-600">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l1.293 1.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                        </Link>
                        <span>&gt;</span>
                        <Link href="/latihan" className="transition hover:text-gray-700">
                            Latihan Soal
                        </Link>
                        <span>&gt;</span>
                        <span className="font-bold text-gray-700">
                            {subtesNama} ({modeText})
                        </span>
                    </div>

                    <div className="flex cursor-pointer items-center gap-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5C82E6] text-sm font-bold text-white shadow-sm">
                            A
                        </div>
                    </div>
                </header>

                {/* KONTEN UTAMA HASIL */}
                <main className="flex flex-1 items-center justify-center p-6">
                    <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
                        {/* BANNER BIRU KARTU */}
                        <div className="relative flex h-28 justify-center bg-gradient-to-r from-[#698CDD] to-[#476BB8]">
                            <div className="absolute -bottom-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-md">
                                <div className="flex h-full w-full items-center justify-center rounded-xl bg-amber-50 text-3xl">
                                    🏆
                                </div>
                            </div>
                        </div>

                        {/* RINGKASAN HASIL */}
                        <div className="px-8 pb-8 pt-12 text-center">
                            <h1 className="text-2xl font-black text-[#1E293B] sm:text-3xl">
                                {subtesNama}
                            </h1>
                            <p className="mt-2 text-xs font-semibold text-gray-500 sm:text-sm">
                                Kerja Bagus! Terus tingkatkan kemampuanmu dan berkembang setiap harinya!
                            </p>

                            {/* STATISTIK 6 KARTU */}
                            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                {/* JAWABAN BENAR */}
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-green-300">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-extrabold text-white">
                                        ✓
                                    </div>
                                    <span className="mt-3 text-2xl font-black text-[#1E293B]">
                                        {jawabanBenar}
                                    </span>
                                    <span className="mt-1 text-[11px] font-bold text-gray-400">
                                        Jawaban Benar
                                    </span>
                                </div>

                                {/* JAWABAN SALAH */}
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-red-300">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-extrabold text-white">
                                        ✕
                                    </div>
                                    <span className="mt-3 text-2xl font-black text-[#1E293B]">
                                        {jawabanSalah}
                                    </span>
                                    <span className="mt-1 text-[11px] font-bold text-gray-400">
                                        Jawaban Salah
                                    </span>
                                </div>

                                {/* JAWABAN KOSONG */}
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-400">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-sm font-extrabold text-white">
                                        −
                                    </div>
                                    <span className="mt-3 text-2xl font-black text-[#1E293B]">
                                        {jawabanKosong}
                                    </span>
                                    <span className="mt-1 text-[11px] font-bold text-gray-400">
                                        Jawaban Kosong
                                    </span>
                                </div>

                                {/* WAKTU PENGERJAAN */}
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-blue-300">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5C82E6] text-white">
                                        🕒
                                    </div>
                                    <span className="mt-3 text-xl font-black text-[#1E293B]">
                                        {waktuPengerjaan}
                                    </span>
                                    <span className="mt-1 text-[11px] font-bold text-gray-400">
                                        Waktu Pengerjaan
                                    </span>
                                </div>

                                {/* POIN */}
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-blue-300">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#82B1FF] text-white">
                                        ⭐
                                    </div>
                                    <span className="mt-3 text-2xl font-black text-[#1E293B]">
                                        {hasil?.poin ?? 0}
                                    </span>
                                    <span className="mt-1 text-[11px] font-bold text-gray-400">
                                        Poin
                                    </span>
                                </div>

                                {/* XP DIPEROLEH */}
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-indigo-300">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B4C6FF] text-[10px] font-black text-[#3b5998]">
                                        XP
                                    </div>
                                    <span className="mt-3 text-xl font-black text-[#1E293B]">
                                        +{hasil?.xpDidapat ?? 0} XP
                                    </span>
                                    <span className="mt-1 text-[11px] font-bold text-gray-400">
                                        XP Diperoleh
                                    </span>
                                </div>
                            </div>

                            {/* TOMBOL AKSI */}
                            <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
                                <Link
                                    href="/latihan"
                                    className="w-full rounded-2xl border border-gray-300 bg-[#D9E2EC] px-6 py-3 text-xs font-bold text-[#334155] transition hover:bg-[#cbd5e1] sm:w-auto"
                                >
                                    ← Kembali ke Menu Latihan Soal
                                </Link>

                                <Link
                                    href={`/latihan/pembahasan?id=${pengerjaan?.id}`}
                                    className="w-full rounded-2xl bg-[#5C82E6] px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#486ed6] sm:w-auto"
                                >
                                    Lihat Pembahasan Soal →
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}