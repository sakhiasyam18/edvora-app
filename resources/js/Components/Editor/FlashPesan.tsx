import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// Letakkan di Components/Editor/FlashPesan.tsx. Membaca props.flash.sukses / props.flash.gagal.
export default function FlashPesan() {
    const { props } = usePage<any>();
    const flash = props.flash;
    const [tampil, setTampil] = useState(true);

    useEffect(() => {
        setTampil(true);
        const t = setTimeout(() => setTampil(false), 4000);
        return () => clearTimeout(t);
    }, [flash]);

    if (!tampil || (!flash?.sukses && !flash?.gagal)) return null;

    const sukses = Boolean(flash.sukses);

    return (
        <div
            role="alert"
            className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium ${
                sukses
                    ? 'border-[#C8E6C9] bg-[#E8F5E9] text-[#1B5E20]'
                    : 'border-[#FFCDD2] bg-[#FFEBEE] text-[#B71C1C]'
            }`}
        >
            <span>{sukses ? flash.sukses : flash.gagal}</span>
            <button type="button" onClick={() => setTampil(false)} aria-label="Tutup" className="ml-4 text-lg leading-none">
                ×
            </button>
        </div>
    );
}
