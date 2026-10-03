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

function Isian({ label, isi }: { label: string; isi: string }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase text-gray-400">{label}</dt>
            <dd className="mt-1 font-semibold text-[#1F2D5C]">{isi}</dd>
        </div>
    );
}

export default function ProfilUtama({ user, siswa, bergabung, level }: ProfilUtamaProps) {
    const nama = siswa.namaLengkap || user.name || 'Siswa';
    const kelas = siswa.kelasLabel ?? '-';
    const tanggalBergabung = bergabung
        ? new Date(bergabung).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '-';
    const angka = (n: number) => n.toLocaleString('id-ID');
    const { flash } = usePage();
    const pesanSukses = typeof flash.sukses === 'string' ? flash.sukses : null;

    return (
        <>
            <Head title="Akun Pribadi" />

            <div className="w-full max-w-[1000px] mx-auto space-y-6 text-[#1F2D5C]">
                {pesanSukses && (
                    <div role="status" className="rounded-lg border border-[#34C759] bg-[#E8F8EC] px-4 py-3 text-sm font-medium text-[#1E6B33]">
                        {pesanSukses}
                    </div>
                )}

                {/* Kartu Profil Utama (Header Biru Gradasi) */}
                <section className="relative flex flex-wrap items-center gap-6 rounded-2xl bg-gradient-to-r from-[#628EFF] to-[#87A8FF] p-6 text-white shadow-sm">
                    {/* Avatar Inisial & Tombol Edit Avatar */}
                    <div className="relative shrink-0">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-3xl font-semibold backdrop-blur-sm">
                            {nama.trim().charAt(0).toUpperCase()}
                        </div>
                        <button 
                            type="button" 
                            className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-600 shadow transition hover:bg-gray-100"
                            title="Ubah Foto Profil"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>

                    {/* Informasi Pengguna & Progress Level */}
                    <div className="min-w-[240px] flex-1">
                        <h1 className="text-2xl font-bold">{nama}</h1>
                        <p className="mt-0.5 text-xs text-white/80">
                            {kelas} · Bergabung {tanggalBergabung}
                        </p>

                        <div className="mt-4 max-w-md">
                            <div className="mb-1.5 flex justify-between text-xs font-medium">
                                <span className="opacity-90">Level {level.level}</span>
                                <span className="opacity-90">
                                    {angka(level.xp)}/{angka(level.xpLevelBerikutnya)} XP
                                </span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
                                <div 
                                    className="h-full rounded-full bg-white transition-all duration-300"
                                    style={{ width: `${Math.min(100, Math.max(0, level.persen))}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stat Total XP & Point */}
                    <div className="flex gap-3">
                        <div className="flex min-w-[90px] flex-col items-center justify-center rounded-xl bg-white/20 px-4 py-2.5 text-center backdrop-blur-sm">
                            <span className="text-[10px] font-semibold tracking-wider text-white/80 uppercase">XP</span>
                            <span className="text-2xl font-extrabold leading-tight">{angka(siswa.xp)}</span>
                            <span className="text-[9px] font-medium tracking-wider text-white/70 uppercase">TOTAL XP</span>
                        </div>
                        <div className="flex min-w-[90px] flex-col items-center justify-center rounded-xl bg-white/20 px-4 py-2.5 text-center backdrop-blur-sm">
                            <span className="text-[10px] font-semibold tracking-wider text-white/80 uppercase">💡</span>
                            <span className="text-2xl font-extrabold leading-tight">{angka(siswa.point)}</span>
                            <span className="text-[9px] font-medium tracking-wider text-white/70 uppercase">TOTAL POINT</span>
                        </div>
                    </div>
                </section>

                {/* Kartu Biodata */}
                <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <h2 className="text-lg font-bold text-[#1F2D5C]">Biodata</h2>
                        <Link 
                            href={route('akun.profil')} 
                            prefetch 
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit Biodata
                        </Link>
                    </div>

                    <dl className="mt-5 grid grid-cols-1 gap-y-5 sm:grid-cols-2">
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
            </div>
        </>
    );
}

ProfilUtama.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;