import { useRef } from 'react';
import Modal from '@/Components/Modal';
import { formatTanggalWib } from '@/lib/waktu';

export interface BadgeDiperoleh {
    id: string;
    nama: string;
    syarat: string;
    icon: string;
    diperolehAt: string; // ISO 8601
}

interface DetailBadgeProps {
    badge: BadgeDiperoleh | null;
    onClose: () => void;
}

// Pop-up detail badge (UCS5 2c.2): nama badge, syarat perolehan, dan tanggal diperoleh.
export default function DetailBadge({ badge, onClose }: DetailBadgeProps) {
    // Isi tetap tampil selama animasi menutup, walaupun badge sudah null.
    const terakhir = useRef<BadgeDiperoleh | null>(null);
    if (badge) terakhir.current = badge;
    const isi = badge ?? terakhir.current;

    return (
        <Modal show={badge !== null} onClose={onClose} maxWidth="sm" panelClassName="rounded-[24px]">
            {isi && (
                <div className="flex flex-col items-center px-6 py-7 text-center">
                    <img src={isi.icon} alt="" className="h-20 w-20" />
                    <h3 className="mt-3 text-[20px] font-semibold text-siswa-judul-seksi">{isi.nama}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-siswa-teks">{isi.syarat}</p>
                    <p className="mt-3 text-[12px] text-siswa-teks">Diperoleh {formatTanggalWib(isi.diperolehAt)}</p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-6 h-10 w-full rounded-[10px] bg-edvora-primary text-[14px] font-semibold text-white"
                    >
                        Tutup
                    </button>
                </div>
            )}
        </Modal>
    );
}
