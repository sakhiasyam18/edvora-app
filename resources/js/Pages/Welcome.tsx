import { Head } from '@inertiajs/react';
import Navbar from '@/Components/Welcome/Navbar';
import HeroSection from '@/Components/Welcome/HeroSection';
import Footer from '@/Components/Welcome/Footer';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome to EDVORA" />
            
            <div className="min-h-screen flex flex-col bg-gray-50 font-sans p-4">
                <Navbar />

                <main className="flex-grow flex flex-col items-center justify-center mb-4">
                    <HeroSection />
                </main>

                <Footer />
            </div>
        </>
    );
}
