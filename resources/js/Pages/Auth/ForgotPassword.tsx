import { FormEventHandler } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { HalamanAuth, KartuAuth, KELAS_TOMBOL_UTAMA, KolomAuth, PesanStatus } from '@/Components/Auth/BagianAuth';

// Minta tautan ubah sandi lewat email, dengan tampilan yang sama dengan Login, Daftar, dan Verifikasi Email.
export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    // Dipakai tombol Kirim dan Kirim Ulang: keduanya meminta tautan baru untuk email yang sama.
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <HalamanAuth judulTab="Lupa Kata Sandi - EDVORA">
            {/* Kartu putih seperti panel formulir di Login; isi rata tengah untuk judul, rata kiri untuk formulir. */}
            <KartuAuth className="px-6 py-8 sm:px-9 sm:py-9">
                <div className="flex flex-col items-center text-center">
                    {/* Ikon kunci di lingkaran biru muda sebagai penanda halaman. */}
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-lightBlue text-brand-blue">
                        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
                            <path d="M8 10.5V7.5a4 4 0 018 0v3M12 14.5v2.5" />
                        </svg>
                    </span>

                    <h2 className="mt-4 text-[22px] font-bold tracking-wide text-brand-navy sm:text-2xl">LUPA KATA SANDI?</h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-brand-grayText sm:text-sm">
                        Masukkan alamat email yang terdaftar pada akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
                    </p>
                </div>

                {status && (
                    <div className="mt-5">
                        <PesanStatus>{status}</PesanStatus>
                    </div>
                )}

                <form onSubmit={submit} className="mt-6 space-y-5">
                    <KolomAuth
                        id="email"
                        label="Email"
                        ikon="email"
                        name="email"
                        type="email"
                        placeholder="Masukkan Email"
                        required
                        autoComplete="username"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                    />

                    <button type="submit" disabled={processing} className={KELAS_TOMBOL_UTAMA}>
                        {processing ? 'MEMPROSES...' : 'KIRIM TAUTAN PEMULIHAN'}
                    </button>
                </form>

                {/* Petunjuk langkah berikutnya sebagai kotak info, bukan teks lepas. */}
                <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-brand-inputBg px-4 py-3 text-[13px] leading-relaxed text-brand-grayText">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 11v5M12 8h.01" />
                    </svg>
                    <p>Silahkan klik tautan yang berada di dalam email untuk mengubah kata sandi</p>
                </div>

                {/* Kirim ulang dibuat tombol garis supaya tidak bersaing dengan tombol utama di atas. */}
                <div className="mt-6 border-t border-brand-inputBorder pt-5 text-center">
                    <p className="text-[13px] text-brand-grayText">Tidak menerima email? tidak masalah</p>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={processing}
                        className="mt-3 inline-flex h-10 items-center justify-center rounded-xl border-2 border-brand-blue bg-white px-6 text-[13px] font-bold tracking-wider text-brand-blue transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand-blue hover:text-white active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        KIRIM ULANG TAUTAN
                    </button>
                </div>
            </KartuAuth>

            {/* Kembali ke halaman Login, di bawah kartu supaya tidak bersaing dengan tombol formulir. */}
            <Link
                href={route('login')}
                className="group mt-5 inline-flex animate-muncul-halus items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 [animation-delay:160ms] [animation-fill-mode:both] hover:bg-white/15"
            >
                <svg
                    className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M19 12H5M11 6l-6 6 6 6" />
                </svg>
                Kembali ke halaman Login
            </Link>
        </HalamanAuth>
    );
}
