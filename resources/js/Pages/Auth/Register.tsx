import { FormEventHandler, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { HalamanAuth, KartuAuth, KELAS_TOMBOL_UTAMA, KolomAuth, PanelSambutan, TautanKembali } from '@/Components/Auth/BagianAuth';
import { kekuatanSandi } from '@/lib/kekuatanSandi';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const strength = kekuatanSandi(data.password);

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
        <HalamanAuth judulTab="Daftar Akun - EDVORA" lebar="max-w-[860px]">
            <KartuAuth className="flex flex-col md:flex-row">
                {/* Panel sambutan */}
                <PanelSambutan
                    judul={
                        <>
                            SELAMAT
                            <br />
                            BERGABUNG !
                        </>
                    }
                    teks="Kami sangat senang melihatmu bergabung. Enjoy ya!"
                    href={route('login')}
                    labelTautan="Sudah punya akun? Masuk"
                />

                {/* Panel formulir */}
                <div className="flex w-full flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 md:w-[58%]">
                    <h2 className="text-center text-[22px] font-bold tracking-wide text-brand-navy sm:text-2xl">DAFTAR</h2>

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
                            onChange={(e) => {
                                const val = e.target.value;
                                setData((prev) => ({
                                    ...prev,
                                    email: val,
                                    name: val ? val.split('@')[0] : prev.name,
                                }));
                            }}
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
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                            sandiTerlihat={showPassword}
                            onUbahTerlihat={() => setShowPassword(!showPassword)}
                            labelTombolMata="Toggle password visibility"
                            bawah={
                                // Pengukur kekuatan sandi selebar kolom, dengan label di kanan.
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-inputBg">
                                        <div className={`h-full rounded-full transition-all duration-300 ${strength.width} ${strength.color}`} />
                                    </div>
                                    <span className="min-w-[48px] text-right text-[12px] font-medium text-brand-grayText">{strength.label}</span>
                                </div>
                            }
                        />

                        <KolomAuth
                            id="confirm_password"
                            label="Konfirmasi Kata Sandi"
                            ikon="sandi"
                            name="confirm_password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Masukkan ulang Kata Sandi"
                            required
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            error={errors.password_confirmation}
                            sandiTerlihat={showConfirmPassword}
                            onUbahTerlihat={() => setShowConfirmPassword(!showConfirmPassword)}
                            labelTombolMata="Toggle confirm password visibility"
                        />

                        <div className="pt-2">
                            <button className={KELAS_TOMBOL_UTAMA} type="submit" disabled={processing}>
                                {processing ? 'MEMPROSES...' : 'DAFTAR'}
                            </button>
                        </div>
                    </form>
                </div>
            </KartuAuth>

            {/* Kembali ke landing page, di bawah kartu supaya tidak bersaing dengan tombol formulir. */}
            <TautanKembali href="/" label="Kembali ke Beranda" />
        </HalamanAuth>
    );
}
