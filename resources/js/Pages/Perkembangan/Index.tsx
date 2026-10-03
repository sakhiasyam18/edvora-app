import { Head, Link } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import Modal from '@/Components/Modal';
import GrafikTryOut, { TitikTryOut } from '@/Components/Perkembangan/GrafikTryOut';
import { formatWaktuWib } from '@/lib/waktu';
import { LabelPenguasaan } from '@/types/latihan';

interface RemedialSubtes {
    kode: string | null;
    nama: string;
    jumlah: number; // > 0
}

interface TryOutSelesai {
    id: string; // try_out.id
    judul: string;
    selesaiPada: string; // ISO, waktu siswa selesai
    periodeSelesai: string; // ISO, akhir periode paket
    skor: number | null; // null = belum dinilai IRT
}

interface TopikHeatmap {
    id: string;
    nama: string;
    persen: number; // 0–100 (K14)
    label: LabelPenguasaan;
    nJendela: number; // isi jendela 0–20
}

interface SubtesHeatmap {
    kode: string | null;
    nama: string;
    persen: number; // rata-rata persen topik subtes ini
    topikList: TopikHeatmap[];
}

interface TopikRekomendasi {
    topikId: string;
    kodeSubtes: string | null;
    namaTopik: string;
    persen: number;
}

interface PerkembanganProps {
    totalSoalDikerjakan: number;
    remedial: { total: number; perSubtes: RemedialSubtes[] };
    tryOutList: TryOutSelesai[]; // urut waktu selesai
    penguasaan: SubtesHeatmap[]; // 7 subtes, urut subtes.urutan
    batasJendela: number; // 20
    rekomendasi: TopikRekomendasi[]; // maks 3
}

// Warna card heatmap per label (UCS4). Kelas sementara; warna akhir ditentukan desain frontend.
const LABEL: Record<LabelPenguasaan, { teks: string; warna: string }> = {
    belum_cukup_data: { teks: 'Belum Cukup Data', warna: 'bg-gray-200' },
    belum_dikuasai: { teks: 'Belum Dikuasai', warna: 'bg-red-200' },
    berkembang: { teks: 'Berkembang', warna: 'bg-yellow-200' },
    dikuasai: { teks: 'Dikuasai', warna: 'bg-green-200' },
};

const kartu = 'rounded-xl bg-white px-6 py-5 shadow-md';
const tombolUtama = 'rounded-lg bg-edvora-primary px-4 py-2 text-sm font-medium text-white hover:bg-edvora-primary-hover';

