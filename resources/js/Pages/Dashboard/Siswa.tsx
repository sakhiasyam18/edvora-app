import { Head, Link, usePage } from '@inertiajs/react';

interface SiswaProps {
    judul?: string;
}

export default function Siswa({ judul = 'Dashboard Siswa' }: SiswaProps) {
    const user = usePage<any>().props.auth.user;

    const initial = user?.name
        ? user.name.charAt(0).toUpperCase()
        : 'S';

    return (
        <>
            <Head title={judul} />

            <div className="flex min-h-screen bg-white">
                {/* Sidebar */}
                <aside className="hidden w-64 shrink-0 flex-col bg-[#344A91] md:flex">
                    {/* Logo */}
                    <div className="flex h-24 items-center justify-center">
                        <Link
                            href={route('dashboard')}
                            className="text-3xl font-bold tracking-wide text-white"
                        >
                            EDVORA
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="mt-16 space-y-4 px-4">
                        <Link
                            href={route('dashboard')}
                            className="flex items-center gap-4 rounded-xl bg-[#5F8DDD] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#6A96E5]"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-5 w-5"
                            >
                                <path d="M12 3.2 3.5 10v10.2c0 .5.4.8.8.8H9v-6h6v6h4.7c.4 0 .8-.3.8-.8V10L12 3.2Z" />
                            </svg>

                            <span>Beranda</span>
                        </Link>

                        <Link
                            href={route('riwayat.index')}
                            className="flex items-center gap-4 rounded-xl px-6 py-4 text-lg font-medium text-white transition hover:bg-white/10"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                            >
                                <path d="M5 4h11a2 2 0 0 1 2 2v11" />
                                <path d="M5 4v14a2 2 0 0 0 2 2h11" />
                                <path d="M8 8h7" />
                                <path d="M8 12h5" />
                                <path d="M16 17h5" />
                                <path d="m18.5 14.5 2.5 2.5-2.5 2.5" />
                            </svg>

                            <span>Riwayat</span>
                        </Link>
                    </nav>
                </aside>

                {/* Main Section */}
                <div className="flex min-h-screen flex-1 flex-col">
                    {/* Header */}
                    <header className="flex h-24 shrink-0 items-center justify-end bg-white px-8 md:px-10">
                        <Link
                            href={route('profile.edit')}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5E8CDF] text-xl font-medium text-white transition hover:bg-[#4E7FD5]"
                            aria-label="Profil"
                        >
                            {initial}
                        </Link>
                    </header>

                    {/* Dashboard Content */}
                    <main className="flex flex-1 bg-[#E6F2FF] px-6 py-10 md:px-12 md:py-11">
                        <div className="w-full">
                            {/* Greeting */}
                            <div className="mb-7">
                                <h1 className="text-3xl font-bold text-[#19386F] md:text-4xl">
                                    Halo, {user?.name || 'Siswa'}!
                                </h1>

                                <p className="mt-1 text-sm font-medium text-[#445984] md:text-base">
                                    Jangan Lupa Semangat Belajar untuk Hari ini!
                                </p>
                            </div>

                            {/* Cards */}
                            <div className="grid max-w-[900px] grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {/* Latihan Soal */}
                                <Link
                                    href={route('latihan.index')}
                                    className="group relative flex min-h-[220px] flex-col rounded-xl bg-white px-5 py-5 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C7E9FA]">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#548CC8"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-7 w-7"
                                        >
                                            <rect
                                                x="5"
                                                y="3"
                                                width="14"
                                                height="18"
                                                rx="2"
                                            />
                                            <path d="M9 7h6" />
                                            <path d="M9 17h6" />
                                        </svg>
                                    </div>

                                    <h2 className="text-xl font-bold text-[#203766]">
                                        Latihan Soal
                                    </h2>

                                    <p className="mt-1 max-w-[190px] text-sm leading-snug text-[#536078]">
                                        Kerjakan soal latihan sesuai subtest yang
                                        kamu inginkan!
                                    </p>

                                    <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#568DD0] text-white transition group-hover:translate-x-1">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-4 w-4"
                                        >
                                            <path d="M5 12h14" />
                                            <path d="m13 6 6 6-6 6" />
                                        </svg>
                                    </div>
                                </Link>

                                {/* Try Out */}
                                <div className="group relative flex min-h-[220px] flex-col rounded-xl bg-white px-5 py-5 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#CDF3B9]">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#70A95B"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-7 w-7"
                                        >
                                            <path d="M6 2h8l4 4v16H6Z" />
                                            <path d="M14 2v5h5" />
                                            <path d="M9 12h6" />
                                            <path d="M9 16h6" />
                                        </svg>
                                    </div>

                                    <h2 className="text-xl font-bold text-[#203766]">
                                        Try Out
                                    </h2>

                                    <p className="mt-1 max-w-[190px] text-sm leading-snug text-[#536078]">
                                        Latih kemampuan kamu dan dapatkan pengalaman
                                        ujian sesungguhnya dengan timer!
                                    </p>

                                    <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#568DD0] text-white">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-4 w-4"
                                        >
                                            <path d="M5 12h14" />
                                            <path d="m13 6 6 6-6 6" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Battle Soal */}
                                <Link
                                    href={route('battle.matchmaking')}
                                    className="group relative flex min-h-[220px] flex-col rounded-xl bg-white px-5 py-5 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D8D7FF]">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#6867BA"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-7 w-7"
                                        >
                                            <path d="m4 4 7 7" />
                                            <path d="m20 4-7 7" />
                                            <path d="m6 2 2 2-4 4-2-2Z" />
                                            <path d="m18 2-2 2 4 4 2-2Z" />
                                            <path d="m8 14-5 5" />
                                            <path d="m16 14 5 5" />
                                            <path d="m3 19 2 2" />
                                            <path d="m21 19-2 2" />
                                        </svg>
                                    </div>

                                    <h2 className="text-xl font-bold text-[#203766]">
                                        Battle Soal
                                    </h2>

                                    <p className="mt-1 max-w-[190px] text-sm leading-snug text-[#536078]">
                                        Tantang temanmu untuk mengerjakan soal secara
                                        kompetitif!
                                    </p>

                                    <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#568DD0] text-white transition group-hover:translate-x-1">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-4 w-4"
                                        >
                                            <path d="M5 12h14" />
                                            <path d="m13 6 6 6-6 6" />
                                        </svg>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}