import { Head } from '@inertiajs/react';

interface ArenaBattleProps {
    // Nanti tim backend akan menambahkan definisi data di sini
    judul?: string; 
}

export default function ArenaBattle({ judul = "ArenaBattle" }: ArenaBattleProps) {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <Head title="ArenaBattle" />
            
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-4">
                    ArenaBattle - {judul}
                </h1>
                
                {/* Tempat temanmu mendesain tampilan nanti */}
                <div className="p-4 border border-dashed border-gray-300 rounded text-center text-gray-400">
                    Area konten ArenaBattle akan diletakkan di sini
                </div>
            </div>
        </div>
    );
}
