import { ReactNode } from 'react';

// Geometri diambil persis dari desain Figma (Group 280–286, node 641:3423):
// lingkaran 78,4121px, jari-jari luar 39,2061 dan dalam 31,3257, jadi tebal garis 7,8804.
const KOTAK = 78.4121;
const TEBAL = 7.8804;
const JARI_JARI = (KOTAK - TEBAL) / 2;
const KELILING = 2 * Math.PI * JARI_JARI;

interface CincinProgresProps {
    persen: number; // 0–100
    warnaKelas: string; // kelas stroke-* dari token siswa.*, mis. 'stroke-siswa-cincin-naik'
    ukuran?: number; // px; default mengikuti desain
    label: string; // teks untuk pembaca layar
    children?: ReactNode; // isi di tengah cincin
}

/**
 * Cincin progres umum: busur mulai dari atas lalu searah jarum jam sebesar `persen`.
 * Khusus tampilan — tidak tahu soal subtes/topik. Untuk lingkaran tahap latihan pakai LingkaranTahap.
 */
export default function CincinProgres({ persen, warnaKelas, ukuran = KOTAK, label, children }: CincinProgresProps) {
    const isi = Math.min(100, Math.max(0, persen)) / 100;

    return (
        <div className="relative shrink-0" style={{ width: ukuran, height: ukuran }}>
            <svg width={ukuran} height={ukuran} viewBox={`0 0 ${KOTAK} ${KOTAK}`} role="img" aria-label={label}>
                <circle
                    cx={KOTAK / 2}
                    cy={KOTAK / 2}
                    r={JARI_JARI}
                    fill="none"
                    strokeWidth={TEBAL}
                    className="stroke-siswa-cincin-dasar"
                />
                {/* Ujung bulat tetap menggambar titik walau panjang busurnya 0, jadi busur hanya dipasang bila ada isinya. */}
                {isi > 0 && (
                    <circle
                        cx={KOTAK / 2}
                        cy={KOTAK / 2}
                        r={JARI_JARI}
                        fill="none"
                        strokeWidth={TEBAL}
                        strokeLinecap="round"
                        strokeDasharray={KELILING}
                        strokeDashoffset={KELILING * (1 - isi)}
                        transform={`rotate(-90 ${KOTAK / 2} ${KOTAK / 2})`}
                        className={warnaKelas}
                    />
                )}
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">{children}</div>
        </div>
    );
}
