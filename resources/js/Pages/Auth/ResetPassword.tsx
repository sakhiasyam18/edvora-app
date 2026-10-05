import { FormEventHandler, ReactNode, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { HalamanAuth, KartuAuth, KELAS_TOMBOL_UTAMA, KolomAuth } from '@/Components/Auth/BagianAuth';
import InputError from '@/Components/InputError';
import { kekuatanSandi } from '@/lib/kekuatanSandi';

interface ResetPasswordProps {
    token: string;
    email: string;
    berhasil: boolean; // true setelah sandi tersimpan; server kembali ke halaman ini, bukan ke Login
}

// Ubah sandi dari tautan email, dengan tampilan yang sama dengan Lupa Kata Sandi (komponen BagianAuth).
export default function ResetPassword({ token, email, berhasil }: ResetPasswordProps) {
    const [sandiTerlihat, setSandiTerlihat] = useState(false);
    const [konfirmasiTerlihat, setKonfirmasiTerlihat] = useState(false);

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
        <HalamanAuth judulTab="Ubah Kata Sandi - EDVORA">
            <KartuAuth className="px-6 py-8 sm:px-9 sm:py-9">
                {berhasil ? (
                    <div className="flex flex-col items-center text-center">
                        <IkonJudul warna="bg-green-50 text-green-600">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M8 12.5l2.7 2.7L16 9.8" />
                        </IkonJudul>

                        <h2 className="mt-4 text-[22px] font-bold tracking-wide text-brand-navy sm:text-2xl">KATA SANDI BERHASIL DIUBAH</h2>
                        <p className="mt-2 text-[13px] leading-relaxed text-brand-grayText sm:text-sm">Silakan masuk dengan kata sandi baru Anda.</p>

                        <Link href={route('login')} className={`mt-6 ${KELAS_TOMBOL_UTAMA}`}>
                            KEMBALI KE LOGIN
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col items-center text-center">
                            <IkonJudul warna="bg-brand-lightBlue text-brand-blue">
                                <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
                                <path d="M8 10.5V7.5a4 4 0 018 0v3M12 14.5v2.5" />
                            </IkonJudul>

                            <h2 className="mt-4 text-[22px] font-bold tracking-wide text-brand-navy sm:text-2xl">UBAH KATA SANDI</h2>
                            <p className="mt-2 text-[13px] leading-relaxed text-brand-grayText sm:text-sm">Buat kata sandi baru untuk akun Anda.</p>
                        </div>

                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <KolomAuth
                                id="password"
                                label="Kata Sandi Baru"
                                ikon="sandi"
                                name="password"
                                type={sandiTerlihat ? 'text' : 'password'}
                                placeholder="Masukkan Kata Sandi Baru"
                                required
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                                sandiTerlihat={sandiTerlihat}
                                onUbahTerlihat={() => setSandiTerlihat(!sandiTerlihat)}
                                bawah={
                                    // Pengukur kekuatan sandi sama dengan halaman Daftar.
                                    <div className="mt-2 flex items-center gap-3">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-inputBg">
                                            <div className={`h-full rounded-full transition-all duration-300 ${kekuatan.width} ${kekuatan.color}`} />
                                        </div>
                                        <span className="min-w-[48px] text-right text-[12px] font-medium text-brand-grayText">{kekuatan.label}</span>
                                    </div>
                                }
                            />

                            <KolomAuth
                                id="password_confirmation"
                                label="Konfirmasi Kata Sandi Baru"
                                ikon="sandi"
                                name="password_confirmation"
                                type={konfirmasiTerlihat ? 'text' : 'password'}
                                placeholder="Masukkan ulang Kata Sandi"
                                required
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                error={errors.password_confirmation}
                                sandiTerlihat={konfirmasiTerlihat}
                                onUbahTerlihat={() => setKonfirmasiTerlihat(!konfirmasiTerlihat)}
                            />

                            {/* Token kedaluwarsa/tidak valid dan email tidak cocok dikirim server di kunci email; kolom email tidak tampil di halaman ini. */}
                            <InputError message={errors.email} />

                            <div className="pt-2">
                                <button type="submit" disabled={processing} className={KELAS_TOMBOL_UTAMA}>
                                    {processing ? 'MEMPROSES...' : 'PERBARUI KATA SANDI'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </KartuAuth>
        </HalamanAuth>
    );
}

// Ikon penanda halaman di lingkaran berwarna, seperti di Lupa Kata Sandi.
function IkonJudul({ warna, children }: { warna: string; children: ReactNode }) {
    return (
        <span className={`flex h-14 w-14 items-center justify-center rounded-full ${warna}`}>
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {children}
            </svg>
        </span>
    );
}
