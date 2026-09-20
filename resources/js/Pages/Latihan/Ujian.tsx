import { Head } from '@inertiajs/react';
import MainLayout from '@/Components/Layouts/MainLayout';
import ArenaPengerjaan from '@/Components/Ujian/ArenaPengerjaan';
import KartuSoal from '@/Components/Ujian/KartuSoal';

interface UjianProps {
    title?: string;
}

export default function Ujian({ title = "Mengerjakan Latihan" }: UjianProps) {
    return (
        <MainLayout>
            <Head title={title} />
            <ArenaPengerjaan
                navigasiSoal={
                    <div className="grid grid-cols-5 gap-2">
                        {[1,2,3,4,5].map(n => (
                            <button key={n} className="p-2 border rounded text-center hover:bg-gray-50">{n}</button>
                        ))}
                    </div>
                }
            >
                <h2 className="text-xl font-bold mb-4">Soal No. 1</h2>
                <KartuSoal teksSoal="Berapakah hasil dari 1 + 1?" />
                
                <div className="space-y-3 mt-8">
                    {['A', 'B', 'C', 'D', 'E'].map(opsi => (
                        <div key={opsi} className="p-3 border rounded hover:border-indigo-500 cursor-pointer">
                            Opsi {opsi}
                        </div>
                    ))}
                </div>
            </ArenaPengerjaan>
        </MainLayout>
    );
}
