import { Head, Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import KartuStat from '@/Components/Beranda/KartuStat';
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
        <div className="rounded-subtes bg-siswa-laman-awal px-4 py-3 transition duration-200 hover:bg-siswa-panel-fleksibel">
            <dt className="text-[12px] font-medium text-siswa-teks">{label}</dt>
            <dd className="mt-0.5 truncate text-[15px] font-medium text-siswa-judul-seksi">{isi}</dd>
        </div>
    );
}

// Akun Pribadi. Ukuran huruf, warna, kartu, dan bayangan mengikuti Beranda.
export default function ProfilUtama({ user, siswa, bergabung, level }: ProfilUtamaProps) {
    const nama = siswa.namaLengkap || user.name || 'Siswa';
    const kelas = siswa.kelasLabel ?? '-';
    const tanggalBergabung = bergabung
        ? new Date(bergabung).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '-';
    const angka = (n: number) => n.toLocaleString('id-ID');

    return (
        <>
            <Head title="Akun Pribadi" />

            {/* Pesan sukses setelah edit biodata kini berupa pop-up di halaman edit, jadi tidak ditampilkan di sini. */}
            <div className="w-full space-y-4 font-poppins text-siswa-judul">
                {/* Kartu Profil Utama: gaya sama dengan banner sapaan Beranda; XP dan Point memakai kotak angka yang sama. */}
                <section className="flex animate-muncul-halus flex-wrap items-center gap-5 rounded-kartu bg-gradient-to-l from-siswa-banner-awal to-siswa-banner-akhir px-[26px] py-5 text-white shadow-kartu">
                    {/* Avatar Inisial & Tombol Edit Avatar */}
                    <div className="relative shrink-0">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/50 bg-white/25 text-[26px] font-semibold backdrop-blur-sm md:h-[72px] md:w-[72px]">
                            {nama.trim().charAt(0).toUpperCase()}
                        </div>
                        <button
                            type="button"
                            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-siswa-teks shadow-panel transition duration-200 hover:scale-110 hover:text-edvora-primary"
                            title="Ubah Foto Profil"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>

                    {/* Informasi Pengguna & Progress Level */}
                    <div className="min-w-[220px] flex-1">
                        <h1 className="text-[24px] font-semibold leading-tight">{nama}</h1>
                        <p className="mt-1 text-[13px] text-white/90">
                            {kelas} · Bergabung {tanggalBergabung}
                        </p>

                        <div className="mt-3 max-w-md">
                            <div className="mb-1.5 flex justify-between text-[12px] font-medium text-white/90">
                                <span>Level {level.level}</span>
                                <span>
                                    {angka(level.xp)}/{angka(level.xpLevelBerikutnya)} XP
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
                                <div
                                    className="h-full rounded-full bg-white transition-[width] duration-700 ease-out"
                                    style={{ width: `${Math.min(100, Math.max(0, level.persen))}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stat Total XP & Point */}
                    <dl className="flex shrink-0 gap-4">
                        <KartuStat label="Total XP" nilai={angka(siswa.xp)} />
                        <KartuStat label="Total Point" nilai={angka(siswa.point)} />
                    </dl>
                </section>

                {/* Kartu Biodata */}
                <section className="animate-muncul-halus rounded-kartu bg-white px-[26px] py-5 shadow-kartu [animation-delay:80ms] [animation-fill-mode:both]">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-[18px] font-semibold leading-tight text-siswa-judul-seksi">Biodata</h2>
                        <Link
                            href={route('akun.profil')}
                            prefetch
                            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-siswa-garis-halus bg-white px-4 text-[13px] font-semibold text-siswa-judul-seksi shadow-panel transition duration-200 hover:-translate-y-0.5 hover:bg-siswa-panel-fleksibel"
                        >
                            <svg className="h-3.5 w-3.5 text-edvora-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit Biodata
                        </Link>
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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

// Persistent layout: sidebar tidak dirender ulang saat pindah dari/ke halaman siswa lain.
ProfilUtama.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
