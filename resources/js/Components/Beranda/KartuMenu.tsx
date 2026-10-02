import { Link } from '@inertiajs/react';

interface KartuMenuProps {
    href: string;
    judul: string;
    keterangan: string;
    ikon: string; // berkas ikon dari desain
    kelasIkon: string; // ukuran ikon, persis seperti di desain
    kelasLatarIkon: string; // warna lingkaran latar ikon dari token siswa.*
    prefetch?: boolean;
}

/** Kartu pintasan besar di Beranda (Latihan Soal dan Try Out). */
export default function KartuMenu({ href, judul, keterangan, ikon, kelasIkon, kelasLatarIkon, prefetch }: KartuMenuProps) {
    return (
        <Link
            href={href}
            prefetch={prefetch}
            className="group relative flex min-h-[196px] flex-col rounded-kartu bg-white px-[26px] pb-[21px] pt-4 shadow-kartu transition duration-200 hover:-translate-y-1 hover:shadow-xl"
        >
            <span className={`flex h-[65px] w-[65px] items-center justify-center rounded-full ${kelasLatarIkon}`}>
                <img src={ikon} alt="" className={`${kelasIkon} object-contain`} />
            </span>

            <h2 className="mt-[3px] text-[18px] font-semibold leading-[33px] text-siswa-judul-kartu">{judul}</h2>

            {/* pr: ruang untuk tombol panah di pojok kanan bawah. Selebihnya teks memakai lebar kartu. */}
            <p className="-mt-0.5 pr-[70px] text-[14px] font-normal leading-[20px] text-siswa-teks">{keterangan}</p>

            <img
                src="/images/ikon/tombol-maju.png"
                alt=""
                className="absolute bottom-[13px] right-[25px] h-[43.303px] w-[43.303px] object-contain transition group-hover:translate-x-2"
            />
        </Link>
    );
}
