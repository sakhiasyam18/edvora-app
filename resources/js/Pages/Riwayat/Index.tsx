import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// Tombol "Lanjut Kerjakan" disembunyikan sampai fitur simpan per soal selesai (RANCANGAN-dashboard-topik-remedial.md).
// Saat itu, aktifkan lagi dan arahkan ke rute pengerjaan yang baru; cabang Ulangi di latihan.ujian sudah dihapus.
const LANJUT_KERJAKAN_TERSEDIA = false;

// Interface Data
interface RiwayatItem {
    id: string;
    tipe: string;
    mode_latihan?: string;
    status: 'berjalan' | 'selesai';
    jenis_pengerjaan: string;
    nama_materi: string;
    total_skor: number;
    started_at: string;
    finished_at?: string;
    try_out_id?: string;
    subtes_id?: string;
}

interface PaginatedData<T> {
    data: T[];
    links: any[];
    current_page: number;
    last_page: number;
}

interface IndexProps {
    title?: string;
    riwayat: PaginatedData<RiwayatItem>;
    filters: {
        search: string;
    };
}

interface ModalInfoData {
    judul: string;
    tipe: string;
    mode_latihan: string;
    started_at: string;
    status: string;
    total_dijawab: number;
    jumlah_soal: number;
    skor: number;
}

// Komponen Helper untuk Ikon & Warna Dinamis
const getCardStyle = (tipe: string, mode_latihan?: string) => {
    if (tipe === 'try_out' || tipe === 'tryout') {
        return {
            bgIcon: 'bg-[#D4E8D1]', // Hijau Try Out
            textIcon: 'text-[#4CAF50]',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2.41L17.59 9H13V4.41zM6 20V4h5v7h7v9H6zm2-8h8v2H8v-2zm0 4h5v2H8v-2z" />
                </svg>
            ),
        };
    }

    if (mode_latihan === 'remedial') {
        return {
            bgIcon: 'bg-[#FDF0D5]', // Kuning Remedial
            textIcon: 'text-[#F5A623]',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                    <path d="m9 14 2 2 4-4" />
                </svg>
            ),
        };
    }

    if (mode_latihan === 'simulasi') {
        return {
            bgIcon: 'bg-[#FAD9D9]', // Merah Simulasi
            textIcon: 'text-[#E57373]',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 2v2" />
                    <path d="M12 8v4l2 2" />
                </svg>
            ),
        };
    }

    // Default: Fleksibel
    return {
        bgIcon: 'bg-[#D2E4FF]', // Biru Fleksibel
        textIcon: 'text-[#5B8DEF]',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
        ),
    };
};

