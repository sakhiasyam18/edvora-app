import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';

interface Opsi {
    id: string;
    label: string;
    teks: string;
}

interface Soal {
    id: number;
    pertanyaan: string;
    opsi: Opsi[];
}

// 7 Subtes UTBK Sesuai Gambar
const DAFTAR_SUBTES = [
    { id: 1, kode: 'PU', nama: 'Penalaran Umum', durasiDetik: 600 },
    { id: 2, kode: 'PPU', nama: 'Pengetahuan dan Pemahaman Umum', durasiDetik: 600 },
    { id: 3, kode: 'PBM', nama: 'Pemahaman Baca dan Menulis', durasiDetik: 600 },
    { id: 4, kode: 'PK', nama: 'Pengetahuan Kuantitatif', durasiDetik: 600 },
    { id: 5, kode: 'LBI', nama: 'Literasi Bahasa Indonesia', durasiDetik: 600 },
    { id: 6, kode: 'LBE', nama: 'Literasi Bahasa Inggris', durasiDetik: 600 },
    { id: 7, kode: 'PM', nama: 'Penalaran Matematika', durasiDetik: 600 },
];

export default function Kerjakan() {
    // State subtes aktif (0 sampai 6)
    const [subtesIndex, setSubtesIndex] = useState(0);

    // Dummy Soal per halaman
    const listSoal: Soal[] = [
        {
            id: 1,
            pertanyaan: `Perhatikan teks berikut!\nVierzha, Paramita, Hendra, Dewi, dan Nurul adalah siswa SMA ROGU. Jika diukur dari SMA ROGU, maka rumah Vierzha lebih jauh daripada rumah Hendra. Rumah Paramita lebih dekat daripada rumah Dewi dan rumah Nurul.\n\nJika rumah Hendra lebih jauh dari rumah Nurul, maka anak yang rumahnya paling dekat dari SMA ROGU adalah ...`,
            opsi: [
                { id: 'a', label: 'A', teks: 'Vierzha' },
                { id: 'b', label: 'B', teks: 'Paramita' },
                { id: 'c', label: 'C', teks: 'Hendra' },
                { id: 'd', label: 'D', teks: 'Dewi' },
                { id: 'e', label: 'E', teks: 'Nurul' },
            ],
        },
    ];

    const [indeksAktif, setIndeksAktif] = useState(0);
    const [jawabanUser, setJawabanUser] = useState<{ [key: string]: string }>({});
    const [raguRagu, setRaguRagu] = useState<{ [key: string]: boolean }>({});

    // Pop-up modal state
    const [showModalSubtes, setShowModalSubtes] = useState(false);
    const [showModalSelesai, setShowModalSelesai] = useState(false);

    // Cek apakah sedang berada di subtes terakhir (PM)
    const isSubtesTerakhir = subtesIndex === DAFTAR_SUBTES.length - 1;

    // Timer Countdown
    const [timeLeft, setTimeLeft] = useState(DAFTAR_SUBTES[0].durasiDetik);

    // Reset timer saat subtes berganti
    useEffect(() => {
        setTimeLeft(DAFTAR_SUBTES[subtesIndex].durasiDetik);
    }, [subtesIndex]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const subtesAktif = DAFTAR_SUBTES[subtesIndex];
    const soalCurrent = listSoal[0];

    // Key unik gabungan subtes & id soal agar jawaban terpisah tiap subtes
    const currentKey = `${subtesIndex}_${soalCurrent.id}`;

    const handlePilihJawaban = (opsiId: string) => {
        setJawabanUser((prev) => ({ ...prev, [currentKey]: opsiId }));
    };

    const toggleRaguRagu = () => {
        setRaguRagu((prev) => ({ ...prev, [currentKey]: !prev[currentKey] }));
    };

    // Tombol "Simpan Soal" untuk Lanjut Subtes (Subtes 1 - 6)
    const handleLanjutSubtes = () => {
        setShowModalSubtes(false);
        if (!isSubtesTerakhir) {
            setSubtesIndex((prev) => prev + 1);
            setIndeksAktif(0);
        }
    };

    // Konfirmasi Selesai Tryout & Kembali ke Dashboard
    const handleFinishTryout = () => {
        setShowModalSelesai(false);
        router.get('/dashboard');
    };

    return (
        <>
            <Head title={`Pengerjaan Try Out - ${subtesAktif.nama}`} />
            <div className="flex min-h-screen flex-col bg-[#EBF3FC] font-['Plus_Jakarta_Sans',sans-serif] text-[#1E293B]">
                {/* HEADER */}
                <header className="flex h-16 items-center justify-between bg-white px-8 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2B4184] text-white font-black text-lg">
                            E
                        </div>
                    </div>

                    <div className="text-sm font-bold text-gray-700">
                        Try Out EDVORA 1
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5C82E6] text-sm font-bold text-white shadow-sm">
                        A
                    </div>
                </header>

                {/* KONTEN UTAMA */}
                <main className="flex flex-1 gap-6 p-8 max-w-7xl mx-auto w-full">
                    {/* AREA SOAL (KIRI) */}
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-extrabold text-[#1E293B] mb-4">
                                Soal {indeksAktif + 1} dari 10
                            </h2>

                            {/* TEKS SOAL */}
                            <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-100">
                                <div className="text-sm font-semibold text-gray-800 leading-relaxed whitespace-pre-line">
                                    {soalCurrent.pertanyaan}
                                </div>
                            </div>

                            {/* OPSI JAWABAN */}
                            <div className="mt-4 space-y-3">
                                {soalCurrent.opsi.map((opsi) => {
                                    const isSelected = jawabanUser[currentKey] === opsi.id;
                                    return (
                                        <button
                                            key={opsi.id}
                                            type="button"
                                            onClick={() => handlePilihJawaban(opsi.id)}
                                            className="flex w-full items-center gap-4 rounded-xl transition text-left"
                                        >
                                            <div
                                                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-bold transition ${
                                                    isSelected
                                                        ? 'bg-[#5C82E6] text-white border-[#5C82E6]'
                                                        : 'bg-white border-gray-300 text-gray-600'
                                                }`}
                                            >
                                                {opsi.label}
                                            </div>
                                            <div
                                                className={`flex-1 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                                                    isSelected
                                                        ? 'bg-blue-50 border-[#5C82E6] text-[#2B4184]'
                                                        : 'bg-white border-gray-200 text-gray-700'
                                                }`}
                                            >
                                                {opsi.teks}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* TOMBOL SIMPAN SOAL BAWAH (HANYA MUNCUL DI SUBTES 1 SAMPAI 6) */}
                        {!isSubtesTerakhir && (
                            <div className="mt-8 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setShowModalSubtes(true)}
                                    className="w-full max-w-md rounded-2xl bg-[#4A8B3B] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#3d7330]"
                                >
                                    Simpan Soal
                                </button>
                            </div>
                        )}
                    </div>

                    {/* PANEL NAVIGASI & SUBTES (KANAN) */}
                    <aside className="w-80 space-y-4">
                        {/* TIMER & SUBTES ACTIVE BADGE */}
                        <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
                            <span className="text-xs font-bold text-[#1E293B] truncate max-w-[170px]">
                                {subtesAktif.nama}
                            </span>
                            <span className="rounded-xl bg-[#D9534F] px-4 py-1.5 text-xs font-black text-white">
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        {/* NAVIGASI NOMOR SOAL */}
                        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100 space-y-4">
                            <h3 className="text-xs font-bold text-gray-500">Navigasi Soal</h3>

                            <div className="grid grid-cols-5 gap-2.5">
                                {Array.from({ length: 10 }).map((_, idx) => {
                                    const num = idx + 1;
                                    const isCurrent = idx === indeksAktif;
                                    const key = `${subtesIndex}_${num}`;
                                    const isAnswered = !!jawabanUser[key];
                                    const isDoubtful = !!raguRagu[key];

                                    let bgClass = 'bg-[#5C82E6] text-white border-[#5C82E6]';
                                    if (isDoubtful) bgClass = 'bg-amber-400 text-white border-amber-400';
                                    else if (!isAnswered && !isCurrent) bgClass = 'bg-white border-gray-300 text-gray-500';

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setIndeksAktif(idx)}
                                            className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold transition ${bgClass} ${
                                                isCurrent ? 'ring-2 ring-[#2B4184] ring-offset-1' : ''
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* RAGU-RAGU BUTTON */}
                            <button
                                type="button"
                                onClick={toggleRaguRagu}
                                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition border ${
                                    raguRagu[currentKey]
                                        ? 'bg-amber-500 text-white border-amber-500'
                                        : 'bg-amber-400 text-white border-amber-400 hover:bg-amber-500'
                                }`}
                            >
                                <span className="h-3.5 w-3.5 rounded border-2 border-white bg-transparent inline-block" />
                                Ragu-ragu
                            </button>

                            {/* PREV / NEXT */}
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
                                    disabled={indeksAktif === 9}
                                    onClick={() => setIndeksAktif((p) => p + 1)}
                                    className="flex-1 rounded-xl bg-[#5C82E6] py-2 text-xs font-bold text-white transition hover:bg-[#486ed6] disabled:opacity-50"
                                >
                                    Lanjutkan →
                                </button>
                            </div>

                            {/* SIMPAN JAWABAN (MUNCULKAN MODAL SUBTES / SELESAI) */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (isSubtesTerakhir) {
                                        setShowModalSelesai(true);
                                    } else {
                                        setShowModalSubtes(true);
                                    }
                                }}
                                className="w-full rounded-xl bg-[#4A8B3B] py-2.5 text-xs font-bold text-white transition hover:bg-[#3d7330]"
                            >
                                Simpan Jawaban
                            </button>
                        </div>
                    </aside>
                </main>
            </div>

            {/* POP UP 1: KONFIRMASI SIMPAN SUBTES (SUBTES 1-6) */}
            {showModalSubtes && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-150">
                        <h2 className="text-xl font-extrabold text-[#1E293B]">
                            Yakin Menyimpan Jawaban?
                        </h2>
                        <p className="mt-2 text-xs font-medium text-gray-500">
                            Kamu akan lanjut ke subtest berikutnya
                        </p>

                        <div className="mt-6 flex justify-center gap-4">
                            <button
                                type="button"
                                onClick={handleLanjutSubtes}
                                className="w-32 rounded-2xl bg-[#71C055] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#62a84a]"
                            >
                                IYA
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowModalSubtes(false)}
                                className="w-32 rounded-2xl bg-[#F07171] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#d85e5e]"
                            >
                                TIDAK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* POP UP 2: KONFIRMASI AKHIR / SELESAI TRY OUT (SUBTES TERAKHIR) */}
            {showModalSelesai && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-150">
                        <h2 className="text-xl font-extrabold text-[#1E293B]">
                            Yakin Menyimpan Jawaban?
                        </h2>
                        <p className="mt-2 text-xs font-medium text-gray-500">
                            Kamu telah menyelesaikan seluruh subtest tryout.
                        </p>

                        <div className="mt-6 flex justify-center gap-4">
                            <button
                                type="button"
                                onClick={handleFinishTryout}
                                className="w-32 rounded-2xl bg-[#71C055] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#62a84a]"
                            >
                                IYA
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowModalSelesai(false)}
                                className="w-32 rounded-2xl bg-[#F07171] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#d85e5e]"
                            >
                                TIDAK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}