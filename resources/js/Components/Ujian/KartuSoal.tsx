import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { Soal } from '@/types/latihan';

// Pecah teks jadi bagian biasa dan bagian $...$ yang dirender KaTeX.
export function TeksMatematika({ teks }: { teks: string }) {
    const bagian = teks.split(/(\$[^$]+\$)/g);

    return (
        <>
            {bagian.map((potongan, i) =>
                potongan.startsWith('$') && potongan.endsWith('$') && potongan.length > 1 ? (
                    <InlineMath key={i} math={potongan.slice(1, -1)} renderError={() => <span>{potongan}</span>} />
                ) : (
                    <span key={i} className="whitespace-pre-line">{potongan}</span>
                ),
            )}
        </>
    );
}

interface KartuSoalProps {
    nomor: number;
    teksSoal: Soal['teks_soal'];
    gambarUrl?: Soal['gambar_soal'] | null;
}

export default function KartuSoal({ nomor, teksSoal, gambarUrl }: KartuSoalProps) {
    return (
        <div>
            <span className="inline-block rounded-lg border border-gray-300 bg-white px-3 py-1 text-lg font-medium text-[#1F2D5C] shadow-sm">
                Soal Nomor {nomor}
            </span>

            {gambarUrl && (
                <img src={gambarUrl} alt={`Ilustrasi soal nomor ${nomor}`} className="mt-4 max-h-72 max-w-full rounded-lg border border-gray-200 bg-white" />
            )}

            <p className="mt-3 text-lg font-semibold leading-relaxed text-[#1F2D5C]">
                <TeksMatematika teks={teksSoal} />
            </p>
        </div>
    );
}
