import { FormEventHandler, useState } from 'react';
import InputError from '@/Components/InputError';
import { kekuatanSandi } from '@/lib/kekuatanSandi';
import { Head, Link, useForm } from '@inertiajs/react';

interface ResetPasswordProps {
    token: string;
    email: string;
    berhasil: boolean; // true setelah sandi tersimpan; server kembali ke halaman ini, bukan ke Login
}

// Ubah sandi dari tautan email, dengan tampilan yang sama dengan Login, Daftar, dan Verifikasi Email.
export default function ResetPassword({ token, email, berhasil }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const kekuatan = kekuatanSandi(data.password);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="bg-gradient-edvora flex min-h-screen flex-col items-center justify-center p-4 font-poppins antialiased selection:bg-[#5B88DD] selection:text-white sm:p-6">
            <Head title="Ubah Sandi - EDVORA" />

            <main className="flex w-full max-w-[480px] flex-col items-center">
                <header className="mb-5 text-center sm:mb-6">
                    <Link href="/">
                        <h1 className="brand-title-shadow text-3xl font-extrabold tracking-widest text-white sm:text-4xl md:text-[40px]">EDVORA</h1>
                    </Link>
                </header>

                <section className="main-card-shadow w-full rounded-2xl border border-white/60 bg-brand-lightBlue px-6 py-8 sm:rounded-3xl sm:px-10 sm:py-9">
                    {berhasil ? (
                        <div className="text-center">
                            <p className="text-sm tracking-wide text-brand-grayText">UBAH KATA SANDI</p>
                            <h2 className="mt-1 text-2xl font-bold tracking-wide text-brand-navy sm:text-[26px]">BERHASIL</h2>

                            <div className="flex justify-center pt-6">
                                <Link
                                    href={route('login')}
                                    className="w-44 rounded-xl bg-brand-blue py-2.5 text-center text-sm font-bold tracking-wider text-white shadow-[0_4px_12px_rgba(91,136,221,0.45)] transition-all duration-150 hover:bg-brand-blueHover active:scale-[0.98]"
                                >
                                    KEMBALI KE LOGIN
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="mb-6 text-center text-2xl font-bold tracking-wide text-brand-navy sm:text-[26px]">UBAH SANDI</h2>

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-brand-navy" htmlFor="password">
                                        Kata Sandi Baru
                                    </label>
                                    <InputSandi
                                        id="password"
                                        placeholder="Masukkan Sandi Baru"
                                        value={data.password}
                                        onChange={(nilai) => setData('password', nilai)}
                                    />
                                    {/* Indikator kekuatan sama dengan halaman Daftar. */}
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="h-2 w-32 overflow-hidden rounded-full border border-[#BFD5ED] bg-[#E1EDF8] p-0.5 sm:w-36">
                                            <div className={`h-full ${kekuatan.width} ${kekuatan.color} rounded-full transition-all duration-300`}></div>
                                        </div>
                                        <span className="text-[12px] font-medium text-[#283C63]">{kekuatan.label}</span>
                                    </div>
                                    <InputError message={errors.password} className="mt-1.5" />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-brand-navy" htmlFor="password_confirmation">
                                        Konfirmasi Kata Sandi Baru
                                    </label>
                                    <InputSandi
                                        id="password_confirmation"
                                        placeholder="Masukkan ulang Sandi Baru"
                                        value={data.password_confirmation}
                                        onChange={(nilai) => setData('password_confirmation', nilai)}
                                    />
                                    <InputError message={errors.password_confirmation} className="mt-1.5" />
                                </div>

                                {/* Token kedaluwarsa/tidak valid dan email tidak cocok dikirim server di kunci email; kolom email tidak tampil di halaman ini. */}
                                <InputError message={errors.email} />

                                <div className="flex justify-center pt-3">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-44 rounded-xl bg-brand-blue py-2.5 text-sm font-bold tracking-wider text-white shadow-[0_4px_12px_rgba(91,136,221,0.45)] transition-all duration-150 hover:bg-brand-blueHover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processing ? 'MEMPROSES...' : 'PERBARUI SANDI'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}

// Input kata sandi dengan tombol lihat/sembunyikan, sama seperti di halaman Masuk.
function InputSandi({ id, value, placeholder, onChange }: { id: string; value: string; placeholder: string; onChange: (nilai: string) => void }) {
    const [terlihat, setTerlihat] = useState(false);

    return (
        <div className="relative flex items-center">
            <input
                className="w-full rounded-xl border border-brand-inputBorder bg-brand-inputBg py-2.5 pl-4 pr-11 text-sm text-brand-navy placeholder-[#8ea6c2] shadow-inner transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-blue"
                id={id}
                name={id}
                placeholder={placeholder}
                required
                type={terlihat ? 'text' : 'password'}
                value={value}
                autoComplete="new-password"
                onChange={(e) => onChange(e.target.value)}
            />
            <button
                aria-label="Tampilkan atau sembunyikan kata sandi"
                className="absolute right-3.5 text-brand-navy transition-colors hover:text-brand-blue focus:outline-none"
                type="button"
                onClick={() => setTerlihat(!terlihat)}
            >
                {terlihat ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>
        </div>
    );
}
