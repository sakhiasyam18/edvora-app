import { Head, Link, usePage } from '@inertiajs/react';

interface IndexProps {
    title?: string;
}

export default function Index({
    title = 'Riwayat Pengerjaan',
}: IndexProps) {
    const user = usePage<any>().props.auth.user;

    const initial = user?.name
        ? user.name.charAt(0).toUpperCase()
        : 'A';

    return (
        <>
            <Head title={title} />

            <div className="flex min-h-screen bg-white">
                {/* Sidebar */}
                <aside className="hidden w-64 shrink-0 flex-col bg-[#344A91] md:flex">
                    {/* Logo */}
                    <div className="flex h-24 items-center justify-center">
                        <span className="text-3xl font-bold tracking-wide text-white">
                            EDVORA
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="mt-16 space-y-4 px-4">
                        {/* Beranda */}
                        <Link
                            href={route('dashboard')}
                            className="flex items-center gap-4 rounded-xl px-6 py-4 text-lg font-medium text-white transition hover:bg-white/10"
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

                        {/* Riwayat Active */}
                        <Link
                            href={route('riwayat.index')}
                            className="flex items-center gap-4 rounded-xl bg-[#5F8DDD] px-6 py-4 text-lg font-semibold text-white"
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
                                <path d="M6 3h10a2 2 0 0 1 2 2v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                                <path d="M8 8h6" />
                                <path d="M8 12h6" />
                                <path d="M8 16h4" />
                            </svg>

                            <span>Riwayat</span>
                        </Link>
                    </nav>
                </aside>

                {/* Main Area */}
                <div className="flex min-h-screen flex-1 flex-col">
                    {/* Header */}
                    <header className="flex h-24 shrink-0 items-center justify-end bg-white px-10">
                        <Link
                            href={route('profile.edit')}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5F8DDF] text-xl font-medium text-white transition hover:bg-[#507FD0]"
                        >
                            {initial}
                        </Link>
                    </header>

                    {/* Content */}
                    <main className="flex flex-1 bg-gradient-to-r from-[#B8E1F3] to-[#6695E4] px-6 py-10 md:px-12">
                        <div className="w-full">
                            {/* Heading */}
                            <div className="mb-7">
                                <h1 className="text-3xl font-bold text-[#213D72] md:text-4xl">
                                    Riwayat Pengerjaan
                                </h1>

                                <p className="mt-1 text-sm font-medium text-[#53648B] md:text-base">
                                    Lihat kembali pembahasan dan lanjutkan latihanmu
                                    di sini.
                                </p>
                            </div>

                            {/* Search / Filter */}
                            <div className="relative w-full">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                                >
                                    <circle cx="11" cy="11" r="7" />
                                    <path d="m20 20-3.5-3.5" />
                                </svg>

                                <input
                                    type="text"
                                        placeholder="Cari riwayat..."
                                        className="h-14 w-full rounded-xl border border-gray-300 bg-white pl-14 pr-5 text-base font-medium text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#5F8DDD] focus:ring-2 focus:ring-[#5F8DDD]/20"
                                />
                            </div>

                            {/* Empty State */}
                            <div className="flex min-h-[360px] items-center justify-center">
                                <p className="text-lg font-semibold text-white md:text-xl">
                                    Belum Ada Soal yang Dikerjakan
                                </p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}