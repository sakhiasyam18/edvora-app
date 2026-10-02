import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';

// Pilihan panel filter; kode sama dengan FilterRiwayat::JENIS dan ::STATUS di backend.
const PILIHAN_JENIS = {
    fleksibel: 'Latihan Soal Fleksibel',
    simulasi: 'Latihan Simulasi',
    remedial: 'Remedial',
    tryout: 'Try Out',
} as const;

const PILIHAN_STATUS = {
    selesai: 'selesai',
    belum_selesai: 'belum selesai',
} as const;

type JenisSesi = keyof typeof PILIHAN_JENIS;
type StatusFilter = keyof typeof PILIHAN_STATUS;

// Pilihan radio setelah Reset.
const JENIS_DEFAULT: JenisSesi = 'fleksibel';
const STATUS_DEFAULT: StatusFilter = 'selesai';

// Tombol "Lanjut Kerjakan" disembunyikan sampai fitur simpan per soal selesai (RANCANGAN-dashboard-topik-remedial.md).
// Saat itu, aktifkan lagi dan arahkan ke rute pengerjaan yang baru; cabang Ulangi di latihan.ujian sudah dihapus.
// Try Out tidak memakai flag ini: pengerjaan Try Out yang berjalan selalu bisa dilanjutkan (RANCANGAN-tryout.md 6.4).
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
    // Dari paginator Laravel: [Sebelumnya, 1, 2, ..., Berikutnya]; url null bila tidak bisa dipencet.
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface IndexProps {
    title?: string;
    riwayat: PaginatedData<RiwayatItem>;
    // Pencarian dan filter yang sedang berlaku; null = tanpa filter (semua riwayat).
    filters: {
        cari: string;
        jenis: JenisSesi | null;
        status: StatusFilter | null;
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
    const [cari, setCari] = useState(filters.cari);
    const [panelFilter, setPanelFilter] = useState(false);
    const [pilihanJenis, setPilihanJenis] = useState<JenisSesi>(filters.jenis ?? JENIS_DEFAULT);
    const [pilihanStatus, setPilihanStatus] = useState<StatusFilter>(filters.status ?? STATUS_DEFAULT);
    const [selectedInfo, setSelectedInfo] = useState<ModalInfoData | null>(null);
    const [isLoadingInfo, setIsLoadingInfo] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filterAktif = filters.jenis !== null || filters.status !== null;
    const adaPencarian = filters.cari !== '' || filterAktif;

    // Satu request per pencarian: hanya saat tombol cari/Enter, Cari, atau Reset ditekan (bukan setiap ketikan).
    const tampilkan = (params: { cari: string; jenis?: JenisSesi; status?: StatusFilter }) => {
        router.get(
            route('riwayat.index'),
            { cari: params.cari.trim() || undefined, jenis: params.jenis, status: params.status },
            { preserveState: true },
        );
    };

    const kirimPencarian = (e: FormEvent) => {
        e.preventDefault();
        tampilkan({ cari, jenis: filters.jenis ?? undefined, status: filters.status ?? undefined });
    };

    const terapkanFilter = () => {
        setPanelFilter(false);
        tampilkan({ cari, jenis: pilihanJenis, status: pilihanStatus });
    };

    // Reset: filter dihapus sehingga semua riwayat tampil lagi; teks pencarian tetap.
    const resetFilter = () => {
        setPilihanJenis(JENIS_DEFAULT);
        setPilihanStatus(STATUS_DEFAULT);
        setPanelFilter(false);
        tampilkan({ cari });
    };

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

            {/* Sidebar dan header dari SiswaLayout (persistent), sama dengan halaman siswa lain. */}
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
                                    {/* Pencarian: dikirim lewat tombol kaca pembesar atau Enter. */}
                                    <form onSubmit={kirimPencarian} className="relative w-full md:max-w-md">
                                        <input
                                            type="text"
                                            value={cari}
                                            onChange={(e) => setCari(e.target.value)}
                                            placeholder="Cari Sesi atau Subtest"
                                            className="h-12 w-full rounded-full border border-gray-200 bg-white pl-5 pr-14 text-sm font-medium text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#5F8DDD] focus:ring-1 focus:ring-[#5F8DDD]"
                                        />
                                        <button
                                            type="submit"
                                            aria-label="Cari"
                                            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#2B4184] transition hover:bg-[#E6F2FF]"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                                <circle cx="11" cy="11" r="7" />
                                                <path d="m20 20-3.5-3.5" />
                                            </svg>
                                        </button>
                                    </form>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setPanelFilter((buka) => !buka)}
                                            aria-expanded={panelFilter}
                                            className={`flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border bg-white px-5 text-sm font-medium shadow-sm transition hover:bg-gray-50 ${
                                                filterAktif ? 'border-[#5F8DDD] text-[#2B4184]' : 'border-gray-200 text-gray-600'
                                            }`}
                                        >
                                            <span>Filter Pencarian</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                <path d="M3 6h18M6 12h12m-9 6h6" />
                                            </svg>
                                        </button>

                                        {/* Panel filter: pilihan baru berlaku setelah Cari; Reset menampilkan semua riwayat lagi. */}
                                        {panelFilter && (
                                            <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
                                                <p className="text-sm font-bold text-[#1E293B]">Jenis sesi</p>
                                                <div className="mt-2 space-y-2">
                                                    {(Object.keys(PILIHAN_JENIS) as JenisSesi[]).map((kode) => (
                                                        <label key={kode} className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                                                            <input
                                                                type="radio"
                                                                name="jenis"
                                                                checked={pilihanJenis === kode}
                                                                onChange={() => setPilihanJenis(kode)}
                                                                className="text-[#5B8DEF] focus:ring-[#5B8DEF]"
                                                            />
                                                            {PILIHAN_JENIS[kode]}
                                                        </label>
                                                    ))}
                                                </div>

                                                <p className="mt-4 text-sm font-bold text-[#1E293B]">Status Pengerjaan</p>
                                                <div className="mt-2 space-y-2">
                                                    {(Object.keys(PILIHAN_STATUS) as StatusFilter[]).map((kode) => (
                                                        <label key={kode} className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                                                            <input
                                                                type="radio"
                                                                name="status"
                                                                checked={pilihanStatus === kode}
                                                                onChange={() => setPilihanStatus(kode)}
                                                                className="text-[#5B8DEF] focus:ring-[#5B8DEF]"
                                                            />
                                                            {PILIHAN_STATUS[kode]}
                                                        </label>
                                                    ))}
                                                </div>

                                                <div className="mt-5 flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={resetFilter}
                                                        className="flex-1 rounded-full bg-[#E57373] py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D85E5E]"
                                                    >
                                                        Reset
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={terapkanFilter}
                                                        className="flex-1 rounded-full bg-[#5B8DEF] py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4A7CDA]"
                                                    >
                                                        Cari
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Cards Grid */}
                            {riwayat.data.length === 0 ? (
                                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100">
                                    {/* UCS3 2a dan 2b: belum pernah mengerjakan vs pencarian/filter tanpa hasil. */}
                                    {adaPencarian ? (
                                        <>
                                            <p className="text-xl font-semibold text-gray-700">Data Tidak Ditemukan</p>
                                            <p className="mt-2 text-sm text-gray-500">Coba kata kunci atau filter lain.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xl font-semibold text-gray-700">Belum Ada Riwayat Pengerjaan</p>
                                            <p className="mt-2 text-sm text-gray-500">Mulai latihan, simulasi, atau remedial untuk melihat riwayat kamu di sini.</p>
                                        </>
                                    )}
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
                                                        item.try_out_id ? (
                                                            <Link
                                                                href={route('tryout.kerjakan', item.try_out_id)}
                                                                className="flex w-full items-center justify-center rounded-2xl bg-[#4CAF50] py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#43A047]"
                                                            >
                                                                Lanjut Kerjakan
                                                            </Link>
                                                        ) : (
                                                            LANJUT_KERJAKAN_TERSEDIA && (
                                                                <Link
                                                                    href={route('latihan.ujian', { subtesId: item.subtes_id, pengerjaanId: item.id })}
                                                                    className="flex w-full items-center justify-center rounded-2xl bg-[#4CAF50] py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#43A047]"
                                                                >
                                                                    Lanjut Kerjakan
                                                                </Link>
                                                            )
                                                        )
                                                    ) : (
                                                        <Link
                                                            href={item.try_out_id ? route('tryout.hasil', item.try_out_id) : route('riwayat.detail', item.id)}
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

                            {/* Pagination 10 per halaman; tautannya sudah membawa pencarian dan filter (withQueryString). */}
                            {riwayat.last_page > 1 && (
                                <nav aria-label="Halaman riwayat" className="mt-8 flex flex-wrap items-center justify-center gap-2">
                                    {riwayat.links.map((link, i) => {
                                        const label = i === 0 ? '← Sebelumnya' : i === riwayat.links.length - 1 ? 'Berikutnya →' : link.label;
                                        const gaya = `flex h-10 min-w-10 items-center justify-center rounded-full px-4 text-sm font-semibold shadow-sm transition ${
                                            link.active ? 'bg-[#5B8DEF] text-white' : 'border border-gray-200 bg-white text-gray-600'
                                        }`;

                                        return link.url ? (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                preserveState
                                                aria-current={link.active ? 'page' : undefined}
                                                className={`${gaya} ${link.active ? '' : 'hover:bg-gray-50'}`}
                                            >
                                                {label}
                                            </Link>
                                        ) : (
                                            <span key={i} className={`${gaya} cursor-not-allowed opacity-50`}>
                                                {label}
                                            </span>
                                        );
                                    })}
                                </nav>
                            )}
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

// Persistent layout: sidebar tidak dirender ulang saat pindah dari/ke halaman siswa lain.
Index.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;