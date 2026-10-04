interface ItemTab<T extends string> {
    mode: T;
    label: string;
    redup?: boolean; // teks abu-abu, mis. Remedial yang belum punya soal; tetap bisa dipilih
}

interface TabModeProps<T extends string> {
    daftar: ItemTab<T>[];
    aktif: T;
    onPilih: (mode: T) => void;
    label?: string; // nama grup untuk pembaca layar
    ukuran?: 'besar' | 'kecil'; // kecil: tab Pemeringkatan di Peringkat Try Out
}

/**
 * Sliding radio pilihan mode latihan. Pindah tab murni state di browser, tanpa request ke server.
 * Dipakai juga untuk Pemeringkatan Umum/Khusus di Peringkat Try Out (2 tab, onPilih membuka halamannya).
 */
export default function TabMode<T extends string>({ daftar, aktif, onPilih, label = 'Mode latihan', ukuran = 'besar' }: TabModeProps<T>) {
    const urutanAktif = Math.max(0, daftar.findIndex((item) => item.mode === aktif));

    return (
        <div
            role="radiogroup"
            aria-label={label}
            className="relative grid rounded-panel bg-white p-[2px] shadow-kartu"
            style={{ gridTemplateColumns: `repeat(${daftar.length}, minmax(0, 1fr))` }}
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
                        className={`group relative rounded-tombol px-2 font-medium leading-tight transition-colors duration-300 ease-out ${
                            ukuran === 'kecil' ? 'h-10 text-[14px]' : 'h-[52.5px] text-[15px] lg:text-[18.27px]'
                        } ${
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
