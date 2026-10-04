import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// Halaman menu utama sidebar: tidak punya "halaman sebelumnya", jadi tombol kembali disembunyikan.
const HALAMAN_UTAMA = ['dashboard', 'latihan.index', 'latihan.persiapan', 'tryout.index', 'riwayat.index', 'perkembangan.index', 'akun.profil.utama'];

// Tujuan cadangan bila tidak ada riwayat di tab ini (mis. halaman dibuka langsung dari tautan).
const INDUK: [string, string][] = [
    ['latihan.*', 'latihan.index'],
    ['tryout.*', 'tryout.index'],
    ['riwayat.*', 'riwayat.index'],
    ['akun.*', 'akun.profil.utama'],
];

// Breadcrumb di samping ikon rumah. Hanya halaman yang desainnya memakai breadcrumb (Figma: Try Out).
const BREADCRUMB: [string, string[]][] = [
    ['tryout.index', ['Try Out']],
    ['tryout.hasil', ['Try Out', 'Hasil Try Out']],
];

function kembali() {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }
    const induk = INDUK.find(([pola]) => route().current(pola))?.[1] ?? 'dashboard';
    router.visit(route(induk));
}

interface TopbarSiswaProps {
    inisial: string;
    // Halaman Akun Pribadi (/akun...): ikon rumah di kiri diganti ikon pengguna. Dihitung SiswaLayout dari URL.
    isAkunPribadi: boolean;
}

/**
 * Topbar halaman siswa: tombol kembali (hanya di sub-halaman) dan pintasan ke Beranda di kiri, avatar pengguna di kanan.
 * Avatar membuka menu berisi nama, email, dan tombol Keluar. Akun Pribadi dibuka lewat sidebar.
 */
export default function TopbarSiswa({ inisial, isAkunPribadi }: TopbarSiswaProps) {
    // usePage: SiswaLayout persisten, jadi topbar perlu dirender ulang setiap pindah halaman untuk mengecek rute aktif.
    const user = usePage<any>().props.auth?.user;
    const subHalaman = !HALAMAN_UTAMA.some((nama) => route().current(nama));
    const breadcrumb = BREADCRUMB.find(([nama]) => route().current(nama))?.[1] ?? [];

    const [menuTerbuka, setMenuTerbuka] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Tutup menu saat klik di luar.
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuTerbuka(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        // sticky top-0: tetap menempel di atas saat halaman di-scroll.
        // z-30: kartu yang di-hover (transform) membuat lapisan baru, jadi topbar perlu di atasnya.
        <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between bg-white px-6 font-poppins shadow-kartu md:pl-[52px] md:pr-[38px]">
            <div className="flex min-w-0 items-center gap-3">
                {subHalaman && (
                    <button
                        type="button"
                        onClick={kembali}
                        aria-label="Kembali ke halaman sebelumnya"
                        title="Kembali"
                        className="-ml-2 flex h-9 w-9 animate-muncul-halus items-center justify-center rounded-full text-[#6F6F6F] transition duration-200 hover:-translate-x-0.5 hover:bg-siswa-badge-subtes hover:text-siswa-judul"
                    >
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M11 6l-6 6 6 6" />
                        </svg>
                    </button>
                )}

                <Link href={route('dashboard')} aria-label="Beranda" className="shrink-0 transition hover:opacity-70">
                    {isAkunPribadi ? (
                        <div className="flex h-[33.939px] w-[33.939px] items-center justify-center rounded-full bg-[#E8EDF5]">
                            <svg className="h-5 w-5 text-[#A3AED0]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    ) : (
                        <img src="/images/ikon/topbar-beranda.png" alt="" className="h-[33.939px] w-[33.939px] object-contain" />
                    )}
                </Link>

                {breadcrumb.map((item, i) => (
                    <span key={item} className={`min-w-0 animate-muncul-halus items-center gap-3 text-[15px] text-siswa-teks md:text-base ${i < breadcrumb.length - 1 ? 'hidden sm:flex' : 'flex'}`}>
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 6l6 6-6 6" />
                        </svg>
                        <span className="truncate">{item}</span>
                    </span>
                ))}
            </div>

            <div className="relative" ref={menuRef}>
                <button
                    type="button"
                    onClick={() => setMenuTerbuka(!menuTerbuka)}
                    aria-label="Menu akun"
                    aria-expanded={menuTerbuka}
                    className="flex items-center gap-4"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-edvora-primary text-[24px] font-normal leading-none text-white transition hover:bg-edvora-primary-hover">
                        {inisial}
                    </span>
                    <img src="/images/ikon/panah-bawah.png" alt="" className="h-[19.542px] w-[19.542px] object-contain" />
                </button>

                {menuTerbuka && (
                    <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-100 bg-white py-1.5 text-sm shadow-xl">
                        <div className="border-b border-slate-100 px-4 py-2">
                            <p className="truncate font-semibold text-slate-800">{user?.name}</p>
                            <p className="truncate text-xs text-slate-500">{user?.email}</p>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="block w-full px-4 py-2 text-left font-medium text-red-600 transition hover:bg-red-50"
                        >
                            Keluar
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
