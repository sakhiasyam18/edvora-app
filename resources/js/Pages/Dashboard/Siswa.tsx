import { Head, Link, usePage } from '@inertiajs/react';

interface SiswaProps {
    judul?: string;
}

export default function Siswa({ judul = 'Dashboard Siswa' }: SiswaProps) {
    const user = usePage<any>().props.auth.user;

    return (
        <>
            <Head title={judul} />

            <div className="flex min-h-screen bg-white">
                {/* Sidebar */}
                <aside className="w-64 border-r border-gray-200 bg-white">
                    {/* Logo */}
                    <div className="flex h-20 items-center border-b border-gray-200 px-8">
                        <div className="mr-3 h-9 w-9 rounded border border-gray-300" />

                        <span className="text-xl font-bold text-gray-900">
                            EDVORA
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2 px-6 py-8">
                        <Link
                            href={route('dashboard')}
                            className="block rounded-lg bg-blue-50 px-4 py-3 font-medium text-blue-600"
                        >
                            Beranda
                        </Link>

                        <Link
                            href={route('riwayat.index')}
                            className="block rounded-lg px-4 py-3 font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                            Riwayat
                        </Link>
                    </nav>
                </aside>

                {/* Main Area */}
                <div className="flex flex-1 flex-col">
                    {/* Header */}
                    <header className="flex h-20 items-center justify-end border-b border-gray-200 px-10">
                        <Link
                            href={route('profile.edit')}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-6 w-6 text-gray-600"
                            >
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4.5 20c.8-4 3.3-6 7.5-6s6.7 2 7.5 6" />
                            </svg>
                        </Link>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 px-10 py-10">
                        <div className="max-w-5xl">
                            <h1 className="mb-6 text-3xl font-bold text-gray-900">
                                Halo, {user.name}!
                            </h1>

                            {/* Search */}
                            <div className="relative mb-8">
                                <input
                                    type="text"
                                    placeholder="Cari materi, latihan, atau topik..."
                                    className="w-full rounded-xl border border-gray-300 px-5 py-4 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
                                >
                                    <circle cx="11" cy="11" r="7" />
                                    <path d="m20 20-3.5-3.5" />
                                </svg>
                            </div>

                            {/* Menu Cards */}
                            <div className="grid grid-cols-3 gap-6">
                                <Link
                                    href={route('latihan.persiapan')}
                                    className="flex h-52 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >
                                    <span className="text-lg font-semibold text-gray-800">
                                        Latihan Soal
                                    </span>
                                </Link>

                                <div className="flex h-52 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                                    <span className="text-lg font-semibold text-gray-800">
                                        Try Out
                                    </span>
                                </div>

                                <Link
                                    href={route('battle.matchmaking')}
                                    className="flex h-52 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >
                                    <span className="text-lg font-semibold text-gray-800">
                                        Battle Soal
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}