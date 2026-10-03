import { warnaSubtes } from './KartuSubtes';

interface KartuInfoSubtesProps {
    kode: string | null;
    nama: string;
    deskripsi: string | null;
    jumlahTopik: number;
}

/** Kartu ringkas subtes di puncak Pilih Mode: lingkaran kode, jumlah topik, nama, dan deskripsi. */
export default function KartuInfoSubtes({ kode, nama, deskripsi, jumlahTopik }: KartuInfoSubtesProps) {
    const warna = warnaSubtes(kode);

    return (
        <section className={`flex min-h-[126px] gap-[26px] rounded-panel border-t-[5px] bg-white pb-4 pl-[21px] pr-6 pt-[18px] shadow-kartu ${warna.garis}`}>
            <div className="flex shrink-0 flex-col items-start">
                <span className={`flex h-[58px] w-[58px] items-center justify-center rounded-full text-[18px] font-bold leading-5 text-white ${warna.lingkaran}`}>
                    {kode}
                </span>
                <span className="mt-[11px] flex items-center gap-1 text-[9px] font-medium leading-4 text-siswa-teks-redup">
                    <img src="/images/ikon/topik.png" alt="" className="h-[18.698px] w-[17.832px] object-contain" />
                    {jumlahTopik} Topik
                </span>
            </div>

            <div className="pt-[2px]">
                <h1 className="text-[24px] font-semibold leading-9 text-siswa-judul-seksi">{nama}</h1>
                <p className="mt-[5px] text-[15px] font-medium leading-4 text-siswa-teks">{deskripsi}</p>
            </div>
        </section>
    );
}
