import { Head, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import BannerSapaan from '@/Components/Beranda/BannerSapaan';
import KartuMenu from '@/Components/Beranda/KartuMenu';
import KartuPenguasaan from '@/Components/Beranda/KartuPenguasaan';
import KartuRekomendasi from '@/Components/Beranda/KartuRekomendasi';

interface TopikRekomendasi {
    topikId: string;
    kodeSubtes: string | null;
    namaTopik: string;
    persen: number;
}

interface PenguasaanSubtes {
    kode: string | null;
    nama: string;
    persen: number; // 0–100, rata-rata semua topik subtes itu
    adaData: boolean; // false = belum ada topik dengan 20 jawaban fleksibel
}

interface SiswaProps {
    judul?: string;
    level: number;
    poin: number;
    rekomendasi: TopikRekomendasi[]; // maks 3; kosong bila belum pernah latihan fleksibel
    penguasaanSubtes: PenguasaanSubtes[];
}

// Isi Beranda, mengikuti desain Figma node 641:3423.
export default function Siswa({ judul = 'Beranda', level, poin, rekomendasi, penguasaanSubtes }: SiswaProps) {
    const user = usePage<any>().props.auth.user;

    return (
        <>
            <Head title={judul} />

            {/* Tanpa batas lebar: kartu ikut melebar sampai tepi layar, sisa ruang di kanan diatur padding <main>. */}
            <div className="w-full space-y-4 font-poppins">
                <BannerSapaan nama={user?.name || 'Siswa'} level={level} poin={poin} />

                <div className="grid grid-cols-1 gap-[21px] md:grid-cols-2 xl:grid-cols-3">
                    <KartuMenu
                        href={route('latihan.index')}
                        prefetch
                        judul="Latihan Soal"
                        keterangan="Kerjakan soal latihan sesuai subtest yang kamu inginkan!"
                        ikon="/images/ikon/kartu-latihan.png"
                        kelasIkon="h-[37.775px] w-[39.68px]"
                        kelasLatarIkon="bg-siswa-ikon-latihan"
                    />

                    {/* Try Out: ada atau tidaknya event try out ditentukan di halaman Try Out, bukan di kartu ini. */}
                    <KartuMenu
                        href={route('tryout.index')}
                        judul="Try Out"
                        keterangan="Latih kemampuan kamu dan dapatkan pengalaman ujian sesungguhnya dengan timer!"
                        ikon="/images/ikon/kartu-tryout.png"
                        kelasIkon="h-[35.568px] w-[36.042px]"
                        kelasLatarIkon="bg-siswa-ikon-tryout"
                    />

                    <div className="md:col-span-2 xl:col-span-1">
                        <KartuRekomendasi rekomendasi={rekomendasi} />
                    </div>
                </div>

                <KartuPenguasaan penguasaanSubtes={penguasaanSubtes} />
            </div>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah ke halaman siswa lain.
Siswa.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
