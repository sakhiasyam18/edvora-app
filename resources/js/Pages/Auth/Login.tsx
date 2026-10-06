import { FormEventHandler, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { HalamanAuth, KartuAuth, KELAS_TOMBOL_UTAMA, KolomAuth, PanelSambutan, PesanStatus, TautanKembali } from '@/Components/Auth/BagianAuth';

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
        <HalamanAuth judulTab="EDVORA - Masuk" lebar="max-w-[860px]">
            <KartuAuth className="flex flex-col md:flex-row">
                {/* Panel formulir */}
                <div className="flex w-full flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 md:w-[58%]">
                    <h2 className="text-center text-[22px] font-bold tracking-wide text-brand-navy sm:text-2xl">MASUK</h2>

                    {status && (
                        <div className="mt-5">
                            <PesanStatus>{status}</PesanStatus>
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-6 space-y-4">
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

                        <KolomAuth
                            id="password"
                            label="Kata Sandi"
                            ikon="sandi"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Masukkan Kata Sandi"
                            required
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                            sandiTerlihat={showPassword}
                            onUbahTerlihat={() => setShowPassword(!showPassword)}
                        />

                        {/* Ingat Saya & Lupa Sandi */}
                        <div className="flex items-center justify-between pt-0.5 text-[13px]">
                            <label className="flex cursor-pointer select-none items-center gap-2 font-medium text-brand-navy">
                                <input
                                    className="h-4 w-4 cursor-pointer rounded border-brand-inputBorder text-brand-blue focus:ring-brand-blue focus:ring-offset-0"
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span>Ingat Saya</span>
                            </label>
                            {canResetPassword !== false && (
                                <Link className="font-semibold text-brand-blue transition-colors hover:text-brand-blueHover hover:underline" href={route('password.request')}>
                                    Lupa Sandi
                                </Link>
                            )}
                        </div>

                        <div className="pt-2">
                            <button className={KELAS_TOMBOL_UTAMA} type="submit" disabled={processing}>
                                {processing ? 'MEMPROSES...' : 'MASUK'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Panel sambutan */}
                <PanelSambutan
                    judul={
                        <>
                            SELAMAT DATANG
                            <br className="hidden sm:block" /> KEMBALI !
                        </>
                    }
                    teks="Kami sangat senang melihatmu kembali. Kami harap kamu betah"
                    href={route('register')}
                    labelTautan="Tidak punya akun? Daftar"
                />
            </KartuAuth>

            {/* Kembali ke landing page, di bawah kartu supaya tidak bersaing dengan tombol formulir. */}
            <TautanKembali href="/" label="Kembali ke Beranda" />
        </HalamanAuth>
    );
}
