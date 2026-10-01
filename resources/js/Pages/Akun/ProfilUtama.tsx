import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';

interface LevelXp {
    level: number;
    xp: number; // total XP siswa
    xpLevelIni: number; // total XP minimal level sekarang
    xpLevelBerikutnya: number; // total XP untuk naik ke level berikutnya
    persen: number; // 0–100, kemajuan dari xpLevelIni ke xpLevelBerikutnya
}

interface ProfilUtamaProps {
    user: { id: string; name: string; email: string };
    siswa: {
        namaLengkap: string;
        kelas: string | null;
        kelasLabel: string | null;
        jenisKelamin: 'laki-laki' | 'perempuan' | null;
        xp: number;
        point: number;
        universitas: { id: string; nama: string } | null;
        prodi: { id: string; nama: string; jenjang: string | null } | null;
    };
    bergabung: string | null; // YYYY-MM-DD
    level: LevelXp;
}

const LABEL_JENIS_KELAMIN = { 'laki-laki': 'Laki-laki', perempuan: 'Perempuan' } as const;

// Satu baris biodata. Belum didesain.
function Isian({ label, isi }: { label: string; isi: string }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
            <dd className="font-semibold text-[#1F2D5C]">{isi}</dd>
        </div>
    );
}

// Akun Pribadi: kartu profil + level dan kartu biodata. Susunan saja, belum didesain.
export default function ProfilUtama({ user, siswa, bergabung, level }: ProfilUtamaProps) {
    const nama = siswa.namaLengkap || user.name || 'Siswa';
    const kelas = siswa.kelasLabel ?? '-';
    const tanggalBergabung = bergabung
        ? new Date(bergabung).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '-';
    const angka = (n: number) => n.toLocaleString('id-ID');
    // Pesan sekali tampil setelah biodata disimpan (Inertia::flash di ProfileController::updateBiodata).
    const { flash } = usePage();
    const pesanSukses = typeof flash.sukses === 'string' ? flash.sukses : null;

    return (
        <>
            <Head title="Akun Pribadi" />

            <div className="w-full max-w-[1000px] space-y-5 text-[#1F2D5C]">
                {pesanSukses && (
                    <div role="status" className="rounded-lg border border-[#34C759] bg-[#E8F8EC] px-4 py-3 text-sm font-medium text-[#1E6B33]">
                        {pesanSukses}
                    </div>
                )}

                {/* Kartu profil: inisial, nama, kelas, tanggal bergabung, level, XP, dan poin */}
                <section className="flex flex-wrap items-center gap-5 rounded-xl bg-white px-6 py-5 shadow-md">
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#5B86DB] text-3xl font-semibold text-white">
                        {nama.trim().charAt(0).toUpperCase()}
                    </span>

                    <div className="min-w-[220px] flex-1">
                        <h1 className="text-2xl font-bold">{nama}</h1>
                        <p className="text-sm text-gray-600">
                            {kelas} · Bergabung {tanggalBergabung}
                        </p>

                        <div className="mt-3 max-w-sm">
                            <div className="flex justify-between text-xs font-medium">
                                <span>Level {level.level}</span>
                                <span>
                                    {angka(level.xp)}/{angka(level.xpLevelBerikutnya)} XP
                                </span>
                            </div>
                            <progress
                                max={100}
                                value={level.persen}
                                aria-label={`Kemajuan menuju level ${level.level + 1}`}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <dl className="flex gap-3 text-center">
                        <div className="rounded-lg border px-4 py-2">
                            <dt className="text-xs text-gray-600">Total XP</dt>
                            <dd className="text-xl font-bold">{angka(siswa.xp)}</dd>
                        </div>
                        <div className="rounded-lg border px-4 py-2">
                            <dt className="text-xs text-gray-600">Point</dt>
                            <dd className="text-xl font-bold">{angka(siswa.point)}</dd>
                        </div>
                    </dl>
                </section>

                {/* Kartu biodata */}
                <section className="rounded-xl bg-white px-6 py-5 shadow-md">
                    <div className="flex items-center justify-between gap-4 border-b pb-3">
                        <h2 className="text-lg font-bold">Biodata</h2>
                        <Link href={route('akun.profil')} prefetch className="rounded-full border px-3 py-1 text-sm font-medium">
                            Edit Biodata
                        </Link>
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Isian label="Nama Lengkap" isi={nama} />
                        <Isian label="Email" isi={user.email} />
                        <Isian label="Kelas" isi={kelas} />
                        <Isian label="Jenis Kelamin" isi={siswa.jenisKelamin ? LABEL_JENIS_KELAMIN[siswa.jenisKelamin] : '-'} />
                        <Isian label="Universitas" isi={siswa.universitas?.nama ?? '-'} />
                        <Isian
                            label="Prodi"
                            isi={siswa.prodi ? `${siswa.prodi.jenjang ? `${siswa.prodi.jenjang} ` : ''}${siswa.prodi.nama}` : '-'}
                        />
                    </dl>
                </section>

                {/* Section Badge menyusul. */}
            </div>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah dari/ke halaman siswa lain.
ProfilUtama.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
