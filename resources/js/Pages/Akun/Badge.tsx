import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';

interface BadgeProgress {
    saatIni: number;
    target: number;
    label: string;
}

interface BadgeItem {
    id: string;
    nama: string;
    deskripsi: string;
    xpBonus: number;
    warnaHexagon: string;
    ikon: string;
    tercapai: boolean;
    diraihPada?: string | null;
    progress?: BadgeProgress | null;
}

interface BadgeProps {
    badges: BadgeItem[];
}

// Komponen Ikon Hexagon Sesuai Desain UI
function HexagonBadge({ warna, ikon, tercapai }: { warna: string; ikon: string; tercapai: boolean }) {
    return (
        <div className="relative flex h-20 w-20 items-center justify-center">
            {/* Bentuk Segi Enam (Hexagon) menggunakan Clip-path SVG */}
            <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm">
                <polygon
                    points="50,3 93,25 93,75 50,97 7,75 7,25"
                    className={tercapai ? warna.split(' ')[0] : 'fill-slate-200'}
                />
            </svg>

            {/* Ikon di Tengah Hexagon */}
            <div className="absolute text-white">
                {!tercapai ? (
                    <svg className="h-7 w-7 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                ) : ikon === 'star' ? (
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ) : ikon === 'code' ? (
                    <span className="text-xl font-bold font-mono">&lt;/&gt;</span>
                ) : ikon === 'academic' ? (
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                        <path d="M4.6 10.134v2.866c0 .88 2.418 2 5.4 2 2.98 0 5.4-1.12 5.4-2v-2.866l-4.636 1.987a3 3 0 01-2.328 0L4.6 10.134z" />
                    </svg>
                ) : ikon === 'crown' ? (
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l1.954-1.221a1 1 0 011.524.838v2.02l2.368-1.48a1 1 0 011.524.838v7.364a1 1 0 01-1 1H2.63a1 1 0 01-1-1V5.68a1 1 0 011.524-.838l2.368 1.48V4.302a1 1 0 011.524-.838L9 4.677V3a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
        </div>
    );
}

export default function Badge({ badges }: BadgeProps) {
    const diraihCount = badges.filter((b) => b.tercapai).length;

    return (
        <>
            <Head title="Koleksi Badge" />

            <div className="w-full space-y-6 font-poppins text-slate-800">
                {/* Header & Back Nav */}
                <div>
                    <Link
                        href="/akun/profil/utama"
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition duration-200 hover:text-edvora-primary"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali ke Profil
                    </Link>
                    <h1 className="mt-2 text-[24px] font-bold text-slate-800">Koleksi Badge Saya</h1>
                    <p className="text-[13px] text-slate-500">
                        Kamu telah membuka <span className="font-semibold text-edvora-primary">{diraihCount}</span> dari {badges.length} badge.
                    </p>
                </div>

                {/* Grid Badge (Sesuaikan layout gambar Figma/Design) */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
                    {badges.map((badge) => (
                        <div
                            key={badge.id}
                            className={`relative flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm border transition duration-200 ${badge.tercapai ? 'border-slate-100 hover:shadow-md' : 'border-slate-100 bg-slate-50/50'
                                }`}
                        >
                            {/* Pill XP Bonus di Pojok Kanan Atas */}
                            <div className="absolute right-4 top-4">
                                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 border border-amber-200/60">
                                    +{badge.xpBonus} XP
                                </span>
                            </div>

                            {/* Hexagon & Info Utama */}
                            <div className="flex flex-col items-center text-center pt-2">
                                <HexagonBadge
                                    warna={badge.warnaHexagon}
                                    ikon={badge.ikon}
                                    tercapai={badge.tercapai}
                                />

                                <h3 className={`mt-4 text-[16px] font-bold ${badge.tercapai ? 'text-slate-800' : 'text-slate-600'}`}>
                                    {badge.nama}
                                </h3>

                                <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                                    {badge.deskripsi}
                                </p>
                            </div>

                            {/* Footer Kartu Badge */}
                            <div className="mt-6 pt-3">
                                {badge.tercapai ? (
                                    <div className="flex items-center justify-between text-[11px]">
                                        <div className="text-left">
                                            <span className="block font-semibold uppercase text-slate-400 text-[9px] tracking-wider">
                                                Diraih Pada
                                            </span>
                                            <span className="font-bold text-slate-700">{badge.diraihPada}</span>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-600">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                            Tercapai
                                        </span>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] font-semibold">
                                            <span className="text-slate-500">Progress: {badge.progress?.label}</span>
                                            <span className="text-slate-400 font-normal">Terkunci</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className="h-full rounded-full bg-slate-400 transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        ((badge.progress?.saatIni ?? 0) / (badge.progress?.target ?? 1)) * 100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

Badge.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;