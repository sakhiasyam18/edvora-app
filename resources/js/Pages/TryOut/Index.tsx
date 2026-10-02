import { ReactNode, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';

interface TryOutItem {
    id: string;
    judul: string;
    status: string;
    jumlah_soal: number;
    durasi_menit: number;
    batas_waktu: string;
    peraturan?: string[];
}

interface Props {
    tryouts?: TryOutItem[];
}

export default function Index({ tryouts }: Props) {
    const [selectedTryout, setSelectedTryout] = useState<TryOutItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Data dummy fallback sesuai desain EDVORA
    const defaultTryouts: TryOutItem[] = [
        {
            id: '1',
            judul: 'Try Out EDVORA 1',
            status: 'DIBUKA',
            jumlah_soal: 160,
            durasi_menit: 195,
            batas_waktu: 's.d. 10 Oktober 2026, 23.59',
            peraturan: [
                'Waktu pengerjaan akan berjalan secara otomatis setelah tombol Mulai Kerjakan diklik.',
                'Setiap subtes memiliki alokasi waktu tersendiri.',
                'Kamu dapat menandai soal yang ragu-ragu dengan tombol Ragu-ragu.',
                'Pastikan koneksi internet stabil selama pengerjaan berlangsung.',
            ],
        },
    ];

    const listData = tryouts && tryouts.length > 0 ? tryouts : defaultTryouts;

    const handleOpenModal = (to: TryOutItem) => {
        setSelectedTryout(to);
        setIsModalOpen(true);
    };

    const handleStartExam = () => {
        if (selectedTryout) {
            router.get(`/tryout/${selectedTryout.id}/kerjakan`);
        }
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

                <div className="max-w-3xl space-y-4">
                    {listData.map((to) => (
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
                                            {to.status}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-gray-500">
                                        <span className="rounded-full border border-gray-200 px-3 py-1 bg-gray-50">
                                            📄 {to.jumlah_soal} soal
                                        </span>
                                        <span className="rounded-full border border-gray-200 px-3 py-1 bg-gray-50">
                                            ⏱ {to.durasi_menit} menit
                                        </span>
                                        <span className="rounded-full border border-gray-200 px-3 py-1 bg-gray-50">
                                            📅 {to.batas_waktu}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleOpenModal(to)}
                                className="rounded-xl bg-[#5C82E6] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#486ed6]"
                            >
                                Kerjakan &rarr;
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* POP UP PERATURAN (MODAL) */}
            {isModalOpen && selectedTryout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                    <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                                <h2 className="text-xl font-extrabold text-[#1E293B]">
                                    {selectedTryout.judul}
                                </h2>
                                <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10px] font-bold text-[#15803D]">
                                    {selectedTryout.status}
                                </span>
                            </div>

                            <div className="mt-2 flex justify-center gap-2 text-xs font-semibold text-gray-500">
                                <span>📄 {selectedTryout.jumlah_soal} soal</span>
                                <span>•</span>
                                <span>⏱ {selectedTryout.durasi_menit} menit</span>
                                <span>•</span>
                                <span>📅 {selectedTryout.batas_waktu}</span>
                            </div>
                        </div>

                        {/* Kotak Peraturan */}
                        <div className="mt-6 rounded-2xl bg-[#EBF3FC] border border-[#D0E2FF] p-5">
                            <h3 className="text-center text-sm font-extrabold tracking-wider text-[#2B4184] uppercase mb-3">
                                PERATURAN
                            </h3>
                            <ol className="list-decimal pl-5 text-xs font-medium text-gray-700 leading-relaxed space-y-2">
                                {selectedTryout.peraturan?.map((rule, idx) => (
                                    <li key={idx}>{rule}</li>
                                ))}
                            </ol>
                        </div>

                        {/* Tombol Mulai */}
                        <button
                            type="button"
                            onClick={handleStartExam}
                            className="mt-6 w-full rounded-xl bg-[#5C82E6] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#486ed6]"
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