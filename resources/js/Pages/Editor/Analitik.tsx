import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';
import EditorLayout from '@/Components/Layouts/EditorLayout';

interface TopikHeatmap {
    kodeSubtes: string;
    topik: string;
    akurasi: number; // persen jawaban benar, 0–100
    jawaban: number;
}

interface StokTopik {
    id: string;
    kodeSubtes: string;
    topik: string;
    published: number;
    draft: number;
    perTingkat: { mudah: number; sedang: number; sulit: number }; // soal published per tingkat
}

interface AnalitikProps {
    ringkasan: { published: number; draft: number; totalSoal: number; jawaban: number; siswa: number };
    butirCukupData: number;
    butirBermasalah: { kode: string; alasan: string }[];
    heatmap: TopikHeatmap[]; // akurasi terendah dulu
    hariHeatmap: number;
    stokTopik: StokTopik[];
    target: { topik: number; tingkat: number };
    minRespon: number;
}

const angka = (n: number) => n.toLocaleString('id-ID');

// Warna petak heatmap: merah = banyak siswa salah, kuning = sedang, hijau = sebagian besar benar.
function warnaAkurasi(akurasi: number): string {
    if (akurasi < 40) {
        return 'bg-siswa-umpan-salah text-siswa-umpan-salah-teks';
    }

    return akurasi < 70 ? 'bg-siswa-hint-latar text-siswa-hint-teks' : 'bg-siswa-umpan-benar text-siswa-umpan-benar-teks';
}

// Warna bar stok: merah di bawah separuh target, oranye belum penuh, hijau sudah mencapai target.
function warnaStok(rasio: number): string {
    if (rasio < 0.5) {
        return 'bg-siswa-titik-salah';
    }

    return rasio < 1 ? 'bg-siswa-cincin-naik' : 'bg-siswa-titik-benar';
}

