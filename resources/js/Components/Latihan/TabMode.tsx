interface ItemTab<T extends string> {
    mode: T;
    label: string;
    redup?: boolean; // teks abu-abu, mis. Remedial yang belum punya soal; tetap bisa dipilih
}

interface TabModeProps<T extends string> {
    daftar: ItemTab<T>[];
    aktif: T;
    onPilih: (mode: T) => void;
}

/**
 * Sliding radio pilihan mode latihan. Pindah tab murni state di browser, tanpa request ke server.
 */
export default function TabMode<T extends string>({ daftar, aktif, onPilih }: TabModeProps<T>) {
    const urutanAktif = Math.max(0, daftar.findIndex((item) => item.mode === aktif));

    return (
        <div
            role="radiogroup"
            aria-label="Mode latihan"
            className="relative grid grid-cols-3 rounded-panel bg-white p-[2px] shadow-kartu"
        >
            {/* Pil biru penanda tab aktif: satu elemen yang meluncur ke tab terpilih, bukan muncul-hilang per tombol. */}
            <span
                aria-hidden="true"
                className="absolute bottom-[2px] left-[2px] top-[2px] rounded-tombol bg-tab-aktif shadow-panel transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `calc((100% - 4px) / ${daftar.length})`, transform: `translateX(${urutanAktif * 100}%)` }}
            />

            {daftar.map((item) => {
                const terpilih = item.mode === aktif;

                return (
                    <button
                        key={item.mode}
                        type="button"
                        role="radio"
                        aria-checked={terpilih}
                        onClick={() => onPilih(item.mode)}
                        // Hover tab yang tidak aktif: latar biru muda tipis memudar masuk, teks sedikit membesar.
                        className={`group relative h-[52.5px] rounded-tombol px-2 text-[15px] font-medium leading-tight transition-colors duration-300 ease-out lg:text-[18.27px] ${
                            terpilih
                                ? 'text-white'
                                : `${item.redup ? 'text-siswa-tab-nonaktif' : 'text-siswa-tab-teks'} hover:bg-siswa-panel-fleksibel/60`
                        }`}
                    >
                        <span className={`inline-block transition-transform duration-300 ease-out ${terpilih ? '' : 'group-hover:scale-105'}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
