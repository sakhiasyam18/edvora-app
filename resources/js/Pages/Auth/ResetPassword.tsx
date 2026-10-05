import React, { FormEventHandler, useState } from 'react';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onSuccess: () => {
                setIsSuccess(true);
            },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen bg-[#F0F4F9] flex flex-col items-center justify-center p-4">
            <Head title="Ubah Sandi" />

            {/* Logo EDVORA */}
            <div className="mb-6 text-center flex flex-col items-center">
                <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center font-bold text-white text-xl mb-1 shadow-sm">
                    E
                </div>
                <span className="font-extrabold text-[#0F172A] tracking-wider text-xs">EDVORA</span>
            </div>

            {/* Card Container */}
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                {!isSuccess ? (
                    /* UBAH SANDI (Gambar 2) */
                    <div className="flex flex-col items-center">
                        <h2 className="text-base font-bold text-[#1E293B] mb-6 uppercase tracking-wide text-center">
                            UBAH SANDI
                        </h2>

                        <form onSubmit={submit} className="w-full space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Kata Sandi Baru
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Masukkan Sandi Baru"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full px-4 py-2.5 text-xs bg-[#EBF3FC] border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 placeholder-gray-400 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                
                                {/* Indikator Lemah */}
                                {data.password && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="w-1/3 h-full bg-red-500 rounded-full"></div>
                                        </div>
                                        <span className="text-[10px] text-gray-400">Lemah</span>
                                    </div>
                                )}
                                <InputError message={errors.password} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                    Konfirmasi Kata Sandi Baru
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Masukkan ulang Sandi Baru"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full px-4 py-2.5 text-xs bg-[#EBF3FC] border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 placeholder-gray-400 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                                    >
                                        {showConfirmPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <InputError message={errors.password_confirmation} className="mt-1" />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 bg-[#4F80E1] hover:bg-blue-600 text-white font-bold text-[11px] rounded-lg transition-colors shadow-sm uppercase tracking-wider mt-4"
                            >
                                PERBARUI SANDI
                            </button>
                        </form>
                    </div>
                ) : (
                    /* UBAH SANDI BERHASIL (Gambar 3) */
                    <div className="flex flex-col items-center text-center py-2">
                        <p className="text-[11px] text-gray-500 mb-1 tracking-wide">UBAH KATA SANDI</p>
                        <h2 className="text-lg font-bold text-[#1E293B] mb-8 tracking-wide">
                            BERHASIL
                        </h2>

                        <Link
                            href={route('login')}
                            className="w-full py-2.5 bg-[#4F80E1] hover:bg-blue-600 text-white font-bold text-[11px] rounded-lg transition-colors shadow-sm uppercase tracking-wider block"
                        >
                            KEMBALI KE LOGIN
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}