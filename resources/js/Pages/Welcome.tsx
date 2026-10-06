import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import AjakanSection from '@/Components/Welcome/AjakanSection';
import CaraKerjaSection from '@/Components/Welcome/CaraKerjaSection';
import FeaturesSection from '@/Components/Welcome/FeaturesSection';
import Footer from '@/Components/Welcome/Footer';
import HeroSection from '@/Components/Welcome/HeroSection';
import Navbar from '@/Components/Welcome/Navbar';
import SubtesSection from '@/Components/Welcome/SubtesSection';
import TentangSection from '@/Components/Welcome/TentangSection';

// Landing page (company profile EDVORA). Warna, huruf, dan kartu memakai token yang sama dengan aplikasi.
export default function Welcome() {
    // Gulir halus saat menu navbar diklik; hanya di landing page, dikembalikan saat pindah halaman.
    useEffect(() => {
        const html = document.documentElement;
        html.style.scrollBehavior = 'smooth';
        return () => {
            html.style.scrollBehavior = '';
        };
    }, []);

    return (
        <>
            <Head title="EDVORA - Platform Persiapan UTBK" />

            <div className="flex min-h-screen flex-col bg-white font-poppins text-siswa-judul antialiased selection:bg-edvora-primary selection:text-white">
                <Navbar />
                <main className="flex-1">
                    <HeroSection />
                    <TentangSection />
                    <FeaturesSection />
                    <SubtesSection />
                    <CaraKerjaSection />
                    <AjakanSection />
                </main>
                <Footer />
            </div>
        </>
    );
}
