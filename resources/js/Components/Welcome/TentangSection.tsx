import JudulBagian from './JudulBagian';
import Muncul from './Muncul';

// Nilai yang dipegang EDVORA, sesuai cara kerja aplikasi (latihan bertahap, penilaian, pemantauan).
const NILAI = [
    {
        judul: 'Terarah',
        teks: 'Topik dan tingkat kesulitan soal menyesuaikan penguasaanmu, jadi waktu belajar dipakai untuk bagian yang paling perlu.',
        ikon: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 100 8 4 4 0 000-8z" />,
    },
    {
        judul: 'Terukur',
        teks: 'Setiap latihan dan Try Out tercatat. Skor, penguasaan topik, dan perkembanganmu bisa dilihat kapan saja.',
        ikon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    },
    {
        judul: 'Menyenangkan',
        teks: 'XP, poin, dan level membuat proses belajar terasa seperti perjalanan yang bisa kamu ikuti kemajuannya.',
        ikon: <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />,
    },
];

export default function TentangSection() {
    return (
        <section id="tentang" className="scroll-mt-20 bg-white py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
                <Muncul>
                    <JudulBagian
                        label="Tentang EDVORA"
                        judul="Teman belajar menuju PTN impian"
                        pengantar="EDVORA adalah platform persiapan UTBK yang menggabungkan latihan soal, Try Out, dan pemantauan perkembangan belajar. Tujuannya sederhana: membantu setiap siswa tahu apa yang sudah dikuasai, apa yang perlu dilatih, dan seberapa siap menghadapi ujian."
                    />
                </Muncul>

                <div className="mt-14 grid gap-5 md:grid-cols-3">
                    {NILAI.map((n, i) => (
                        <Muncul key={n.judul} jeda={i * 120}>
                            <div className="h-full rounded-kartu border border-siswa-garis-halus bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-edvora-primary/40 hover:shadow-kartu">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-siswa-panel-fleksibel text-edvora-primary">
                                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        {n.ikon}
                                    </svg>
                                </span>
                                <h3 className="mt-5 text-[18px] font-semibold text-siswa-judul">{n.judul}</h3>
                                <p className="mt-2 text-[14px] leading-relaxed text-siswa-teks">{n.teks}</p>
                            </div>
                        </Muncul>
                    ))}
                </div>
            </div>
        </section>
    );
}
