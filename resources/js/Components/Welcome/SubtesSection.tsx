import JudulBagian from './JudulBagian';
import Muncul from './Muncul';

// Tujuh subtes UTBK; warna lingkaran sama dengan kartu Pilih Subtes di aplikasi.
const SUBTES = [
    { kode: 'PU', nama: 'Penalaran Umum', warna: 'bg-subtes-pu' },
    { kode: 'PPU', nama: 'Pengetahuan dan Pemahaman Umum', warna: 'bg-subtes-ppu' },
    { kode: 'PBM', nama: 'Pemahaman Baca dan Menulis', warna: 'bg-subtes-pbm' },
    { kode: 'PK', nama: 'Pengetahuan Kuantitatif', warna: 'bg-subtes-pk' },
    { kode: 'LBI', nama: 'Literasi dalam Bahasa Indonesia', warna: 'bg-subtes-lbi' },
    { kode: 'LBE', nama: 'Literasi dalam Bahasa Inggris', warna: 'bg-subtes-lbe' },
    { kode: 'PM', nama: 'Penalaran Matematika', warna: 'bg-subtes-pm' },
];

export default function SubtesSection() {
    return (
        <section id="subtes" className="scroll-mt-20 bg-white py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
                <Muncul>
                    <JudulBagian
                        label="Materi"
                        judul="Lengkap untuk 7 subtes UTBK"
                        pengantar="Latihan dan Try Out mencakup seluruh subtes Tes Potensi Skolastik, Literasi, dan Penalaran Matematika."
                    />
                </Muncul>

                <div className="mt-12 flex flex-wrap justify-center gap-4">
                    {SUBTES.map((s, i) => (
                        <Muncul key={s.kode} jeda={i * 70} className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]">
                            <div className="flex h-full items-center gap-4 rounded-kartu border border-siswa-garis-halus bg-white px-5 py-4 transition duration-300 hover:-translate-y-1 hover:shadow-kartu">
                                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white shadow-panel ${s.warna}`}>
                                    {s.kode}
                                </span>
                                <span className="text-[14px] font-medium leading-snug text-siswa-judul-seksi">{s.nama}</span>
                            </div>
                        </Muncul>
                    ))}
                </div>
            </div>
        </section>
    );
}
