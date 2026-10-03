import { Link } from '@inertiajs/react';

export interface SubtesRingkas {
    id: string;
    kode: string | null;
    nama: string;
    deskripsi: string | null;
    jumlahTopik: number; // topik yang punya soal; 0 = belum bisa dikerjakan
}

// Warna per kode subtes, bukan per posisi kartu, supaya tetap benar saat urutan berubah.
// Nama kelas ditulis utuh (bukan dirangkai) supaya tetap terbaca Tailwind saat build.
// Dipakai juga oleh kartu info subtes di Pilih Mode lewat warnaSubtes().
const WARNA_SUBTES: Record<string, { garis: string; lingkaran: string }> = {
    PU: { garis: 'border-t-subtes-pu', lingkaran: 'bg-subtes-pu' },
    PPU: { garis: 'border-t-subtes-ppu', lingkaran: 'bg-subtes-ppu' },
    PBM: { garis: 'border-t-subtes-pbm', lingkaran: 'bg-subtes-pbm' },
    PK: { garis: 'border-t-subtes-pk', lingkaran: 'bg-subtes-pk' },
    LBI: { garis: 'border-t-subtes-lbi', lingkaran: 'bg-subtes-lbi' },
    LBE: { garis: 'border-t-subtes-lbe', lingkaran: 'bg-subtes-lbe' },
    PM: { garis: 'border-t-subtes-pm', lingkaran: 'bg-subtes-pm' },
};
const WARNA_CADANGAN = WARNA_SUBTES.PU;

export function warnaSubtes(kode: string | null) {
    return WARNA_SUBTES[kode ?? ''] ?? WARNA_CADANGAN;
}

const KELAS_KARTU =
    'group relative flex min-h-[167px] flex-col rounded-subtes border-t-[5px] bg-white pb-[7px] pl-[19px] pr-[15px] pt-[7px] shadow-kartu';

/**
 * Kartu satu subtes di halaman Pilih Subtes.
 * Subtes tanpa topik bersoal tampil redup dan tidak bisa dipencet.
 */
export default function KartuSubtes({ subtes }: { subtes: SubtesRingkas }) {
    const warna = warnaSubtes(subtes.kode);
    // Sama dengan aturan sebelumnya: perlu topik bersoal dan kode untuk URL Pilih Mode.
    const bisaDibuka = subtes.jumlahTopik > 0 && !!subtes.kode;

    const isi = (
        <>
            <div className="flex items-center gap-4">
                <span
                    className={`flex h-14 w-[57px] shrink-0 items-center justify-center rounded-full text-[18px] font-bold leading-5 text-white ${warna.lingkaran}`}
                >
                    {subtes.kode}
                </span>
                <h2 className="text-[16px] font-semibold leading-[22px] text-siswa-judul">{subtes.nama}</h2>
            </div>

            <p className="mt-[3px] pl-[2px] text-[13px] font-normal leading-[19px] text-siswa-teks">{subtes.deskripsi}</p>

            <div className="mt-auto flex items-center justify-between pt-2">
                <span className="flex items-center gap-1 text-[9px] font-medium leading-4 text-siswa-teks-redup">
                    <img src="/images/ikon/topik.png" alt="" className="h-[18.512px] w-[19.308px] object-contain" />
                    {bisaDibuka ? `${subtes.jumlahTopik} Topik` : 'Segera hadir'}
                </span>

                {bisaDibuka && (
                    // Berkas panah sama dengan di Beranda; desain memotongnya sedikit di atas dan bawah.
                    <span className="relative h-[29.491px] w-[32.56px] overflow-hidden transition group-hover:translate-x-2">
                        <img src="/images/ikon/tombol-maju.png" alt="" className="absolute left-0 top-[-6.96%] h-[112.99%] w-full max-w-none" />
                    </span>
                )}
            </div>
        </>
    );

    if (!bisaDibuka) {
        return (
            <div aria-disabled="true" className={`${KELAS_KARTU} ${warna.garis} cursor-not-allowed opacity-60`}>
                {isi}
            </div>
        );
    }

    return (
        <Link
            href={route('latihan.mode', { subtes: subtes.kode })}
            prefetch
            className={`${KELAS_KARTU} ${warna.garis} transition duration-200 hover:-translate-y-1 hover:shadow-xl`}
        >
            {isi}
        </Link>
    );
}