export default function Index({
    title = 'Riwayat Pengerjaan',
    riwayat,
    filters,
}: IndexProps) {
    const user = usePage<any>().props.auth.user;
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

    const [search, setSearch] = useState(filters.search || '');
    const [selectedInfo, setSelectedInfo] = useState<ModalInfoData | null>(null);
    const [isLoadingInfo, setIsLoadingInfo] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get(route('riwayat.index'), { search }, { preserveState: true, replace: true });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleOpenInfo = async (pengerjaanId: string) => {
        setIsLoadingInfo(true);
        setIsModalOpen(true);
        try {
            const res = await fetch(route('riwayat.info', pengerjaanId));
            const data = await res.json();
            setSelectedInfo(data);
        } catch (error) {
            console.error('Gagal mengambil info:', error);
        } finally {
            setIsLoadingInfo(false);
        }
    };

    return (
        <>
            <Head title={title} />

            <div className="flex min-h-screen bg-[#F5F8FF]">
                {/* Sidebar */}
                <aside className="hidden w-64 shrink-0 flex-col bg-[#344A91] md:flex">
                    <div className="flex h-24 items-center justify-center">
                        <span className="text-3xl font-bold tracking-wide text-white">
                            EDVORA
                        </span>
                    </div>

                    <nav className="mt-16 space-y-4 px-4">
                        <Link href={route('dashboard')} className="flex items-center gap-4 rounded-xl px-6 py-4 text-lg font-medium text-white transition hover:bg-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                <path d="M12 3.2 3.5 10v10.2c0 .5.4.8.8.8H9v-6h6v6h4.7c.4 0 .8-.3.8-.8V10L12 3.2Z" />
                            </svg>
                            <span>Beranda</span>
                        </Link>
                        <Link href={route('riwayat.index')} className="flex items-center gap-4 rounded-xl bg-[#5F8DDD] px-6 py-4 text-lg font-semibold text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                <path d="M6 3h10a2 2 0 0 1 2 2v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                                <path d="M8 8h6" />
                                <path d="M8 12h6" />
                                <path d="M8 16h4" />
                            </svg>
                            <span>Riwayat</span>
                        </Link>
                    </nav>
                </aside>

                {/* Main Area */}
                <div className="flex min-h-screen flex-1 flex-col">
                    {/* Header Top Bar */}
                    <header className="flex h-20 shrink-0 items-center justify-end bg-white px-10 border-b border-gray-100">
                        <Link href={route('profile.edit')} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5F8DDF] text-lg font-medium text-white transition hover:bg-[#507FD0]">
                            {initial}
                        </Link>
                    </header>

                    {/* Content */}
                    <main className="flex flex-1 px-6 py-8 md:px-12">
                        <div className="w-full max-w-6xl mx-auto">
                            
                            {/* Header Section (Banner & Search) */}
                            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                {/* Banner Kiri */}
                                <div className="rounded-2xl bg-gradient-to-r from-[#81A6E7] to-[#A8C7FA] px-8 py-5 text-white shadow-sm md:w-[45%]">
                                    <h1 className="text-2xl font-bold md:text-3xl">Riwayat Pengerjaan</h1>
                                    <p className="mt-1 text-sm font-medium opacity-90">Akses riwayat pengerjaan mu disini!</p>
                                </div>

                                {/* Search & Filter Kanan */}
                                <div className="flex flex-1 items-center gap-4 md:justify-end">
                                    <div className="relative w-full md:max-w-md">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Cari Sesi atau Subtes"
                                            className="h-12 w-full rounded-full border border-gray-200 bg-white pl-12 pr-5 text-sm font-medium text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#5F8DDD] focus:ring-1 focus:ring-[#5F8DDD]"
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400">
                                            <circle cx="11" cy="11" r="7" />
                                            <path d="m20 20-3.5-3.5" />
                                        </svg>
                                    </div>
                                    <button className="flex h-12 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50">
                                        <span>Filter Pencarian</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                            <path d="M3 6h18M6 12h12m-9 6h6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Cards Grid */}
                            {riwayat.data.length === 0 ? (
                                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100">
                                    <p className="text-xl font-semibold text-gray-700">Belum Ada Riwayat Pengerjaan</p>
                                    <p className="mt-2 text-sm text-gray-500">Mulai latihan, simulasi, atau remedial untuk melihat riwayat kamu di sini.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:gap-8">
                                    {riwayat.data.map((item) => {
                                        const style = getCardStyle(item.tipe, item.mode_latihan);
                                        return (
                                            <div key={item.id} className="relative flex flex-col justify-between rounded-3xl bg-white p-6 shadow-sm border border-gray-100 transition hover:shadow-md">
                                                
                                                {/* Top Row: Badge & Info Icon */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        {item.status === 'berjalan' && (
                                                            <span className="inline-block rounded-full bg-[#FF7B7B] px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
                                                                Belum Selesai
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleOpenInfo(item.id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5B8DEF] text-white shadow-sm transition hover:bg-[#4A7CDA]"
                                                        title="Informasi Pengerjaan"
                                                    >
                                                        <span className="font-serif text-sm font-bold italic">i</span>
                                                    </button>
                                                </div>

                                                {/* Content Title */}
                                                <div className="mb-8 flex items-center gap-5">
                                                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${style.bgIcon} ${style.textIcon}`}>
                                                        {style.icon}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h3 className="text-lg font-bold text-[#344A91] leading-tight">
                                                            {item.jenis_pengerjaan}
                                                        </h3>
                                                        {item.nama_materi && (
                                                            <p className="text-lg font-semibold text-gray-800 leading-tight">
                                                                {item.nama_materi}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <div>
                                                    {item.status === 'berjalan' ? (
                                                        LANJUT_KERJAKAN_TERSEDIA && <Link
                                                            href={route('latihan.ujian', { subtesId: item.subtes_id, pengerjaanId: item.id })}
                                                            className="flex w-full items-center justify-center rounded-2xl bg-[#4CAF50] py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#43A047]"
                                                        >
                                                            Lanjut Kerjakan
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            href={item.tipe === 'try_out' || item.tipe === 'tryout' ? route('tryout.hasil', item.id) : route('riwayat.detail', item.id)}
                                                            className="flex w-full items-center justify-center rounded-2xl bg-[#5B8DEF] py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#4A7CDA]"
                                                        >
                                                            Lihat Hasil Pengerjaan
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* Modal Info Pengerjaan */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Latar Belakang Gelap (Klik untuk menutup) */}
                    <div 
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
                        onClick={() => setIsModalOpen(false)}
                    ></div>

                    {/* Card Modal Utama dengan Border Biru Terang */}
                    <div className="relative z-10 w-full max-w-lg rounded-2xl border-[3px] border-[#2596F8] bg-white p-5 shadow-2xl transition-all md:p-6">
                        
                        {isLoadingInfo ? (
                            <div className="py-6 text-center text-sm font-medium text-gray-500">
                                Memuat informasi...
                            </div>
                        ) : selectedInfo ? (
                            <div className="flex flex-col items-start gap-4 md:flex-row md:gap-5">
                                {/* Ikon Kiri (Warna dinamis mengikuti getCardStyle) */}
                                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${getCardStyle(selectedInfo.tipe, selectedInfo.mode_latihan).bgIcon} ${getCardStyle(selectedInfo.tipe, selectedInfo.mode_latihan).textIcon}`}>
                                    {getCardStyle(selectedInfo.tipe, selectedInfo.mode_latihan).icon}
                                </div>

                                {/* Konten Kanan */}
                                <div className="flex-1 pt-1">
                                    <h3 className="text-xl font-bold text-[#1F2D5C] leading-tight">
                                        {selectedInfo.judul}
                                    </h3>

                                    {/* Baris Tag/Pill */}
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        
                                        {/* Tag Jumlah Soal */}
                                        <div className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                                            </svg>
                                            {selectedInfo.total_dijawab} / {selectedInfo.jumlah_soal} soal terjawab
                                        </div>

                                        {/* Tag Waktu Mulai */}
                                        <div className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            Mulai {selectedInfo.started_at}
                                        </div>

                                        {/* Tag Status / Skor */}
                                        <div className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 ${selectedInfo.status === 'selesai' ? 'text-[#F5A623]' : 'text-gray-400'}`}>
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                            {selectedInfo.status === 'selesai' ? `Skor: ${selectedInfo.skor}` : 'Belum Selesai'}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </>
    );
}