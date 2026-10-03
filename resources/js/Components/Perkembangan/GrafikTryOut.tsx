import { formatWaktuWib } from '@/lib/waktu';

export interface TitikTryOut {
    nomor: number; // "TO n", dari urutan semua Try Out siswa
    judul: string;
    selesaiPada: string; // ISO
    skor: number;
}

// Ukuran kanvas SVG. Grafik tampil selebar card lewat kelas w-full.
const LEBAR = 600;
const TINGGI = 240;
const KIRI = 44; // ruang label sumbu Y
const KANAN = 16;
const ATAS = 12;
const BAWAH = 28; // ruang label sumbu X
const SKOR_MAKS = 1000; // skala skor UTBK (SDD 5.3.5)
const GARIS_BANTU = [0, 200, 400, 600, 800, 1000];

/**
 * Tren skor Try Out (UCS4: line chart). Sumbu Y tetap 0–1000 supaya kenaikan kecil tidak tampak dramatis.
 * Titik berjarak sama karena yang dibandingkan adalah urutan Try Out, bukan jarak waktunya.
 * Susunan dasar tanpa library; bisa diganti library grafik tanpa mengubah props.
 */
export default function GrafikTryOut({ titik }: { titik: TitikTryOut[] }) {
    const lebarArea = LEBAR - KIRI - KANAN;
    const tinggiArea = TINGGI - ATAS - BAWAH;
    // Satu titik diletakkan di tengah; selebihnya dibagi rata dari kiri ke kanan.
    const x = (i: number) => KIRI + (titik.length === 1 ? lebarArea / 2 : (i * lebarArea) / (titik.length - 1));
    const y = (skor: number) => ATAS + tinggiArea * (1 - Math.min(Math.max(skor, 0), SKOR_MAKS) / SKOR_MAKS);

    return (
        <svg viewBox={`0 0 ${LEBAR} ${TINGGI}`} className="w-full" role="img" aria-label="Grafik skor Try Out">
            {GARIS_BANTU.map((nilai) => (
                <g key={nilai}>
                    <line x1={KIRI} x2={LEBAR - KANAN} y1={y(nilai)} y2={y(nilai)} strokeDasharray="4 4" className="stroke-gray-200" />
                    <text x={KIRI - 8} y={y(nilai)} textAnchor="end" dominantBaseline="middle" fontSize="11" className="fill-gray-500">
                        {nilai}
                    </text>
                </g>
            ))}

            {titik.length > 1 && (
                <polyline
                    points={titik.map((t, i) => `${x(i)},${y(t.skor)}`).join(' ')}
                    fill="none"
                    strokeWidth="2"
                    className="stroke-edvora-primary"
                />
            )}

            {titik.map((t, i) => (
                <g key={t.nomor}>
                    <circle cx={x(i)} cy={y(t.skor)} r="5" className="fill-edvora-primary">
                        <title>{`${t.judul} · ${formatWaktuWib(t.selesaiPada)} · Skor ${Math.round(t.skor)}`}</title>
                    </circle>
                    <text x={x(i)} y={TINGGI - 8} textAnchor="middle" fontSize="11" className="fill-gray-500">
                        TO {t.nomor}
                    </text>
                </g>
            ))}
        </svg>
    );
}
