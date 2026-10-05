import { ReactNode } from 'react';
import JudulBagian from './JudulBagian';
import Muncul from './Muncul';

// Fitur utama, sesuai yang tersedia di aplikasi.
const FITUR: { judul: string; teks: string; latar: string; ikon: ReactNode }[] = [
    {
        judul: 'Latihan Soal 3 Mode',
        teks: 'Mode Fleksibel untuk memilih topik dan jumlah soal, Mode Simulasi dengan waktu terbatas, dan Remedial untuk mengulang soal yang salah.',
        latar: 'bg-siswa-ikon-latihan text-edvora-primary',
        ikon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    },
    {
        judul: 'Try Out Simulasi UTBK',
        teks: 'Kerjakan semua subtes secara berurutan dengan waktu per subtes, lalu lihat skor IRT dan peringkatmu setelah periode berakhir.',
        latar: 'bg-siswa-ikon-tryout text-siswa-umpan-benar-teks',
        ikon: <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h4" />,
    },
    {
        judul: 'Pembahasan & Hint',
        teks: 'Setiap soal dilengkapi kunci jawaban dan pembahasan. Saat buntu, buka hint untuk petunjuk tanpa langsung melihat jawabannya.',
        latar: 'bg-siswa-hint-latar text-siswa-hint-teks',
        ikon: <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" />,
    },
    {
        judul: 'Perkembangan Belajar',
        teks: 'Pantau penguasaan setiap topik, grafik skor Try Out, dan rekomendasi topik yang sebaiknya dilatih berikutnya.',
        latar: 'bg-siswa-panel-fleksibel text-edvora-primary',
        ikon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    },
    {
        judul: 'Peringkat Try Out',
        teks: 'Bandingkan hasilmu dengan peserta lain secara umum, atau khusus dengan peserta yang menuju universitas dan prodi yang sama.',
        latar: 'bg-siswa-umpan-salah text-siswa-umpan-salah-teks',
        ikon: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 6h2a2 2 0 010 4h-2M7 6H5a2 2 0 000 4h2" />,
    },
    {
        judul: 'XP, Poin & Level',
        teks: 'Setiap jawaban benar menambah XP dan poin. Naik level seiring latihan, jadi semangat belajar tetap terjaga.',
        latar: 'bg-[#EDE9FE] text-[#6D4FD8]',
        ikon: <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />,
    },
];

export default function FeaturesSection() {
    return (
        <section id="fitur" className="scroll-mt-20 bg-gradient-to-b from-siswa-laman-awal to-white py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
                <Muncul>
                    <JudulBagian
                        label="Fitur"
                        judul="Semua yang kamu butuhkan untuk UTBK"
                        pengantar="Dari latihan harian sampai simulasi ujian, setiap fitur dirancang supaya persiapanmu lebih fokus dan hasilnya terlihat."
                    />
                </Muncul>

                <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {FITUR.map((f, i) => (
                        <Muncul key={f.judul} jeda={(i % 3) * 110}>
                            <article className="group h-full rounded-kartu bg-white p-7 shadow-kartu transition duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${f.latar}`}>
                                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        {f.ikon}
                                    </svg>
                                </span>
                                <h3 className="mt-5 text-[18px] font-semibold text-siswa-judul">{f.judul}</h3>
                                <p className="mt-2 text-[14px] leading-relaxed text-siswa-teks">{f.teks}</p>
                            </article>
                        </Muncul>
                    ))}
                </div>
            </div>
        </section>
    );
}
