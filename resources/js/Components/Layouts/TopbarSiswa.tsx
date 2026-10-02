import { Link } from '@inertiajs/react';

/**
 * Topbar halaman siswa: pintasan ke Beranda di kiri dan avatar pengguna di kanan.
 * Tautan avatar tetap menuju Akun Pribadi seperti sebelumnya; panah hanya penanda desain.
 */
export default function TopbarSiswa({ inisial }: { inisial: string }) {
    return (
        <header className="flex h-[60px] shrink-0 items-center justify-between bg-white px-6 font-poppins shadow-kartu md:pl-[52px] md:pr-[38px]">
            <Link href={route('dashboard')} aria-label="Beranda">
                <img src="/images/ikon/topbar-beranda.png" alt="" className="h-[33.939px] w-[33.939px] object-contain" />
            </Link>

            <Link href={route('akun.profil.utama')} className="flex items-center gap-4" aria-label="Akun Pribadi">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-edvora-primary text-[24px] font-normal leading-none text-white transition hover:bg-edvora-primary-hover">
                    {inisial}
                </span>
                <img src="/images/ikon/panah-bawah.png" alt="" className="h-[19.542px] w-[19.542px] object-contain" />
            </Link>
        </header>
    );
}
