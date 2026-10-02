import { useEffect, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { TeksMatematika } from '@/Components/Ujian/KartuSoal';
import { batasEfektif, sisaDetikDari } from '@/lib/batasSubtes';
import { JawabanTryOut, SoalTryOut, SubtesAktifTryOut } from '@/types/tryout';

interface KerjakanProps {
    paket: { id: string; judul: string };
    pengerjaanId: string;
    subtes: SubtesAktifTryOut;
    soalList: SoalTryOut[];
    sisaDetik: number;
}

// Jawaban dan tanda ragu subtes yang sedang dikerjakan. Hanya ada di browser (cadangan localStorage)
// sampai Simpan Soal / Simpan Jawaban / waktu habis mengirimnya ke server.
interface Draf {
    jawaban: Record<string, JawabanTryOut>;
    ragu: Record<string, boolean>;
}

const DRAF_KOSONG: Draf = { jawaban: {}, ragu: {} };

function bacaDraf(kunci: string): Draf {
    try {
        const isi = window.localStorage.getItem(kunci);
        return isi ? { ...DRAF_KOSONG, ...JSON.parse(isi) } : DRAF_KOSONG;
    } catch {
        return DRAF_KOSONG;
    }
}

// Batas subtes yang pernah dipakai di browser ini (ms). Tidak dihapus setelah kirim, supaya halaman subtes lama
// yang dibuka lagi lewat tombol Back langsung habis waktunya, bukan mulai menghitung dari awal.
function bacaBatas(kunci: string): number | null {
    try {
        const isi = Number(window.localStorage.getItem(kunci));
        return isi > 0 ? isi : null;
    } catch {
        return null;
    }
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

// Setiap subtes dirender ulang dari awal (key), sehingga draf, nomor aktif, dan timer tidak terbawa ke subtes berikutnya.
export default function Kerjakan(props: KerjakanProps) {
    return <PengerjaanSubtes key={props.subtes.id} {...props} />;
}

function PengerjaanSubtes({ paket, pengerjaanId, subtes, soalList, sisaDetik }: KerjakanProps) {
    const user = usePage<any>().props.auth.user;
    const inisial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';
    const kunciDraf = `tryout:${pengerjaanId}:${subtes.id}`;
    const kunciBatas = `${kunciDraf}:batas`;

    const [draf, setDraf] = useState<Draf>(() => bacaDraf(kunciDraf));
    const [indeksAktif, setIndeksAktif] = useState(0);
    const [modal, setModal] = useState<'subtes' | 'selesai' | null>(null);
    const [timeLeft, setTimeLeft] = useState(sisaDetik);
    const [waktuHabis, setWaktuHabis] = useState(false);
    const mengirim = useRef(false);

    const soal = soalList[indeksAktif];
    const jawaban = draf.jawaban[soal.id];

    // Cadangan agar jawaban tidak hilang saat halaman dimuat ulang.
    useEffect(() => {
        try {
            window.localStorage.setItem(kunciDraf, JSON.stringify(draf));
        } catch {
            // Tanpa cadangan (mode privat / penyimpanan diblokir).
        }
    }, [draf, kunciDraf]);

    const kirim = () => {
        if (mengirim.current) return;
        mengirim.current = true;
        setModal(null);

        router.post(
            route('tryout.kirim', paket.id),
            {
                tryOutSubtesId: subtes.id,
                jawaban: Object.entries(draf.jawaban).map(([soalId, j]) => ({ soalId, ...j })),
            },
            {
                onSuccess: () => {
                    try {
                        window.localStorage.removeItem(kunciDraf);
                    } catch {
                        // Abaikan.
                    }
                },
                onFinish: () => {
                    mengirim.current = false;
                },
            },
        );
    };

    // Timer dihitung dari waktu batas, bukan dikurangi per detik. Server tetap patokannya: kiriman yang terlambat
    // lebih dari 30 detik ditolak, jadi kirim otomatis harus tepat waktu walaupun tab disembunyikan.
    useEffect(() => {
        const batas = batasEfektif(sisaDetik, Date.now(), bacaBatas(kunciBatas));
        try {
            window.localStorage.setItem(kunciBatas, String(batas));
        } catch {
            // Tanpa cadangan batas; Back lalu Forward memakai sisaDetik dari halaman lama.
        }

        const tampilkan = () => {
            const sisa = sisaDetikDari(batas, Date.now());
            setTimeLeft(sisa);
            return sisa;
        };
        tampilkan();

        // Kirim otomatis memakai satu setTimeout, bukan interval: Chrome memperlambat interval di tab yang
        // tersembunyi lama sampai sekali per menit, sehingga kiriman bisa melewati toleransi server.
        const timeout = window.setTimeout(() => setWaktuHabis(true), Math.max(0, batas - Date.now()));
        const interval = window.setInterval(() => {
            if (tampilkan() === 0) window.clearInterval(interval);
        }, 1000);
        // Tab yang baru terlihat lagi setelah batas lewat langsung mengirim.
        const saatTerlihat = () => {
            if (document.visibilityState === 'visible' && tampilkan() === 0) setWaktuHabis(true);
        };
        document.addEventListener('visibilitychange', saatTerlihat);

        return () => {
            window.clearTimeout(timeout);
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', saatTerlihat);
        };
    }, [sisaDetik, kunciBatas]);

    // Waktu habis: kirim tanpa konfirmasi (= Simpan Soal, atau Simpan Jawaban di subtes terakhir).
    useEffect(() => {
        if (waktuHabis) kirim();
    }, [waktuHabis]);

    // Jawaban kosong (tanpa opsi dan tanpa teks) berarti soal kembali belum dijawab.
    const aturJawaban = (soalId: string, isi: JawabanTryOut | null) =>
        setDraf((d) => {
            const lain = { ...d.jawaban };
            delete lain[soalId];
            return { ...d, jawaban: isi ? { ...lain, [soalId]: isi } : lain };
        });

    const pilihOpsi = (opsiId: string) => {
        if (soal.tipe === 'benar_salah') {
            const sekarang = jawaban?.opsiIds ?? [];
            const baru = sekarang.includes(opsiId) ? sekarang.filter((id) => id !== opsiId) : [...sekarang, opsiId];
            aturJawaban(soal.id, baru.length ? { opsiIds: baru, jawabanIsian: null } : null);
        } else {
            aturJawaban(soal.id, { opsiIds: [opsiId], jawabanIsian: null });
        }
    };

    const isiIsian = (teks: string) => aturJawaban(soal.id, teks.trim() ? { opsiIds: [], jawabanIsian: teks } : null);

    const toggleRaguRagu = () => setDraf((d) => ({ ...d, ragu: { ...d.ragu, [soal.id]: !d.ragu[soal.id] } }));

    return (
        <>
            <Head title={`Pengerjaan Try Out - ${subtes.nama}`} />
            <div className="flex min-h-screen flex-col bg-[#EBF3FC] font-['Plus_Jakarta_Sans',sans-serif] text-[#1E293B]">
                {/* HEADER */}
                <header className="flex h-16 items-center justify-between bg-white px-8 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2B4184] text-white font-black text-lg">
                            E
                        </div>
                    </div>

                    <div className="text-sm font-bold text-gray-700">{paket.judul}</div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5C82E6] text-sm font-bold text-white shadow-sm">
                        {inisial}
                    </div>
                </header>

                {/* KONTEN UTAMA */}
                <main className="flex flex-1 gap-6 p-8 max-w-7xl mx-auto w-full">
                    {/* AREA SOAL (KIRI) */}
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-extrabold text-[#1E293B] mb-4">
                                Soal {indeksAktif + 1} dari {soalList.length}
                            </h2>

                            {/* TEKS SOAL */}
                            <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-100">
                                <div className="text-sm font-semibold text-gray-800 leading-relaxed">
                                    <TeksMatematika teks={soal.teks_soal} />
                                </div>
                                {soal.gambar_soal && (
                                    <img
                                        src={soal.gambar_soal}
                                        alt={`Ilustrasi soal nomor ${indeksAktif + 1}`}
                                        className="mt-4 max-h-72 max-w-full rounded-lg"
                                    />
                                )}
                            </div>

                            {soal.tipe === 'benar_salah' && (
                                <p className="mt-4 text-xs font-semibold text-gray-500">Pilih semua pernyataan yang benar.</p>
                            )}

                            {/* JAWABAN: kolom isian, atau opsi (pilihan ganda: satu; benar-salah: centang banyak) */}
                            {soal.tipe === 'isian_singkat' ? (
                                <input
                                    type="text"
                                    maxLength={100}
                                    value={jawaban?.jawabanIsian ?? ''}
                                    onChange={(e) => isiIsian(e.target.value)}
                                    placeholder="Ketik jawabanmu"
                                    aria-label="Jawaban isian singkat"
                                    className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 focus:border-[#5C82E6] focus:ring-[#5C82E6]"
                                />
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {soal.opsi.map((opsi) => {
                                        const isSelected = jawaban?.opsiIds.includes(opsi.id) ?? false;
                                        const centang = soal.tipe === 'benar_salah';
                                        return (
                                            <button
                                                key={opsi.id}
                                                type="button"
                                                role={centang ? 'checkbox' : undefined}
                                                aria-checked={centang ? isSelected : undefined}
                                                onClick={() => pilihOpsi(opsi.id)}
                                                className="flex w-full items-center gap-4 rounded-xl transition text-left"
                                            >
                                                <div
                                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition ${
                                                        isSelected
                                                            ? 'bg-[#5C82E6] text-white border-[#5C82E6]'
                                                            : 'bg-white border-gray-300 text-gray-600'
                                                    }`}
                                                >
                                                    {centang ? (isSelected ? '✓' : '') : opsi.label}
                                                </div>
                                                <div
                                                    className={`flex-1 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                                                        isSelected
                                                            ? 'bg-blue-50 border-[#5C82E6] text-[#2B4184]'
                                                            : 'bg-white border-gray-200 text-gray-700'
                                                    }`}
                                                >
                                                    <TeksMatematika teks={opsi.teks_opsi} />
                                                    {opsi.gambar_opsi && (
                                                        <img
                                                            src={opsi.gambar_opsi}
                                                            alt={`Gambar opsi ${opsi.label}`}
                                                            className="mt-2 max-h-40 max-w-full rounded-lg"
                                                        />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* SIMPAN SOAL: menyelesaikan subtes ini dan pindah ke subtes berikutnya (tidak ada di subtes terakhir) */}
                        {!subtes.terakhir && (
                            <div className="mt-8 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setModal('subtes')}
                                    className="w-full max-w-md rounded-2xl bg-[#4A8B3B] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#3d7330]"
                                >
                                    Simpan Soal
                                </button>
                            </div>
                        )}
                    </div>

                    {/* PANEL NAVIGASI & SUBTES (KANAN) */}
                    <aside className="w-80 space-y-4">
                        {/* TIMER & SUBTES AKTIF */}
                        <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
                            <span className="text-xs font-bold text-[#1E293B] truncate max-w-[170px]">{subtes.nama}</span>
                            <span role="timer" aria-label="Sisa waktu subtes" className="rounded-xl bg-[#D9534F] px-4 py-1.5 text-xs font-black text-white">
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        {/* NAVIGASI NOMOR SOAL */}
                        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100 space-y-4">
                            <h3 className="text-xs font-bold text-gray-500">Navigasi Soal</h3>

                            <div className="grid grid-cols-5 gap-2.5">
                                {soalList.map((s, idx) => {
                                    const isCurrent = idx === indeksAktif;
                                    const isAnswered = !!draf.jawaban[s.id];
                                    const isDoubtful = !!draf.ragu[s.id];

                                    let bgClass = 'bg-[#5C82E6] text-white border-[#5C82E6]';
                                    if (isDoubtful) bgClass = 'bg-amber-400 text-white border-amber-400';
                                    else if (!isAnswered && !isCurrent) bgClass = 'bg-white border-gray-300 text-gray-500';

                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setIndeksAktif(idx)}
                                            aria-current={isCurrent ? 'step' : undefined}
                                            className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold transition ${bgClass} ${
                                                isCurrent ? 'ring-2 ring-[#2B4184] ring-offset-1' : ''
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* RAGU-RAGU */}
                            <button
                                type="button"
                                onClick={toggleRaguRagu}
                                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition border ${
                                    draf.ragu[soal.id]
                                        ? 'bg-amber-500 text-white border-amber-500'
                                        : 'bg-amber-400 text-white border-amber-400 hover:bg-amber-500'
                                }`}
                            >
                                <span className="h-3.5 w-3.5 rounded border-2 border-white bg-transparent inline-block" />
                                Ragu-ragu
                            </button>

                            {/* SEBELUMNYA / LANJUTKAN */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={indeksAktif === 0}
                                    onClick={() => setIndeksAktif((p) => p - 1)}
                                    className="flex-1 rounded-xl bg-[#5C82E6] py-2 text-xs font-bold text-white transition hover:bg-[#486ed6] disabled:opacity-50"
                                >
                                    ← Sebelumnya
                                </button>
                                <button
                                    type="button"
                                    disabled={indeksAktif === soalList.length - 1}
                                    onClick={() => setIndeksAktif((p) => p + 1)}
                                    className="flex-1 rounded-xl bg-[#5C82E6] py-2 text-xs font-bold text-white transition hover:bg-[#486ed6] disabled:opacity-50"
                                >
                                    Lanjutkan →
                                </button>
                            </div>

                            {/* SIMPAN JAWABAN: hanya aktif di subtes terakhir; mengakhiri Try Out */}
                            <button
                                type="button"
                                disabled={!subtes.terakhir}
                                onClick={() => setModal('selesai')}
                                className={`w-full rounded-xl py-2.5 text-xs font-bold text-white transition ${
                                    subtes.terakhir ? 'bg-[#4A8B3B] hover:bg-[#3d7330]' : 'cursor-not-allowed bg-gray-300'
                                }`}
                            >
                                Simpan Jawaban
                            </button>
                        </div>
                    </aside>
                </main>
            </div>

            {/* POP UP KONFIRMASI */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-150">
                        <h2 className="text-xl font-extrabold text-[#1E293B]">Yakin Menyimpan Jawaban?</h2>
                        <p className="mt-2 text-xs font-medium text-gray-500">
                            {modal === 'subtes'
                                ? 'Kamu akan lanjut ke subtest berikutnya'
                                : 'Try Out akan diakhiri dan jawaban dikirim.'}
                        </p>

                        <div className="mt-6 flex justify-center gap-4">
                            <button
                                type="button"
                                onClick={kirim}
                                className="w-32 rounded-2xl bg-[#71C055] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#62a84a]"
                            >
                                IYA
                            </button>
                            <button
                                type="button"
                                onClick={() => setModal(null)}
                                className="w-32 rounded-2xl bg-[#F07171] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#d85e5e]"
                            >
                                TIDAK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* WAKTU HABIS */}
            {waktuHabis && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
                        <h2 className="text-xl font-extrabold text-[#1E293B]">Waktu habis</h2>
                        <p className="mt-2 text-xs font-medium text-gray-500">Menyimpan jawaban…</p>
                        {/* Jika koneksi terputus, kirim ulang secara manual. */}
                        <button
                            type="button"
                            onClick={kirim}
                            className="mt-6 rounded-2xl bg-[#5C82E6] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#486ed6]"
                        >
                            Kirim ulang
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
