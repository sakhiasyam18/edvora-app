import { useEffect, useRef, useState } from 'react';

interface TimerMundurProps {
    durasiMenit: number;
    onHabis?: () => void;
}

function formatWaktu(totalDetik: number) {
    const jam = Math.floor(totalDetik / 3600);
    const menit = Math.floor((totalDetik % 3600) / 60);
    const detik = totalDetik % 60;
    return [jam, menit, detik].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function TimerMundur({ durasiMenit, onHabis }: TimerMundurProps) {
    const [sisaDetik, setSisaDetik] = useState(durasiMenit * 60);
    const onHabisRef = useRef(onHabis);
    onHabisRef.current = onHabis;

    useEffect(() => {
        // Hitung dari waktu selesai, bukan decrement per tick, supaya tetap akurat
        // walaupun interval diperlambat browser saat tab tidak aktif.
        const waktuSelesai = Date.now() + durasiMenit * 60 * 1000;
        setSisaDetik(durasiMenit * 60);

        const interval = setInterval(() => {
            const sisa = Math.max(0, Math.round((waktuSelesai - Date.now()) / 1000));
            setSisaDetik(sisa);
            if (sisa === 0) {
                clearInterval(interval);
                onHabisRef.current?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [durasiMenit]);

    const hampirHabis = sisaDetik <= 60;

    return (
        <div
            role="timer"
            aria-label="Sisa waktu pengerjaan"
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-semibold tabular-nums text-white shadow-md transition-colors ${
                hampirHabis ? 'bg-[#D64545]' : 'bg-[#1F2D5C]'
            }`}
        >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 10.4l3.2 1.9-.8 1.3L11 13V7h2v5.4z" />
            </svg>
            {formatWaktu(sisaDetik)}
        </div>
    );
}
