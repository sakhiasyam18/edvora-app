
import { usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import SidebarSiswa from './SidebarSiswa';
import TopbarSiswa from './TopbarSiswa';

/**
 * Layout halaman siswa: sidebar, topbar, dan area konten.
 * Dipasang sebagai persistent layout (Halaman.layout = ...), jadi sidebar tidak dirender ulang saat pindah halaman.
 */
export default function SiswaLayout({ children }: { children: ReactNode }) {
    const user = usePage<any>().props.auth.user;  const inisial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

return (
     <div className="flex min-h-screen bg-gradient-to-r from-siswa-laman-awal from-[24.711%] to-siswa-laman-akhir">
     <SidebarSiswa />

 <div className="flex min-h-screen flex-1 flex-col">
    <TopbarSiswa inisial={inisial} />

    <main className="flex-1 px-6 py-[17px] md:px-[43px]">{children}</main>
     </div>
 </div>
 );
}