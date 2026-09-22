import { FormEventHandler, useState } from 'react';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const getPasswordStrength = (pwd: string) => {
        if (!pwd) return { label: 'Lemah', width: 'w-1/4', color: 'bg-[#CC1010]' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score >= 3 && pwd.length >= 8) {
            return { label: 'Kuat', width: 'w-full', color: 'bg-[#10B981]' };
        } else if (score >= 2 || pwd.length >= 6) {
            return { label: 'Sedang', width: 'w-3/5', color: 'bg-[#EAA315]' };
        } else {
            return { label: 'Lemah', width: 'w-1/4', color: 'bg-[#CC1010]' };
        }
    };

    const strength = getPasswordStrength(data.password);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Ensure name is present for backend validation compatibility
        if (!data.name && data.email) {
            data.name = data.email.split('@')[0] || 'Pengguna';
        }

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-[#A4CEEC] via-[#85B5EB] to-[#5B88DD] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-[#5B88DD] selection:text-white font-poppins">
            <Head title="Daftar Akun - EDVORA" />

            {/* BEGIN: HeaderSection */}
            <header className="w-full text-center mb-6 sm:mb-8 mt-2" data-purpose="brand-header">
                <Link href="/">
                    <h1 className="brand-title text-3xl sm:text-4xl lg:text-[42px] font-black text-white uppercase tracking-wider inline-block">
                        EDVORA
                    </h1>
                </Link>
            </header>
            {/* END: HeaderSection */}

            {/* BEGIN: AuthContainer */}
            <main className="w-full max-w-[820px] mx-auto flex items-center justify-center" data-purpose="registration-card-wrapper">
                {/* Split Layout Card Container */}
                <div className="w-full bg-[#CAE9FD] rounded-3xl main-card-shadow overflow-hidden flex flex-col md:flex-row transition-all duration-300">
                    {/* BEGIN: WelcomeSidePanel */}
                    <section className="w-full md:w-[38%] bg-white p-8 sm:p-10 flex flex-col justify-center items-center text-center rounded-3xl shadow-sm z-10" data-purpose="welcome-panel">
                        <div className="max-w-[240px] flex flex-col items-center">
                            <h2 className="text-xl sm:text-[22px] font-extrabold text-[#283C63] leading-snug tracking-wide uppercase">
                                SELAMAT<br />BERGABUNG !
                            </h2>
                            <p className="mt-4 text-[13px] sm:text-[14px] leading-relaxed text-[#4A5D78] font-normal">
                                Kami sangat senang melihatmu bergabung. Enjoy ya!
                            </p>
                            <Link
                                className="mt-8 sm:mt-10 inline-block w-full py-2.5 px-4 bg-[#D5E8FD] hover:bg-[#c2ddfb] active:scale-[0.98] transition-all text-[#283C63] text-xs sm:text-[13px] font-bold rounded-xl text-center shadow-sm"
                                href={route('login')}
                            >
                                Sudah punya akun? Masuk
                            </Link>
                        </div>
                    </section>
                    {/* END: WelcomeSidePanel */}

                    {/* BEGIN: RegistrationFormPanel */}
                    <section className="w-full md:w-[62%] bg-[#CAE9FD] p-8 sm:p-10 lg:px-12 flex flex-col justify-center" data-purpose="form-panel">
                        <div className="w-full max-w-[390px] mx-auto">
                            {/* Form Header */}
                            <h2 className="text-2xl sm:text-[26px] font-extrabold text-[#26355D] tracking-wide text-center mb-6">
                                DAFTAR
                            </h2>

                            {/* Register Form */}
                            <form onSubmit={submit} className="space-y-4">
                                {/* Email Field */}
                                <div data-purpose="email-input-group">
                                    <label className="block text-sm sm:text-[14px] font-bold text-[#283C63] mb-1.5 ml-0.5" htmlFor="email">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <input
                                            className="w-full px-4 py-2.5 bg-white/90 focus:bg-white text-sm text-[#283C63] placeholder-[#8A9EB5] border border-[#BFD9F5] focus:border-[#5B88DD] rounded-xl outline-none input-shadow transition-all duration-200"
                                            id="email"
                                            name="email"
                                            placeholder="Masukkan Email"
                                            required
                                            type="email"
                                            value={data.email}
                                            autoComplete="username"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData((prev) => ({
                                                    ...prev,
                                                    email: val,
                                                    name: val ? val.split('@')[0] : prev.name,
                                                }));
                                            }}
                                        />
                                    </div>
                                    <InputError message={errors.email} className="mt-1.5" />
                                </div>

                                {/* Password Field */}
                                <div data-purpose="password-input-group">
                                    <label className="block text-sm sm:text-[14px] font-bold text-[#283C63] mb-1.5 ml-0.5" htmlFor="password">
                                        Kata Sandi
                                    </label>
                                    <div className="relative">
                                        <input
                                            className="w-full pl-4 pr-11 py-2.5 bg-white/90 focus:bg-white text-sm text-[#283C63] placeholder-[#8A9EB5] border border-[#BFD9F5] focus:border-[#5B88DD] rounded-xl outline-none input-shadow transition-all duration-200"
                                            id="password"
                                            name="password"
                                            placeholder="Masukkan Kata Sandi"
                                            required
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            autoComplete="new-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                        {/* Toggle Password Visibility Button */}
                                        <button
                                            aria-label="Toggle password visibility"
                                            className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors focus:outline-none ${showPassword ? 'text-[#5B88DD]' : 'text-[#283C63] hover:text-[#5B88DD]'}`}
                                            data-purpose="password-toggle"
                                            id="togglePassword"
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                                                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                                            </svg>
                                        </button>
                                    </div>
                                    {/* Password Strength Indicator */}
                                    <div className="mt-2 flex items-center gap-2" data-purpose="password-strength-indicator">
                                        <div className="w-32 sm:w-36 h-2 bg-[#E1EDF8] rounded-full overflow-hidden p-0.5 border border-[#BFD5ED]">
                                            <div className={`h-full ${strength.width} ${strength.color} rounded-full transition-all duration-300`}></div>
                                        </div>
                                        <span className="text-[12px] font-medium text-[#283C63]">{strength.label}</span>
                                    </div>
                                    <InputError message={errors.password} className="mt-1.5" />
                                </div>

                                {/* Confirm Password Field */}
                                <div data-purpose="confirm-password-input-group">
                                    <label className="block text-sm sm:text-[14px] font-bold text-[#283C63] mb-1.5 ml-0.5" htmlFor="confirm_password">
                                        Konfirmasi Kata Sandi
                                    </label>
                                    <div className="relative">
                                        <input
                                            className="w-full pl-4 pr-11 py-2.5 bg-white/90 focus:bg-white text-sm text-[#283C63] placeholder-[#8A9EB5] border border-[#BFD9F5] focus:border-[#5B88DD] rounded-xl outline-none input-shadow transition-all duration-200"
                                            id="confirm_password"
                                            name="confirm_password"
                                            placeholder="Masukkan ulang Kata Sandi"
                                            required
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            autoComplete="new-password"
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                        />
                                        {/* Toggle Password Visibility Button */}
                                        <button
                                            aria-label="Toggle confirm password visibility"
                                            className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors focus:outline-none ${showConfirmPassword ? 'text-[#5B88DD]' : 'text-[#283C63] hover:text-[#5B88DD]'}`}
                                            data-purpose="password-toggle"
                                            id="toggleConfirmPassword"
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                                                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                                            </svg>
                                        </button>
                                    </div>
                                    <InputError message={errors.password_confirmation} className="mt-1.5" />
                                </div>

                                {/* Action Button */}
                                <div className="pt-4 flex justify-center" data-purpose="submit-container">
                                    <button
                                        className="w-40 py-2.5 px-6 bg-[#5B88DD] hover:bg-[#4d7ad0] active:scale-95 text-white font-bold text-sm tracking-wider uppercase rounded-xl btn-submit-shadow transition-all duration-150 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        type="submit"
                                        disabled={processing}
                                    >
                                        {processing ? 'MEMPROSES...' : 'DAFTAR'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                    {/* END: RegistrationFormPanel */}
                </div>
            </main>
            {/* END: AuthContainer */}
        </div>
    );
}
