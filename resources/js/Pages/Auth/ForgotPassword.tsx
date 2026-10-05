import React, { FormEventHandler } from 'react';
import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen bg-[#F0F4F9] flex flex-col items-center justify-center p-4">
            <Head title="Lupa Kata Sandi" />

            {/* Logo EDVORA */}
            <div className="mb-6 text-center flex flex-col items-center">
                <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center font-bold text-white text-xl mb-1 shadow-sm">
                    E
                </div>
                <span className="font-extrabold text-[#0F172A] tracking-wider text-xs">EDVORA</span>
            </div>

            {/* Card Container */}
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-base font-bold text-[#1E293B] mb-2 uppercase tracking-wide">
                        LUPA KATA SANDI?
                    </h2>
                    <p className="text-[11px] text-gray-500 mb-6 leading-relaxed max-w-xs">
                        Masukkan alamat email yang terdaftar pada akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
                    </p>

                    {status && (
                        <div className="mb-4 text-xs font-medium text-green-600 bg-green-50 p-2.5 rounded-lg w-full">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="w-full space-y-4">
                        <div>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Masukkan Email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full px-4 py-2.5 text-xs bg-[#EBF3FC] border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 placeholder-gray-400"
                                required
                            />
                            <InputError message={errors.email} className="mt-1 text-left" />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2.5 bg-[#4F80E1] hover:bg-blue-600 text-white font-bold text-[11px] rounded-lg transition-colors shadow-sm uppercase tracking-wider"
                        >
                            KIRIM TAUTAN PEMULIHAN
                        </button>
                    </form>

                    <p className="text-[10px] text-gray-400 my-4 leading-relaxed">
                        Silahkan klik tautan yang berada di dalam email untuk mengubah kata sandi
                    </p>

                    <hr className="w-full border-gray-100 mb-4" />

                    <p className="text-[11px] text-gray-500 mb-3">
                        Tidak menerima email? tidak masalah
                    </p>

                    <button
                        type="button"
                        onClick={submit}
                        disabled={processing}
                        className="w-full py-2.5 bg-[#4F80E1] hover:bg-blue-600 text-white font-bold text-[11px] rounded-lg transition-colors shadow-sm uppercase tracking-wider"
                    >
                        KIRIM ULANG EMAIL VERIFIKASI
                    </button>
                </div>
            </div>
        </div>
    );
}