import { ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import { formatWaktuWib } from '@/lib/waktu';
import { HasilSubtesTryOut } from '@/types/tryout';

interface HasilProps {
    paket: { id: string; judul: string; selesaiAt: string };
    ditutup: boolean;
    skorTotal: number | null; // null sampai skor IRT dihitung setelah paket ditutup
    perSubtes: HasilSubtesTryOut[];
    xp: number;
    poin: number;
}

// Singkatan subtes dari huruf depan kata berhuruf kapital: "Pengetahuan dan Pemahaman Umum" → "PPU".
function singkatan(nama: string): string {
    return nama
        .split(/\s+/)
        .filter((kata) => /^[A-Z]/.test(kata))
        .map((kata) => kata[0])
        .join('');
}

// Satu kartu subtes di bagian Rincian (Figma: Hasil Try Out). Skor IRT per subtes belum dikirim server,
// jadi angka besar dan bilahnya memakai jumlah benar dari jumlah soal.
function KartuSubtes({ subtes, urutan }: { subtes: HasilSubtesTryOut; urutan: number }) {
    const persen = subtes.jumlahSoal > 0 ? (subtes.benar / subtes.jumlahSoal) * 100 : 0;

    return (
        <div
            className="animate-muncul-halus rounded-[20px] border border-siswa-ujian-garis bg-white px-5 py-5 transition duration-200 [animation-fill-mode:both] hover:-translate-y-0.5 hover:shadow-kartu md:px-6"
            style={{ animationDelay: `${200 + urutan * 70}ms` }}
        >
            <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-edvora-primary/40 bg-siswa-panel-fleksibel px-2.5 py-0.5 text-sm font-semibold text-siswa-judul">
                    {singkatan(subtes.nama) || '–'}
                </span>
                <span className="text-xl font-semibold text-siswa-judul md:text-2xl">
                    {subtes.benar}/{subtes.jumlahSoal}
                </span>
            </div>

            <p className="mt-2 text-base text-siswa-judul md:text-lg">{subtes.nama}</p>

            <div className="mt-3 h-[18px] rounded-full border border-siswa-ujian-garis bg-siswa-panel-fleksibel p-[3px]">
                <div className="h-full rounded-full bg-siswa-judul transition-[width] duration-700 ease-out" style={{ width: `${persen}%` }} />
            </div>

            <p className="mt-2 text-xs">
                <span className="text-siswa-umpan-benar-teks">{subtes.benar} Benar</span>
                <span className="text-siswa-teks"> · </span>
                <span className="text-siswa-umpan-salah-teks">{subtes.salah} Salah</span>
                <span className="text-siswa-teks"> · {subtes.kosong} Kosong</span>
            </p>
        </div>
    );
}

const kelasTombol =
    'flex h-11 items-center justify-center gap-2 rounded-[12px] text-sm font-semibold shadow-panel transition duration-200 md:h-12 md:text-lg';

export default function Hasil({ paket, ditutup, skorTotal, perSubtes, xp, poin }: HasilProps) {
    return (
        <>
            <Head title={`Hasil ${paket.judul} - EDVORA`} />

            <div className="pt-4 font-poppins text-siswa-judul md:pt-6">
                {/* Banner judul */}
                <section className="animate-muncul-halus rounded-[20px] bg-gradient-to-r from-[#A9CBF2] to-[#6F96DD] px-6 py-6 shadow-kartu md:px-10 md:py-9">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium uppercase text-white/90">HASIL EVALUASI TRY OUT</p>
                            <h1 className="mt-1 text-2xl font-bold text-white md:text-[32px]">{paket.judul}</h1>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-white/25 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm md:text-base">+{xp} XP</span>
                            <span className="rounded-full bg-white/25 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm md:text-base">+{poin} Poin</span>
                        </div>
                    </div>

                    <p className="mt-4 text-sm font-medium text-white md:text-base">
                        {skorTotal === null
                            ? `Skor IRT dan peringkat muncul setelah periode berakhir, ${formatWaktuWib(paket.selesaiAt)}.`
                            : `Skor IRT: ${skorTotal.toLocaleString('id-ID')} dari 1000`}
                    </p>
                </section>

                <div className="mx-auto mt-6 max-w-[1000px] md:mt-8">
                    {/* Rincian per subtes */}
                    <section className="animate-muncul-halus rounded-[20px] bg-white px-5 py-6 shadow-kartu [animation-delay:100ms] [animation-fill-mode:both] md:px-10 md:py-8">
                        <h2 className="text-xl font-semibold uppercase text-siswa-judul md:text-[28px]">RINCIAN</h2>
                        <div className="mt-5 grid gap-4 md:grid-cols-2 md:gap-5">
                            {perSubtes.map((s, i) => (
                                // Kartu terakhir yang sendirian di barisnya diletakkan di tengah, seperti di desain.
                                <div key={s.id} className={i === perSubtes.length - 1 && perSubtes.length % 2 === 1 ? 'md:col-span-2 md:mx-auto md:w-[calc(50%-10px)]' : ''}>
                                    <KartuSubtes subtes={s} urutan={i} />
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 md:mt-8 md:gap-5">
                        <Link href={route('tryout.index')} className={`${kelasTombol} bg-ujian-biru text-white hover:-translate-y-0.5 hover:shadow-md`}>
                            &larr; Kembali ke Menu
                        </Link>
                        {/* Pembahasan baru dibuka setelah paket ditutup (T15); halamannya dibuat bersama IRT. */}
                        <button
                            type="button"
                            disabled
                            title={ditutup ? 'Segera hadir' : 'Tersedia setelah periode berakhir'}
                            className={`${kelasTombol} cursor-not-allowed bg-siswa-ujian-redup text-white/90 shadow-none`}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5zM12 6v14" />
                            </svg>
                            Lihat Pembahasan
                        </button>
                    </div>
                    <p className="mt-2 text-right text-xs font-medium text-siswa-teks">
                        {ditutup ? 'Pembahasan segera hadir.' : 'Pembahasan tersedia setelah periode berakhir.'}
                    </p>
                </div>
            </div>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah ke halaman siswa lain.
Hasil.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
