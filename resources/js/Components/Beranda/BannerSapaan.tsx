import KartuStat from './KartuStat';

interface BannerSapaanProps {
    nama: string;
    level: number;
    poin: number;
}

/** Banner sapaan di puncak Beranda, berisi nama siswa serta Level dan Poin. */
export default function BannerSapaan({ nama, level, poin }: BannerSapaanProps) {
    return (
        <section className="flex min-h-[83px] items-center justify-between gap-4 rounded-kartu bg-gradient-to-l from-siswa-banner-awal to-siswa-banner-akhir px-[26px] py-4 shadow-kartu">
            <div>
                <h1 className="text-[24px] font-semibold leading-tight text-white">Halo, {nama}!</h1>
                <p className="mt-1 text-[15px] font-normal leading-tight text-white">Siap kejar target Drill Soal?</p>
            </div>

            <dl className="flex shrink-0 gap-6">
                <KartuStat label="Level" nilai={level} />
                <KartuStat label="Poin" nilai={poin} />
            </dl>
        </section>
    );
}