// Perkembangan Belajar (UCS4, RANCANGAN-perkembangan.md). Susunan saja, belum didesain.
export default function Perkembangan({ totalSoalDikerjakan, remedial, tryOutList, penguasaan, batasJendela, rekomendasi }: PerkembanganProps) {
    const [pilihRemedial, setPilihRemedial] = useState(false);

    return (
        <>
            <Head title="Perkembangan Belajar" />

            <div className="w-full max-w-[1000px] space-y-5 text-brand-navy">
                <section className={kartu}>
                    <h1 className="text-2xl font-bold">Perkembangan Belajar</h1>
                    <p className="mt-1 text-sm text-brand-grayText">Pantau perkembanganmu dan raih skor UTBK terbaik!</p>
                </section>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <section className={kartu}>
                        <h2 className="font-semibold">Total Soal Dikerjakan</h2>
                        <p className="mt-2 text-4xl font-bold">{totalSoalDikerjakan}</p>
                    </section>

                    <section className={kartu}>
                        <h2 className="font-semibold">Antrean Remedial</h2>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-4xl font-bold">{remedial.total}</p>
                            {/* Remedial dikerjakan per subtes (SDD 5.3.3), jadi siswa memilih subtesnya dulu. */}
                            <button
                                type="button"
                                disabled={remedial.total === 0}
                                onClick={() => setPilihRemedial(true)}
                                className={`${tombolUtama} disabled:cursor-not-allowed disabled:bg-gray-300`}
                            >
                                Latih Soal Yang Salah
                            </button>
                        </div>
                        {remedial.total === 0 && <p className="mt-2 text-sm text-brand-grayText">Belum ada soal yang perlu diperbaiki</p>}
                    </section>
                </div>

                <section className={kartu}>
                    <h2 className="text-lg font-bold">Grafik Try Out</h2>
                    <div className="mt-3">
                        <KontenGrafik tryOutList={tryOutList} />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <section className={`${kartu} lg:col-span-2`}>
                        <h2 className="text-lg font-bold">Penguasaan Topik UTBK</h2>
                        <p className="text-sm text-brand-grayText">Klik topik untuk langsung berlatih</p>

                        {/* Legenda: arti warna juga ditulis, tidak hanya lewat warna. */}
                        <ul className="mt-3 flex flex-wrap gap-3 text-xs">
                            {Object.values(LABEL).map((label) => (
                                <li key={label.teks} className="flex items-center gap-1">
                                    <span className={`h-3 w-3 rounded-sm ${label.warna}`} aria-hidden="true" />
                                    {label.teks}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4 space-y-5">
                            {penguasaan.map((subtes) => (
                                <div key={subtes.kode ?? subtes.nama}>
                                    <h3 className="font-semibold">
                                        {subtes.kode} - {subtes.nama} · {Math.round(subtes.persen)}%
                                    </h3>
                                    {subtes.topikList.length === 0 ? (
                                        <p className="mt-2 text-sm text-brand-grayText">Belum ada topik untuk subtes ini.</p>
                                    ) : (
                                        <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                            {subtes.topikList.map((topik) => (
                                                <li key={topik.id}>
                                                    <KartuTopik topik={topik} kodeSubtes={subtes.kode} batasJendela={batasJendela} />
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={kartu}>
                        <h2 className="text-lg font-bold">Direkomendasikan</h2>
                        <p className="text-sm text-brand-grayText">Topik dengan penguasaan terendah</p>

                        {rekomendasi.length > 0 ? (
                            <ul className="mt-4 space-y-3">
                                {rekomendasi.map((topik) => (
                                    <li key={topik.topikId} className="rounded-lg border px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="rounded-full bg-brand-lightBlue px-2 py-1 text-xs font-bold">{topik.kodeSubtes}</span>
                                            <div>
                                                <p className="font-semibold">{topik.namaTopik}</p>
                                                <p className="text-xs text-brand-grayText">Penguasaan {Math.round(topik.persen)}%</p>
                                            </div>
                                        </div>
                                        {/* Link hanya bila subtes punya kode, karena rute latihan.mode mengikat subtes lewat kode. */}
                                        {topik.kodeSubtes && (
                                            <Link
                                                href={route('latihan.mode', { subtes: topik.kodeSubtes, topik: topik.topikId })}
                                                className={`${tombolUtama} mt-3 block text-center`}
                                            >
                                                Latih Topik Ini
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-4 text-sm text-brand-grayText">
                                Selesaikan latihan mode fleksibel untuk mendapatkan rekomendasi topik.
                            </p>
                        )}
                    </section>
                </div>
            </div>

            <Modal show={pilihRemedial} maxWidth="md" onClose={() => setPilihRemedial(false)}>
                <div className="p-5 text-brand-navy">
                    <h3 className="text-lg font-semibold">Pilih subtes</h3>
                    <ul className="mt-3 divide-y">
                        {remedial.perSubtes.map((subtes) => {
                            const isi = (
                                <>
                                    <span>
                                        <span className="font-semibold">{subtes.kode}</span> {subtes.nama}
                                    </span>
                                    <span className="shrink-0 text-sm text-brand-grayText">{subtes.jumlah} soal</span>
                                </>
                            );

                            // Link hanya bila subtes punya kode, karena rute latihan.mode mengikat subtes lewat kode.
                            return (
                                <li key={subtes.kode ?? subtes.nama}>
                                    {subtes.kode ? (
                                        <Link
                                            href={route('latihan.mode', { subtes: subtes.kode, tab: 'remedial' })}
                                            className="flex items-center justify-between gap-3 py-3 hover:text-edvora-primary"
                                        >
                                            {isi}
                                        </Link>
                                    ) : (
                                        <div className="flex items-center justify-between gap-3 py-3">{isi}</div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setPilihRemedial(false)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

// Isi card Grafik Try Out (spec 6.3). Nomor "TO n" mengikuti urutan semua Try Out siswa, jadi nomor di grafik
// dan di daftar Menunggu nilai selalu sama. Paket yang belum dinilai tidak digambar sebagai titik 0.
function KontenGrafik({ tryOutList }: { tryOutList: TryOutSelesai[] }) {
    if (tryOutList.length === 0) {
        return (
            <p className="text-sm text-brand-grayText">
                Kamu belum mengerjakan Try Out.{' '}
                <Link href={route('tryout.index')} className="font-medium text-edvora-primary underline">
                    Lihat Try Out
                </Link>
            </p>
        );
    }

    const bernomor = tryOutList.map((tryOut, i) => ({ ...tryOut, nomor: i + 1 }));
    const titik: TitikTryOut[] = bernomor.flatMap((t) =>
        t.skor === null ? [] : [{ nomor: t.nomor, judul: t.judul, selesaiPada: t.selesaiPada, skor: t.skor }],
    );
    const menunggu = bernomor.filter((t) => t.skor === null);

    return (
        <>
            {titik.length > 0 ? (
                <GrafikTryOut titik={titik} />
            ) : (
                <p className="text-sm text-brand-grayText">
                    Belum ada skor Try Out. Skor muncul setelah periode Try Out berakhir dan dinilai.
                </p>
            )}

            {menunggu.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-sm font-semibold">Menunggu nilai</h3>
                    <ul className="mt-1 space-y-1 text-sm text-brand-grayText">
                        {menunggu.map((t) => (
                            <li key={t.id}>
                                TO {t.nomor} · {t.judul} · periode berakhir {formatWaktuWib(t.periodeSelesai)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}

// Satu card heatmap. Warna dari label; topik dengan jendela < 20 jawaban tampil 0% dengan ikon info (UCS4 2a).
function KartuTopik({ topik, kodeSubtes, batasJendela }: { topik: TopikHeatmap; kodeSubtes: string | null; batasJendela: number }) {
    const belumCukup = topik.label === 'belum_cukup_data';
    const info = `Belum dapat ditentukan, kerjakan minimal ${batasJendela} soal`;
    const kelas = `block h-full rounded-lg px-3 py-3 ${LABEL[topik.label].warna}`;
    const isi = (
        <>
            <span className="block text-sm font-medium">{topik.nama}</span>
            <span className="mt-1 flex items-center gap-1 text-xl font-bold">
                {Math.round(topik.persen)}%
                {belumCukup && (
                    <span title={info} aria-label={info} className="text-sm font-normal">
                        ⓘ
                    </span>
                )}
            </span>
            {belumCukup && (
                <span className="block text-xs">
                    {topik.nJendela}/{batasJendela} soal
                </span>
            )}
            <span className="sr-only">{LABEL[topik.label].teks}</span>
        </>
    );

    // Link hanya bila subtes punya kode, karena rute latihan.mode mengikat subtes lewat kode.
    return kodeSubtes ? (
        <Link href={route('latihan.mode', { subtes: kodeSubtes, topik: topik.id })} className={`${kelas} hover:brightness-95`}>
            {isi}
        </Link>
    ) : (
        <div className={kelas}>{isi}</div>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah ke halaman siswa lain.
Perkembangan.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
