import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import ArenaPengerjaan, { NavigasiSoal } from '@/Components/Ujian/ArenaPengerjaan';
import KartuPembahasan, { StatusPembahasan } from '@/Components/Ujian/KartuPembahasan';
import KartuSoal, { TeksMatematika } from '@/Components/Ujian/KartuSoal';
import TabelMajemuk from '@/Components/Ujian/TabelMajemuk';
import TombolOpsi, { BulatanCentang, IkonHasil, StatusOpsi } from '@/Components/Ujian/TombolOpsi';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import { ModeLatihan, OpsiJawaban, TipeSoal } from '@/types/latihan';

type StatusSoal = StatusPembahasan;

// Satu soal dari PembahasanPengerjaan di backend.
interface SoalPembahasan {
    id: string;
    tipe: TipeSoal;
    teks_soal: string;
    gambar_soal: string | null;
    pembahasan: string;
    gambar_pembahasan: string | null;
    kolom_tabel: string[] | null; // majemuk_tabel: judul kolom tabel
    opsi_jawaban: OpsiJawaban[];
    kunci: string; // siap tampil: "A. Vierzna", "Vierzna dan Dewi", "1. Benar; 2. Salah", atau kunci isian
    status: StatusSoal;
    // pilihanKolom hanya untuk majemuk_tabel: id pernyataan => nomor kolom (mulai 1).
    jawaban: { opsiIds: string[]; isian: string | null; pilihanKolom: Record<string, number> | null };
}

interface PembahasanProps {
    pengerjaan: { id: string; namaSubtes: string; mode: ModeLatihan | null };
    soalList: SoalPembahasan[];
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
    const bilah = !dipilih ? 'bg-white text-siswa-judul' : opsi.is_kunci ? 'bg-ujian-hijau text-white' : 'bg-ujian-merah text-white';
    // Di bilah berwarna label putih; di bilah putih label memakai warna nilai kebenarannya.
    const teksLabel = dipilih ? '' : opsi.is_kunci ? 'text-siswa-umpan-benar-teks' : 'text-siswa-umpan-salah-teks';

    return (
        <div className="flex min-h-11 overflow-hidden rounded-[10px] text-[13px] font-semibold shadow-panel">
            <span
                role="img"
                aria-label={dipilih ? 'Dipilih' : 'Tidak dipilih'}
                className="flex w-[46px] shrink-0 items-center justify-center border-r border-siswa-ujian-garis bg-white"
            >
                <BulatanCentang dipilih={dipilih} />
            </span>

            <div className={`flex flex-1 items-center justify-between gap-3 px-4 py-2.5 ${bilah}`}>
                <span>
                    <TeksMatematika teks={opsi.teks_opsi} />
                </span>
                <span className={`flex shrink-0 items-center gap-1.5 font-medium ${teksLabel}`}>
                    <IkonHasil benar={opsi.is_kunci} padaWarna={dipilih} />
                    {opsi.is_kunci ? 'Benar' : 'Salah'}
                </span>
            </div>
        </div>
    );
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
                        <KartuSoal nomor={indeksAktif + 1} teksSoal={soal.teks_soal} gambarUrl={soal.gambar_soal} />

                        {soal.tipe === 'isian_singkat' ? (
                            <div className="mt-3 flex min-h-11 items-center rounded-[10px] bg-white px-4 py-2.5 text-sm font-semibold text-siswa-judul shadow-panel">
                                {soal.jawaban.isian ? (
                                    <span className="break-all">{soal.jawaban.isian}</span>
                                ) : (
                                    <span className="font-medium italic text-siswa-teks">Tidak dijawab</span>
                                )}
                            </div>
                        ) : soal.tipe === 'majemuk_tabel' ? (
                            <div className="mt-3">
                                <TabelMajemuk
                                    kolom={soal.kolom_tabel ?? []}
                                    pernyataan={soal.opsi_jawaban}
                                    pilihan={soal.jawaban.pilihanKolom ?? {}}
                                    terkunci
                                />
                            </div>
                        ) : (
                            <div className="mt-3 space-y-2.5">
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

                        <KartuPembahasan status={soal.status} kunci={soal.kunci} pembahasan={soal.pembahasan} gambar={soal.gambar_pembahasan} />
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
