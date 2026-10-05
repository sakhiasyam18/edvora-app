import { Head, Link } from '@inertiajs/react';
import { useState, ReactNode } from 'react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';

export interface AvatarItem {
    id: string;
    nama: string;
    deskripsi: string;
    hargaPoint: number;
    rarity: string;
    gambarUrl: string;
    dimiliki: boolean;
    dipakai: boolean;
}

interface AvatarProps {
    totalPoint?: number;
    avatars?: AvatarItem[];
}

export default function Avatar({ totalPoint = 2354, avatars = [] }: AvatarProps) {
    const [tabAktif, setTabAktif] = useState<'toko' | 'saya'>('toko');
    
    // Pengaman: pilih avatar pertama jika ada
    const [avatarTerpilih, setAvatarTerpilih] = useState<AvatarItem | null>(
        avatars.length > 0 ? avatars[0] : null
    );
    const [isModalBeliOpen, setIsModalBeliOpen] = useState(false);
    const [pakaiLangsung, setPakaiLangsung] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const listAvatarSaya = avatars.filter((a) => a.dimiliki);
    const listDitampilkan = tabAktif === 'toko' ? avatars : listAvatarSaya;

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleProsesBeli = () => {
        setIsModalBeliOpen(false);
        showToast('Avatar berhasil dibeli!');
    };

    const handlePakaiAvatar = (avatar: AvatarItem) => {
        showToast('Avatar berhasil dipakai!');
    };

    return (
        <>
            <Head title="Toko Avatar" />

            {/* Notification Toast */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 animate-bounce">
                    <div className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-xl border border-emerald-100">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                            ✓
                        </span>
                        {toastMessage}
                    </div>
                </div>
            )}

            <div className="w-full space-y-4 font-poppins text-slate-800">
                {/* Tombol Kembali yang Benar sesuai route kamu */}
                <div>
                    <Link
                        href="/akun/profil/utama"
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                        ← Kembali ke Akun Pribadi
                    </Link>
                </div>

                {/* Tab Toko & Point */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1.5">
                        <button
                            onClick={() => setTabAktif('toko')}
                            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                                tabAktif === 'toko' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Toko Avatar
                        </button>
                        <button
                            onClick={() => setTabAktif('saya')}
                            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                                tabAktif === 'saya' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Avatar Saya ({listAvatarSaya.length})
                        </button>
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 shadow-sm border border-slate-100">
                        <span className="text-xl">🏆</span>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Poin</p>
                            <p className="text-base font-bold text-slate-900">{totalPoint.toLocaleString('id-ID')} Point</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Grid Avatar */}
                    <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {listDitampilkan.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setAvatarTerpilih(item)}
                                    className={`relative flex cursor-pointer flex-col items-center rounded-2xl border-2 p-4 text-center transition-all ${
                                        avatarTerpilih?.id === item.id
                                            ? 'border-indigo-500 bg-indigo-50/30 shadow-md'
                                            : 'border-slate-100 hover:border-slate-200'
                                    }`}
                                >
                                    {item.dipakai && (
                                        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                                            ✓
                                        </span>
                                    )}

                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                                        <img src={item.gambarUrl} alt={item.nama} className="h-12 w-12 object-contain" />
                                    </div>

                                    <h4 className="mt-3 text-xs font-bold text-slate-800">{item.nama}</h4>

                                    <div className="mt-2">
                                        {item.dipakai ? (
                                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold text-indigo-600">
                                                Dipakai
                                            </span>
                                        ) : item.dimiliki ? (
                                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-600">
                                                Dimiliki
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-600">
                                                🏆 {item.hargaPoint} Point
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pratinjau Kanan */}
                    {avatarTerpilih && (
                        <div className="flex flex-col items-center justify-between rounded-3xl bg-white p-6 shadow-sm border border-slate-100 text-center">
                            <div className="w-full">
                                <div className="flex justify-between text-xs font-bold text-slate-400">
                                    <span>Pratinjau Avatar</span>
                                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-indigo-600">
                                        {avatarTerpilih.rarity}
                                    </span>
                                </div>

                                <div className="relative mx-auto my-8 flex h-40 w-40 items-center justify-center rounded-full bg-indigo-50/50 border-2 border-dashed border-indigo-200">
                                    <img
                                        src={avatarTerpilih.gambarUrl}
                                        alt={avatarTerpilih.nama}
                                        className="h-28 w-28 object-contain"
                                    />
                                </div>

                                <h3 className="text-lg font-bold text-slate-900">{avatarTerpilih.nama}</h3>
                                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{avatarTerpilih.deskripsi}</p>
                            </div>

                            <div className="mt-6 w-full">
                                {avatarTerpilih.dipakai ? (
                                    <button
                                        disabled
                                        className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-400 cursor-not-allowed"
                                    >
                                        Dipakai
                                    </button>
                                ) : avatarTerpilih.dimiliki ? (
                                    <button
                                        onClick={() => handlePakaiAvatar(avatarTerpilih)}
                                        className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700"
                                    >
                                        Pakai
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsModalBeliOpen(true)}
                                        className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700"
                                    >
                                        🏆 Beli Sekarang · {avatarTerpilih.hargaPoint} Point
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Beli Avatar */}
            {isModalBeliOpen && avatarTerpilih && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">Beli avatar</h3>
                            <button
                                onClick={() => setIsModalBeliOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm">
                                <img
                                    src={avatarTerpilih.gambarUrl}
                                    alt={avatarTerpilih.nama}
                                    className="h-10 w-10 object-contain"
                                />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">{avatarTerpilih.nama}</h4>
                                <p className="text-xs font-medium text-slate-500">🏆 {avatarTerpilih.hargaPoint} Point</p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="pakaiAvatar"
                                checked={pakaiLangsung}
                                onChange={(e) => setPakaiLangsung(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="pakaiAvatar" className="text-xs font-medium text-slate-600 cursor-pointer">
                                Pakai avatar setelah dibeli
                            </label>
                        </div>

                        <button
                            onClick={handleProsesBeli}
                            className="mt-6 w-full rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700"
                        >
                            Beli
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

Avatar.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;