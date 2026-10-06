import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import LambangEdvora from '@/Components/Layouts/LambangEdvora';

// Tautan ke bagian-bagian landing page.
const MENU = [
    { label: 'Tentang', href: '#tentang' },
    { label: 'Fitur', href: '#fitur' },
    { label: 'Subtes', href: '#subtes' },
    { label: 'Cara Kerja', href: '#cara-kerja' },
];

export default function Navbar() {
    const { auth } = usePage<any>().props;
    const [menuTerbuka, setMenuTerbuka] = useState(false);
    const [digulir, setDigulir] = useState(false);

    // Bayangan navbar baru muncul setelah halaman digulir, supaya hero terlihat menyatu di posisi paling atas.
    useEffect(() => {
        const cek = () => setDigulir(window.scrollY > 8);
        cek();
        window.addEventListener('scroll', cek, { passive: true });
        return () => window.removeEventListener('scroll', cek);
    }, []);

    return (
        <header
            className={`sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md transition-shadow duration-300 ${
                digulir ? 'border-siswa-garis-halus shadow-kartu' : 'border-transparent'
            }`}
        >
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
                <Link aria-label="Beranda Edvora" href="/" className="flex items-center gap-2.5">
                    <LambangEdvora className="h-[34px] w-[29px]" />
                    <span className="text-[20px] font-extrabold tracking-[2.5px] text-siswa-judul">EDVORA</span>
                </Link>

                <nav aria-label="Navigasi halaman" className="hidden items-center gap-1 md:flex">
                    {MENU.map((m) => (
                        <a
                            key={m.href}
                            href={m.href}
                            className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-siswa-teks transition-colors duration-150 hover:bg-siswa-laman-awal hover:text-siswa-judul"
                        >
                            {m.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-2.5">
                    {auth?.user ? (
                        <Link href={route('dashboard')} className={TOMBOL_BIRU}>
                            DASHBOARD
                        </Link>
                    ) : (
                        <>
                            <Link href={route('login')} className={`${TOMBOL_GARIS} hidden sm:inline-flex`}>
                                MASUK
                            </Link>
                            <Link href={route('register')} className={TOMBOL_BIRU}>
                                DAFTAR
                            </Link>
                        </>
                    )}

                    {/* Menu bagian halaman di layar sempit. */}
                    <button
                        type="button"
                        onClick={() => setMenuTerbuka(!menuTerbuka)}
                        aria-label="Buka menu"
                        aria-expanded={menuTerbuka}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-siswa-judul transition hover:bg-siswa-laman-awal md:hidden"
                    >
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                            {menuTerbuka ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                        </svg>
                    </button>
                </div>
            </div>

            {menuTerbuka && (
                <nav aria-label="Navigasi halaman" className="animate-buka-menu border-t border-siswa-garis-halus bg-white px-5 py-3 md:hidden">
                    {MENU.map((m) => (
                        <a
                            key={m.href}
                            href={m.href}
                            onClick={() => setMenuTerbuka(false)}
                            className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-siswa-judul-seksi hover:bg-siswa-laman-awal"
                        >
                            {m.label}
                        </a>
                    ))}
                    {!auth?.user && (
                        <Link href={route('login')} className="mt-1 block rounded-lg px-3 py-2.5 text-[15px] font-semibold text-edvora-primary hover:bg-siswa-laman-awal">
                            Masuk
                        </Link>
                    )}
                </nav>
            )}
        </header>
    );
}

const TOMBOL_BIRU =
    'inline-flex h-10 items-center justify-center rounded-xl bg-edvora-primary px-5 text-[13px] font-bold tracking-wider text-white shadow-[0_4px_12px_rgba(91,136,221,0.35)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-edvora-primary-hover active:translate-y-0';
const TOMBOL_GARIS =
    'h-10 items-center justify-center rounded-xl border-2 border-edvora-primary/70 px-5 text-[13px] font-bold tracking-wider text-edvora-primary transition-all duration-150 hover:border-edvora-primary hover:bg-siswa-laman-awal';
