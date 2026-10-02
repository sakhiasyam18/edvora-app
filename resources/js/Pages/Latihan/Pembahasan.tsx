import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import ArenaPengerjaan, { NavigasiSoal, TombolNavigasiSoal } from '@/Components/Ujian/ArenaPengerjaan';
import KartuSoal, { TeksMatematika } from '@/Components/Ujian/KartuSoal';
import TombolOpsi, { StatusOpsi } from '@/Components/Ujian/TombolOpsi';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import { ModeLatihan, OpsiJawaban, TipeSoal } from '@/types/latihan';

type StatusSoal = 'benar' | 'salah' | 'kosong';

// Satu soal dari PembahasanPengerjaan di backend.
interface SoalPembahasan {
    id: string;
    tipe: TipeSoal;
    teks_soal: string;
    gambar_soal: string | null;
    pembahasan: string;
    opsi_jawaban: OpsiJawaban[];
    kunci: string; // siap tampil: "A. Vierzna", "Vierzna dan Dewi", atau kunci isian
    status: StatusSoal;
    jawaban: { opsiIds: string[]; isian: string | null };
}

interface PembahasanProps {
    pengerjaan: { id: string; namaSubtes: string; mode: ModeLatihan | null };
    soalList: SoalPembahasan[];
}

const GLIF: Record<StatusSoal, string> = {
    benar: 'M7.5 12.4l3 3 6-6.4',
    salah: 'M8.5 8.5l7 7m0-7l-7 7',
    kosong: 'M7.5 12h9',
};

