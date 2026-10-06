import { Link } from '@inertiajs/react';
import LambangEdvora from '@/Components/Layouts/LambangEdvora';

const TAUTAN_HALAMAN = [
    { label: 'Tentang', href: '#tentang' },
    { label: 'Fitur', href: '#fitur' },
    { label: 'Subtes', href: '#subtes' },
    { label: 'Cara Kerja', href: '#cara-kerja' },
];

export default function Footer() {
    return (
        <footer className="bg-siswa-sidebar-akhir text-white/70">
            <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
                <div>
                    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Beranda Edvora">
                        <LambangEdvora className="h-[34px] w-[29px]" />
                        <span className="text-[20px] font-extrabold tracking-[2.5px] text-white">EDVORA</span>
                    </Link>
                    <p className="mt-4 max-w-sm text-[14px] leading-relaxed">
                        Platform persiapan UTBK untuk berlatih soal, mengikuti Try Out, dan memantau perkembangan belajar dalam satu tempat.
                    </p>
                </div>

                <div>
                    <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white">Jelajahi</h3>
                    <ul className="mt-4 space-y-2.5 text-[14px]">
                        {TAUTAN_HALAMAN.map((t) => (
                            <li key={t.href}>
                                <a href={t.href} className="transition-colors hover:text-white">
                                    {t.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white">Akun</h3>
                    <ul className="mt-4 space-y-2.5 text-[14px]">
                        <li>
                            <Link href={route('login')} className="transition-colors hover:text-white">
                                Masuk
                            </Link>
                        </li>
                        <li>
                            <Link href={route('register')} className="transition-colors hover:text-white">
                                Daftar
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </footer>
    );
}
