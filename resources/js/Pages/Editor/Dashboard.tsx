import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import JudulHalaman from '@/Components/Editor/JudulHalaman';
import EditorLayout from '@/Components/Layouts/EditorLayout';

interface StokSubtes {
    kode: string;
    nama: string;
    jumlahTopik: number;
    published: number;
    draft: number;
    review: number;
}

interface DashboardProps {
    ringkasan: { published: number; draft: number; review: number };
    tryOutDibuka: number;
    stokSubtes: StokSubtes[];
}

// Dashboard editor (desain DASHBOARD EDITOR): jumlah soal per status, Try Out yang sedang dibuka, dan stok per subtes.
export default function Dashboard({ ringkasan, tryOutDibuka, stokSubtes }: DashboardProps) {
    const total = ringkasan.published + ringkasan.draft + ringkasan.review;

    return (
        <EditorLayout breadcrumb={['Dashboard']}>
            <Head title="Dashboard Editor" />

            <JudulHalaman atas="Editor" judul="Dashboard" keterangan="Pantau stok soal dan paket Try Out" />

            <div className="grid gap-5 md:grid-cols-2">
                <KartuAngka
                    label="Total Soal"
                    angka={total}
                    keterangan={`${ringkasan.published} published · ${ringkasan.draft} draft${ringkasan.review ? ` · ${ringkasan.review} review` : ''}`}
                    latarIkon="bg-siswa-ikon-latihan text-siswa-subtes"
                    ikon={<path d="M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4" />}
                />
                <KartuAngka
                    label="Try Out Dibuka"
                    angka={tryOutDibuka}
                    latarIkon="bg-siswa-hint-latar text-siswa-ubin-remedial"
                    ikon={<path d="M9 4h6v3H9zM7 5.5H5.5A1.5 1.5 0 004 7v12.5A1.5 1.5 0 005.5 21h13a1.5 1.5 0 001.5-1.5V7a1.5 1.5 0 00-1.5-1.5H17M8.5 13l2.5 2.5 4.5-4.5" />}
                />
            </div>

            <section className="mt-6 rounded-kartu bg-white p-6 shadow-kartu">
                <h2 className="text-xl font-semibold text-siswa-judul">Stok per Subtes</h2>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {stokSubtes.map((s) => (
                        <Link
                            key={s.kode}
                            href={route('editor.soal.index', s.kode)}
                            className="rounded-2xl border border-siswa-garis-halus px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <span className="rounded-md border border-siswa-garis-halus bg-siswa-badge-subtes px-1.5 py-0.5 text-xs font-bold text-siswa-judul">{s.kode}</span>
                            <div className="mt-2 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-siswa-judul">{s.nama}</p>
                                    <p className="text-xs text-siswa-teks">{s.jumlahTopik} Topik</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3 text-xs">
                                    <span
                                        title="Soal published"
                                        className="flex items-center gap-1 rounded-full bg-siswa-ikon-tryout px-2.5 py-0.5 font-semibold text-siswa-umpan-benar-teks"
                                    >
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
                                            <circle cx="12" cy="12" r="9" />
                                            <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        {s.published}
                                    </span>
                                    <span className="text-siswa-teks">{s.draft} draft</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </EditorLayout>
    );
}

function KartuAngka({ label, angka, keterangan, latarIkon, ikon }: { label: string; angka: number; keterangan?: string; latarIkon: string; ikon: ReactNode }) {
    return (
        <div className="flex items-center justify-between rounded-kartu bg-white px-6 py-5 shadow-kartu">
            <div>
                <p className="text-sm text-siswa-teks">{label}</p>
                <p className="text-3xl font-bold text-siswa-judul">{angka.toLocaleString('id-ID')}</p>
                {keterangan && <p className="text-xs text-siswa-teks">{keterangan}</p>}
            </div>
            <span className={`flex h-16 w-16 items-center justify-center rounded-full ${latarIkon}`}>
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {ikon}
                </svg>
            </span>
        </div>
    );
}
