import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';

interface AdminLayoutProps {
    judul: string;
}

export default function AdminLayout({ judul, children }: PropsWithChildren<AdminLayoutProps>) {
    const page = usePage();
    const flash = ((page as any).flash || (page.props as any).flash || {}) as {
        sukses?: string | null;
        error?: string | null;
    };
    const user = (page.props as any).auth?.user || null;

    const [pesanSukses, setPesanSukses] = useState<string | null>(typeof flash.sukses === 'string' ? flash.sukses : null);
    const [pesanError, setPesanError] = useState<string | null>(typeof flash.error === 'string' ? flash.error : null);
    const [menuTerbuka, setMenuTerbuka] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Perbarui notifikasi ketika flash props berubah
    useEffect(() => {
        if (typeof flash.sukses === 'string') {
            setPesanSukses(flash.sukses);
            const timer = setTimeout(() => setPesanSukses(null), 4000);
            return () => clearTimeout(timer);
        } else {
            setPesanSukses(null);
        }
    }, [flash.sukses]);

    useEffect(() => {
        if (typeof flash.error === 'string') {
            setPesanError(flash.error);
            const timer = setTimeout(() => setPesanError(null), 4000);
            return () => clearTimeout(timer);
        } else {
            setPesanError(null);
        }
    }, [flash.error]);

    // Tutup dropdown menu saat klik di luar
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuTerbuka(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isDashboardActive = route().current('admin.index');
    const isKelolaUserActive = route().current('admin.user.*');

    const inisialNama = (user?.name?.trim().charAt(0) || 'A').toUpperCase();

    return (
        <div className="flex min-h-screen w-full bg-[#e8edf3] text-slate-800 antialiased selection:bg-blue-200">
            {/* BEGIN: Left Sidebar */}
            <aside className="w-64 bg-[#22355c] text-white flex flex-col shrink-0 select-none transition-all duration-300 min-h-screen">
                {/* Brand Logo Header */}
                <div className="pt-8 pb-10 flex flex-col items-center justify-center">
                    {/* Stylized Cyan/Blue Ribbon Logo Icon */}
                    <div className="mb-3 text-cyan-400">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M14 12C14 8.68629 16.6863 6 20 6H28C34.6274 6 40 11.3726 40 18C40 23.3705 36.4716 27.915 31.6234 29.4314L13.5 12.5"
                                stroke="#38bdf8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="4"
                            />
                            <path
                                d="M12 22C12 22 17.5 22 25 22C30 22 34 26 34 31C34 36.5228 29.5228 41 24 41H18C14.6863 41 12 38.3137 12 35V22Z"
                                fill="#0284c7"
                                opacity="0.35"
                            />
                            <path
                                d="M12 22C12 22 17.5 22 25 22C30 22 34 26 34 31C34 36.5228 29.5228 41 24 41H18C14.6863 41 12 38.3137 12 35V22Z"
                                stroke="#0ea5e9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="4"
                            />
                            <path d="M16 31H28" stroke="#38bdf8" strokeLinecap="round" strokeWidth="3.5" />
                        </svg>
                    </div>
                    {/* Brand Name */}
                    <h1 className="text-xl font-black tracking-widest text-white uppercase text-center">EDVORA</h1>
                </div>

                {/* Navigation Menu */}
                <nav aria-label="Navigasi Admin" className="px-4 space-y-2 flex-1">
                    {/* Dashboard */}
                    <Link
                        href={route('admin.index')}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition duration-150 ${
                            isDashboardActive
                                ? 'bg-[#44669f] text-white shadow-inner'
                                : 'text-slate-300 hover:text-white hover:bg-slate-700/40 font-medium'
                        }`}
                    >
                        {/* 4-square Grid Icon */}
                        <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                            <rect height="7" rx="1.5" width="7" x="3" y="3" />
                            <rect height="7" rx="1.5" width="7" x="14" y="3" />
                            <rect height="7" rx="1.5" width="7" x="14" y="14" />
                            <rect height="7" rx="1.5" width="7" x="3" y="14" />
                        </svg>
                        <span>Dashboard</span>
                    </Link>

                    {/* Kelola User Link */}
                    <Link
                        href={route('admin.user.index')}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition duration-150 ${
                            isKelolaUserActive
                                ? 'bg-[#44669f] text-white shadow-inner'
                                : 'text-slate-300 hover:text-white hover:bg-slate-700/40 font-medium'
                        }`}
                    >
                        {/* Users Icon */}
                        <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>Kelola User</span>
                    </Link>
                </nav>

                {/* Sidebar Footer (System Status Indicator) */}
                <div className="p-4 text-xs text-slate-400 border-t border-slate-700/50 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Server Online
                    </span>
                    <span className="text-slate-500 text-[11px]">v2.4</span>
                </div>
            </aside>
            {/* END: Left Sidebar */}

            {/* Main Container */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* BEGIN: Top Header */}
                <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-30">
                    {/* Left: Home Button */}
                    <Link
                        href={route('admin.index')}
                        aria-label="Beranda Admin"
                        className="text-slate-500 hover:text-slate-700 transition p-1.5 rounded-lg hover:bg-slate-100"
                    >
                        <svg className="w-6 h-6 fill-current text-slate-500 hover:text-slate-700 transition" viewBox="0 0 24 24">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                        </svg>
                    </Link>

                    {/* Right: Admin Profile Dropdown Button */}
                    <div className="relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuTerbuka(!menuTerbuka)}
                            className="flex items-center gap-2 group p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-blue-700 transition">
                                {inisialNama}
                            </div>
                            <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                            </svg>
                        </button>

                        {/* Dropdown Popup */}
                        {menuTerbuka && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-sm">
                                <div className="px-4 py-2 border-b border-slate-100">
                                    <p className="font-semibold text-slate-800 truncate">{user?.name || 'Administrator'}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email || 'admin@edvora.id'}</p>
                                </div>
                                <Link
                                    href={route('profile.edit')}
                                    className="block px-4 py-2 text-slate-600 hover:bg-slate-50 transition"
                                    onClick={() => setMenuTerbuka(false)}
                                >
                                    Pengaturan Akun
                                </Link>
                                <div className="border-t border-slate-100 my-1" />
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="w-full text-left block px-4 py-2 text-red-600 hover:bg-red-50 font-medium transition"
                                >
                                    Keluar
                                </Link>
                            </div>
                        )}
                    </div>
                </header>
                {/* END: Top Header */}

                {/* BEGIN: Floating Notification Capsules (Matching mockups) */}
                {pesanSukses && (
                    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300">
                        <div className="bg-white px-8 py-3.5 rounded-2xl border-2 border-emerald-500 shadow-xl flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 text-emerald-500 flex items-center justify-center font-bold text-lg">
                                ✓
                            </div>
                            <span className="text-emerald-600 text-base md:text-lg font-bold tracking-wide">
                                {pesanSukses}
                            </span>
                        </div>
                    </div>
                )}

                {pesanError && (
                    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300">
                        <div className="bg-white px-8 py-3.5 rounded-2xl border-2 border-red-500 shadow-xl flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center font-bold text-lg">
                                !
                            </div>
                            <span className="text-red-500 text-base md:text-lg font-bold tracking-wide">
                                {pesanError}
                            </span>
                        </div>
                    </div>
                )}
                {/* END: Floating Notification Capsules */}

                {/* Main Content View */}
                <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
