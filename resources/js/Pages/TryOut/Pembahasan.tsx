import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import ArenaPengerjaan, { NavigasiSoal } from '@/Components/Ujian/ArenaPengerjaan';
import IsiPembahasan, { SoalPembahasan } from '@/Components/Ujian/IsiPembahasan';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';

interface PembahasanTryOutProps {
    paket: { id: string; judul: string };
    subtes: { urutan: number; nama: string; jumlahSubtes: number };
    daftarSubtes: { urutan: number; nama: string }[];
    sebelumnya: number | null; // urutan subtes sebelumnya; null di subtes pertama
    berikutnya: number | null; // urutan subtes berikutnya; null di subtes terakhir
    soalList: SoalPembahasan[];
}

// Gaya tombol sama dengan tombol "Kembali ke Riwayat" di pembahasan latihan.
const kelasTombol =
    'flex h-10 w-full items-center justify-center rounded-lg border border-siswa-ujian-garis bg-white px-4 text-[13px] font-semibold text-siswa-judul shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md';

// Pembahasan Try Out per subtes (RANCANGAN-peringkat-pembahasan-tryout.md 4.4): layout sama dengan halaman Kerjakan,
// ditambah pilihan subtes dan pindah subtes di soal pertama/terakhir. Tampilan polos; penataan Figma menyusul.
export default function Pembahasan({ paket, subtes, daftarSubtes, sebelumnya, berikutnya, soalList }: PembahasanTryOutProps) {
    const [indeksAktif, setIndeksAktif] = useState(0);
    const soal = soalList[indeksAktif];
    const soalTerakhir = indeksAktif >= soalList.length - 1;
    const keSubtes = (urutan: number) => route('tryout.pembahasan', [paket.id, urutan]);

    return (
        <LatihanLayout
            judulTengah={`Pembahasan ${paket.judul}`}
            sidebar={
                <NavigasiSoal
                    judul={subtes.nama}
                    jumlahSoal={soalList.length}
                    indeksAktif={indeksAktif}
                    // Soal kosong = bulatan putih, sama seperti pembahasan latihan.
                    sudahDijawab={(i) => soalList[i].status !== 'kosong'}
                    statusJawaban={(i) => (soalList[i].status === 'kosong' ? null : soalList[i].status)}
                    onPilih={setIndeksAktif}
                    aksiBawah={
                        <div className="space-y-2">
                            {/* Pilihan subtes (UCS2: dropdown). */}
                            <select
                                value={subtes.urutan}
                                onChange={(e) => router.visit(keSubtes(Number(e.target.value)))}
                                aria-label="Pilih subtes"
                                className="h-10 w-full rounded-lg border border-siswa-ujian-garis bg-white text-[13px] text-siswa-judul"
                            >
                                {daftarSubtes.map((s) => (
                                    <option key={s.urutan} value={s.urutan}>
                                        {s.urutan}. {s.nama}
                                    </option>
                                ))}
                            </select>
                            <Link href={route('tryout.hasil', paket.id)} className={kelasTombol}>
                                ← Kembali ke Hasil Pengerjaan
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={`Pembahasan ${subtes.nama} - ${paket.judul}`} />

            {soal ? (
                <ArenaPengerjaan
                    judul={`Subtes ${subtes.urutan} dari ${subtes.jumlahSubtes} · Soal ${indeksAktif + 1} dari ${soalList.length}`}
                    footerKiri={
                        indeksAktif > 0 ? (
                            <button type="button" onClick={() => setIndeksAktif(indeksAktif - 1)} className={kelasTombol}>
                                ‹ Sebelumnya
                            </button>
                        ) : (
                            sebelumnya !== null && (
                                <Link href={keSubtes(sebelumnya)} className={kelasTombol}>
                                    ‹ Subtes Sebelumnya
                                </Link>
                            )
                        )
                    }
                    footerKanan={
                        !soalTerakhir ? (
                            <button type="button" onClick={() => setIndeksAktif(indeksAktif + 1)} className={kelasTombol}>
                                Berikutnya ›
                            </button>
                        ) : berikutnya !== null ? (
                            <Link href={keSubtes(berikutnya)} className={kelasTombol}>
                                Subtes Berikutnya ›
                            </Link>
                        ) : (
                            <Link href={route('tryout.hasil', paket.id)} className={kelasTombol}>
                                Kembali ke Hasil
                            </Link>
                        )
                    }
                >
                    {/* key: isi soal muncul pelan setiap pindah nomor. */}
                    <div key={soal.id} className="animate-muncul-halus">
                        <IsiPembahasan soal={soal} nomor={indeksAktif + 1} />
                    </div>
                </ArenaPengerjaan>
            ) : (
                <div className="px-8 py-6 text-siswa-judul">
                    <p>Belum ada soal yang bisa ditampilkan untuk subtes ini.</p>
                </div>
            )}
        </LatihanLayout>
    );
}
