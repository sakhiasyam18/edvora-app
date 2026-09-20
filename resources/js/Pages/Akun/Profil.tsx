import { Head } from '@inertiajs/react';
import MainLayout from '@/Components/Layouts/MainLayout';

interface ProfilProps {
    title?: string;
}

export default function Profil({ title = "Profil, Biodata & Lencana" }: ProfilProps) {
    return (
        <MainLayout>
            <Head title={title} />
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-6 text-gray-900 font-semibold text-xl border-b">{title}</div>
                <div className="p-6 text-gray-600">
                    <p>Halaman ini disiapkan untuk area Akun Profil.</p>
                </div>
            </div>
        </MainLayout>
    );
}
