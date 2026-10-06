import { ReactNode } from 'react';

interface TombolMulaiProps {
    onClick: () => void;
    disabled?: boolean;
    children?: ReactNode;
}

/** Tombol lebar "Mulai Mengerjakan →" di bawah panel mode. */
export default function TombolMulai({ onClick, disabled, children = 'Mulai Mengerjakan →' }: TombolMulaiProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="h-[52.5px] w-full rounded-tombol bg-tombol-mulai text-[18.27px] font-semibold text-white shadow-panel transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
        >
            {children}
        </button>
    );
}
