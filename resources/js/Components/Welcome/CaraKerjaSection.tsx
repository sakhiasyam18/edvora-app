import JudulBagian from './JudulBagian';
import Muncul from './Muncul';

// Alur memakai EDVORA, sesuai urutan di aplikasi.
const LANGKAH = [
    { judul: 'Daftar & isi biodata', teks: 'Buat akun dengan email, lalu isi kelas serta universitas dan prodi tujuanmu.' },
    { judul: 'Pilih subtes & mode', teks: 'Tentukan subtes, pilih mode latihan, lalu atur topik dan jumlah soal sesuai kebutuhan.' },
    { judul: 'Kerjakan & pelajari', teks: 'Jawab soal, lihat pembahasannya, dan ulangi soal yang salah lewat mode Remedial.' },
    { judul: 'Ukur kesiapanmu', teks: 'Ikuti Try Out, lihat skor dan peringkat, lalu pantau perkembanganmu dari waktu ke waktu.' },
];

export default function CaraKerjaSection() {
    return (
        <section id="cara-kerja" className="scroll-mt-20 bg-gradient-to-b from-white to-siswa-laman-awal py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
                <Muncul>
                    <JudulBagian label="Cara Kerja" judul="Empat langkah mulai belajar" />
                </Muncul>

                <ol className="relative mt-14 grid gap-8 md:grid-cols-4 md:gap-6">
                    {/* Garis penghubung antar-langkah di layar lebar. */}
                    <span aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-0.5 bg-gradient-to-r from-edvora-primary/20 via-edvora-primary/50 to-edvora-primary/20 md:block" />

                    {LANGKAH.map((l, i) => (
                        <li key={l.judul}>
                            <Muncul jeda={i * 130} className="flex flex-col items-center text-center">
                                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-ujian-biru text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(91,136,221,0.35)] ring-4 ring-white">
                                    {i + 1}
                                </span>
                                <h3 className="mt-4 text-[16px] font-semibold text-siswa-judul">{l.judul}</h3>
                                <p className="mt-2 max-w-[240px] text-[14px] leading-relaxed text-siswa-teks">{l.teks}</p>
                            </Muncul>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
