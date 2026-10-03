import { ReactNode, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import Modal from '@/Components/Modal';
import { formatWaktuWib } from '@/lib/waktu';
import { PaketTryOut } from '@/types/tryout';

interface IndexProps {
    paketList: PaketTryOut[];
}

const gayaTombol =
    'inline-flex h-11 items-center rounded-[14px] bg-ujian-biru px-6 text-sm font-semibold text-white shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md md:h-[52px] md:px-10 md:text-lg';

// 195 → "195", 42.5 → "42,5"
const formatMenit = (menit: number) => menit.toLocaleString('id-ID');

export default function Index({ paketList }: IndexProps) {
    const [paketDipilih, setPaketDipilih] = useState<PaketTryOut | null>(null);
    const [memulai, setMemulai] = useState(false);
    // Isi modal tetap tampil selama animasi menutup, walaupun paketDipilih sudah null.
    const paketTerakhir = useRef<PaketTryOut | null>(null);
    if (paketDipilih) paketTerakhir.current = paketDipilih;
    const paketModal = paketDipilih ?? paketTerakhir.current;

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
            <div className="animate-muncul-halus pt-4 font-poppins text-siswa-judul md:pt-6">
                <div className="mb-5">
                    <p className="text-sm font-medium uppercase text-siswa-teks">TRY OUT</p>
                    <h1 className="text-2xl font-bold uppercase text-siswa-judul md:text-[28px]">SIMULASI UTBK</h1>
                    <p className="mt-1 text-sm text-siswa-teks md:text-base">Kerjakan semua subtes secara berurutan dengan waktu yang ditentukan.</p>
                </div>

                {pesanError && (
                    <p role="alert" className="mb-4 max-w-[720px] rounded-[16px] border border-siswa-umpan-salah-teks/30 bg-siswa-umpan-salah p-4 text-sm font-medium text-siswa-umpan-salah-teks">
                        {pesanError}
                    </p>
                )}

                <div className="max-w-[720px] space-y-4">
                    {paketList.length === 0 && (
                        <div className="rounded-[16px] border border-siswa-ujian-garis bg-white p-6 text-sm font-medium text-siswa-teks shadow-kartu">
                            Belum ada Try Out yang dibuka.
                        </div>
                    )}

                    {paketList.map((to, i) => (
                        <div
                            key={to.id}
                            className="animate-muncul-halus rounded-[16px] border border-siswa-ujian-garis bg-white p-5 shadow-kartu transition duration-300 [animation-fill-mode:both] hover:-translate-y-0.5 hover:shadow-lg md:px-5 md:py-6"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                <IkonPaket />
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-semibold text-siswa-judul md:text-xl">{to.judul}</h3>
                                        <LencanaDibuka />
                                    </div>
                                    <InfoPaket paket={to} gaya="chip" />
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
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
                        </div>
                    ))}
                </div>
            </div>

            {/* POP UP PERATURAN (MODAL) */}
            <Modal
                show={paketDipilih !== null}
                maxWidth="2xl"
                onClose={() => setPaketDipilih(null)}
                backdropClassName="bg-siswa-judul/40 backdrop-blur-[2px]"
                panelClassName="rounded-[32px]"
            >
                {paketModal && (
                    <div className="relative p-6 font-poppins text-siswa-judul md:px-[60px] md:py-12">
                        <button
                            type="button"
                            onClick={() => setPaketDipilih(null)}
                            aria-label="Tutup"
                            className="absolute right-5 top-5 text-edvora-primary transition duration-200 hover:rotate-90 hover:text-edvora-primary-hover md:right-[60px] md:top-12"
                        >
                            <svg className="h-9 w-9 md:h-[50px] md:w-[50px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M8.5 8.5l7 7m0-7l-7 7" />
                            </svg>
                        </button>

                        <div className="flex flex-wrap items-center gap-3 pr-12">
                            <h2 className="text-2xl font-semibold md:text-[38px] md:leading-tight">{paketModal.judul}</h2>
                            <LencanaDibuka />
                        </div>
                        <InfoPaket paket={paketModal} gaya="polos" />

                        <div className="mt-6 rounded-[20px] border border-edvora-primary/40 bg-siswa-panel-fleksibel px-5 py-5 md:mt-8 md:px-8">
                            <h3 className="text-center text-xl font-semibold uppercase text-siswa-judul md:text-[30px]">PERATURAN</h3>
                            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-siswa-teks md:pl-14 md:text-base">
                                {paketModal.peraturan.map((aturan, idx) => (
                                    <li key={idx}>{aturan}</li>
                                ))}
                            </ol>
                        </div>

                        {/* Mulai tetap boleh, tetapi Try Out akan terpotong di akhir periode (T13). */}
                        {!paketModal.waktuCukup && (
                            <p className="mt-4 rounded-[16px] border border-siswa-hint-garis bg-siswa-hint-latar p-4 text-sm font-medium text-siswa-hint-teks">
                                Periode berakhir {formatWaktuWib(paketModal.selesaiAt)}. Jawaban dikirim otomatis saat periode berakhir walaupun waktu subtes
                                masih tersisa.
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={mulaiKerjakan}
                            disabled={memulai}
                            className="mt-8 h-12 w-full rounded-[12px] bg-ujian-biru text-base font-semibold text-white shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 md:text-xl"
                        >
                            Mulai Kerjakan &rarr;
                        </button>
                    </div>
                )}
            </Modal>
        </>
    );
}

// Lingkaran hijau muda dengan ikon dokumen (Figma: kartu Try Out).
function IkonPaket() {
    return (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-siswa-ikon-tryout md:h-[76px] md:w-[76px]">
            <svg className="h-7 w-7 text-[#6BAF4E] md:h-9 md:w-9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1 7V3.5L18.5 9H15zM8 13h8v1.6H8V13zm0 3.4h6V18H8v-1.6z" />
            </svg>
        </span>
    );
}

function LencanaDibuka() {
    return (
        <span className="rounded-full border border-[#9BD27E] bg-siswa-ikon-tryout px-3 py-0.5 text-xs font-medium uppercase text-[#4C9A3A] md:text-sm">DIBUKA</span>
    );
}

// Jumlah soal, durasi, dan batas periode. "chip": berbingkai di kartu; "polos": baris teks di modal.
function InfoPaket({ paket, gaya }: { paket: PaketTryOut; gaya: 'chip' | 'polos' }) {
    const butir = [
        { ikon: <IkonBuku />, teks: `${paket.totalSoal} soal` },
        { ikon: <IkonJam />, teks: `${formatMenit(paket.totalMenit)} menit` },
        { ikon: <IkonKalender />, teks: `s.d. ${formatWaktuWib(paket.selesaiAt)}` },
    ];

    return (
        <div className={`flex flex-wrap ${gaya === 'chip' ? 'mt-2 gap-2' : 'mt-3 gap-x-6 gap-y-2'}`}>
            {butir.map(({ ikon, teks }) => (
                <span
                    key={teks}
                    className={`flex items-center gap-1.5 text-siswa-teks ${
                        gaya === 'chip' ? 'rounded-full border border-siswa-ujian-garis px-3 py-1 text-xs shadow-panel md:text-sm' : 'text-sm md:text-lg'
                    }`}
                >
                    {ikon}
                    {teks}
                </span>
            ))}
        </div>
    );
}

const kelasIkon = 'h-4 w-4 shrink-0 md:h-[1.1em] md:w-[1.1em]';

function IkonBuku() {
    return (
        <svg className={kelasIkon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 3h11a1 1 0 011 1v14H7a2 2 0 00-2 2V5a2 2 0 011-2zM5 20a1 1 0 001 1h12" />
        </svg>
    );
}

function IkonJam() {
    return (
        <svg className={kelasIkon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}

function IkonKalender() {
    return (
        <svg className={kelasIkon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="5" width="16" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah ke halaman siswa lain.
Index.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
