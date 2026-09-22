import { FormEventHandler, useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { auth } = usePage<any>().props;
    const initialEmail = auth?.user?.email || 'player@gmail.com';
    const [recipientEmail, setRecipientEmail] = useState(initialEmail);

    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [hasError, setHasError] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [countdown, setCountdown] = useState(59);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { post, processing } = useForm({});

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const handleOtpChange = (index: number, val: string) => {
        if (!/^[0-9]?$/.test(val)) return;
        setHasError(false);
        const nextOtp = [...otp];
        nextOtp[index] = val;
        setOtp(nextOtp);

        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
                const nextOtp = [...otp];
                nextOtp[index - 1] = '';
                setOtp(nextOtp);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').trim();
        if (/^\d+$/.test(pasted)) {
            const digits = pasted.slice(0, 6).split('');
            const nextOtp = [...otp];
            digits.forEach((digit, i) => {
                nextOtp[i] = digit;
            });
            setOtp(nextOtp);
            setHasError(false);
            const nextFocus = Math.min(digits.length, 5);
            inputRefs.current[nextFocus]?.focus();
        }
    };

    const handleResend = () => {
        if (countdown > 0 || processing) return;
        post(route('verification.send'), {
            preserveScroll: true,
            onSuccess: () => {
                setCountdown(59);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            },
        });
    };

    const handleVerification = () => {
        const fullCode = otp.join('');
        if (fullCode.length < 6) {
            setHasError(true);
            return;
        }

        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);
            setIsVerified(true);
            setTimeout(() => {
                router.visit('/biodata');
            }, 1000);
        }, 1200);
    };

    const handleEditEmail = () => {
        const newEmail = prompt('Perbarui surel tujuan penerimaan OTP:', recipientEmail);
        if (newEmail && newEmail.includes('@')) {
            setRecipientEmail(newEmail);
            setOtp(['', '', '', '', '', '']);
            setCountdown(59);
            inputRefs.current[0]?.focus();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#A4CEEC] to-[#5B88DD] font-body-md text-body-md text-on-surface flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-container antialiased">
            <Head title="Verifikasi Akun - EDVORA" />

            {/* Header */}
            <header className="w-full pt-margin-mobile md:pt-margin px-margin-mobile md:px-margin">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-space-sm focus:outline-none">
                        <div className="w-10 h-10 rounded-DEFAULT bg-surface-container-lowest flex items-center justify-center shadow-[0_6px_16px_-2px_rgba(38,53,93,0.15)]">
                            <span className="material-symbols-outlined text-primary text-[24px]">school</span>
                        </div>
                        <span className="font-headline-lg text-headline-lg tracking-tight text-on-primary font-bold">
                            EDVORA
                        </span>
                    </Link>
                    <div className="flex items-center gap-space-xs text-on-primary/90 font-label-md text-label-md"></div>
                </div>
            </header>

            {/* Main Section */}
            <main className="w-full flex-1 flex items-center justify-center px-margin-mobile md:px-margin py-margin-mobile md:py-margin">
                <div className="flex flex-col w-full items-center justify-center py-space-md">
                    {/* Subtle decorative ambient radial backdrop */}
                    <div className="relative w-full max-w-[480px] flex flex-col items-center">
                        {/* Decorative Floating Elements */}
                        <div className="absolute -top-10 -left-8 w-28 h-28 rounded-full bg-secondary-container/40 blur-2xl pointer-events-none"></div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-primary-container/20 blur-2xl pointer-events-none"></div>

                        {/* Main Verification Modal Card */}
                        <div className="w-full relative bg-secondary-fixed/50 backdrop-blur-md rounded-lg shadow-xl shadow-on-surface/10 p-space-lg sm:p-space-xl flex flex-col items-center text-center">
                            {/* Security Icon Badge */}
                            <div className="w-16 h-16 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center mb-space-md">
                                <span className="material-symbols-outlined text-primary text-[32px]">mark_email_read</span>
                            </div>

                            {/* Header Titles */}
                            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight uppercase font-bold">
                                Silahkan Verifikasi
                            </h1>
                            <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs max-w-[320px]">
                                Kode keamanan 6-digit telah dikirimkan ke alamat surel Anda.
                            </p>

                            {/* Status notification from Laravel session */}
                            {status === 'verification-link-sent' && (
                                <div className="mt-space-sm px-4 py-2 bg-green-100 text-green-800 rounded-lg text-xs font-medium">
                                    Tautan verifikasi baru telah dikirimkan ke alamat email Anda.
                                </div>
                            )}

                            {/* Target Recipient Pill */}
                            <div className="mt-space-md inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm">
                                <span className="material-symbols-outlined text-secondary text-[16px]">alternate_email</span>
                                <span className="font-label-md text-label-md text-on-surface tracking-wide" id="target-recipient">
                                    {recipientEmail}
                                </span>
                                <button
                                    className="ml-1 text-primary hover:text-tertiary transition-colors flex items-center focus:outline-none"
                                    onClick={handleEditEmail}
                                    title="Ubah email"
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-[15px]">edit</span>
                                </button>
                            </div>

                            {/* OTP Digit Input Matrix */}
                            <div className="w-full mt-space-lg flex flex-col items-center">
                                <label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary mb-space-sm font-semibold">
                                    Masukkan Kode OTP
                                </label>
                                <div className="flex items-center justify-center gap-2 sm:gap-space-sm w-full" id="otp-group">
                                    {[0, 1, 2].map((idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => (inputRefs.current[idx] = el)}
                                            autoFocus={idx === 0}
                                            className={`otp-box w-11 h-13 sm:w-12 sm:h-14 text-center font-headline-md text-headline-md text-on-surface rounded-DEFAULT bg-surface-container-lowest shadow-sm outline-none transition-all duration-150 focus:bg-surface-bright focus:shadow-md ${
                                                hasError && !otp[idx] ? 'bg-error-container/30 border border-error' : ''
                                            }`}
                                            inputMode="numeric"
                                            maxLength={1}
                                            type="text"
                                            value={otp[idx]}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            onPaste={handlePaste}
                                        />
                                    ))}
                                    <span className="font-headline-md text-secondary select-none px-0.5">-</span>
                                    {[3, 4, 5].map((idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => (inputRefs.current[idx] = el)}
                                            className={`otp-box w-11 h-13 sm:w-12 sm:h-14 text-center font-headline-md text-headline-md text-on-surface rounded-DEFAULT bg-surface-container-lowest shadow-sm outline-none transition-all duration-150 focus:bg-surface-bright focus:shadow-md ${
                                                hasError && !otp[idx] ? 'bg-error-container/30 border border-error' : ''
                                            }`}
                                            inputMode="numeric"
                                            maxLength={1}
                                            type="text"
                                            value={otp[idx]}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            onPaste={handlePaste}
                                        />
                                    ))}
                                </div>
                                {hasError && (
                                    <p className="flex text-error font-body-sm text-body-sm mt-space-xs items-center gap-1" id="otp-error">
                                        <span className="material-symbols-outlined text-[16px]">error</span>
                                        <span>Kode verifikasi tidak valid. Silakan periksa kembali.</span>
                                    </p>
                                )}
                            </div>

                            {/* Resend Status & Countdown Section */}
                            <div className="mt-space-md flex flex-col sm:flex-row items-center justify-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                                <span>Tidak menerima kode verifikasi?</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        className={`font-label-md text-label-md transition-colors ${
                                            countdown > 0
                                                ? 'text-secondary cursor-not-allowed opacity-60'
                                                : 'text-primary cursor-pointer underline hover:text-tertiary'
                                        }`}
                                        disabled={countdown > 0 || processing}
                                        id="resend-btn"
                                        onClick={handleResend}
                                        type="button"
                                    >
                                        Kirim Ulang
                                    </button>
                                    {countdown > 0 && (
                                        <span className="font-label-md text-label-md text-primary font-semibold" id="timer-display">
                                            ({countdown}s)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Verification Buttons */}
                            <div className="w-full mt-space-lg flex flex-col gap-space-sm">
                                <button
                                    className={`w-full py-3.5 px-space-lg rounded-full font-label-lg text-label-lg tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-space-xs text-on-primary ${
                                        isVerified
                                            ? 'bg-primary-container'
                                            : 'bg-primary shadow-primary/30 hover:bg-primary-container active:scale-[0.99]'
                                    }`}
                                    id="verify-action"
                                    onClick={handleVerification}
                                    disabled={isVerifying || isVerified}
                                    type="button"
                                >
                                    {isVerifying ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-on-primary" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                            </svg>
                                            <span>Memverifikasi...</span>
                                        </>
                                    ) : isVerified ? (
                                        <>
                                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                            <span>Berhasil Diverifikasi</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Verifikasi Akun</span>
                                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                                <Link
                                    className="w-full py-2.5 text-center font-label-md text-label-md text-secondary hover:text-on-surface transition-colors"
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                >
                                    Kembali ke Halaman Masuk
                                </Link>
                            </div>

                            {/* Security Guarantee Indicator */}
                            <div className="w-full mt-space-lg pt-space-md flex items-center justify-center gap-space-xs text-secondary-fixed-variant">
                                <span className="material-symbols-outlined text-[16px]">lock</span>
                                <span className="font-label-sm text-label-sm">Enkripsi End-to-End • Verifikasi instan tanpa pulsa</span>
                            </div>
                        </div>

                        {/* Student Support Trust Link */}
                        <div className="mt-space-md text-center">
                            <p className="font-label-sm text-label-sm text-on-primary/80">
                                Mengalami kendala? Hubungi{' '}
                                <a className="underline hover:text-on-primary font-medium" href="#">
                                    Pusat Bantuan Edvora
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full pb-margin-mobile md:pb-margin px-margin-mobile md:px-margin">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-space-sm text-center sm:text-left">
                    <span className="font-label-sm text-label-sm text-on-primary/80">
                        © 2024 Edvora Educational Platform. Hak Cipta Dilindungi.
                    </span>
                    <div className="flex items-center gap-space-md font-label-sm text-label-sm text-on-primary/80"></div>
                </div>
            </footer>
        </div>
    );
}
