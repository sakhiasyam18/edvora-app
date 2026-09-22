import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import Modal from '@/Components/Modal';
import { KonfigurasiSesiLatihan, ModeLatihan } from '@/types/latihan';
import { dummyKonfigurasiSesi } from '@/data/dummyLatihan';

// Sementara: daftar subtes belum dikirim backend.
const daftarSubtes = [
    { id: 1, nama: 'Penalaran Umum', singkatan: 'PU', warna: 'bg-[#DCE7F0]', deskripsi: 'Menguji kemampuan berpikir logis melalui bagian Induktif, Deduktif, dan Kuantitatif.' },
    { id: 2, nama: 'Pengetahuan dan Pemahaman Umum', singkatan: 'PPU', warna: 'bg-[#F3D6D6]', deskripsi: 'Mengukur pemahaman bahasa, leksikal, dan wawasan sosial budaya.' },
    { id: 3, nama: 'Pemahaman Baca dan Menulis', singkatan: 'PBM', warna: 'bg-[#EDF0D8]', deskripsi: 'Menilai pemahaman wacana dan kemampuan menulis akademik, mencakup ejaan serta ide pokok.' },
    { id: 4, nama: 'Pengetahuan Kuantitatif', singkatan: 'PK', warna: 'bg-[#DFDFF3]', deskripsi: 'Menguji konsep dasar matematika seperti aljabar dan geometri.' },
    { id: 5, nama: 'Literasi dalam Bahasa Indonesia', singkatan: 'LBI', warna: 'bg-[#F2D6EC]', deskripsi: 'Mengevaluasi pemahaman teks ilmiah yang kompleks.' },
    { id: 6, nama: 'Literasi dalam Bahasa Inggris', singkatan: 'LBE', warna: 'bg-[#F2EED8]', deskripsi: 'Menguji strategi kognitif pembaca menggunakan bacaan berbahasa Inggris.' },
    { id: 7, nama: 'Penalaran Matematika', singkatan: 'PM', warna: 'bg-[#D9EFE0]', deskripsi: 'Menerapkan konsep matematika untuk menyelesaikan masalah nyata dalam bentuk grafik atau soal cerita.' },
];

const JUMLAH_SOAL_FLEKSIBEL_AWAL = 10;
const JUMLAH_SOAL_MIN = 1;
const JUMLAH_SOAL_MAKS = 20;
const JUMLAH_SOAL_SIMULASI = dummyKonfigurasiSesi.jumlahSoal;
const WAKTU_SIMULASI_MENIT = dummyKonfigurasiSesi.waktuPengerjaanMenit ?? 20;

function konfigurasiUntukMode(subtesId: number, namaSubtes: string, mode: ModeLatihan): KonfigurasiSesiLatihan {
    if (mode === 'simulasi') {
        return { subtesId, namaSubtes, mode, jumlahSoal: JUMLAH_SOAL_SIMULASI, waktuPengerjaanMenit: WAKTU_SIMULASI_MENIT };
    }
    return { subtesId, namaSubtes, mode, jumlahSoal: JUMLAH_SOAL_FLEKSIBEL_AWAL, iceBreakingAktif: false };
}

function IkonPanah() {
    return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3F6FB5] text-white">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
        </span>
    );
}

