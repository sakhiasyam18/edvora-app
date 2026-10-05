import { useEffect } from 'react';

interface ToastGagalProps {
    pesan: string[]; // satu kotak per pesan; kosong = tidak tampil
    onHilang: () => void;
}

// Notifikasi gagal di atas halaman (desain: "Unggah File Gagal!", "Perubahan Belum Berhasil"). Hilang sendiri
// setelah 5 detik, atau saat diklik.
export default function ToastGagal({ pesan, onHilang }: ToastGagalProps) {
    useEffect(() => {
        if (pesan.length === 0) {
            return;
        }

        const waktu = window.setTimeout(onHilang, 5000);

        return () => window.clearTimeout(waktu);
        // onHilang sengaja tidak ikut: fungsi baru tiap render akan mengulang hitungan 5 detik.
    }, [pesan]);

    if (pesan.length === 0) {
        return null;
    }

    return (
        <div role="alert" className="fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 font-poppins">
            {pesan.map((p) => (
                <button
                    key={p}
                    type="button"
                    onClick={onHilang}
                    className="flex animate-muncul-halus items-center gap-3 rounded-2xl border border-siswa-titik-salah bg-white px-5 py-3 text-left text-lg font-semibold text-siswa-titik-salah shadow-lg md:text-2xl"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-siswa-titik-salah text-xl">!</span>
                    {p}
                </button>
            ))}
        </div>
    );
}
