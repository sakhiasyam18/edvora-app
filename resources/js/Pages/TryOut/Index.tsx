import { ReactNode, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import { formatWaktuWib } from '@/lib/waktu';
import { PaketTryOut } from '@/types/tryout';

interface IndexProps {
    paketList: PaketTryOut[];
}

const gayaTombol = 'rounded-xl bg-[#5C82E6] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#486ed6]';

// 195 → "195", 42.5 → "42,5"
const formatMenit = (menit: number) => menit.toLocaleString('id-ID');

export default function Index({ paketList }: IndexProps) {
    const [paketDipilih, setPaketDipilih] = useState<PaketTryOut | null>(null);
    const [memulai, setMemulai] = useState(false);

    // Pesan sekali tampil dari backend (Inertia::flash), mis. paket sudah tidak dibuka.
    const { flash } = usePage();
    const pesanError = typeof flash.error === 'string' ? flash.error : null;

    const mulaiKerjakan = () => {
        if (!paketDipilih) return;
        router.post(route('tryout.mulai', paketDipilih.id), {}, {
            onStart: () => setMemulai(true),
            onFinish: () => setMemulai(false),
        });
    };

    return (
        <>
            <Head title="Try Out - EDVORA" />

            {/* Sidebar dan header dari SiswaLayout (persistent layout di bawah). */}
            <div className="text-[#1E293B]">
                <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">TRY OUT</p>
                    <h1 className="text-2xl font-black text-[#1E293B]">SIMULASI UTBK</h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Mengerjakan semua subtes secara berurutan menggunakan timer.
                    </p>
                </div>

                {pesanError && (
                    <p className="mb-4 max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                        {pesanError}
                    </p>
                )}

                <div className="max-w-3xl space-y-4">
                    {paketList.length === 0 && (
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm font-semibold text-gray-500 shadow-sm">
                            Belum ada Try Out yang dibuka.
                        </div>
                    )}

                    {paketList.map((to) => (
                        <div
                            key={to.id}
                            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#166534]">
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-[#1E293B]">{to.judul}</h3>
                                        <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10px] font-bold text-[#15803D]">
                                            DIBUKA
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-gray-500">
                                        <span className="rounded-full border border-gray-200 px-3 py-1 bg-gray-50">
                                            📄 {to.totalSoal} soal
                                        </span>
                                        <span className="rounded-full border border-gray-200 px-3 py-1 bg-gray-50">
                                            ⏱ {formatMenit(to.totalMenit)} menit
                                        </span>
                                        <span className="rounded-full border border-gray-200 px-3 py-1 bg-gray-50">
                                            📅 s.d. {formatWaktuWib(to.selesaiAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {to.statusPengerjaan === 'belum' && (
                                <button type="button" onClick={() => setPaketDipilih(to)} className={gayaTombol}>
                                    Kerjakan &rarr;
                                </button>
                            )}
                            {to.statusPengerjaan === 'berjalan' && (
                                <Link href={route('tryout.kerjakan', to.id)} className={gayaTombol}>
                                    Lanjut Kerjakan &rarr;
                                </Link>
                            )}
                            {to.statusPengerjaan === 'selesai' && (
                                <Link href={route('tryout.hasil', to.id)} className={gayaTombol}>
                                    Lihat Hasil Try Out &rarr;
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* POP UP PERATURAN (MODAL) */}
            {paketDipilih && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                    <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <button
                            type="button"
                            onClick={() => setPaketDipilih(null)}
                            aria-label="Tutup"
                            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                                <h2 className="text-xl font-extrabold text-[#1E293B]">{paketDipilih.judul}</h2>
                                <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10px] font-bold text-[#15803D]">
                                    DIBUKA
                                </span>
                            </div>

                            <div className="mt-2 flex justify-center gap-2 text-xs font-semibold text-gray-500">
                                <span>📄 {paketDipilih.totalSoal} soal</span>
                                <span>•</span>
                                <span>⏱ {formatMenit(paketDipilih.totalMenit)} menit</span>
                                <span>•</span>
                                <span>📅 s.d. {formatWaktuWib(paketDipilih.selesaiAt)}</span>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl bg-[#EBF3FC] border border-[#D0E2FF] p-5">
                            <h3 className="text-center text-sm font-extrabold tracking-wider text-[#2B4184] uppercase mb-3">
                                PERATURAN
                            </h3>
                            <ol className="list-decimal pl-5 text-xs font-medium text-gray-700 leading-relaxed space-y-2">
                                {paketDipilih.peraturan.map((aturan, idx) => (
                                    <li key={idx}>{aturan}</li>
                                ))}
                            </ol>
                        </div>

                        {/* Mulai tetap boleh, tetapi Try Out akan terpotong di akhir periode (T13). */}
                        {!paketDipilih.waktuCukup && (
                            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-700">
                                Periode berakhir {formatWaktuWib(paketDipilih.selesaiAt)}. Jawaban dikirim otomatis saat periode
                                berakhir walaupun waktu subtes masih tersisa.
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={mulaiKerjakan}
                            disabled={memulai}
                            className="mt-6 w-full rounded-xl bg-[#5C82E6] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#486ed6] disabled:opacity-60"
                        >
                            Mulai Kerjakan &rarr;
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah ke halaman siswa lain.
Index.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
