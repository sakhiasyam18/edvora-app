import { Head } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import DetailBadge, { BadgeDiperoleh } from '@/Components/Gamifikasi/DetailBadge';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import { formatTanggalWib } from '@/lib/waktu';

interface BadgeProps {
    badges: BadgeDiperoleh[]; // hanya yang sudah diperoleh, terbaru dulu
}

// Semua badge yang sudah diperoleh siswa (UCS5), tujuan "Lihat Semua" di Akun Pribadi.
export default function Badge({ badges }: BadgeProps) {
    const [dipilih, setDipilih] = useState<BadgeDiperoleh | null>(null);

    return (
        <>
            <Head title="Koleksi Badge" />

            <div className="w-full space-y-6 font-poppins text-slate-800">
                <div>
                    <h1 className="text-[24px] font-bold text-slate-800">Koleksi Badge Saya</h1>
                    <p className="text-[13px] text-slate-500">
                        Kamu telah memperoleh <span className="font-semibold text-edvora-primary">{badges.length}</span> badge.
                    </p>
                </div>

                {badges.length === 0 ? (
                    <p className="rounded-2xl bg-white p-5 text-[13px] text-slate-500 shadow-sm">Belum ada badge.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
                        {badges.map((badge) => (
                            <button
                                key={badge.id}
                                type="button"
                                onClick={() => setDipilih(badge)}
                                className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition duration-200 hover:shadow-md"
                            >
                                <img src={badge.icon} alt="" className="h-20 w-20" />
                                <h3 className="mt-4 text-[16px] font-bold text-slate-800">{badge.nama}</h3>
                                <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{badge.syarat}</p>
                                <div className="mt-6 text-[11px]">
                                    <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">Diraih Pada</span>
                                    <span className="font-bold text-slate-700">{formatTanggalWib(badge.diperolehAt)}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <DetailBadge badge={dipilih} onClose={() => setDipilih(null)} />
        </>
    );
}

Badge.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