// Lingkaran berwarna dengan glif putih; warna dipakai sebagai fill SVG, jadi berupa hex.
function IkonBulat({ status, warna }: { status: StatusSoal; warna: string }) {
    return (
        <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill={warna} />
            <path d={GLIF[status]} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// Pilihan ganda: kunci selalu hijau; pilihan siswa yang salah merah; opsi lain tetap putih.
function statusOpsiPilihanGanda(opsi: OpsiJawaban, dipilih: boolean): StatusOpsi {
    if (opsi.is_kunci) return 'benar';
    return dipilih ? 'salah' : 'default';
}

/**
 * Benar/salah: warna bilah menunjukkan apakah pilihan siswa sesuai kunci (hanya opsi yang dicentang),
 * sedangkan label kanan menunjukkan nilai kebenaran pernyataan itu sendiri.
 */
function OpsiBenarSalah({ opsi, dipilih }: { opsi: OpsiJawaban; dipilih: boolean }) {
    const bilah = !dipilih
        ? 'border-gray-200 bg-white text-[#1F2D5C]'
        : opsi.is_kunci
          ? 'border-[#2AA94B] bg-[#34C759] text-[#26355D]'
          : 'border-[#E05B5B] bg-[#F07676] text-[#26355D]';
    // Di bilah berwarna label memakai navy seperti halaman ujian; di bilah putih memakai warna nilai kebenarannya.
    const [warnaLabel, teksLabel] = dipilih
        ? ['#26355D', 'text-[#26355D]']
        : opsi.is_kunci
          ? ['#2F9E44', 'text-[#2F9E44]']
          : ['#D64545', 'text-[#D64545]'];

    return (
        <div className="flex items-stretch gap-2">
            <span
                role="img"
                aria-label={dipilih ? 'Dipilih' : 'Tidak dipilih'}
                className="flex w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#2E3F85] shadow-sm"
            >
                {dipilih && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                )}
            </span>

            <div className={`flex flex-1 items-center justify-between gap-3 rounded-lg border px-4 py-2 shadow-sm ${bilah}`}>
                <span>
                    <TeksMatematika teks={opsi.teks_opsi} />
                </span>
                <span className={`flex shrink-0 items-center gap-2 font-medium ${teksLabel}`}>
                    <IkonBulat status={opsi.is_kunci ? 'benar' : 'salah'} warna={warnaLabel} />
                    {opsi.is_kunci ? 'Benar' : 'Salah'}
                </span>
            </div>
        </div>
    );
}

const KARTU: Record<StatusSoal, { judul: string; latar: string; teks: string; warna: string }> = {
    benar: { judul: 'Jawaban Benar', latar: 'bg-[#E4F6DA]', teks: 'text-[#2F9E44]', warna: '#2F9E44' },
    salah: { judul: 'Jawaban Salah', latar: 'bg-[#FDE3E3]', teks: 'text-[#D64545]', warna: '#D64545' },
    kosong: { judul: 'Tidak Dijawab', latar: 'bg-[#EEF0F3]', teks: 'text-[#5B6472]', warna: '#5B6472' },
};

function KartuPembahasan({ soal }: { soal: SoalPembahasan }) {
    const kartu = KARTU[soal.status];

    return (
        <section className={`mt-8 rounded-lg px-5 py-4 shadow-sm ${kartu.latar}`}>
            <h3 className={`flex items-center gap-3 text-lg font-bold ${kartu.teks}`}>
                <IkonBulat status={soal.status} warna={kartu.warna} />
                {kartu.judul}
            </h3>

            <div className="pl-9 text-sm text-[#1F2D5C]">
                <p className="mt-1">
                    Kunci Jawaban:{' '}
                    <span className="font-semibold">
                        <TeksMatematika teks={soal.kunci} />
                    </span>
                </p>

                <h4 className="mt-4 font-semibold">Pembahasan</h4>
                <p className="mt-1 leading-relaxed">
                    <TeksMatematika teks={soal.pembahasan} />
                </p>
            </div>
        </section>
    );
}

// Pembahasan satu pengerjaan dengan gaya halaman ujian: satu soal per tampilan, sidebar nomor soal berwarna.
export default function Pembahasan({ pengerjaan, soalList }: PembahasanProps) {
    const [indeksAktif, setIndeksAktif] = useState(0);
    const soal = soalList[indeksAktif];

    return (
        <LatihanLayout
            breadcrumb={['Riwayat', pengerjaan.namaSubtes, 'Pembahasan']}
            sidebar={
                soalList.length > 0 && (
                    <NavigasiSoal
                        jumlahSoal={soalList.length}
                        indeksAktif={indeksAktif}
                        // Soal kosong = bulatan putih, sama seperti soal yang belum dijawab di halaman ujian.
                        sudahDijawab={(i) => soalList[i].status !== 'kosong'}
                        statusJawaban={(i) => (soalList[i].status === 'kosong' ? null : soalList[i].status)}
                        onPilih={setIndeksAktif}
                        aksiBawah={
                            <Link
                                href={route('riwayat.index')}
                                className="rounded-md bg-white px-4 py-1.5 text-xs font-medium text-[#1F2D5C] shadow transition hover:bg-gray-50"
                            >
                                Kembali ke Riwayat
                            </Link>
                        }
                    />
                )
            }
        >
            <Head title={`Pembahasan ${pengerjaan.namaSubtes}`} />

            {soal ? (
                <ArenaPengerjaan
                    judul={pengerjaan.namaSubtes}
                    footerKanan={
                        <div className="flex gap-2">
                            <TombolNavigasiSoal jumlahSoal={soalList.length} indeksAktif={indeksAktif} onPilih={setIndeksAktif} />
                        </div>
                    }
                >
                    <KartuSoal nomor={indeksAktif + 1} teksSoal={soal.teks_soal} gambarUrl={soal.gambar_soal} />

                    {soal.tipe === 'isian_singkat' ? (
                        <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg text-[#1F2D5C] shadow-sm">
                            {soal.jawaban.isian ? (
                                <span className="break-all">{soal.jawaban.isian}</span>
                            ) : (
                                <span className="italic text-gray-500">Tidak dijawab</span>
                            )}
                        </div>
                    ) : (
                        <div className="mt-4 space-y-2.5">
                            {soal.opsi_jawaban.map((opsi) => {
                                const dipilih = soal.jawaban.opsiIds.includes(String(opsi.id));

                                return soal.tipe === 'benar_salah' ? (
                                    <OpsiBenarSalah key={opsi.id} opsi={opsi} dipilih={dipilih} />
                                ) : (
                                    <TombolOpsi key={opsi.id} opsi={opsi} status={statusOpsiPilihanGanda(opsi, dipilih)} disabled redup={false} />
                                );
                            })}
                        </div>
                    )}

                    <KartuPembahasan soal={soal} />
                </ArenaPengerjaan>
            ) : (
                <div className="px-8 py-6 text-[#1F2D5C]">
                    <p>Belum ada soal yang bisa ditampilkan untuk pengerjaan ini.</p>
                    <Link href={route('riwayat.index')} className="mt-3 inline-block text-sm font-medium text-[#2E3F85] underline">
                        Kembali ke Riwayat
                    </Link>
                </div>
            )}
        </LatihanLayout>
    );
}
