import { Head, Link } from '@inertiajs/react';

interface AdminProps {
    // Nanti tim backend akan menambahkan definisi data di sini
    judul?: string;
}

// Halaman template tujuan admin setelah login (rute admin.index, UCS6).
export default function Admin({ judul = 'Admin' }: AdminProps) {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <Head title="Admin" />

            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Admin - {judul}</h1>

                    {/* Satu-satunya jalan keluar selama menu admin belum dibuat. */}
                    <Link href={route('logout')} method="post" as="button" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        Keluar
                    </Link>
                </div>

                {/* Tempat temanmu mendesain tampilan nanti */}
                <div className="p-4 border border-dashed border-gray-300 rounded text-center text-gray-400">
                    Area konten Admin akan diletakkan di sini
                </div>
            </div>
        </div>
    );
}
