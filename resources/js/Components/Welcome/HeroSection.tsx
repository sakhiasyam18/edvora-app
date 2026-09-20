import { Link } from '@inertiajs/react';

export default function HeroSection() {
    return (
        <section className="border-2 border-dashed border-green-500 bg-green-50 p-12 w-full max-w-4xl text-center rounded flex flex-col items-center">
            <p className="text-green-700 font-semibold mb-6">[ Area Hero Section ]</p>
            
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Company Pack - Tech Fora Apps</h1>
            
            <div className="border border-dashed border-purple-400 bg-purple-50 p-4 mt-8 rounded inline-block">
                <p className="text-purple-600 text-sm mb-3">[ Area Tombol CTA ]</p>
                <Link 
                    href="/login"
                    className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded hover:bg-blue-700 transition"
                >
                    Masuk ke EDVORA
                </Link>
            </div>
        </section>
    );
}
