// Judul setiap bagian landing page: label kecil, judul, dan kalimat pengantar, rata tengah.
export default function JudulBagian({ label, judul, pengantar }: { label: string; judul: string; pengantar?: string }) {
    return (
        <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-edvora-primary">{label}</p>
            <h2 className="mt-2 text-[28px] font-bold leading-tight text-siswa-judul sm:text-[34px]">{judul}</h2>
            {pengantar && <p className="mt-3 text-[15px] leading-relaxed text-siswa-teks">{pengantar}</p>}
        </div>
    );
}
