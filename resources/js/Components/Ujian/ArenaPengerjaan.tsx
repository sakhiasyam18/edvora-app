import { ReactNode } from 'react';

interface ArenaPengerjaanProps {
    children: ReactNode;
    navigasiSoal: ReactNode;
}

export default function ArenaPengerjaan({ children, navigasiSoal }: ArenaPengerjaanProps) {
    return (
        <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-3/4 bg-white p-6 rounded-lg shadow-sm">
                {children}
            </div>
            <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4">Navigasi Soal</h3>
                {navigasiSoal}
            </div>
        </div>
    );
}
