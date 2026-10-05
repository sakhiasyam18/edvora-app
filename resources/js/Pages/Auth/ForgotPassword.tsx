import { FormEventHandler } from 'react';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

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
        <div className="bg-gradient-edvora flex min-h-screen flex-col items-center justify-center p-4 font-poppins antialiased selection:bg-[#5B88DD] selection:text-white sm:p-6">
            <Head title="Lupa Kata Sandi - EDVORA" />

            <main className="flex w-full max-w-[480px] flex-col items-center">
                <header className="mb-5 text-center sm:mb-6">
                    <Link href="/">
                        <h1 className="brand-title-shadow text-3xl font-extrabold tracking-widest text-white sm:text-4xl md:text-[40px]">EDVORA</h1>
                    </Link>
                </header>

                <section className="main-card-shadow w-full rounded-2xl border border-white/60 bg-brand-lightBlue px-6 py-8 text-center sm:rounded-3xl sm:px-10 sm:py-9">
                    <h2 className="text-2xl font-bold tracking-wide text-brand-navy sm:text-[26px]">LUPA KATA SANDI?</h2>
                    <p className="mt-3 text-sm text-brand-grayText">
                        Masukkan alamat email yang terdaftar pada akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
                    </p>

                    {status && (
                        <div role="status" className="mt-4 rounded-lg bg-green-50 p-2 text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-6 space-y-4 text-left">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-brand-navy" htmlFor="email">
                                Email
                            </label>
                            <input
                                className="w-full rounded-xl border border-brand-inputBorder bg-brand-inputBg px-4 py-2.5 text-sm text-brand-navy placeholder-[#8ea6c2] shadow-inner transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                id="email"
                                name="email"
                                placeholder="Masukkan Email"
                                required
                                type="email"
                                value={data.email}
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-1.5" />
                        </div>

                        <div className="flex justify-center pt-3">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-bold tracking-wider text-white shadow-[0_4px_12px_rgba(91,136,221,0.45)] transition-all duration-150 hover:bg-brand-blueHover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'MEMPROSES...' : 'KIRIM TAUTAN PEMULIHAN'}
                            </button>
                        </div>
                    </form>

                    <p className="mt-4 text-xs text-brand-grayText sm:text-sm">Silahkan klik tautan yang berada di dalam email untuk mengubah kata sandi</p>

                    <hr className="my-5 border-brand-inputBorder" />

                    <p className="text-xs text-brand-grayText sm:text-sm">Tidak menerima email? tidak masalah</p>

                    <div className="flex justify-center pt-3">
                        <button
                            type="button"
                            onClick={submit}
                            disabled={processing}
                            className="rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-bold tracking-wider text-white shadow-[0_4px_12px_rgba(91,136,221,0.45)] transition-all duration-150 hover:bg-brand-blueHover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            KIRIM ULANG TAUTAN
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
