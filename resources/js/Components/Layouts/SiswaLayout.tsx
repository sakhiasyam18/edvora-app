import { Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

interface MenuSidebar {
    label: string;
    rute: string | null; // nama rute; null = halamannya belum ada, jadi belum bisa dipencet
    aktifUntuk?: string; // pola route().current() bila berbeda dari rute, mis. 'latihan.*'
}

// Urutan menu sidebar (RANCANGAN-dashboard-topik-remedial.md, K18).
const MENU_SIDEBAR: MenuSidebar[] = [
    { label: 'Beranda', rute: 'dashboard' },
    { label: 'Latihan Soal', rute: 'latihan.index', aktifUntuk: 'latihan.*' },
    { label: 'Try Out', rute: null },
    { label: 'Riwayat', rute: 'riwayat.index', aktifUntuk: 'riwayat.*' },
    { label: 'Perkembangan', rute: null },
    { label: 'Akun Pribadi', rute: 'akun.profil.utama', aktifUntuk: 'akun.*' },
];

/**
 * Layout halaman siswa: sidebar, header, dan area konten.
 * Dipasang sebagai persistent layout (Halaman.layout = ...), jadi sidebar tidak dirender ulang saat pindah halaman.
 * Susunan saja; ikon dan desain dikerjakan frontend.
 */
export default function SiswaLayout({ children }: { children: ReactNode }) {
    const user = usePage<any>().props.auth.user;
    const inisial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

    return (
        <div className="flex min-h-screen bg-white">
            <aside className="hidden w-64 shrink-0 flex-col bg-[#344A91] md:flex">
                <div className="flex h-24 items-center justify-center">
                    <Link href={route('dashboard')} className="text-3xl font-bold tracking-wide text-white">
                        EDVORA
                    </Link>
                </div>

                <nav className="mt-16 space-y-4 px-4">
                    {MENU_SIDEBAR.map((menu) => {
                        if (!menu.rute) {
                            return (
                                <span
                                    key={menu.label}
                                    aria-disabled="true"
                                    className="flex cursor-not-allowed items-center gap-4 rounded-xl px-6 py-4 text-lg font-medium text-white opacity-60"
                                >
                                    {menu.label}
                                </span>
                            );
                        }

                        const aktif = route().current(menu.aktifUntuk ?? menu.rute);

                        return (
                            <Link
                                key={menu.label}
                                href={route(menu.rute)}
                                // Data halaman tujuan diambil saat kursor diarahkan, supaya klik terasa cepat.
                                prefetch
                                aria-current={aktif ? 'page' : undefined}
                                className={`flex items-center gap-4 rounded-xl px-6 py-4 text-lg text-white transition ${aktif ? 'bg-[#5F8DDD] font-semibold' : 'font-medium hover:bg-white/10'
                                    }`}
                            >
                                {menu.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex min-h-screen flex-1 flex-col">
                <header className="flex h-24 shrink-0 items-center justify-between bg-white px-8 md:px-10">
                    <Link href={route('dashboard')} className="text-gray-500 hover:text-[#1F2D5C]" aria-label="Beranda">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                        </svg>
                    </Link>

                    <Link
                        href={route('akun.profil.utama')}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5E8CDF] text-xl font-medium text-white transition hover:bg-[#4E7FD5]"
                        aria-label="Profil"
                    >
                        {inisial}
                    </Link>
                </header>

                <main className="flex-1 bg-[#E6F2FF] px-6 py-10 md:px-12">{children}</main>
            </div>
        </div>
    );
}
