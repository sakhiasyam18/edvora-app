import { useState } from 'react';

interface GambarAvatarProps {
    src: string;
    nama: string;
    className?: string;
}

// Gambar avatar. Bila file belum ada di public/images/avatar, tampil huruf pertama nama (RANCANGAN-badge-avatar.md bagian 7).
export default function GambarAvatar({ src, nama, className = '' }: GambarAvatarProps) {
    // Disimpan per src, supaya avatar lain yang dipilih kemudian tetap dicoba dimuat.
    const [srcRusak, setSrcRusak] = useState<string | null>(null);

    if (srcRusak === src) {
        return <span className="font-semibold">{nama.trim().charAt(0).toUpperCase()}</span>;
    }

    return <img src={src} alt={nama} className={className} onError={() => setSrcRusak(src)} />;
}
