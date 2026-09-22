import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

interface LatihanLayoutProps {
    breadcrumb: string[];
    sidebar?: ReactNode;
    children: ReactNode;
}

export default function LatihanLayout({ breadcrumb, sidebar, children }: LatihanLayoutProps) {
    const namaUser: string = usePage<any>().props.auth?.user?.name ?? '';
    const inisial = namaUser.charAt(0).toUpperCase() || 'A';

    return (
        <div className="flex h-screen flex-col font-['Poppins',sans-serif] text-[#1F2D5C]">
            <Head>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=poppins:400,500,600,700&display=swap" rel="stylesheet" />
            </Head>

            <header className="z-10 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white shadow-sm">
                <div className="flex h-full w-56 shrink-0 items-center justify-center border-r border-gray-200">
                    <span className="text-3xl font-bold tracking-wide text-[#1F2D5C]">EDVORA</span>
                </div>

                <nav className="flex flex-1 items-center gap-3 px-6 text-sm text-gray-500">
                    <Link href={route('dashboard')} className="text-gray-500 hover:text-[#1F2D5C]" aria-label="Beranda">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                        </svg>
                    </Link>
                    {breadcrumb.map((item, i) => (
                        <span key={i} className="flex items-center gap-3">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M9 6l6 6-6 6" />
                            </svg>
                            <span className={i === breadcrumb.length - 1 ? 'text-gray-600' : ''}>{item}</span>
                        </span>
                    ))}
                </nav>

                <div className="px-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5B86DB] text-lg font-medium text-white">
                        {inisial}
                    </div>
                </div>
            </header>

            <div className="flex min-h-0 flex-1">
                {sidebar && (
                    <aside className="flex w-56 shrink-0 flex-col overflow-y-auto bg-[#2E3F85] p-6 text-white">
                        {sidebar}
                    </aside>
                )}
                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#C3E1F6] via-[#8DB5E8] to-[#5B86DB]">
                    {children}
                </main>
            </div>
        </div>
    );
}
