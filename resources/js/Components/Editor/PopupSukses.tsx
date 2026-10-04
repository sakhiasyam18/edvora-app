import Modal from '@/Components/Modal';

interface PopupSuksesProps {
    pesan: string | null; // null = tertutup
    tombol?: string;
    onTombol?: () => void; // tanpa ini tombol hanya menutup pop-up
    onTutup: () => void;
}

// Pop-up berhasil (desain: notif sukses upload dan edit soal): centang hijau, "SUCCESS!!!", pesan, dan satu tombol.
export default function PopupSukses({ pesan, tombol = 'Oke', onTombol, onTutup }: PopupSuksesProps) {
    return (
        <Modal show={pesan !== null} maxWidth="sm" onClose={onTutup} panelClassName="rounded-[20px]">
            <div className="relative px-6 pb-6 pt-6 text-center font-poppins">
                <button type="button" onClick={onTutup} aria-label="Tutup" className="absolute right-4 top-3 text-xl font-bold text-siswa-judul">
                    ×
                </button>
                <svg className="mx-auto h-16 w-16 text-siswa-titik-benar" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <circle cx="12" cy="12" r="10.5" strokeWidth={1.4} />
                    <path d="M7.5 12.5l3 3 6-6.5" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 font-semibold text-siswa-titik-benar">SUCCESS!!!</p>
                <p className="mt-1 text-sm text-siswa-judul">{pesan}</p>
                <button
                    type="button"
                    onClick={onTombol ?? onTutup}
                    className="mt-4 rounded-lg bg-ujian-biru px-12 py-2 text-xs font-medium text-white shadow-panel transition hover:opacity-90"
                >
                    {tombol}
                </button>
            </div>
        </Modal>
    );
}
