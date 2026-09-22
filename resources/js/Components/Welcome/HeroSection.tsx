export default function HeroSection() {
    return (
        <section className="w-full relative" data-purpose="hero-banner">
            {/* Hero Image Background Container */}
            <div className="w-full relative h-[380px] sm:h-[480px] md:h-[580px] lg:h-[640px] overflow-hidden bg-slate-900">
                <img
                    alt="Foto Bersama Komunitas Edvora"
                    className="w-full h-full object-cover object-[center_28%] select-none brightness-95"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD32aarxnk2jBQ3dCiIx6z9h69_bPQ-6fDJMmpD_04dukJJbr8Ka1b0AoEmnQxvHh-4JR128i0_o08sCfEDSYf7GOSziMFUl_w-BElr6Z5Zq6068T-1Ns2zoqZg0MKK1UW0xYn5Ksdfu0WG_vJmicIricCOR0R_IiRdoaZXrKDom1FPD1k4sDHSo8Hc8uJWAc-uUIZGDuvZW8g-7-QSCOlV7nIAlKSiNt8WsguHcZFoOUy11m-uav1kak6bpWW-pSSQaQ"
                />
                {/* Overlay Semitransparan untuk keterbacaan teks */}
                <div className="absolute inset-0 bg-black/20 backdrop-brightness-95"></div>
                {/* Hero Callout & Title Centered Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
                    <p className="text-white text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-widest uppercase mb-1 drop-shadow-md">
                        SELAMAT DATANG DI
                    </p>
                    <h1 className="text-white text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-wider uppercase mb-5 drop-shadow-lg hero-overlay-shadow">
                        EDVORA
                    </h1>
                    <a
                        className="inline-block bg-[#5B88DD] hover:bg-[#4a75c7] text-white text-xs sm:text-sm md:text-base font-bold px-7 sm:px-9 py-2 sm:py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 uppercase tracking-wide"
                        data-purpose="hero-cta"
                        href="#fitur"
                    >
                        SELENGKAPNYA
                    </a>
                </div>
            </div>
        </section>
    );
}

