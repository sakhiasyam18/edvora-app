import { useEffect, useRef, useState } from 'react';
import { formatWaktuWib } from '@/lib/waktu';

export interface TitikTryOut {
    nomor: number; // "TO n", dari urutan semua Try Out siswa
    judul: string;
    selesaiPada: string; // ISO
    skor: number;
}

// Tinggi kanvas tetap; lebarnya mengikuti lebar card (diukur), jadi huruf dan titik tidak ikut membesar di layar lebar.
const TINGGI = 260;
const KIRI = 44; // ruang label sumbu Y
const KANAN = 20;
const ATAS = 22; // ruang label skor di atas titik tertinggi
const BAWAH = 28; // ruang label sumbu X
const SKOR_MAKS = 1000; // skala skor UTBK (SDD 5.3.5)
const GARIS_BANTU = [0, 200, 400, 600, 800, 1000];

/**
 * Tren skor Try Out (UCS4: line chart). Sumbu Y tetap 0–1000 supaya kenaikan kecil tidak tampak dramatis.
 * Titik berjarak sama karena yang dibandingkan adalah urutan Try Out, bukan jarak waktunya.
 * Susunan dasar tanpa library; bisa diganti library grafik tanpa mengubah props.
 */
export default function GrafikTryOut({ titik }: { titik: TitikTryOut[] }) {
    const wadah = useRef<HTMLDivElement>(null);
    const [lebar, setLebar] = useState(600);

    // Ukur lebar card supaya satu satuan SVG = satu piksel layar.
    useEffect(() => {
        const el = wadah.current;
        if (!el) return;
        const ukur = () => setLebar(Math.max(280, el.clientWidth));
        ukur();
        const pengamat = new ResizeObserver(ukur);
        pengamat.observe(el);
        return () => pengamat.disconnect();
    }, []);

    const lebarArea = lebar - KIRI - KANAN;
    const tinggiArea = TINGGI - ATAS - BAWAH;
    // Satu titik diletakkan di tengah; selebihnya dibagi rata dari kiri ke kanan.
    const x = (i: number) => KIRI + (titik.length === 1 ? lebarArea / 2 : (i * lebarArea) / (titik.length - 1));
    const y = (skor: number) => ATAS + tinggiArea * (1 - Math.min(Math.max(skor, 0), SKOR_MAKS) / SKOR_MAKS);

    const titikGaris = titik.map((t, i) => `${x(i)},${y(t.skor)}`).join(' ');
    // Area di bawah garis: dari titik pertama, sepanjang garis, lalu turun ke sumbu X.
    const area = titik.length > 1 ? `${x(0)},${y(0)} ${titikGaris} ${x(titik.length - 1)},${y(0)}` : '';

    return (
        <div ref={wadah} className="w-full">
            <svg width="100%" height={TINGGI} viewBox={`0 0 ${lebar} ${TINGGI}`} role="img" aria-label="Grafik skor Try Out" className="overflow-visible font-poppins">
                <defs>
                    <linearGradient id="grafik-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#5B88DD" stopOpacity="0.22" />
                        <stop offset="1" stopColor="#5B88DD" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {GARIS_BANTU.map((nilai) => (
                    <g key={nilai}>
                        <line x1={KIRI} x2={lebar - KANAN} y1={y(nilai)} y2={y(nilai)} strokeDasharray="4 4" className="stroke-siswa-garis-halus" />
                        <text x={KIRI - 10} y={y(nilai)} textAnchor="end" dominantBaseline="middle" fontSize="11" className="fill-siswa-teks">
                            {nilai}
                        </text>
                    </g>
                ))}

                {titik.length > 1 && (
                    <>
                        <polygon points={area} fill="url(#grafik-area)" className="animate-muncul-halus" />
                        {/* Garis tergambar pelan dari kiri ke kanan (pathLength 1 + dash). */}
                        <polyline
                            points={titikGaris}
                            fill="none"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength={1}
                            className="stroke-edvora-primary [stroke-dasharray:1] [stroke-dashoffset:1] motion-safe:animate-gambar-garis motion-reduce:[stroke-dashoffset:0]"
                        />
                    </>
                )}

                {titik.map((t, i) => (
                    <g key={t.nomor} className="animate-muncul-halus [animation-fill-mode:both]" style={{ animationDelay: `${300 + i * 120}ms` }}>
                        <text x={x(i)} y={y(t.skor) - 12} textAnchor="middle" fontSize="11" fontWeight="600" className="fill-siswa-judul">
                            {Math.round(t.skor)}
                        </text>
                        <circle cx={x(i)} cy={y(t.skor)} r="6" className="fill-white stroke-edvora-primary" strokeWidth="2.5">
                            <title>{`${t.judul} · ${formatWaktuWib(t.selesaiPada)} · Skor ${Math.round(t.skor)}`}</title>
                        </circle>
                        <text x={x(i)} y={TINGGI - 8} textAnchor="middle" fontSize="11" className="fill-siswa-teks">
                            TO {t.nomor}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}
