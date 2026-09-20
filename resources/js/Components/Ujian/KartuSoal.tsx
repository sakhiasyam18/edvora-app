interface KartuSoalProps {
    // Nanti tim backend akan menambahkan definisi data di sini
    label?: string; 
}

export default function KartuSoal({ label = "Komponen KartuSoal" }: KartuSoalProps) {
    return (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{label}</h3>
            
            {/* Tempat temanmu mendesain komponen nanti */}
            <div className="p-4 border border-dashed border-gray-300 rounded text-center text-gray-400">
                Area UI Komponen
            </div>
        </div>
    );
}
