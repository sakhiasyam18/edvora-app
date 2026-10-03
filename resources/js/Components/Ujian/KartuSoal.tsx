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