export default function Persiapan() {
    const [tampilModal, setTampilModal] = useState(false);
    const [konfigurasi, setKonfigurasi] = useState<KonfigurasiSesiLatihan | null>(null);

    const bukaModal = (subtes: (typeof daftarSubtes)[number]) => {
        setKonfigurasi(konfigurasiUntukMode(subtes.id, subtes.nama, 'fleksibel'));
        setTampilModal(true);
    };

    const gantiMode = (mode: ModeLatihan) => {
        if (!konfigurasi || konfigurasi.mode === mode) return;
        setKonfigurasi(konfigurasiUntukMode(konfigurasi.subtesId, konfigurasi.namaSubtes, mode));
    };

    const ubahJumlahSoal = (delta: number) => {
        if (!konfigurasi) return;
        const jumlahSoal = Math.min(JUMLAH_SOAL_MAKS, Math.max(JUMLAH_SOAL_MIN, konfigurasi.jumlahSoal + delta));
        setKonfigurasi({ ...konfigurasi, jumlahSoal });
    };

    const mulaiMengerjakan = () => {
        if (!konfigurasi) return;
        // Backend belum menerima state ini, jadi konfigurasi dikirim lewat query param.
        router.get(route('latihan.ujian'), { ...konfigurasi });
    };

    return (
        <LatihanLayout breadcrumb={['Latihan Soal']}>
            <Head title="Pilih Subtest" />

            <div className="px-10 py-10">
                <h1 className="text-5xl font-bold text-[#1F2D5C]">Pilih Subtest</h1>
                <p className="mt-1 text-sm font-medium text-gray-600">Pilih subtest UTBK yang ingin kamu kerjakan hari ini!</p>

                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {daftarSubtes.map((subtes) => (
                        <button
                            key={subtes.id}
                            type="button"
                            onClick={() => bukaModal(subtes)}
                            className="flex min-h-[190px] flex-col rounded-xl bg-white p-4 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <span className={`h-12 w-12 rounded-full ${subtes.warna}`} />
                            <span className="mt-4 font-semibold leading-snug text-[#1F2D5C]">
                                {subtes.nama} ({subtes.singkatan})
                            </span>
                            <span className="mt-1 text-xs text-gray-600">{subtes.deskripsi}</span>
                            <span className="mt-auto flex justify-end pt-3">
                                <IkonPanah />
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <Modal show={tampilModal} maxWidth="lg" onClose={() => setTampilModal(false)}>
                {konfigurasi && (
                    <div className="p-6 font-['Poppins',sans-serif] text-[#1F2D5C]">
                        <h2 className="text-2xl font-semibold">{konfigurasi.namaSubtes}</h2>
                        <p className="text-sm text-gray-600">Pilih mode latihan yang sesuai dengan kebutuhanmu!</p>

                        <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg border border-[#C9DBF2] bg-[#EAF2FC] p-1">
                            {(['fleksibel', 'simulasi'] as ModeLatihan[]).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => gantiMode(mode)}
                                    className={`rounded-md py-2.5 font-medium transition ${
                                        konfigurasi.mode === mode ? 'bg-[#5B86DB] text-white shadow' : 'text-[#1F2D5C] hover:bg-white/60'
                                    }`}
                                >
                                    Mode {mode === 'fleksibel' ? 'Fleksibel' : 'Simulasi'}
                                </button>
                            ))}
                        </div>

                        {konfigurasi.mode === 'fleksibel' ? (
                            <div className="mt-4 space-y-4">
                                <div className="flex items-center justify-between rounded-lg border border-[#C9DBF2] bg-[#EAF2FC] p-4">
                                    <div>
                                        <p className="text-lg font-medium">Jumlah Soal</p>
                                        <p className="text-sm text-gray-600">Pilih jumlah soal yang diinginkan</p>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-md border border-gray-300 bg-white px-2 py-1">
                                        <button
                                            type="button"
                                            onClick={() => ubahJumlahSoal(-1)}
                                            disabled={konfigurasi.jumlahSoal <= JUMLAH_SOAL_MIN}
                                            className="flex h-6 w-6 items-center justify-center rounded border border-gray-400 text-gray-600 disabled:opacity-40"
                                            aria-label="Kurangi jumlah soal"
                                        >
                                            −
                                        </button>
                                        <span className="w-6 text-center font-medium">{konfigurasi.jumlahSoal}</span>
                                        <button
                                            type="button"
                                            onClick={() => ubahJumlahSoal(1)}
                                            disabled={konfigurasi.jumlahSoal >= JUMLAH_SOAL_MAKS}
                                            className="flex h-6 w-6 items-center justify-center rounded border border-gray-400 text-gray-600 disabled:opacity-40"
                                            aria-label="Tambah jumlah soal"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    aria-pressed={!!konfigurasi.iceBreakingAktif}
                                    onClick={() => setKonfigurasi({ ...konfigurasi, iceBreakingAktif: !konfigurasi.iceBreakingAktif })}
                                    className="flex w-full items-center gap-4 text-left"
                                >
                                    <span
                                        className={`flex h-12 w-12 items-center justify-center rounded-lg border transition ${
                                            konfigurasi.iceBreakingAktif ? 'border-[#5B86DB] bg-[#5B86DB]' : 'border-gray-300 bg-[#EAF2FC]'
                                        }`}
                                    >
                                        <svg className={`h-7 w-7 ${konfigurasi.iceBreakingAktif ? 'text-white' : 'text-[#2E3F85]'}`} viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zM8.5 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM12 18a5.5 5.5 0 01-5-3.2h10A5.5 5.5 0 0112 18z" />
                                        </svg>
                                    </span>
                                    <span>
                                        <span className="block text-lg font-medium">Ice Breaking</span>
                                        <span className="block text-sm text-gray-600">Aktifkan untuk suasana yang lebih santai</span>
                                    </span>
                                </button>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-300 bg-[#EAF2FC] text-[#2E3F85]">
                                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                        </svg>
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-lg font-medium">Jumlah Soal</p>
                                        <p className="text-sm text-gray-600">Jumlah soal yang akan dikerjakan</p>
                                    </div>
                                    <span className="rounded-md border border-[#C9DBF2] bg-[#EAF2FC] px-4 py-1.5 text-sm font-medium">
                                        {konfigurasi.jumlahSoal} Soal
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-300 bg-[#EAF2FC] text-[#2E3F85]">
                                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                                            <circle cx="12" cy="12" r="9" />
                                            <path d="M12 7v5l3 2" />
                                        </svg>
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-lg font-medium">Waktu Pengerjaan</p>
                                        <p className="text-sm text-gray-600">Durasi waktu untuk menyelesaikan soal</p>
                                    </div>
                                    <span className="rounded-md border border-[#C9DBF2] bg-[#EAF2FC] px-4 py-1.5 text-sm font-medium">
                                        {konfigurasi.waktuPengerjaanMenit} Menit
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={mulaiMengerjakan}
                            className="mt-5 w-full rounded-lg bg-[#5B86DB] py-3 font-medium text-white shadow transition hover:bg-[#4A74C8]"
                        >
                            Mulai Mengerjakan
                        </button>
                    </div>
                )}
            </Modal>
        </LatihanLayout>
    );
}
