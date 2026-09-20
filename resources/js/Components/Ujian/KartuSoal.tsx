interface KartuSoalProps {
    teksSoal: string;
    gambarUrl?: string;
}

export default function KartuSoal({ teksSoal, gambarUrl }: KartuSoalProps) {
    return (
        <div className="mb-6">
            {gambarUrl && (
                <div className="mb-4">
                    <img src={gambarUrl} alt="Ilustrasi Soal" className="max-w-full rounded-md border border-gray-200" />
                </div>
            )}
            <p className="text-gray-800 text-lg leading-relaxed">{teksSoal}</p>
        </div>
    );
}
