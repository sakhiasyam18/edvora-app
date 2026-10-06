import { Link, usePage } from '@inertiajs/react';
import Muncul from './Muncul';

// Ajakan penutup sebelum footer: banner biru dengan tombol daftar (atau buka dashboard bila sudah masuk).
export default function AjakanSection() {
    const { auth } = usePage<any>().props;

    return (
        <section className="bg-siswa-laman-awal px-5 pb-20 sm:px-6 sm:pb-24 lg:px-8">
            <Muncul className="mx-auto max-w-6xl">
                <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-siswa-sidebar-awal via-siswa-sidebar-tengah to-siswa-sidebar-akhir px-6 py-14 text-center shadow-[0_24px_60px_-20px_rgba(38,53,93,0.5)] sm:px-12">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-edvora-primary/30 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-siswa-banner-awal/20 blur-3xl" />

                    <div className="relative">
                        <h2 className="mx-auto max-w-2xl text-[26px] font-bold leading-tight text-white sm:text-[34px]">Siap memulai persiapan UTBK-mu?</h2>
                        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">
                            Mulai dari latihan pertama hari ini, dan lihat sendiri bagaimana penguasaanmu berkembang.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href={auth?.user ? route('dashboard') : route('register')}
                                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-white px-8 text-[14px] font-bold tracking-wider text-siswa-judul shadow-lg transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                            >
                                {auth?.user ? 'BUKA DASHBOARD' : 'DAFTAR SEKARANG'}
                            </Link>
                            {!auth?.user && (
                                <Link
                                    href={route('login')}
                                    className="inline-flex h-12 w-full items-center justify-center rounded-xl border-2 border-white/40 px-8 text-[14px] font-bold tracking-wider text-white transition-all duration-150 hover:border-white hover:bg-white/10 sm:w-auto"
                                >
                                    MASUK
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </Muncul>
        </section>
    );
}
