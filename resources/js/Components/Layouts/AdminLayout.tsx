import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

interface AdminLayoutProps {
    judul: string;
}

// Kerangka halaman admin: menu, tombol Keluar, dan pesan flash dari backend. Belum didesain (tugas tim FE).
export default function AdminLayout({ judul, children }: PropsWithChildren<AdminLayoutProps>) {
    // Pesan sekali tampil dari Admin\UserController (Inertia::flash).
    const { flash } = usePage();
    const pesanSukses = typeof flash.sukses === 'string' ? flash.sukses : null;
    const pesanError = typeof flash.error === 'string' ? flash.error : null;

    const kelasMenu = (aktif: boolean) => (aktif ? 'font-semibold text-gray-900' : 'text-gray-500 hover:text-gray-900');

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <nav className="flex gap-6 text-sm">
                        <Link href={route('admin.index')} className={kelasMenu(route().current('admin.index'))}>
                            Dashboard
                        </Link>
                        <Link href={route('admin.user.index')} className={kelasMenu(route().current('admin.user.*'))}>
                            Daftar User
                        </Link>
                    </nav>

                    <Link href={route('logout')} method="post" as="button" className="text-sm text-gray-500 hover:text-gray-900">
                        Keluar
                    </Link>
                </div>

                <h1 className="text-2xl font-bold text-gray-800">{judul}</h1>

                {pesanSukses && <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-700">{pesanSukses}</p>}
                {pesanError && <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{pesanError}</p>}

                {children}
            </div>
        </div>
    );
}
