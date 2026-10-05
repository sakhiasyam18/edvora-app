import { Head, Link } from '@inertiajs/react';
import { InputHTMLAttributes, ReactNode } from 'react';
import InputError from '@/Components/InputError';

// Bagian tampilan bersama halaman auth (Login, Daftar, Lupa Kata Sandi), supaya ketiganya seragam.

// Tombol utama: warna, bayangan, dan efek tekan sama di semua halaman auth.
export const KELAS_TOMBOL_UTAMA =
    'inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-blue text-sm font-bold tracking-wider text-white shadow-[0_4px_12px_rgba(91,136,221,0.45)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand-blueHover active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

// Kerangka halaman: latar gradasi, judul EDVORA, lalu isi (kartu). lebar: lebar maksimal isi.
export function HalamanAuth({ judulTab, lebar = 'max-w-[440px]', children }: { judulTab: string; lebar?: string; children: ReactNode }) {
    return (
        <div className="bg-gradient-edvora flex min-h-screen flex-col items-center justify-center p-4 font-poppins antialiased selection:bg-[#5B88DD] selection:text-white sm:p-6">
            <Head title={judulTab} />

            <main className={`flex w-full flex-col items-center ${lebar}`}>
                <header className="mb-5 animate-muncul-halus text-center sm:mb-6">
                    <Link href="/">
                        <h1 className="brand-title-shadow text-3xl font-extrabold tracking-widest text-white sm:text-4xl md:text-[40px]">EDVORA</h1>
                    </Link>
                </header>

                {children}
            </main>
        </div>
    );
}

// Kartu putih pembungkus isi halaman auth.
export function KartuAuth({ className = '', children }: { className?: string; children: ReactNode }) {
    return (
        <section
            className={`w-full animate-muncul-halus overflow-hidden rounded-2xl bg-white shadow-[0_12px_35px_rgba(0,0,0,0.12)] [animation-delay:80ms] [animation-fill-mode:both] sm:rounded-3xl ${className}`}
        >
            {children}
        </section>
    );
}

const IKON_KOLOM = {
    email: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="M4 7l8 6 8-6" />
        </>
    ),
    sandi: (
        <>
            <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
            <path d="M8 10.5V7.5a4 4 0 018 0v3" />
        </>
    ),
};

interface KolomAuthProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    ikon: keyof typeof IKON_KOLOM;
    error?: string;
    // Diisi untuk kolom kata sandi: tombol mata di kanan untuk menampilkan/menyembunyikan isi.
    sandiTerlihat?: boolean;
    onUbahTerlihat?: () => void;
    labelTombolMata?: string;
    bawah?: ReactNode; // isi tambahan di bawah kolom, mis. pengukur kekuatan sandi
}

// Kolom isian dengan ikon di kiri dan (opsional) tombol mata di kanan.
export function KolomAuth({ id, label, ikon, error, sandiTerlihat, onUbahTerlihat, labelTombolMata, bawah, ...input }: KolomAuthProps) {
    const adaMata = onUbahTerlihat !== undefined;

    return (
        <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-navy" htmlFor={id}>
                {label}
            </label>
            <div className="relative">
                <svg
                    className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8ea6c2]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    {IKON_KOLOM[ikon]}
                </svg>
                {/* [&::-ms-reveal]: Edge menambah tombol mata sendiri di kolom password; disembunyikan supaya tidak dobel. */}
                <input
                    id={id}
                    {...input}
                    className={`h-11 w-full rounded-xl border border-brand-inputBorder bg-brand-inputBg pl-11 text-sm text-brand-navy placeholder-[#8ea6c2] shadow-inner transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue [&::-ms-reveal]:hidden ${
                        adaMata ? 'pr-11' : 'pr-4'
                    }`}
                />
                {adaMata && (
                    <button
                        type="button"
                        aria-label={labelTombolMata ?? 'Tampilkan atau sembunyikan kata sandi'}
                        onClick={onUbahTerlihat}
                        className={`absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                            sandiTerlihat ? 'text-brand-blue' : 'text-brand-navy/70 hover:text-brand-blue'
                        }`}
                    >
                        {sandiTerlihat ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
            {bawah}
            <InputError message={error} className="mt-1.5" />
        </div>
    );
}

// Panel sambutan berwarna di sisi kartu Login/Daftar: judul, kalimat, dan tautan ke halaman lawannya.
export function PanelSambutan({ judul, teks, href, labelTautan }: { judul: ReactNode; teks: string; href: string; labelTautan: string }) {
    return (
        <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-[#8DB6F0] to-brand-blue px-8 py-10 text-center text-white md:w-[42%]">
            <div className="flex max-w-[240px] flex-col items-center">
                <h3 className="text-lg font-bold leading-snug tracking-wider sm:text-xl">{judul}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/90 sm:text-sm">{teks}</p>
                <Link
                    href={href}
                    className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-xl bg-white px-4 text-[13px] font-semibold text-brand-navy shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:text-brand-blue hover:shadow-lg active:translate-y-0 active:scale-[0.98] sm:text-sm"
                >
                    {labelTautan}
                </Link>
            </div>
        </div>
    );
}

// Kotak pesan status (mis. tautan sudah dikirim) berwarna hijau dengan ikon centang.
export function PesanStatus({ children }: { children: ReactNode }) {
    return (
        <div role="status" className="flex animate-muncul-halus items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-left text-[13px] font-medium text-green-700">
            <svg className="mt-px h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12.5l2.7 2.7L16 9.8" />
            </svg>
            {children}
        </div>
    );
}
