import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import ArenaPengerjaan, { NavigasiSoal } from '@/Components/Ujian/ArenaPengerjaan';
import IsiPembahasan, { SoalPembahasan } from '@/Components/Ujian/IsiPembahasan';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import { ModeLatihan } from '@/types/latihan';

interface PembahasanProps {
    pengerjaan: { id: string; namaSubtes: string; mode: ModeLatihan | null };
    soalList: SoalPembahasan[];
}

// Pembahasan satu pengerjaan dengan gaya halaman ujian: satu soal per tampilan, sidebar nomor soal berwarna.
export default function Pembahasan({ pengerjaan, soalList }: PembahasanProps) {
    const [indeksAktif, setIndeksAktif] = useState(0);
    const soal = soalList[indeksAktif];
    const namaMode = pengerjaan.mode ? { fleksibel: 'Fleksibel', simulasi: 'Simulasi', remedial: 'Remedial' }[pengerjaan.mode] : null;

    return (
        <LatihanLayout
            breadcrumb={[
                { label: 'Riwayat', href: route('riwayat.index') },
                namaMode ? `${pengerjaan.namaSubtes} (Mode ${namaMode})` : pengerjaan.namaSubtes,
                'Pembahasan',
            ]}
            sidebar={
                soalList.length > 0 && (
                    <NavigasiSoal
                        judul={pengerjaan.namaSubtes}
                        jumlahSoal={soalList.length}
                        indeksAktif={indeksAktif}
                        // Soal kosong = bulatan putih, sama seperti soal yang belum dijawab di halaman ujian.
                        sudahDijawab={(i) => soalList[i].status !== 'kosong'}
                        statusJawaban={(i) => (soalList[i].status === 'kosong' ? null : soalList[i].status)}
                        onPilih={setIndeksAktif}
                        aksiBawah={
                            <Link
                                href={route('riwayat.index')}
                                className="flex h-10 w-full items-center justify-center rounded-lg border border-siswa-ujian-garis bg-white text-[13px] font-semibold text-siswa-judul shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                            >
                                ← Kembali ke Riwayat
                            </Link>
                        }
                    />
                )
            }
        >
            <Head title={`Pembahasan ${pengerjaan.namaSubtes}`} />

            {soal ? (
                <ArenaPengerjaan judul={`Soal ${indeksAktif + 1} dari ${soalList.length}`}>
                    {/* key: isi soal muncul pelan setiap pindah nomor. */}
                    <div key={soal.id} className="animate-muncul-halus">
                        <IsiPembahasan soal={soal} nomor={indeksAktif + 1} />
                    </div>
                </ArenaPengerjaan>
            ) : (
                <div className="px-8 py-6 text-siswa-judul">
                    <p>Belum ada soal yang bisa ditampilkan untuk pengerjaan ini.</p>
                    <Link href={route('riwayat.index')} className="mt-3 inline-block text-sm font-medium text-edvora-primary underline">
                        Kembali ke Riwayat
                    </Link>
                </div>
            )}
        </LatihanLayout>
    );
}
