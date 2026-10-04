import { Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import LambangEdvora from './LambangEdvora';

export interface MenuSidebar {
    label: string;
    rute: string | null; // nama rute; null = halamannya belum ada, jadi belum bisa dipencet
    aktifUntuk?: string; // pola route().current() bila berbeda dari rute, mis. 'latihan.*'
    ikon: string | ReactNode; // berkas ikon dari desain Figma, atau ikon SVG (menu admin)
    kelasIkon?: string; // ukuran kotak ikon berkas, persis seperti di desain
}

// Urutan menu sidebar (RANCANGAN-dashboard-topik-remedial.md, K18).
// Ikon dan ukurannya diambil dari frame Beranda di Figma (node 641:3423).
const MENU_SIDEBAR: MenuSidebar[] = [
    { label: 'Beranda', rute: 'dashboard', ikon: '/images/ikon/nav-beranda.png', kelasIkon: 'h-[28.661px] w-[28.661px]' },
    { label: 'Latihan Soal', rute: 'latihan.index', aktifUntuk: 'latihan.*', ikon: '/images/ikon/nav-latihan.png', kelasIkon: 'h-[43.65px] w-[30.869px]' },
    { label: 'Try Out', rute: 'tryout.index', aktifUntuk: 'tryout.*', ikon: '/images/ikon/nav-tryout.png', kelasIkon: 'h-[29.617px] w-[29.617px]' },
    { label: 'Riwayat', rute: 'riwayat.index', aktifUntuk: 'riwayat.*', ikon: '/images/ikon/nav-riwayat.png', kelasIkon: 'h-[27.423px] w-[27.423px]' },
    { label: 'Perkembangan', rute: 'perkembangan.index', ikon: '/images/ikon/nav-perkembangan.svg', kelasIkon: 'h-[24px] w-[24px]' },
    { label: 'Akun Pribadi', rute: 'akun.profil.utama', aktifUntuk: 'akun.*', ikon: '/images/ikon/nav-akun.png', kelasIkon: 'h-[28.672px] w-[28.672px]' },
];

// Satu baris menu dipakai baik oleh Link maupun oleh menu yang belum punya halaman.
const KELAS_BARIS = 'flex h-[47px] items-center gap-4 rounded-nav px-[18px] text-[15px] text-white';

interface SidebarSiswaProps {
    menu?: MenuSidebar[];
    rutBeranda?: string; // tujuan logo EDVORA; admin memakai 'admin.index'
}

/**
 * Sidebar siswa: logo EDVORA dan daftar menu dengan penanda halaman aktif.
 * Dipakai juga oleh AdminLayout dengan menu admin, supaya tampilan sidebar semua peran sama.
 * Disembunyikan di bawah breakpoint md; di layar sempit navigasi memakai topbar.
 */
export default function SidebarSiswa({ menu: daftarMenu = MENU_SIDEBAR, rutBeranda = 'dashboard' }: SidebarSiswaProps) {
    return (
        <aside className="hidden w-sidebar shrink-0 flex-col bg-gradient-to-b from-siswa-sidebar-awal via-siswa-sidebar-tengah via-[41.674%] to-siswa-sidebar-akhir font-poppins md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto">
            <Link href={route(rutBeranda)} className="flex flex-col items-center pt-[18px]" aria-label="Beranda">
                <LambangEdvora />
                <span className="mt-[1px] text-[24px] font-extrabold tracking-[3.6px] text-white">EDVORA</span>
            </Link>

            <nav className="mt-[26px] space-y-1 px-6">
                {daftarMenu.map((menu) => {
                    // Ikon ditaruh di kotak selebar ikon terlebar (31px) dan di tengahnya, supaya semua label mulai di garis yang sama.
                    const ikon = (
                        <span className="flex w-[31px] shrink-0 justify-center">
                            {/* Membesar sedikit saat baris di-hover (group di Link); menu nonaktif tidak punya group, jadi diam. */}
                            {typeof menu.ikon === 'string' ? (
                                <img
                                    src={menu.ikon}
                                    alt=""
                                    className={`${menu.kelasIkon ?? 'h-7 w-7'} object-contain transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none`}
                                />
                            ) : (
                                <span className="flex transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none">{menu.ikon}</span>
                            )}
                        </span>
                    );

                    if (!menu.rute) {
                        return (
                            <span key={menu.label} aria-disabled="true" className={`${KELAS_BARIS} cursor-not-allowed font-medium opacity-60`}>
                                {ikon}
                                {menu.label}
                            </span>
                        );
                    }

                    const aktif = route().current(menu.aktifUntuk ?? menu.rute);

                    return (
                        <Link
                            key={menu.label}
                            href={route(menu.rute)}
                            // Data halaman tujuan diambil saat kursor diarahkan, supaya klik terasa cepat.
                            prefetch
                            aria-current={aktif ? 'page' : undefined}
                            className={`group ${KELAS_BARIS} transition ${
                                aktif
                                    ? 'bg-gradient-to-r from-siswa-nav-awal from-[3.846%] via-siswa-nav-tengah via-[41.346%] to-siswa-nav-akhir font-medium'
                                    : 'font-medium hover:bg-white/10'
                            }`}
                        >
                            {ikon}
                            {/* origin-left: tulisan membesar ke kanan, tidak menabrak ikon. */}
                            <span className="origin-left transition-transform duration-200 ease-out group-hover:scale-105 motion-reduce:transition-none">{menu.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
