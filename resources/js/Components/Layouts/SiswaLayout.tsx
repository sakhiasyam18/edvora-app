import { usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import SidebarSiswa from './SidebarSiswa';
import TopbarSiswa from './TopbarSiswa';

/**
 * Layout halaman siswa: sidebar, topbar, dan area konten.
 * Dipasang sebagai persistent layout (Halaman.layout = ...), jadi sidebar tidak dirender ulang saat pindah halaman.
 */
export default function SiswaLayout({ children }: { children: ReactNode }) {
    // 1. Ambil data props dan url sekaligus dari usePage()
    const { props, url } = usePage<any>(); 
    const user = props.auth.user;  
    const inisial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

    // 2. Logika pengecekan URL (harus diletakkan di luar return/JSX)
    const isAkunPribadi = url.startsWith('/akun');

    return (
        <div className="flex min-h-screen bg-gradient-to-r from-siswa-laman-awal from-[24.711%] to-siswa-laman-akhir">
            <SidebarSiswa />

            <div className="flex min-h-screen flex-1 flex-col">
                {/* 3. Lempar variabel isAkunPribadi sebagai props ke komponen Topbar */}
                <TopbarSiswa inisial={inisial} isAkunPribadi={isAkunPribadi} />

                <main className="flex-1 px-6 py-[17px] md:px-[43px]">{children}</main>
            </div>
        </div>
    );
}