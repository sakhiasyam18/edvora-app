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

// Kartu putih berisi teks soal; nomor soal ditampilkan di judul ArenaPengerjaan ("Soal 3 dari 5").
export default function KartuSoal({ nomor, teksSoal, gambarUrl }: KartuSoalProps) {
    return (
        <div className="rounded-[14px] bg-white px-5 py-4 shadow-kartu md:px-6 md:py-5">
            {gambarUrl && (
                <img src={gambarUrl} alt={`Ilustrasi soal nomor ${nomor}`} className="mb-4 max-h-72 max-w-full rounded-lg border border-siswa-ujian-garis bg-white" />
            )}

            <p className="text-[13px] leading-[26px] text-siswa-judul md:text-sm md:leading-7">
                <TeksMatematika teks={teksSoal} />
            </p>
        </div>
    );
}
