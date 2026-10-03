import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { pecahTeksMatematika } from '@/lib/teksMatematika';
import { Soal } from '@/types/latihan';

// Teks biasa ditampilkan apa adanya; rumus di antara $...$ dirender KaTeX. Aturan $ ada di lib/teksMatematika.
// Rumus yang gagal dirender ditampilkan mentah; importer sudah menolak rumus seperti itu sebelum masuk database.
export function TeksMatematika({ teks }: { teks: string }) {
    return (
        <>
            {pecahTeksMatematika(teks).map((bagian, i) =>
                bagian.rumus ? (
                    <InlineMath key={i} math={bagian.isi} renderError={() => <span>{`$${bagian.isi}$`}</span>} />
                ) : (
                    <span key={i} className="whitespace-pre-line">{bagian.isi}</span>
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