// Dashboard Analitik editor (desain "dashboard analitik"): ringkasan soal dan jawaban, topik tersulit, stok per topik.
export default function Analitik({ ringkasan, butirCukupData, butirBermasalah, heatmap, hariHeatmap, stokTopik, target, minRespon }: AnalitikProps) {
    return (
        <EditorLayout breadcrumb={['Dashboard Analitik']}>
            <Head title="Dashboard Analitik" />

            <div className="mb-6">
                <p className="text-lg text-siswa-teks">Analitik</p>
                <h1 className="mt-1 text-3xl font-semibold text-siswa-judul">Melihat Dashboard Analitik</h1>
                <p className="mt-1 text-lg text-siswa-teks">Pantau pemetaan siswa, ringkasan siswa, dan pemahaman siswa</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KartuAngka
                    label="Soal Published"
                    angka={ringkasan.published}
                    keterangan={`dari ${angka(ringkasan.totalSoal)} soal · ${angka(ringkasan.draft)} Draft`}
                    latarIkon="bg-siswa-ikon-latihan text-siswa-subtes"
                    ikon={<path d="M7 3h7l5 5v13H7zM14 3v5h5M10 12h6M10 16h6" />}
                />
                <KartuAngka
                    label="Log Jawaban"
                    angka={ringkasan.jawaban}
                    keterangan={`dari ${angka(ringkasan.siswa)} siswa, latihan dan Try Out`}
                    latarIkon="bg-siswa-ikon-tryout text-siswa-umpan-benar-teks"
                    ikon={<path d="M4 6h16M4 12h16M4 18h10" />}
                />
                <KartuAngka
                    label="Butir Cukup Data"
                    angka={butirCukupData}
                    keterangan={`soal dengan ≥ ${minRespon} respons`}
                    latarIkon="bg-siswa-hint-latar text-siswa-ubin-remedial"
                    ikon={<path d="M12 7v5l3 2M3.5 12a8.5 8.5 0 102.5-6M3 4v4h4" />}
                />
                <KartuAngka
                    label="Butir Bermasalah"
                    angka={butirBermasalah.length}
                    keterangan={butirBermasalah.length > 0 ? butirBermasalah.map((b) => b.kode).join(', ') : 'belum ada'}
                    // Alasan tiap butir tampil saat kartu disorot.
                    judul={butirBermasalah.map((b) => `${b.kode}: ${b.alasan}`).join('\n') || undefined}
                    latarIkon="bg-siswa-umpan-salah text-siswa-umpan-salah-teks"
                    ikon={<path d="M12 4l9 16H3zM12 10v4M12 17v.5" />}
                />
            </div>

            <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <section className="rounded-kartu bg-white p-6 shadow-kartu">
                    <h2 className="text-xl font-semibold text-siswa-judul">HeatMap Topik Tersulit</h2>
                    <p className="text-sm text-siswa-teks">Akurasi seluruh siswa dalam {hariHeatmap} hari terakhir</p>

                    {heatmap.length === 0 ? (
                        <p className="mt-6 text-sm text-siswa-teks">Belum ada topik dengan cukup jawaban dalam {hariHeatmap} hari terakhir.</p>
                    ) : (
                        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                            {heatmap.map((t) => (
                                <div key={`${t.kodeSubtes}-${t.topik}`} className={`rounded-lg px-3 py-3 ${warnaAkurasi(t.akurasi)}`}>
                                    <p className="text-[11px] font-semibold">{t.kodeSubtes}</p>
                                    <p className="truncate text-sm font-semibold" title={t.topik}>
                                        {t.topik}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold">{t.akurasi.toLocaleString('id-ID')} %</p>
                                    <p className="text-[11px] opacity-80">{angka(t.jawaban)} jawaban</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-kartu bg-white p-6 shadow-kartu">
                    <h2 className="text-xl font-semibold text-siswa-judul">Stok Soal Per Topik</h2>
                    <p className="text-xs text-siswa-teks">
                        Target minimal {target.topik} soal per topik ({target.tingkat} per tingkat). Angka kanan: published + draft.
                    </p>

                    <ul className="mt-4 max-h-[420px] space-y-1 overflow-y-auto pr-2">
                        {stokTopik.map((t) => {
                            const rasio = t.published / target.topik;
                            const rincian = `Mudah ${t.perTingkat.mudah}/${target.tingkat} · Sedang ${t.perTingkat.sedang}/${target.tingkat} · Sulit ${t.perTingkat.sulit}/${target.tingkat}`;

                            return (
                                <li key={t.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)_6rem_3.5rem] items-center gap-2 text-xs" title={rincian}>
                                    <span className="font-semibold text-siswa-judul">{t.kodeSubtes}</span>
                                    <span className="truncate font-medium text-siswa-judul">{t.topik}</span>
                                    <span className="h-1.5 overflow-hidden rounded-full bg-siswa-cincin-dasar">
                                        <span className={`block h-full rounded-full ${warnaStok(rasio)}`} style={{ width: `${Math.min(100, rasio * 100)}%` }} />
                                    </span>
                                    <span className="text-right font-semibold text-siswa-judul">
                                        {t.published} + {t.draft}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </div>
        </EditorLayout>
    );
}

function KartuAngka({
    label,
    angka: nilai,
    keterangan,
    judul,
    latarIkon,
    ikon,
}: {
    label: string;
    angka: number;
    keterangan: string;
    judul?: string;
    latarIkon: string;
    ikon: ReactNode;
}) {
    return (
        <div className="rounded-kartu bg-white px-5 py-4 shadow-kartu" title={judul}>
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm uppercase text-siswa-teks">{label}</p>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${latarIkon}`}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {ikon}
                    </svg>
                </span>
            </div>
            <p className="text-3xl font-bold text-siswa-judul">{angka(nilai)}</p>
            <p className="mt-2 truncate text-xs text-siswa-teks">{keterangan}</p>
        </div>
    );
}
