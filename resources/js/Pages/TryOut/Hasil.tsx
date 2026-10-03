import { ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import KartuStat from '@/Components/Beranda/KartuStat';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import { warnaSubtes } from '@/Components/Latihan/KartuSubtes';
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
// jadi angka dan bilahnya memakai jumlah benar dari jumlah soal. Warna lencana sama dengan kartu Pilih Subtes.
function KartuSubtes({ subtes, urutan }: { subtes: HasilSubtesTryOut; urutan: number }) {
    const kode = singkatan(subtes.nama);
    const persen = subtes.jumlahSoal > 0 ? (subtes.benar / subtes.jumlahSoal) * 100 : 0;

    return (
        <div
            className="animate-muncul-halus rounded-subtes border border-siswa-garis-halus bg-white px-4 py-3.5 transition duration-200 [animation-fill-mode:both] hover:-translate-y-0.5 hover:shadow-kartu"
            style={{ animationDelay: `${150 + urutan * 60}ms` }}
        >
            <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${warnaSubtes(kode).lingkaran}`}>
                    {kode || '–'}
                </span>
                <p className="min-w-0 flex-1 text-[15px] font-medium leading-tight text-siswa-judul">{subtes.nama}</p>
                <span className="shrink-0 text-[16px] font-semibold text-siswa-judul">
                    {subtes.benar}
                    <span className="text-[13px] font-medium text-siswa-teks">/{subtes.jumlahSoal}</span>
                </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-siswa-panel-fleksibel">
                <div className="h-full rounded-full bg-ujian-biru transition-[width] duration-700 ease-out" style={{ width: `${persen}%` }} />
            </div>

            <p className="mt-2 text-[11px] leading-4">
                <span className="text-siswa-umpan-benar-teks">{subtes.benar} Benar</span>
                <span className="text-siswa-teks-redup"> · </span>
                <span className="text-siswa-umpan-salah-teks">{subtes.salah} Salah</span>
                <span className="text-siswa-teks"> · {subtes.kosong} Kosong</span>
            </p>
        </div>
    );
}

const kelasTombol = 'flex h-10 items-center justify-center gap-2 rounded-[10px] text-sm font-semibold shadow-panel transition duration-200';

export default function Hasil({ paket, ditutup, skorTotal, perSubtes, xp, poin }: HasilProps) {
    return (
        <>
            <Head title={`Hasil ${paket.judul} - EDVORA`} />

            {/* Ukuran huruf, kartu, dan jarak mengikuti Beranda supaya halaman siswa terasa satu keluarga. */}
            <div className="w-full space-y-4 font-poppins text-siswa-judul">
                {/* Banner judul: gaya sama dengan banner sapaan Beranda, XP dan Poin memakai kotak angka yang sama. */}
                <section className="flex min-h-[83px] animate-muncul-halus flex-wrap items-center justify-between gap-4 rounded-kartu bg-gradient-to-l from-siswa-banner-awal to-siswa-banner-akhir px-[26px] py-4 shadow-kartu">
                    <div className="min-w-0">
                        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-white/85">Hasil Evaluasi Try Out</p>
                        <h1 className="mt-0.5 text-[24px] font-semibold leading-tight text-white">{paket.judul}</h1>
                        <p className="mt-1 text-[13px] leading-tight text-white/90">
                            {skorTotal === null
                                ? `Skor IRT dan peringkat muncul setelah periode berakhir, ${formatWaktuWib(paket.selesaiAt)}.`
                                : `Skor IRT: ${skorTotal.toLocaleString('id-ID')} dari 1000`}
                        </p>
                    </div>

                    <dl className="flex shrink-0 gap-4">
                        <KartuStat label="XP" nilai={xp} awalan="+" />
                        <KartuStat label="Poin" nilai={poin} awalan="+" />
                    </dl>
                </section>

                {/* Rincian per subtes */}
                <section className="animate-muncul-halus rounded-kartu bg-white px-[26px] py-[14px] pb-6 shadow-kartu [animation-delay:80ms] [animation-fill-mode:both]">
                    <h2 className="text-[18px] font-semibold leading-[33px] text-siswa-judul-seksi">Rincian</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {perSubtes.map((s, i) => (
                            <KartuSubtes key={s.id} subtes={s} urutan={i} />
                        ))}
                    </div>
                </section>

                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <Link href={route('tryout.index')} className={`${kelasTombol} bg-ujian-biru text-white hover:-translate-y-0.5 hover:shadow-md`}>
                        &larr; Kembali ke Menu
                    </Link>
                    {/* Pembahasan baru dibuka setelah paket ditutup (T15); halamannya dibuat bersama IRT. */}
                    <div>
                        <button
                            type="button"
                            disabled
                            title={ditutup ? 'Segera hadir' : 'Tersedia setelah periode berakhir'}
                            className={`${kelasTombol} w-full cursor-not-allowed bg-siswa-ujian-redup text-white/90 shadow-none`}
                        >
                            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5zM12 6v14" />
                            </svg>
                            Lihat Pembahasan
                        </button>
                        <p className="mt-1.5 text-center text-[11px] text-siswa-teks sm:text-right">
                            {ditutup ? 'Pembahasan segera hadir.' : 'Pembahasan tersedia setelah periode berakhir.'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah ke halaman siswa lain.
Hasil.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
