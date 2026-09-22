import { FormEventHandler, useState } from 'react';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }: { status?: string; canResetPassword?: boolean }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="bg-gradient-edvora flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 select-none font-poppins antialiased selection:bg-[#5B88DD] selection:text-white">
            <Head title="EDVORA - Masuk" />

            {/* MainContainer */}
            <main className="w-full max-w-[820px] flex flex-col items-center">
                {/* BrandHeader */}
                <header className="mb-5 sm:mb-6 text-center" data-purpose="brand-header">
                    <Link href="/">
                        <h1 className="text-3xl sm:text-4xl md:text-[40px] font-extrabold tracking-widest text-white brand-title-shadow">
                            EDVORA
                        </h1>
                    </Link>
                </header>

                {/* CardWrapper */}
                <section className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-[0_12px_35px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col md:flex-row" data-purpose="auth-card">
                    {/* LeftFormPanel */}
                    <div className="w-full md:w-[58%] px-6 py-8 sm:px-10 sm:py-10 flex flex-col justify-center" data-purpose="login-form-panel">
                        <h2 className="text-2xl sm:text-[26px] font-bold text-brand-navy text-center mb-6 tracking-wide">
                            MASUK
                        </h2>

                        {status && (
                            <div className="mb-4 text-sm font-medium text-green-600 text-center bg-green-50 p-2 rounded-lg">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4" data-purpose="login-form">
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-navy mb-1.5" htmlFor="email">
                                    Email
                                </label>
                                <div className="relative">
                                    <input
                                        className="w-full px-4 py-2.5 rounded-xl border border-brand-inputBorder bg-brand-inputBg text-brand-navy placeholder-[#8ea6c2] text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-inner"
                                        id="email"
                                        name="email"
                                        placeholder="Masukkan Email"
                                        required
                                        type="email"
                                        value={data.email}
                                        autoComplete="username"
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-1.5" />
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-sm font-semibold text-brand-navy mb-1.5" htmlFor="password">
                                    Kata Sandi
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-brand-inputBorder bg-brand-inputBg text-brand-navy placeholder-[#8ea6c2] text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-inner"
                                        id="password"
                                        name="password"
                                        placeholder="Masukkan Kata Sandi"
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    {/* Password Toggle Visibility Button */}
                                    <button
                                        aria-label="Tampilkan atau sembunyikan kata sandi"
                                        className="absolute right-3.5 text-brand-navy hover:text-brand-blue transition-colors focus:outline-none"
                                        data-purpose="password-visibility-toggle"
                                        id="togglePassword"
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            /* Eye Off Icon */
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        ) : (
                                            /* Eye Icon */
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-1.5" />
                            </div>

                            {/* Options: Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between text-xs sm:text-xs pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-brand-navy font-medium select-none">
                                    <input
                                        className="w-4 h-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue focus:ring-offset-0 cursor-pointer"
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                    />
                                    <span>Ingat Saya</span>
                                </label>
                                {canResetPassword !== false && (
                                    <Link
                                        className="text-brand-navy font-semibold hover:text-brand-blue transition-colors"
                                        href={route('password.request')}
                                    >
                                        Lupa Sandi
                                    </Link>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-3 flex justify-center">
                                <button
                                    className="w-44 py-2.5 bg-brand-blue hover:bg-brand-blueHover text-white font-bold text-sm tracking-wider rounded-xl shadow-[0_4px_12px_rgba(91,136,221,0.45)] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                    type="submit"
                                    disabled={processing}
                                >
                                    {processing ? 'MEMPROSES...' : 'MASUK'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RightWelcomePanel */}
                    <div className="w-full md:w-[42%] bg-brand-lightBlue p-8 sm:p-10 flex flex-col items-center justify-center text-center rounded-2xl md:rounded-l-2xl md:rounded-r-none m-0 sm:m-0" data-purpose="welcome-panel">
                        <h3 className="text-base sm:text-lg font-bold text-brand-navy tracking-wider mb-2 sm:mb-3 leading-snug">
                            SELAMAT DATANG<br className="hidden sm:block" /> KEMBALI !
                        </h3>
                        <p className="text-xs sm:text-sm text-brand-grayText font-normal leading-relaxed max-w-[210px] mb-6 sm:mb-8">
                            Kami sangat senang melihatmu kembali. Kami harap kamu betah
                        </p>
                        {/* Redirect to Registration */}
                        <Link
                            className="inline-block w-full max-w-[220px] py-2.5 px-4 bg-white text-brand-navy hover:text-brand-blue font-semibold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition-all duration-150 active:scale-95"
                            data-purpose="register-redirect-button"
                            href={route('register')}
                        >
                            Tidak punya akun? Daftar
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
