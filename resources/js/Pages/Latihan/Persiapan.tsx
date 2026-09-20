import { Head } from '@inertiajs/react';
import MainLayout from '@/Components/Layouts/MainLayout';

interface PersiapanProps {
    title?: string;
}

export default function Persiapan({ title = "Persiapan Latihan (Mode Simulasi / Fleksibel)" }: PersiapanProps) {
    return (
        <MainLayout>
            <Head title={title} />
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-6 text-gray-900 font-semibold text-xl border-b">{title}</div>
                <div className="p-6 text-gray-600">
                    <p>Halaman ini disiapkan untuk area Latihan Persiapan.</p>
                </div>
            </div>
        </MainLayout>
    );
}
