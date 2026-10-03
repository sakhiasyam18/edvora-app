import { Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import LambangEdvora from './LambangEdvora';

interface LatihanLayoutProps {
    breadcrumb?: string[];
    // Try Out: judul di tengah topbar menggantikan breadcrumb, tanpa tautan ke Beranda
    // (siswa tidak boleh meninggalkan Try Out lewat topbar).
    judulTengah?: string;
    // Panel kanan (Navigasi Soal). Di layar sempit turun ke bawah konten.
    sidebar?: ReactNode;
    children: ReactNode;
}

/**
 * Layout halaman pengerjaan (Figma node 669:7082): topbar penuh dengan lambang, breadcrumb di tengah,
 * dan avatar; tanpa sidebar menu supaya siswa fokus mengerjakan soal.
 */
export default function LatihanLayout({ breadcrumb = [], judulTengah, sidebar, children }: LatihanLayoutProps) {
    const namaUser: string = usePage<any>().props.auth?.user?.name ?? '';
    const inisial = namaUser.charAt(0).toUpperCase() || 'A';

    return (
        <div className="flex h-screen flex-col bg-gradient-to-r from-siswa-laman-awal from-[24.711%] to-siswa-laman-akhir font-poppins text-siswa-judul">
            {/* Tinggi, jarak tepi, bayangan, dan ukuran ikon/avatar disamakan dengan TopbarSiswa di Beranda. */}
            <header className="relative z-20 flex h-[60px] shrink-0 items-center gap-4 bg-white px-6 shadow-kartu md:pl-[52px] md:pr-[38px]">
                {judulTengah ? (
                    <LambangEdvora className="h-[40px] w-[34px]" />
                ) : (
                    <Link href={route('dashboard')} aria-label="Beranda" className="transition hover:opacity-80">
                        <LambangEdvora className="h-[40px] w-[34px]" />
                    </Link>
                )}

                {judulTengah ? (
                    <h1 className="min-w-0 flex-1 truncate text-center text-sm font-medium text-siswa-teks md:text-[15px]">{judulTengah}</h1>
                ) : (
                    <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center justify-center gap-2 text-sm text-siswa-teks md:gap-3 md:text-[15px]">
                        <Link href={route('dashboard')} aria-label="Beranda" className="shrink-0 transition hover:opacity-70">
                            <img src="/images/ikon/topbar-beranda.png" alt="" className="h-[33.939px] w-[33.939px] object-contain" />
                        </Link>
                        {breadcrumb.map((item, i) => {
                            const terakhir = i === breadcrumb.length - 1;
                            return (
                                // Item selain yang terakhir disembunyikan di layar sempit supaya breadcrumb tidak terpotong.
                                <span key={i} className={`min-w-0 items-center gap-2 md:gap-3 ${terakhir ? 'flex' : 'hidden sm:flex'}`}>
                                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 6l6 6-6 6" />
                                    </svg>
                                    <span className={`truncate ${terakhir ? 'font-medium text-siswa-judul/80' : ''}`}>{item}</span>
                                </span>
                            );
                        })}
                    </nav>
                )}

                <div className="flex shrink-0 items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-edvora-primary text-[24px] font-normal leading-none text-white">
                        {inisial}
                    </span>
                    {!judulTengah && <img src="/images/ikon/panah-bawah.png" alt="" className="hidden h-[19.542px] w-[19.542px] object-contain sm:block" />}
                </div>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto">
                {sidebar ? (
                    // Selebar layar seperti di Figma: hanya jarak tepi yang membesar di layar lebar, tanpa batas lebar konten.
                    <div className="grid w-full gap-6 px-4 py-6 md:grid-cols-[minmax(0,1fr)_260px] md:px-8 lg:grid-cols-[minmax(0,1fr)_338px] lg:gap-[18px] lg:px-[52px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6 2xl:px-16">
                        <div className="min-w-0">{children}</div>
                        <aside className="md:sticky md:top-6 md:self-start">{sidebar}</aside>
                    </div>
                ) : (
                    children
                )}
            </main>
        </div>
    );
}
