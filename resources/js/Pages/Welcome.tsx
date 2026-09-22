import { Head } from '@inertiajs/react';
import Navbar from '@/Components/Welcome/Navbar';
import HeroSection from '@/Components/Welcome/HeroSection';
import FeaturesSection from '@/Components/Welcome/FeaturesSection';
import Footer from '@/Components/Welcome/Footer';

export default function Welcome() {
    return (
        <>
            <Head title="EDVORA - Selamat Datang" />

            <div className="bg-[#F8FAFC] flex flex-col min-h-screen text-slate-800 antialiased selection:bg-blue-500 selection:text-white font-sans">
                <Navbar />
                <HeroSection />
                <FeaturesSection />
                <Footer />
            </div>
        </>
    );
}

