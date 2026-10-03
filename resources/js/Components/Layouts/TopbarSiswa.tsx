import { Link } from '@inertiajs/react';

// 1. Tambahkan interface untuk mendefinisikan props baru
interface TopbarSiswaProps {
    inisial: string;
    isAkunPribadi: boolean;
}

/**
 * Topbar halaman siswa: pintasan ke Beranda di kiri dan avatar pengguna di kanan.
 * Tautan avatar tetap menuju Akun Pribadi seperti sebelumnya; panah hanya penanda desain.
 */
// 2. Tambahkan isAkunPribadi ke dalam parameter fungsi
export default function TopbarSiswa({ inisial, isAkunPribadi }: TopbarSiswaProps) {
    return (
        <header className="flex h-[60px] shrink-0 items-center justify-between bg-white px-6 font-poppins shadow-kartu md:pl-[52px] md:pr-[38px]">
            <Link href={route('dashboard')} aria-label="Beranda">
                {/* 3. Logika pergantian ikon */}
                {isAkunPribadi ? (
                    // Ikon saat berada di halaman Akun Pribadi (menggunakan SVG User)
                    <div className="flex h-[33.939px] w-[33.939px] items-center justify-center rounded-full bg-[#E8EDF5]">
                        <svg className="h-5 w-5 text-[#A3AED0]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                ) : (
                    // Ikon gambar Beranda asli Anda
                    <img src="/images/ikon/topbar-beranda.png" alt="" className="h-[33.939px] w-[33.939px] object-contain" />
                )}
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