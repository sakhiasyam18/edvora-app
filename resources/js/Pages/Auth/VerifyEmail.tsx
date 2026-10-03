import { ClipboardEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';

interface VerifyEmailProps {
    status?: string | null; // pesan berhasil: OTP terkirim otomatis atau lewat Kirim Ulang
    gagalKirim?: boolean; // pengiriman otomatis saat halaman dibuka gagal (SMTP)
    jedaKirimUlang: number; // detik sampai Kirim Ulang boleh ditekan, dihitung server
}

const PANJANG_OTP = 6;
const OTP_KOSONG: string[] = Array(PANJANG_OTP).fill('');

// Verifikasi email dengan OTP 6 digit, dengan konsep tampilan yang sama dengan Login dan Register.
export default function VerifyEmail({ status, gagalKirim = false, jedaKirimUlang }: VerifyEmailProps) {
    const email: string = usePage<any>().props.auth?.user?.email ?? '';

    const [otp, setOtp] = useState<string[]>(OTP_KOSONG);
    const [pesanError, setPesanError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    // Halaman dipasang ulang setelah Kirim Ulang, jadi hitung mundur selalu mulai dari sisa jeda terbaru di server.
    const [countdown, setCountdown] = useState(jedaKirimUlang);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { post, processing } = useForm({});

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleOtpChange = (index: number, val: string) => {
        if (!/^[0-9]?$/.test(val)) return;
        setPesanError(null);
        const nextOtp = [...otp];
        nextOtp[index] = val;
        setOtp(nextOtp);

        if (val && index < PANJANG_OTP - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            const nextOtp = [...otp];
            nextOtp[index - 1] = '';
            setOtp(nextOtp);
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').trim();
        if (/^\d+$/.test(pasted)) {
            const digits = pasted.slice(0, PANJANG_OTP).split('');
            const nextOtp = [...otp];
            digits.forEach((digit, i) => {
                nextOtp[i] = digit;
            });
            setOtp(nextOtp);
            setPesanError(null);
            inputRefs.current[Math.min(digits.length, PANJANG_OTP - 1)]?.focus();
        }
    };

    const handleResend = () => {
        if (countdown > 0 || processing) return;
        // Server mengirim OTP baru lalu kembali ke halaman ini dengan pesan status dan jeda baru.
        post(route('verification.send'), { preserveScroll: true });
    };

    const handleVerification = () => {
        const fullCode = otp.join('');
        if (fullCode.length < PANJANG_OTP) {
            setPesanError('Masukkan 6 digit kode OTP.');
            return;
        }

        setIsVerifying(true);
        router.post(
            route('otp.verify'),
            { otp: fullCode },
            {
                onFinish: () => setIsVerifying(false),
                onError: (errors) => {
                    // Pesan dari server, mis. "Kode OTP salah." atau "Kode OTP sudah kedaluwarsa."
                    setPesanError(errors.otp ?? 'Kode verifikasi tidak valid. Silakan periksa kembali.');
                    setOtp(OTP_KOSONG);
                    inputRefs.current[0]?.focus();
                },
            },
        );
    };

    return (
        <div className="bg-gradient-edvora flex min-h-screen flex-col items-center justify-center p-4 font-poppins antialiased selection:bg-[#5B88DD] selection:text-white sm:p-6">
            <Head title="Verifikasi Email - EDVORA" />

            <main className="flex w-full max-w-[480px] flex-col items-center">
                <header className="mb-5 text-center sm:mb-6">
                    <Link href="/">
                        <h1 className="brand-title-shadow text-3xl font-extrabold tracking-widest text-white sm:text-4xl md:text-[40px]">EDVORA</h1>
                    </Link>
                </header>

                <section className="main-card-shadow w-full rounded-2xl border border-white/60 bg-brand-lightBlue px-6 py-8 text-center sm:rounded-3xl sm:px-10 sm:py-9">
                    <h2 className="text-2xl font-bold tracking-wide text-brand-navy sm:text-[26px]">VERIFIKASI EMAIL</h2>
                    <p className="mt-3 text-sm text-brand-grayText">Masukkan kode OTP 6 digit yang dikirim ke</p>
                    <p className="mt-1 break-all text-sm font-semibold text-brand-navy">{email}</p>

                    {status && (
                        <div role="status" className="mt-4 rounded-lg bg-green-50 p-2 text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}
                    {gagalKirim && (
                        <div role="alert" className="mt-4 rounded-lg bg-red-50 p-2 text-sm font-medium text-red-600">
                            Kode OTP gagal dikirim. Tekan Kirim Ulang untuk mencoba lagi.
                        </div>
                    )}

                    <div className="mt-6 flex justify-center gap-2 sm:gap-3">
                        {otp.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => {
                                    inputRefs.current[idx] = el;
                                }}
                                autoFocus={idx === 0}
                                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                                aria-label={`Digit ${idx + 1} kode OTP`}
                                className={`h-12 w-11 rounded-xl border bg-brand-inputBg text-center text-xl font-bold text-brand-navy shadow-inner transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-blue sm:h-14 sm:w-12 ${
                                    pesanError && !digit ? 'border-red-400' : 'border-brand-inputBorder'
                                }`}
                                inputMode="numeric"
                                maxLength={1}
                                type="text"
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                onPaste={handlePaste}
                            />
                        ))}
                    </div>
                    <InputError message={pesanError ?? undefined} className="mt-2" />

                    <p className="mt-4 text-xs text-brand-grayText sm:text-sm">
                        Tidak menerima kode?{' '}
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={countdown > 0 || processing}
                            className="font-semibold text-brand-navy transition-colors hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-brand-navy"
                        >
                            Kirim Ulang
                        </button>
                        {countdown > 0 && <span className="ml-1 font-semibold text-brand-blue">({countdown}s)</span>}
                    </p>

                    <div className="flex justify-center pt-6">
                        <button
                            type="button"
                            onClick={handleVerification}
                            disabled={isVerifying}
                            className="w-44 rounded-xl bg-brand-blue py-2.5 text-sm font-bold tracking-wider text-white shadow-[0_4px_12px_rgba(91,136,221,0.45)] transition-all duration-150 hover:bg-brand-blueHover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isVerifying ? 'MEMVERIFIKASI...' : 'VERIFIKASI'}
                        </button>
                    </div>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="mt-4 text-xs font-semibold text-brand-navy transition-colors hover:text-brand-blue sm:text-sm"
                    >
                        Kembali ke Halaman Masuk
                    </Link>
                </section>
            </main>
        </div>
    );
}
