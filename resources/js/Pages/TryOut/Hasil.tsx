import { ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import { formatWaktuWib } from '@/lib/waktu';
import { HasilSubtesTryOut } from '@/types/tryout';

interface HasilProps {
    paket: { id: string; judul: string; selesaiAt: string };
    ditutup: boolean;
    skorTotal: number | null; // null sampai skor IRT dihitung setelah paket ditutup
    perSubtes: HasilSubtesTryOut[];
    xp: number;
    poin: number;
}

export default function Hasil({ paket, ditutup, skorTotal, perSubtes, xp, poin }: HasilProps) {
    return (
        <>
            <Head title={`Hasil ${paket.judul} - EDVORA`} />

            <div className="text-[#1E293B]">
                <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">HASIL TRY OUT</p>
                    <h1 className="text-2xl font-black text-[#1E293B]">{paket.judul}</h1>
                </div>

                <div className="max-w-3xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-gray-500">
                        <span className="rounded-full border border-gray-200 px-3 py-1 bg-gray-50">+{xp} XP</span>
                        <span className="rounded-full border border-gray-200 px-3 py-1 bg-gray-50">+{poin} Poin</span>
                    </div>

                    {skorTotal === null ? (
                        <p className="mt-4 rounded-2xl bg-[#EBF3FC] border border-[#D0E2FF] p-4 text-xs font-medium text-gray-700">
                            Skor IRT dan peringkat muncul setelah periode berakhir, {formatWaktuWib(paket.selesaiAt)}.
                        </p>
                    ) : (
                        <p className="mt-4 text-base font-bold text-[#2B4184]">
                            Skor IRT: {skorTotal.toLocaleString('id-ID')} dari 1000
                        </p>
                    )}

                    <table className="mt-6 w-full text-left text-sm">
                        <thead>
                            <tr className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                <th className="py-2">Subtes</th>
                                <th className="py-2 text-center">Benar</th>
                                <th className="py-2 text-center">Salah</th>
                                <th className="py-2 text-center">Kosong</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {perSubtes.map((s) => (
                                <tr key={s.id} className="font-semibold text-gray-700">
                                    <td className="py-3">{s.nama}</td>
                                    <td className="py-3 text-center text-[#15803D]">{s.benar}</td>
                                    <td className="py-3 text-center text-[#D9534F]">{s.salah}</td>
                                    <td className="py-3 text-center text-gray-500">{s.kosong}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                        {/* Pembahasan baru dibuka setelah paket ditutup (T15); halamannya dibuat bersama IRT. */}
                        <button
                            type="button"
                            disabled
                            title={ditutup ? 'Segera hadir' : 'Tersedia setelah periode berakhir'}
                            className="cursor-not-allowed rounded-xl bg-gray-300 px-6 py-2.5 text-xs font-bold text-white"
                        >
                            Lihat Pembahasan
                        </button>
                        <Link
                            href={route('tryout.index')}
                            className="rounded-xl bg-[#5C82E6] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#486ed6]"
                        >
                            Kembali ke Menu
                        </Link>
                    </div>
                    <p className="mt-2 text-right text-[11px] font-medium text-gray-400">
                        {ditutup ? 'Pembahasan segera hadir.' : 'Pembahasan tersedia setelah periode berakhir.'}
                    </p>
                </div>
            </div>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah ke halaman siswa lain.
Hasil.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
