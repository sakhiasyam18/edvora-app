import AdminLayout from '@/Components/Layouts/AdminLayout';
import { formatWaktuWib } from '@/lib/waktu';
import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';

interface LogItem {
    id: string;
    aksi: string;
    keterangan: string | null;
    namaPelaku: string;
    waktu: string; // ISO, UTC
}

interface AdminProps {
    totalSiswa: number;
    aktifHariIni: number; // siswa yang login sejak 00.00 WIB
    jumlahEditor: number;
    auditLogAdmin: LogItem[];
    auditLogEditor: LogItem[];
}

// Kartu angka ringkasan; gaya kartu, huruf, dan bayangan sama dengan halaman siswa.
function KartuAngka({ label, nilai, keterangan, ikon, warnaIkon, urutan }: { label: string; nilai: number; keterangan: string; ikon: ReactNode; warnaIkon: string; urutan: number }) {
    return (
        <div
            className="flex animate-muncul-halus items-center justify-between gap-4 rounded-kartu bg-white px-[26px] py-5 shadow-kartu transition duration-200 [animation-fill-mode:both] hover:-translate-y-1 hover:shadow-xl"
            style={{ animationDelay: `${80 + urutan * 70}ms` }}
        >
            <div className="min-w-0">
                <span className="text-[14px] font-medium text-siswa-teks">{label}</span>
                <p className="text-[28px] font-semibold leading-tight text-siswa-judul-seksi">{nilai.toLocaleString('id-ID')}</p>
                <p className="mt-0.5 text-[12px] text-siswa-teks">{keterangan}</p>
            </div>
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${warnaIkon}`}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    {ikon}
                </svg>
            </span>
        </div>
    );
}

// Panel Audit Log untuk satu peran; daftar bergaris pemisah tanpa kotak di dalam kotak.
function PanelLog({ peran, log, kosong, urutan }: { peran: string; log: LogItem[]; kosong: string; urutan: number }) {
    return (
        <div
            className="flex animate-muncul-halus flex-col rounded-kartu bg-white px-[26px] py-5 shadow-kartu [animation-fill-mode:both]"
            style={{ animationDelay: `${300 + urutan * 80}ms` }}
        >
            <div className="flex items-center justify-between gap-3 border-b border-siswa-garis-halus pb-3.5">
                <div>
                    <h3 className="text-[18px] font-semibold leading-tight text-siswa-judul-seksi">Audit Log</h3>
                    <p className="mt-0.5 text-[12px] font-medium uppercase tracking-[0.06em] text-siswa-teks">{peran}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-siswa-ikon-latihan text-edvora-primary">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                </span>
            </div>

            {log.length === 0 ? (
                <p className="py-10 text-center text-[13px] italic text-siswa-teks">{kosong}</p>
            ) : (
                <ul className="divide-y divide-siswa-garis-halus/70">
                    {log.map((item) => (
                        <li key={item.id} className="-mx-2 flex items-start gap-3 rounded-[10px] px-2 py-3 transition-colors duration-150 hover:bg-siswa-laman-awal">
                            <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-edvora-primary/70" aria-hidden="true" />
                            <div className="min-w-0">
                                <p className="text-[14px] font-medium leading-snug text-siswa-judul-seksi">
                                    {item.aksi}
                                    {item.keterangan ? `: ${item.keterangan}` : ''}
                                </p>
                                <p className="mt-0.5 text-[12px] text-siswa-teks">
                                    {item.namaPelaku} · {formatWaktuWib(item.waktu)}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function Admin({ totalSiswa, aktifHariIni, jumlahEditor, auditLogAdmin, auditLogEditor }: AdminProps) {
    return (
        <AdminLayout judul="Dashboard">
            <Head title="Dashboard Admin" />

            <div className="w-full space-y-4">
                {/* Judul halaman: gaya banner sama dengan banner sapaan Beranda siswa. */}
                <section className="flex min-h-[83px] animate-muncul-halus flex-col justify-center rounded-kartu bg-gradient-to-l from-siswa-banner-awal to-siswa-banner-akhir px-[26px] py-4 shadow-kartu">
                    <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-white/85">Admin</p>
                    <h2 className="mt-0.5 text-[24px] font-semibold leading-tight text-white">Dashboard</h2>
                    <p className="mt-1 text-[13px] leading-tight text-white/90">Ringkasan pengguna dan aktivitas sistem</p>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Ringkasan Statistik">
                    <KartuAngka
                        urutan={0}
                        label="Siswa"
                        nilai={totalSiswa}
                        keterangan="Total siswa terdaftar"
                        warnaIkon="bg-siswa-ikon-latihan text-edvora-primary"
                        ikon={
                            <>
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </>
                        }
                    />
                    <KartuAngka
                        urutan={1}
                        label="Aktif Hari Ini"
                        nilai={aktifHariIni}
                        keterangan="Siswa aktif sejak 00.00 WIB"
                        warnaIkon="bg-siswa-ikon-tryout text-siswa-umpan-benar-teks"
                        ikon={
                            <>
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <polyline points="16 11 18 13 22 9" />
                            </>
                        }
                    />
                    <KartuAngka
                        urutan={2}
                        label="Editor"
                        nilai={jumlahEditor}
                        keterangan="Total akun admin editor"
                        warnaIkon="bg-siswa-hint-latar text-siswa-hint-teks"
                        ikon={
                            <>
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                                <circle cx="19" cy="11" r="2" />
                            </>
                        }
                    />
                </section>

                {/* items-start: panel setinggi isinya, tidak ada ruang kosong besar di panel yang log-nya sedikit. */}
                <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2" aria-label="Aktivitas Audit Log">
                    <PanelLog urutan={0} peran="Admin" log={auditLogAdmin} kosong="Belum ada aktivitas admin." />
                    <PanelLog urutan={1} peran="Editor" log={auditLogEditor} kosong="Belum ada aktivitas editor." />
                </section>
            </div>
        </AdminLayout>
    );
}
