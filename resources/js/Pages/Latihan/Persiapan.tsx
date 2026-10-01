import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import LingkaranTahap, { keteranganSkor, TEKS_LABEL } from '@/Components/Gamifikasi/LingkaranTahap';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import Modal from '@/Components/Modal';
import { KonfigurasiSesiLatihan, ModeLatihan, TopikPenguasaan } from '@/types/latihan';

// Batas sama dengan LatihanSoalController::JUMLAH_SOAL_MIN dan JUMLAH_SOAL_MAKS.
const JUMLAH_SOAL_FLEKSIBEL_AWAL = 10;
const JUMLAH_SOAL_MIN = 10;
const JUMLAH_SOAL_MAKS = 20;

// Kelas checkbox (plugin @tailwindcss/forms) untuk daftar topik.
const KELAS_CHECKBOX = 'h-4 w-4 shrink-0 rounded border-gray-300 text-[#5B86DB] focus:ring-[#5B86DB] disabled:opacity-50';

interface SubtesLatihan {
    id: string;
    nama_subtes: string;
    jumlah_soal: number;
    waktu_default_menit: number;
}

// topikIds = topik awal yang tercentang di mode fleksibel.
function konfigurasiUntukMode(item: SubtesLatihan, mode: ModeLatihan, topikIds: string[]): KonfigurasiSesiLatihan {
    const subtesId = item.id;
    const namaSubtes = item.nama_subtes;
    if (mode === 'simulasi') {
        return { subtesId, namaSubtes, mode, jumlahSoal: item.jumlah_soal, waktuPengerjaanMenit: item.waktu_default_menit };
    }
    return { subtesId, namaSubtes, mode, jumlahSoal: JUMLAH_SOAL_FLEKSIBEL_AWAL, iceBreakingAktif: false, topikIds };
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

// Warna per kode subtes, bukan per posisi kartu, supaya tetap benar saat urutan berubah.
const warnaSubtes: Record<string, string> = {
    PU: 'bg-[#DCE7F0]',
    PPU: 'bg-[#F3D6D6]',
    PBM: 'bg-[#EDF0D8]',
    PK: 'bg-[#DFDFF3]',
    LBI: 'bg-[#F2D6EC]',
    LBE: 'bg-[#F2EED8]',
    PM: 'bg-[#D9EFE0]',
};
const WARNA_CADANGAN = 'bg-[#DCE7F0]';

// Satu baris topik di modal mode fleksibel. Belum didesain.
function PilihanTopik({ topik, dipilih, onUbah }: { topik: TopikPenguasaan; dipilih: boolean; onUbah: () => void }) {
    return (
        <label
            className={`flex w-full items-center gap-3 rounded-lg border bg-white px-3 py-2 transition ${dipilih ? 'border-[#5B86DB]' : 'border-gray-200'
                } ${topik.adaSoal ? 'cursor-pointer hover:border-[#5B86DB]' : 'cursor-not-allowed opacity-60'}`}
        >
            <input type="checkbox" checked={dipilih} onChange={onUbah} disabled={!topik.adaSoal} className={KELAS_CHECKBOX} />
            <LingkaranTahap topik={topik} />
            <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                    {topik.nama}
                    {/* Topik prioritas: belum dikuasai padahal sudah 60 soal di tahap yang sama. */}
                    {topik.prioritas && (
                        <span className="rounded-full bg-[#FDECEC] px-2 py-0.5 text-[10px] font-semibold text-[#B94040]">Direkomendasikan</span>
                    )}
                </span>
                <span className="block text-xs text-gray-600">
                    {topik.adaSoal ? `Tahap ${topik.tahap} · ${TEKS_LABEL[topik.label]} · ${keteranganSkor(topik)}` : 'Belum ada soal'}
                </span>
            </span>
        </label>
    );
}

interface PersiapanProps {
    subtes?: any[];
    // subtes_id => topik, sudah diurutkan backend dari yang paling perlu dilatih (prioritas dulu).
    topikPerSubtes?: Record<string, TopikPenguasaan[]>;
}

export default function Persiapan({ subtes = [], topikPerSubtes = {} }: PersiapanProps) {
    const [tampilModal, setTampilModal] = useState(false);
    const [konfigurasi, setKonfigurasi] = useState<KonfigurasiSesiLatihan | null>(null);
    // Pesan sekali tampil dari backend (Inertia::flash), mis. sesi latihan sudah selesai atau kedaluwarsa.
    const { flash } = usePage();
    const pesanError = typeof flash.error === 'string' ? flash.error : null;

    // Topik subtes yang punya soal. Di mode fleksibel semuanya tercentang lebih dulu (UCS1).
    const topikTersedia = (subtesId: string | number) => (topikPerSubtes[subtesId] ?? []).filter((t) => t.adaSoal).map((t) => t.id);

    const bukaModal = (item: any) => {
        setKonfigurasi(konfigurasiUntukMode(item, 'fleksibel', topikTersedia(item.id)));
        setTampilModal(true);
    };

    const gantiMode = (mode: ModeLatihan) => {
        if (!konfigurasi || konfigurasi.mode === mode) return;
        const item = subtes.find((s) => s.id === konfigurasi.subtesId);
        if (item) setKonfigurasi(konfigurasiUntukMode(item, mode, topikTersedia(item.id)));
    };

    const ubahJumlahSoal = (delta: number) => {
        if (!konfigurasi) return;
        const jumlahSoal = Math.min(JUMLAH_SOAL_MAKS, Math.max(JUMLAH_SOAL_MIN, konfigurasi.jumlahSoal + delta));
        setKonfigurasi({ ...konfigurasi, jumlahSoal });
    };

    const topikList = konfigurasi ? (topikPerSubtes[konfigurasi.subtesId] ?? []) : [];
    const idTersedia = konfigurasi ? topikTersedia(konfigurasi.subtesId) : [];
    const topikIds = konfigurasi?.topikIds ?? [];
    // "Semua Topik" tercentang hanya bila semua topik yang punya soal tercentang (UCS1).
    const semuaDipilih = idTersedia.length > 0 && idTersedia.every((id) => topikIds.includes(id));

    const ubahTopik = (id: string) => {
        if (!konfigurasi) return;
        setKonfigurasi({ ...konfigurasi, topikIds: topikIds.includes(id) ? topikIds.filter((t) => t !== id) : [...topikIds, id] });
    };

    // Mencentang "Semua Topik" memilih semuanya; melepasnya mengosongkan pilihan (UCS1).
    const ubahSemuaTopik = () => {
        if (!konfigurasi) return;
        setKonfigurasi({ ...konfigurasi, topikIds: semuaDipilih ? [] : idTersedia });
    };

    // Mode fleksibel butuh minimal satu topik; soalnya dibagi rata ke topik terpilih menurut tahap siswa di tiap topik.
    const bisaMulai = konfigurasi !== null && (konfigurasi.mode === 'simulasi' || topikIds.length > 0);

    const mulaiMengerjakan = () => {
        if (!konfigurasi || !bisaMulai) return;
        // Backend belum menerima state ini, jadi konfigurasi dikirim lewat query param.
        router.get(route('latihan.ujian'), { ...konfigurasi });
    };

    return (
        <LatihanLayout breadcrumb={['Latihan Soal']}>
            <Head title="Pilih Subtest" />

            <div className="px-10 py-10">
                <h1 className="text-5xl font-bold text-[#1F2D5C]">Pilih Subtest</h1>
                <p className="mt-1 text-sm font-medium text-gray-600">Pilih subtest UTBK yang ingin kamu kerjakan hari ini!</p>

                {/* Banner dasar, belum didesain. */}
                {pesanError && (
                    <div role="alert" className="mt-4 rounded-lg border border-[#E86565] bg-[#FDECEC] px-4 py-3 text-sm font-medium text-[#8A2B2B]">
                        {pesanError}
                    </div>
                )}

                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {subtes.map((item) => {
                        // Subtes tanpa soal belum bisa dikerjakan; tanpa ini halaman Ujian crash di soalList[0].
                        const tersedia = Boolean(item.soal_exists);
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => tersedia && bukaModal(item)}
                                disabled={!tersedia}
                                aria-disabled={!tersedia}
                                className="flex min-h-[190px] flex-col rounded-xl bg-white p-4 text-left shadow-md transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className={`h-12 w-12 rounded-full ${warnaSubtes[item.kode_subtes] ?? WARNA_CADANGAN}`} />
                                <span className="mt-4 font-semibold leading-snug text-[#1F2D5C]">
                                    {item.nama_subtes} ({item.kode_subtes})
                                </span>
                                <span className="mt-1 text-xs text-gray-600">{item.deskripsi || 'Selesaikan tantangan di subtes ini!'}</span>
                                <span className="mt-auto flex justify-end pt-3">
                                    {tersedia ? (
                                        <IkonPanah />
                                    ) : (
                                        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600">Segera hadir</span>
                                    )}
                                </span>
                            </button>
                        );
                    })}
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
                                    className={`rounded-md py-2.5 font-medium transition ${konfigurasi.mode === mode ? 'bg-[#5B86DB] text-white shadow' : 'text-[#1F2D5C] hover:bg-white/60'
                                        }`}
                                >
                                    Mode {mode === 'fleksibel' ? 'Fleksibel' : 'Simulasi'}
                                </button>
                            ))}
                        </div>

                        {konfigurasi.mode === 'fleksibel' ? (
                            <div className="mt-4 space-y-4">
                                <div className="rounded-lg border border-[#C9DBF2] bg-[#EAF2FC] p-4">
                                    <p className="text-lg font-medium">Topik</p>
                                    <p className="text-sm text-gray-600">Pilih satu atau beberapa topik, diurutkan dari yang paling perlu kamu latih</p>
                                    {topikList.length > 0 ? (
                                        <div role="group" aria-label="Topik" className="mt-3 max-h-72 space-y-2 overflow-y-auto p-0.5">
                                            <label className="flex cursor-pointer items-center gap-3 px-3 py-1 font-medium">
                                                <input
                                                    type="checkbox"
                                                    checked={semuaDipilih}
                                                    onChange={ubahSemuaTopik}
                                                    disabled={idTersedia.length === 0}
                                                    className={KELAS_CHECKBOX}
                                                />
                                                Semua Topik ({idTersedia.length} Topik)
                                            </label>
                                            {topikList.map((topik) => (
                                                <PilihanTopik
                                                    key={topik.id}
                                                    topik={topik}
                                                    dipilih={topikIds.includes(topik.id)}
                                                    onUbah={() => ubahTopik(topik.id)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-sm text-gray-600">Belum ada topik untuk subtes ini.</p>
                                    )}
                                </div>

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

                                <div className="flex items-center justify-between gap-4 rounded-lg border border-[#C9DBF2] bg-[#EAF2FC] p-4">
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#2E3F85] text-white">
                                            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zM8.5 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM12 18a5.5 5.5 0 01-5-3.2h10A5.5 5.5 0 0112 18z" />
                                            </svg>
                                        </span>
                                        <div>
                                            <p className="text-lg font-medium">Ice Breaking</p>
                                            <p className="text-sm text-gray-600">Aktifkan untuk suasana yang lebih santai</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={!!konfigurasi.iceBreakingAktif}
                                        aria-label="Ice Breaking"
                                        onClick={() => setKonfigurasi({ ...konfigurasi, iceBreakingAktif: !konfigurasi.iceBreakingAktif })}
                                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B86DB] focus-visible:ring-offset-2 ${konfigurasi.iceBreakingAktif ? 'bg-[#5B86DB]' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${konfigurasi.iceBreakingAktif ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
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
                                        {konfigurasi.waktuPengerjaanMenit?.toLocaleString('id-ID')} Menit
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={mulaiMengerjakan}
                            disabled={!bisaMulai}
                            className="mt-5 w-full rounded-lg bg-[#5B86DB] py-3 font-medium text-white shadow transition enabled:hover:bg-[#4A74C8] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {bisaMulai ? 'Mulai Mengerjakan' : 'Pilih minimal satu topik'}
                        </button>
                    </div>
                )}
            </Modal>
        </LatihanLayout>
    );
}
