import { Head, router, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import { LabelPenguasaan } from '@/types/latihan';

type TabMode = 'fleksibel' | 'simulasi' | 'remedial';

interface TopikPilihan {
    id: string;
    nama: string;
    tahap: 1 | 2 | 3;
    label: LabelPenguasaan;
    persen: number; // 0–100, progres tahap
    direkomendasikan: boolean; // termasuk 3 rekomendasi teratas subtes ini
}

interface PilihModeProps {
    subtes: {
        id: string;
        kode: string | null;
        nama: string;
        deskripsi: string | null;
        jumlahTopik: number;
    };
    topikList: TopikPilihan[]; // topik yang punya soal, urut `urutan`
    batasSoal: { min: number; maks: number };
    simulasi: { jumlahSoal: number; waktuMenit: number };
    remedial: { jumlahSoal: number; batasSesi: number }; // jumlahSoal = semua soal remedial subtes ini
    tabAwal: TabMode; // tab yang terbuka pertama kali; dari Perkembangan bisa 'remedial' (?tab=)
    topikAwal: string | null; // dari Perkembangan: hanya topik ini yang tercentang (?topik=)
}

const TAB: { mode: TabMode; label: string }[] = [
    { mode: 'fleksibel', label: 'Mode Fleksibel' },
    { mode: 'simulasi', label: 'Mode Simulasi' },
    { mode: 'remedial', label: 'Remedial' },
];

// Kotak info kecil (Jumlah Soal, Waktu, Topik). Belum didesain.
function Info({ judul, isi }: { judul: string; isi: string }) {
    return (
        <div className="rounded-lg border bg-white px-4 py-3">
            <p className="text-xs text-gray-600">{judul}</p>
            <p className="font-semibold">{isi}</p>
        </div>
    );
}

// Pilih Mode untuk satu subtes. Susunan saja, belum didesain.
export default function PilihMode({ subtes, topikList, batasSoal, simulasi, remedial, tabAwal, topikAwal }: PilihModeProps) {
    // Kunjungan Inertia memasang ulang halaman, jadi nilai awal ini dibaca lagi setiap URL Pilih Mode dibuka.
    const [tab, setTab] = useState<TabMode>(tabAwal);
    // Default semua topik tercentang (UCS1); dari Perkembangan hanya topik yang diklik.
    const [topikDipilih, setTopikDipilih] = useState<string[]>(() => (topikAwal ? [topikAwal] : topikList.map((topik) => topik.id)));
    const [jumlahSoal, setJumlahSoal] = useState(batasSoal.min);
    const [memuat, setMemuat] = useState(false);

    // Pesan sekali tampil dari backend, mis. input tidak valid atau soal baru sudah habis.
    const { flash } = usePage();
    const pesanError = typeof flash.error === 'string' ? flash.error : null;

    // "Semua Topik" tercentang hanya bila semua topik tercentang; melepas satu topik ikut melepasnya.
    const semuaDipilih = topikList.length > 0 && topikDipilih.length === topikList.length;

    const pilihSemua = () => setTopikDipilih(semuaDipilih ? [] : topikList.map((topik) => topik.id));

    const pilihTopik = (id: string) =>
        setTopikDipilih((dipilih) => (dipilih.includes(id) ? dipilih.filter((x) => x !== id) : [...dipilih, id]));

    const ubahJumlahSoal = (selisih: number) =>
        setJumlahSoal((jumlah) => Math.min(batasSoal.maks, Math.max(batasSoal.min, jumlah + selisih)));

    // Soal dipilih server; klien hanya mengirim pilihan mode, topik, dan jumlah soal.
    const mulai = (data: Record<string, unknown>) =>
        router.get(route('latihan.ujian'), { subtesId: subtes.id, ...data }, {
            onStart: () => setMemuat(true),
            onFinish: () => setMemuat(false),
        });

    return (
        <>
            <Head title={`Pilih Mode - ${subtes.nama}`} />

            <div className="w-full max-w-[900px] space-y-5 text-[#1F2D5C]">
                {/* Card subtes */}
                <section className="flex items-start gap-4 rounded-xl bg-white px-6 py-5 shadow-md">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#DCE7F0] text-sm font-bold">
                        {subtes.kode}
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold">{subtes.nama}</h1>
                        <p className="text-sm text-gray-600">{subtes.deskripsi}</p>
                        <p className="mt-1 text-xs text-gray-500">{subtes.jumlahTopik} Topik</p>
                    </div>
                </section>

                {pesanError && (
                    <div role="alert" className="rounded-lg border border-[#E86565] bg-[#FDECEC] px-4 py-3 text-sm font-medium text-[#8A2B2B]">
                        {pesanError}
                    </div>
                )}

                <div>
                    <h2 className="text-xl font-bold">Pilih Mode Latihan</h2>
                    <p className="text-sm text-gray-600">Pilih mode latihan yang sesuai dengan kebutuhanmu!</p>
                </div>

                {/* Sliding radio. Pindah tab murni state di browser, tanpa request ke server. */}
                <div role="radiogroup" aria-label="Mode latihan" className="grid grid-cols-3 gap-1 rounded-lg border bg-white p-1">
                    {TAB.map((item) => (
                        <button
                            key={item.mode}
                            type="button"
                            role="radio"
                            aria-checked={tab === item.mode}
                            onClick={() => setTab(item.mode)}
                            className={`rounded-md py-2 font-medium ${tab === item.mode ? 'bg-[#5B86DB] text-white' : ''}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {tab === 'fleksibel' && (
                    <section className="space-y-4">
                        <div className="rounded-xl border bg-white px-5 py-4">
                            <h3 className="text-lg font-bold">Mode Fleksibel</h3>
                            <p className="text-sm text-gray-600">
                                Pilih topik dan jumlah soal sesuai kebutuhan. Pembahasan soal akan langsung muncul setelah kamu menyimpan jawaban.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold">Pilih Topik</h3>
                            <p className="text-sm text-gray-600">Pilih satu atau beberapa topik yang ingin kamu kerjakan!</p>

                            <div className="mt-2 space-y-2 rounded-xl border bg-white px-5 py-4">
                                <label className="flex items-center gap-3 font-medium">
                                    <input type="checkbox" checked={semuaDipilih} onChange={pilihSemua} />
                                    Semua Topik ({topikList.length} Topik)
                                </label>

                                {topikList.map((topik) => (
                                    <label key={topik.id} className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={topikDipilih.includes(topik.id)}
                                            onChange={() => pilihTopik(topik.id)}
                                        />
                                        {topik.nama}
                                        {topik.direkomendasikan && (
                                            <span className="rounded-full bg-[#34C759] px-2 py-0.5 text-[10px] font-semibold text-white">
                                                Direkomendasikan
                                            </span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border bg-white px-5 py-4">
                            <div>
                                <h3 className="text-lg font-bold">Jumlah Soal</h3>
                                <p className="text-sm text-gray-600">Pilih jumlah soal yang diinginkan</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => ubahJumlahSoal(-1)}
                                    disabled={jumlahSoal <= batasSoal.min}
                                    aria-label="Kurangi jumlah soal"
                                    className="h-7 w-7 rounded border disabled:opacity-40"
                                >
                                    −
                                </button>
                                <span className="w-6 text-center font-semibold">{jumlahSoal}</span>
                                <button
                                    type="button"
                                    onClick={() => ubahJumlahSoal(1)}
                                    disabled={jumlahSoal >= batasSoal.maks}
                                    aria-label="Tambah jumlah soal"
                                    className="h-7 w-7 rounded border disabled:opacity-40"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => mulai({ mode: 'fleksibel', topikIds: topikDipilih, jumlahSoal })}
                            disabled={topikDipilih.length === 0 || memuat}
                            className="w-full rounded-lg bg-[#5B86DB] py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {topikDipilih.length === 0 ? 'Pilih minimal satu topik' : 'Mulai Mengerjakan →'}
                        </button>
                    </section>
                )}

                {tab === 'simulasi' && (
                    <section className="space-y-4">
                        <div className="space-y-4 rounded-xl border bg-white px-5 py-4">
                            <div>
                                <h3 className="text-lg font-bold">Mode Simulasi</h3>
                                <p className="text-sm text-gray-600">
                                    Kerjakan paket soal dengan waktu terbatas seperti UTBK. Pembahasan akan muncul setelah semua soal selesai dikerjakan atau waktu telah habis.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <Info judul="Jumlah Soal" isi={`${simulasi.jumlahSoal} Soal`} />
                                <Info judul="Waktu Pengerjaan" isi={`${simulasi.waktuMenit.toLocaleString('id-ID')} Menit`} />
                                <Info judul="Topik" isi={`Semua Topik (${subtes.jumlahTopik})`} />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => mulai({ mode: 'simulasi' })}
                            disabled={memuat}
                            className="w-full rounded-lg bg-[#5B86DB] py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Mulai Mengerjakan →
                        </button>
                    </section>
                )}

                {tab === 'remedial' &&
                    (remedial.jumlahSoal === 0 ? (
                        <section className="rounded-xl border bg-white px-5 py-4">
                            <h3 className="text-lg font-bold">Remedial Belum Tersedia!</h3>
                            <p className="text-sm text-gray-600">
                                Tidak ada soal yang perlu diperbaiki pada subtes ini. Kerjakan soal mode fleksibel atau simulasi terlebih dahulu.
                            </p>
                        </section>
                    ) : (
                        <section className="space-y-4">
                            <div className="space-y-4 rounded-xl border bg-white px-5 py-4">
                                <div>
                                    <h3 className="text-lg font-bold">Mode Remedial</h3>
                                    <p className="text-sm text-gray-600">
                                        Kerjakan ulang soal yang pernah kamu jawab salah pada subtes ini. Soal diambil dari topik yang masih perlu kamu kuasai.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Info judul="Topik" isi="Semua topik" />
                                    <Info judul="Jumlah Soal" isi={`${remedial.jumlahSoal} Soal`} />
                                </div>

                                {remedial.jumlahSoal > remedial.batasSesi && (
                                    <p className="text-xs text-gray-600">
                                        Satu sesi berisi {remedial.batasSesi} soal yang paling lama menunggu. Sisanya dikerjakan di sesi berikutnya.
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => mulai({ mode: 'remedial' })}
                                disabled={memuat}
                                className="w-full rounded-lg bg-[#5B86DB] py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Mulai Mengerjakan →
                            </button>
                        </section>
                    ))}
            </div>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah dari/ke Pilih Subtes.
PilihMode.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
