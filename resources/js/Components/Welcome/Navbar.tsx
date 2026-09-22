import { Link, usePage } from '@inertiajs/react';

export default function Navbar() {
    const { auth } = usePage<any>().props;

    return (
        <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm" data-purpose="site-navigation">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                {/* Brand Logo */}
                <Link aria-label="Beranda Edvora" className="flex items-center space-x-2 focus:outline-none" href="/">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-wide text-[#28488E]">EDVORA</span>
                </Link>

                {/* Navigation Action Controls */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                    {auth?.user ? (
                        <Link
                            className="inline-flex items-center justify-center bg-[#5B88DD] hover:bg-[#4a75c7] active:scale-95 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all duration-200 tracking-wider uppercase"
                            data-purpose="dashboard-button"
                            href={route('dashboard')}
                        >
                            DASHBOARD
                        </Link>
                    ) : (
                        <Link
                            className="inline-flex items-center justify-center bg-[#5B88DD] hover:bg-[#4a75c7] active:scale-95 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all duration-200 tracking-wider uppercase"
                            data-purpose="login-button"
                            href={route('login')}
                        >
                            MASUK
                        </Link>
                    )}

                    {/* Avatar Icon Profil */}
                    <Link
                        href={auth?.user ? route('dashboard') : route('login')}
                        aria-label="Profil Pengguna"
                        className="text-[#5B88DD] hover:text-[#4a75c7] focus:outline-none transition-colors p-0.5 rounded-full ring-2 ring-transparent focus:ring-[#5B88DD] inline-flex items-center justify-center"
                        data-purpose="user-profile-button"
                    >
                        <svg aria-hidden="true" className="w-9 h-9 sm:w-10 sm:h-10 fill-current" viewBox="0 0 24 24">
                            <path clipRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" fillRule="evenodd" />
                        </svg>
                    </Link>
                </div>
            </div>
        </header>
    );
}

