import { ReactNode } from 'react';

interface JudulHalamanProps {
    atas: string; // label kecil di atas judul, mis. "BANK SOAL . PU"
    judul: string;
    keterangan?: string;
    // Tombol di kanan judul, mis. Upload Bank Soal dan Tambah Soal.
    aksi?: ReactNode;
}

// Kepala halaman editor: label kecil, judul besar, dan keterangan satu baris.
export default function JudulHalaman({ atas, judul, keterangan, aksi }: JudulHalamanProps) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                <p className="text-sm uppercase text-siswa-teks">{atas}</p>
                <h1 className="mt-1 text-2xl font-bold uppercase text-siswa-judul">{judul}</h1>
                {keterangan && <p className="mt-1 text-sm text-siswa-teks">{keterangan}</p>}
            </div>
            {aksi && <div className="flex flex-wrap gap-3">{aksi}</div>}
        </div>
    );
}
