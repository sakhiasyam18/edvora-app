import { LabelPenguasaan, TopikPenguasaan } from '@/types/latihan';

// Sama dengan Penguasaan::JENDELA di backend: skor baru ada setelah 20 soal terakhir di topik terkumpul.
const JENDELA = 20;

export const TEKS_LABEL: Record<LabelPenguasaan, string> = {
    belum_cukup_data: 'Belum cukup data',
    belum_dikuasai: 'Belum dikuasai',
    berkembang: 'Berkembang',
    dikuasai: 'Dikuasai',
};

// Satu desimal supaya batas naik (> 75) dan turun (< 30) terbaca: 75,0 belum naik, 75,4 naik; 29,8 turun, 30,0 tetap.
// Skor dari 20 jawaban berbobot tidak pernah berada di antara 75 dan 75,4 atau di antara 29,9 dan 30, jadi pembulatan aman.
export function keteranganSkor(topik: Pick<TopikPenguasaan, 'skor' | 'nJendela'>): string {
    if (topik.skor === null) {
        return `${topik.nJendela} dari ${JENDELA} soal`;
    }

    return `Skor ${topik.skor.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

interface LingkaranTahapProps {
    topik: Pick<TopikPenguasaan, 'tahap' | 'isiLingkaran' | 'label'>;
    ukuran?: number;
}

/**
 * Angka tahap dengan lingkaran yang terisi menuju batas naik tahap (skor / 75).
 * Selama skor belum ada lingkarannya kosong; pakai keteranganSkor() untuk teks "n dari 20 soal".
 */
export default function LingkaranTahap({ topik, ukuran = 44 }: LingkaranTahapProps) {
    const jariJari = 16;
    const keliling = 2 * Math.PI * jariJari;
    const isi = topik.isiLingkaran ?? 0;

    return (
        <svg width={ukuran} height={ukuran} viewBox="0 0 40 40" role="img" aria-label={`Tahap ${topik.tahap}, ${TEKS_LABEL[topik.label]}`}>
            <circle cx="20" cy="20" r={jariJari} fill="none" stroke="#E5ECF6" strokeWidth="4" />
            {/* Ujung bulat tetap menggambar titik walau panjangnya 0, jadi busur hanya dipasang bila ada isinya. */}
            {isi > 0 && (
                <circle
                    cx="20"
                    cy="20"
                    r={jariJari}
                    fill="none"
                    stroke={topik.label === 'dikuasai' ? '#6BAF4E' : '#5B86DB'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={keliling}
                    strokeDashoffset={keliling * (1 - isi)}
                    transform="rotate(-90 20 20)"
                />
            )}
            <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1F2D5C">
                {topik.tahap}
            </text>
        </svg>
    );
}
