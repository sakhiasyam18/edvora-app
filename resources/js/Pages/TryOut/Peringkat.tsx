import { ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import { BarisPeringkat, JenisPeringkat } from '@/types/tryout';

interface PeringkatProps {
    paket: { id: string; judul: string };
    skorSaya: number;
    jenis: JenisPeringkat;
    tujuanSaya: { universitas: string; prodi: string } | null; // khusus: tujuan siswa yang login
    podium: BarisPeringkat[]; // peringkat 1–3, hanya di halaman 1
    daftar: BarisPeringkat[];
    posisiSaya: { peringkat: number; totalPeserta: number } | null;
    halaman: { sekarang: number; terakhir: number };
}

const angka = (nilai: number) => nilai.toLocaleString('id-ID');

// Satu baris peringkat; universitas dan prodi disembunyikan di peringkat khusus (P11).
function Baris({ baris, khusus }: { baris: BarisPeringkat; khusus: boolean }) {
    return (
        <tr className={baris.saya ? 'font-semibold' : undefined}>
            <td className="py-1 pr-4">#{baris.peringkat}</td>
            <td className="py-1 pr-4">{baris.nama}</td>
            {!khusus && <td className="py-1 pr-4">{baris.universitas ?? '-'}</td>}
            {!khusus && <td className="py-1 pr-4">{baris.prodi ?? '-'}</td>}
            <td className="py-1 text-right">{angka(baris.skor)}</td>
        </tr>
    );
}

// Peringkat Try Out (RANCANGAN-peringkat-pembahasan-tryout.md 5.4). Tampilan polos; penataan Figma menyusul.
export default function Peringkat({ paket, skorSaya, jenis, tujuanSaya, podium, daftar, posisiSaya, halaman }: PeringkatProps) {
    const khusus = jenis === 'khusus';
    const keHalaman = (j: JenisPeringkat, nomor = 1) => route('tryout.peringkat', { tryOut: paket.id, jenis: j, halaman: nomor });
    const kolom = khusus
        ? ['Peringkat', 'Nama Pengguna', 'Skor']
        : ['Peringkat', 'Nama Pengguna', 'Tujuan Universitas', 'Program Studi Tujuan', 'Skor'];

    return (
        <>
            <Head title={`Peringkat ${paket.judul} - EDVORA`} />

            <div className="w-full space-y-4 text-siswa-judul">
                <section>
                    <p className="text-sm">Riwayat Hasil Pengerjaan Try Out</p>
                    <h1 className="text-xl font-semibold">{paket.judul}</h1>
                    <p>Skor IRT: {angka(skorSaya)}</p>
                </section>

                <nav className="flex gap-4">
                    <Link href={keHalaman('umum')} className={khusus ? undefined : 'font-semibold underline'}>
                        Pemeringkatan Umum
                    </Link>
                    <Link href={keHalaman('khusus')} className={khusus ? 'font-semibold underline' : undefined}>
                        Pemeringkatan Khusus
                    </Link>
                </nav>

                {khusus &&
                    (tujuanSaya ? (
                        <p className="text-sm">
                            {tujuanSaya.universitas} · {tujuanSaya.prodi}. Peringkat dihitung berdasarkan tujuan peserta saat ini.
                        </p>
                    ) : (
                        <p className="text-sm">Isi universitas dan prodi tujuan di Profil untuk melihat peringkat khusus.</p>
                    ))}

                {posisiSaya && (
                    <p>
                        Peringkatmu: {posisiSaya.peringkat} dari {posisiSaya.totalPeserta}
                    </p>
                )}

                {podium.length > 0 && (
                    <section>
                        <h2 className="font-semibold">Tiga Teratas</h2>
                        <table className="w-full text-sm">
                            <tbody>
                                {podium.map((b, i) => (
                                    <Baris key={i} baris={b} khusus={khusus} />
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {daftar.length > 0 && (
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                {kolom.map((k) => (
                                    <th key={k} className="py-1 pr-4 text-left">
                                        {k}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {daftar.map((b, i) => (
                                <Baris key={i} baris={b} khusus={khusus} />
                            ))}
                        </tbody>
                    </table>
                )}

                <div className="flex items-center gap-4 text-sm">
                    {halaman.sekarang > 1 && <Link href={keHalaman(jenis, halaman.sekarang - 1)}>‹ Sebelumnya</Link>}
                    <span>
                        Halaman {halaman.sekarang} dari {halaman.terakhir}
                    </span>
                    {halaman.sekarang < halaman.terakhir && <Link href={keHalaman(jenis, halaman.sekarang + 1)}>Berikutnya ›</Link>}
                </div>

                <Link href={route('tryout.hasil', paket.id)} className="inline-block text-sm underline">
                    Kembali ke Hasil Pengerjaan Try Out
                </Link>
            </div>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah ke halaman siswa lain.
Peringkat.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
