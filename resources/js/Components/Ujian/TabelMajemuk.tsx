import { OpsiJawaban } from '@/types/latihan';
import { IkonHasil, IsiOpsi } from '@/Components/Ujian/TombolOpsi';

// Opsi latihan (OpsiJawaban) maupun Try Out (OpsiTryOut, tanpa kunci) bisa dipakai sebagai pernyataan.
type PernyataanTabel = Pick<OpsiJawaban, 'id' | 'teks_opsi'> & { label: string; gambar_opsi?: string | null; kunci_kolom?: number | null };

interface TabelMajemukProps<T extends PernyataanTabel> {
    kolom: string[];
    pernyataan: T[];
    // Pilihan siswa: id pernyataan => nomor kolom (mulai 1).
    pilihan: Record<string, number>;
    onPilih?: (opsi: T, nomorKolom: number) => void;
    // Setelah dikunci: sel kunci setiap baris berwarna hijau, pilihan yang keliru merah.
    terkunci?: boolean;
    // Kunci per pernyataan dari balasan latihan.jawab, karena halaman ujian tidak menerima kunci_kolom.
    // Tidak diisi (halaman pembahasan): kunci dibaca dari opsi.kunci_kolom.
    kunci?: Record<string, number | null> | null;
}

// Soal majemuk_tabel: satu baris per pernyataan, satu pilihan per baris. Tampilan dasar, belum didesain.
export default function TabelMajemuk<T extends PernyataanTabel>({
    kolom,
    pernyataan,
    pilihan,
    onPilih,
    terkunci = false,
    kunci: kunciServer,
}: TabelMajemukProps<T>) {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full border-collapse bg-white text-left text-[#1F2D5C]">
                <thead>
                    <tr className="bg-[#2E3F85] text-sm text-white">
                        <th scope="col" className="px-4 py-2 font-medium">
                            Pernyataan
                        </th>
                        {kolom.map((judul) => (
                            <th key={judul} scope="col" className="w-28 px-2 py-2 text-center font-medium">
                                {judul}
                            </th>
                        ))}
                        {terkunci && (
                            <th scope="col" className="w-12 px-2 py-2">
                                <span className="sr-only">Hasil</span>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {pernyataan.map((opsi, baris) => {
                        const dipilih = pilihan[String(opsi.id)];
                        const nomorKunci = kunciServer ? kunciServer[String(opsi.id)] : opsi.kunci_kolom;

                        return (
                            <tr key={opsi.id} className="border-t border-gray-200">
                                <td className="px-4 py-2">
                                    <IsiOpsi opsi={opsi} />
                                </td>
                                {kolom.map((judul, i) => {
                                    const nomor = i + 1;
                                    const aktif = dipilih === nomor;
                                    const kunci = terkunci && nomorKunci === nomor;
                                    const keliru = terkunci && aktif && !kunci;

                                    return (
                                        <td key={judul} className={`px-2 py-2 text-center ${kunci ? 'bg-[#C5EBA8]' : keliru ? 'bg-[#F07676]' : ''}`}>
                                            <button
                                                type="button"
                                                role="radio"
                                                aria-checked={aktif}
                                                aria-label={`Pernyataan ${baris + 1}: ${judul}`}
                                                disabled={terkunci}
                                                onClick={() => onPilih?.(opsi, nomor)}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-300 bg-white transition hover:border-[#2E3F85] disabled:cursor-default disabled:hover:border-gray-300"
                                            >
                                                {aktif && <span className="h-3.5 w-3.5 rounded-full bg-[#2E3F85]" />}
                                            </button>
                                        </td>
                                    );
                                })}
                                {terkunci && (
                                    <td className="px-2 py-2">
                                        <IkonHasil benar={dipilih === nomorKunci} padaWarna={false} />
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
