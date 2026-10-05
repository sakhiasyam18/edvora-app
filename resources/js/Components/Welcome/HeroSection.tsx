import { Link, usePage } from '@inertiajs/react';

// Hero landing page: judul dan ajakan di kiri, pratinjau tampilan aplikasi di kanan (tanpa foto).
export default function HeroSection() {
    const { auth } = usePage<any>().props;

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-siswa-laman-awal to-siswa-laman-akhir">
            {/* Cahaya biru lembut di latar, bukan gambar. */}
            <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-edvora-primary/15 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-1/2 h-[380px] w-[380px] rounded-full bg-siswa-banner-awal/40 blur-3xl" />
            <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-16 sm:px-6 md:pt-24 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8 lg:pb-32 lg:pt-28">
                <div className="animate-muncul-halus text-center lg:text-left">
                    <h1 className="text-[34px] font-bold leading-[1.15] text-siswa-judul sm:text-[44px] lg:text-[52px]">
                        Belajar UTBK yang <span className="bg-gradient-to-r from-edvora-primary to-siswa-sidebar-awal bg-clip-text text-transparent">terarah dan terukur</span>
                    </h1>

                    <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-siswa-teks sm:text-base lg:mx-0">
                        EDVORA membantu siswa berlatih soal UTBK sesuai kemampuannya, mengikuti Try Out bergaya ujian sebenarnya, dan memantau
                        perkembangan belajar dalam satu tempat.
                    </p>

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                        <Link
                            href={auth?.user ? route('dashboard') : route('register')}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-edvora-primary px-7 text-[14px] font-bold tracking-wider text-white shadow-[0_8px_20px_rgba(91,136,221,0.4)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-edvora-primary-hover active:translate-y-0 sm:w-auto"
                        >
                            {auth?.user ? 'BUKA DASHBOARD' : 'MULAI SEKARANG'}
                            <span aria-hidden="true">&rarr;</span>
                        </Link>
                        <a
                            href="#fitur"
                            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-siswa-garis-halus bg-white px-7 text-[14px] font-semibold text-siswa-judul shadow-panel transition-all duration-150 hover:-translate-y-0.5 hover:border-edvora-primary/50 sm:w-auto"
                        >
                            Lihat Fitur
                        </a>
                    </div>
                </div>

                <PratinjauAplikasi />
            </div>
        </section>
    );
}

// Ilustrasi tampilan aplikasi dari kartu-kartu HTML; hanya hiasan, angka di dalamnya contoh.
function PratinjauAplikasi() {
    const topik = [
        { kode: 'PU', nama: 'Penalaran Umum', persen: 78, warna: 'bg-subtes-pu' },
        { kode: 'PK', nama: 'Pengetahuan Kuantitatif', persen: 64, warna: 'bg-subtes-pk' },
        { kode: 'LBI', nama: 'Literasi Bahasa Indonesia', persen: 52, warna: 'bg-subtes-lbi' },
    ];

    return (
        <div aria-hidden="true" className="relative mx-auto w-full max-w-[460px] animate-muncul-halus [animation-delay:150ms] [animation-fill-mode:both]">
            {/* Kartu utama: penguasaan per subtes */}
            <div className="rounded-[22px] border border-white bg-white p-6 shadow-[0_24px_60px_-15px_rgba(38,53,93,0.25)]">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[12px] font-medium text-siswa-teks">Perkembangan Belajar</p>
                        <p className="text-[17px] font-semibold text-siswa-judul">Penguasaan Subtes</p>
                    </div>
                    <span className="rounded-full bg-siswa-umpan-benar px-3 py-1 text-[11px] font-semibold text-siswa-umpan-benar-teks">Berkembang</span>
                </div>

                <ul className="mt-5 space-y-4">
                    {topik.map((t) => (
                        <li key={t.kode} className="flex items-center gap-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${t.warna}`}>{t.kode}</span>
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between text-[12px]">
                                    <span className="truncate font-medium text-siswa-judul-seksi">{t.nama}</span>
                                    <span className="font-semibold text-siswa-judul">{t.persen}%</span>
                                </div>
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-siswa-laman-awal">
                                    <div className="h-full rounded-full bg-ujian-biru" style={{ width: `${t.persen}%` }} />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Kartu kecil: skor Try Out dengan garis tren */}
            <div className="absolute -bottom-10 -left-4 w-[220px] rounded-[18px] border border-white bg-white p-4 shadow-[0_20px_45px_-15px_rgba(38,53,93,0.3)] sm:-left-10">
                <p className="text-[11px] font-medium text-siswa-teks">Skor Try Out</p>
                <div className="flex items-end justify-between">
                    <p className="text-[24px] font-bold leading-tight text-siswa-judul">612</p>
                    <span className="mb-1 rounded-full bg-siswa-umpan-benar px-2 py-0.5 text-[10px] font-semibold text-siswa-umpan-benar-teks">▲ 43</span>
                </div>
                <svg viewBox="0 0 180 44" className="mt-2 h-11 w-full">
                    <defs>
                        <linearGradient id="hero-tren" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#5B88DD" stopOpacity="0.25" />
                            <stop offset="1" stopColor="#5B88DD" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <polygon points="0,38 30,30 60,33 90,22 120,24 150,12 180,8 180,44 0,44" fill="url(#hero-tren)" />
                    <polyline points="0,38 30,30 60,33 90,22 120,24 150,12 180,8" fill="none" stroke="#5B88DD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            {/* Lencana kecil: XP */}
            <div className="absolute -right-3 -top-5 flex items-center gap-2 rounded-2xl border border-white bg-white px-3.5 py-2.5 shadow-[0_16px_35px_-12px_rgba(38,53,93,0.3)] sm:-right-8">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-siswa-hint-latar text-[11px] font-bold text-siswa-hint-teks">XP</span>
                <div>
                    <p className="text-[10px] text-siswa-teks">Latihan selesai</p>
                    <p className="text-[13px] font-semibold text-siswa-judul">+120 XP</p>
                </div>
            </div>
        </div>
    );
}
