import { Head, router, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import GambarAvatar from '@/Components/Gamifikasi/GambarAvatar';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import Modal from '@/Components/Modal';

interface AvatarItem {
    id: string | null; // null = Default, selalu pertama
    nama: string;
    gambarUrl: string; // versi sesuai jenis kelamin siswa
    hargaPoint: number; // 0 untuk Default
    levelMinimal: number;
    terkunci: boolean; // belum dimiliki dan level siswa < levelMinimal
    dimiliki: boolean;
    dipakai: boolean;
}

interface AvatarProps {
    totalPoint: number;
    level: number;
    avatars: AvatarItem[];
}

// Default tidak punya id.
const kunci = (a: AvatarItem) => a.id ?? 'default';

const angka = (n: number) => n.toLocaleString('id-ID');

// Label kartu (UCS5 2b.2).
function labelKartu(a: AvatarItem): string {
    if (a.dipakai) return 'Dipakai';
    if (a.dimiliki) return 'Pakai';
    if (a.terkunci) return `Lv. ${a.levelMinimal}`;
    return `${angka(a.hargaPoint)} point`;
}

// Toko Avatar (UCS5 2b): level membuka avatar, point membelinya.
export default function Avatar({ totalPoint, level, avatars }: AvatarProps) {
    const [tabAktif, setTabAktif] = useState<'toko' | 'saya'>('toko');
    // Disimpan sebagai kunci, bukan objek: setelah beli/pakai, props avatars dimuat ulang dari server.
    const [kunciTerpilih, setKunciTerpilih] = useState(() => kunci(avatars.find((a) => a.dipakai) ?? avatars[0]));
    const [konfirmasiBeli, setKonfirmasiBeli] = useState(false);
    const [memproses, setMemproses] = useState(false);

    // Pesan sekali tampil dari backend (Inertia::flash).
    const { flash } = usePage();
    const pesanSukses = typeof flash.sukses === 'string' ? flash.sukses : null;
    const pesanError = typeof flash.error === 'string' ? flash.error : null;

    const avatarSaya = avatars.filter((a) => a.dimiliki);
    const ditampilkan = tabAktif === 'toko' ? avatars : avatarSaya;
    const terpilih = avatars.find((a) => kunci(a) === kunciTerpilih) ?? avatars[0];

    const kirim = (namaRute: 'akun.avatar.beli' | 'akun.avatar.pakai') =>
        router.post(
            route(namaRute),
            { avatarId: terpilih.id },
            {
                preserveScroll: true,
                onStart: () => setMemproses(true),
                onFinish: () => {
                    setMemproses(false);
                    setKonfirmasiBeli(false);
                },
            },
        );

    return (
        <>
            <Head title="Toko Avatar" />

            <div className="w-full space-y-4 font-poppins text-slate-800">
                {/* Tab dan saldo point */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1.5">
                        <button
                            type="button"
                            onClick={() => setTabAktif('toko')}
                            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                                tabAktif === 'toko' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Toko Avatar
                        </button>
                        <button
                            type="button"
                            onClick={() => setTabAktif('saya')}
                            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                                tabAktif === 'saya' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Avatar Saya ({avatarSaya.length})
                        </button>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Point · Level {level}</p>
                        <p className="text-base font-bold text-slate-900">{angka(totalPoint)} Point</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Galeri avatar (UCS5: Gallery View) */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {ditampilkan.map((item) => (
                                <button
                                    key={kunci(item)}
                                    type="button"
                                    onClick={() => setKunciTerpilih(kunci(item))}
                                    className={`flex flex-col items-center rounded-2xl border-2 p-4 text-center transition-all ${
                                        kunciTerpilih === kunci(item) ? 'border-indigo-500 bg-indigo-50/30 shadow-md' : 'border-slate-100 hover:border-slate-200'
                                    } ${item.terkunci ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-2xl">
                                        <GambarAvatar src={item.gambarUrl} nama={item.nama} className="h-14 w-14 object-contain" />
                                    </div>
                                    <h4 className="mt-3 text-xs font-bold text-slate-800">{item.nama}</h4>
                                    <span
                                        className={`mt-2 rounded-full px-3 py-1 text-[10px] font-bold ${
                                            item.dipakai
                                                ? 'bg-indigo-100 text-indigo-600'
                                                : item.dimiliki
                                                  ? 'bg-emerald-100 text-emerald-600'
                                                  : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {labelKartu(item)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pratinjau */}
                    <div className="flex flex-col items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
                        <div className="w-full">
                            <p className="text-left text-xs font-bold text-slate-400">Pratinjau Avatar</p>
                            <div className="mx-auto my-8 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-indigo-200 bg-indigo-50/50 text-4xl">
                                <GambarAvatar src={terpilih.gambarUrl} nama={terpilih.nama} className="h-28 w-28 object-contain" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{terpilih.nama}</h3>
                            <p className="mt-2 text-xs text-slate-500">
                                {terpilih.id === null
                                    ? 'Avatar bawaan, gratis'
                                    : `Syarat Lv. ${terpilih.levelMinimal} · ${angka(terpilih.hargaPoint)} point`}
                            </p>
                        </div>

                        <div className="mt-6 w-full">
                            {/* Pesan hasil beli/pakai di dekat tombolnya: di layar sempit panel ini ada di bawah galeri,
                                jadi banner di atas halaman tidak terlihat (preserveScroll). */}
                            {(pesanSukses || pesanError) && (
                                <div
                                    role={pesanError ? 'alert' : 'status'}
                                    className={`mb-3 rounded-lg border px-4 py-3 text-sm font-medium ${
                                        pesanError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    }`}
                                >
                                    {pesanError ?? pesanSukses}
                                </div>
                            )}

                            {terpilih.dipakai ? (
                                <button type="button" disabled className="w-full cursor-not-allowed rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-400">
                                    Dipakai
                                </button>
                            ) : terpilih.dimiliki ? (
                                <button
                                    type="button"
                                    disabled={memproses}
                                    onClick={() => kirim('akun.avatar.pakai')}
                                    className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
                                >
                                    Pakai
                                </button>
                            ) : terpilih.terkunci ? (
                                <button type="button" disabled className="w-full cursor-not-allowed rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-400">
                                    Level XP tidak mencukupi
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setKonfirmasiBeli(true)}
                                    className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700"
                                >
                                    {angka(terpilih.hargaPoint)} point
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Konfirmasi beli (SDD FR32) */}
            <Modal
                show={konfirmasiBeli}
                onClose={() => !memproses && setKonfirmasiBeli(false)}
                maxWidth="md"
                panelClassName="rounded-[24px]"
            >
                <div className="flex flex-col items-center px-6 py-7 text-center">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-2xl">
                        <GambarAvatar src={terpilih.gambarUrl} nama={terpilih.nama} className="h-16 w-16 object-contain" />
                    </div>
                    <h3 className="mt-3 text-[18px] font-semibold text-slate-900">Beli avatar</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-slate-600">
                        Beli avatar {terpilih.nama} seharga {angka(terpilih.hargaPoint)} point?
                    </p>
                    <div className="mt-6 grid w-full grid-cols-2 gap-3">
                        <button
                            type="button"
                            disabled={memproses}
                            onClick={() => setKonfirmasiBeli(false)}
                            className="h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-600"
                        >
                            Tidak
                        </button>
                        <button
                            type="button"
                            disabled={memproses}
                            onClick={() => kirim('akun.avatar.beli')}
                            className="h-11 rounded-xl bg-indigo-600 text-sm font-bold text-white disabled:opacity-60"
                        >
                            {memproses ? '...' : 'Iya'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

Avatar.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
