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

interface BadgeItem {
    id: string;
    nama: string;
    deskripsi: string;
    diraihPada?: string;
    tanggalDiraih?: string;
    xpBonus?: number;
    warnaHexagon?: string;
    ikon?: string;
    tercapai: boolean;
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
        avatarUrl?: string;
    };
    bergabung: string | null; // YYYY-MM-DD
    level: LevelXp;
    badges?: BadgeItem[];
}

const LABEL_JENIS_KELAMIN = { 'laki-laki': 'Laki-laki', perempuan: 'Perempuan' } as const;

// Data contoh/default jika backend belum mengirim props badges
const DEFAULT_BADGES: BadgeItem[] = [
    {
        id: '1',
        nama: 'Pemenang Kuis',
        deskripsi: 'Skor tertinggi kuis mingguan',
        diraihPada: '12 Okt 2023',
        warnaHexagon: 'bg-black text-black',
        ikon: 'star',
        tercapai: true,
    },
    {
        id: '2',
        nama: 'Ahli Logika',
        deskripsi: 'Menyelesaikan 50 soal analitis',
        diraihPada: '28 Nov 2023',
        warnaHexagon: 'bg-black text-black',
        ikon: 'code',
        tercapai: true,
    },
    {
        id: '3',
        nama: 'Rajin Belajar',
        deskripsi: 'Login 30 hari berturut-turut',
        diraihPada: '15 Jan 2024',
        warnaHexagon: 'bg-black text-black',
        ikon: 'academic',
        tercapai: true,
    },
    {
        id: '4',
        nama: 'Analisis Hebat',
        deskripsi: 'Akurasi jawaban di atas 95%',
        diraihPada: '02 Feb 2024',
        warnaHexagon: 'bg-black text-black',
        ikon: 'trending-up',
        tercapai: true,
    },
];

// Komponen Render Hexagon Hitam dengan Ikon
function MiniHexagonBadge({ ikon, tercapai }: { ikon?: string; tercapai: boolean }) {
    return (
        <div className="relative flex h-14 w-14 items-center justify-center">
            {/* Hexagon Hitam */}
            <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm">
                <polygon
                    points="50,3 93,25 93,75 50,97 7,25 7,25"
                    className={tercapai ? 'fill-black' : 'fill-slate-200'}
                />
            </svg>

            {/* Ikon di Tengah Hexagon */}
            <div className="absolute text-white">
                {!tercapai ? (
                    <svg className="h-5 w-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                ) : ikon === 'code' ? (
                    <span className="text-xs font-bold font-mono">&lt;/&gt;</span>
                ) : ikon === 'academic' ? (
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                        <path d="M4.6 10.134v2.866c0 .88 2.418 2 5.4 2 2.98 0 5.4-1.12 5.4-2v-2.866l-4.636 1.987a3 3 0 01-2.328 0L4.6 10.134z" />
                    </svg>
                ) : ikon === 'trending-up' ? (
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                )}
            </div>
        </div>
    );
}

function Isian({ label, isi }: { label: string; isi: string }) {
    return (
        <div className="rounded-subtes bg-siswa-laman-awal px-4 py-3 transition duration-200 hover:bg-siswa-panel-fleksibel">
            <dt className="text-[12px] font-medium text-siswa-teks">{label}</dt>
            <dd className="mt-0.5 truncate text-[15px] font-medium text-siswa-judul-seksi">{isi}</dd>
        </div>
    );
}

export default function ProfilUtama({ user, siswa, bergabung, level, badges = DEFAULT_BADGES }: ProfilUtamaProps) {
    const nama = siswa?.namaLengkap || user?.name || 'Siswa';
    const kelas = siswa?.kelasLabel ?? '-';
    const tanggalBergabung = bergabung
        ? new Date(bergabung).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '-';
    const angka = (n: number) => (n ?? 0).toLocaleString('id-ID');

    const totalBadgeDiperoleh = badges.filter((b) => b.tercapai).length;

    return (
        <>
            <Head title="Akun Pribadi" />

            <div className="w-full space-y-4 font-poppins text-siswa-judul">
                {/* Kartu Profil Utama */}
                <section className="flex animate-muncul-halus flex-wrap items-center gap-5 rounded-kartu bg-gradient-to-l from-siswa-banner-awal to-siswa-banner-akhir px-[26px] py-5 text-white shadow-kartu">
                    {/* Avatar Inisial / Gambar & Tombol Edit Avatar */}
                    <div className="relative shrink-0">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-white/25 shadow-inner backdrop-blur-sm md:h-[72px] md:w-[72px]">
                            {siswa?.avatarUrl ? (
                                /* Menampilkan Avatar Karakter yang Dipilih dari Toko Avatar */
                                <img src={siswa.avatarUrl} alt={nama} className="h-full w-full object-cover p-1" />
                            ) : (
                                /* Fallback Inisial Nama */
                                nama.trim().charAt(0).toUpperCase()
                            )}
                        </div>
                        {/* Tombol pensil untuk mengarahkan ke toko/pilihan avatar */}
                        <Link
                            href="/akun/avatar"
                            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-siswa-teks shadow-panel transition duration-200 hover:scale-110 hover:text-edvora-primary"
                            title="Ubah Foto Profil / Toko Avatar"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                            </svg>
                        </Link>
                    </div>

                    {/* Informasi Pengguna & Progress Level */}
                    <div className="min-w-[220px] flex-1">
                        <h1 className="text-[24px] font-semibold leading-tight">{nama}</h1>
                        <p className="mt-1 text-[13px] text-white/90">
                            {kelas} · Bergabung {tanggalBergabung}
                        </p>

                        <div className="mt-3 max-w-md">
                            <div className="mb-1.5 flex justify-between text-[12px] font-medium text-white/90">
                                <span>Level {level?.level ?? 1}</span>
                                <span>
                                    {angka(level?.xp)}/{angka(level?.xpLevelBerikutnya)} XP
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
                                <div
                                    className="h-full rounded-full bg-white transition-[width] duration-700 ease-out"
                                    style={{ width: `${Math.min(100, Math.max(0, level?.persen ?? 0))}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stat Total XP & Point */}
                    <dl className="flex shrink-0 gap-4">
                        <KartuStat label="Total XP" nilai={angka(siswa?.xp)} />
                        <KartuStat label="Total Point" nilai={angka(siswa?.point)} />
                    </dl>
                </section>

                {/* Kartu Biodata */}
                <section className="animate-muncul-halus rounded-kartu bg-white px-[26px] py-5 shadow-kartu [animation-delay:80ms] [animation-fill-mode:both]">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-[18px] font-semibold leading-tight text-siswa-judul-seksi">Biodata</h2>
                        <Link
                            href={typeof route === 'function' && route().has('akun.profil') ? route('akun.profil') : '/akun/profil'}
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
                        <Isian label="Email" isi={user?.email ?? '-'} />
                        <Isian label="Kelas" isi={kelas} />
                        <Isian label="Jenis Kelamin" isi={siswa?.jenisKelamin ? LABEL_JENIS_KELAMIN[siswa.jenisKelamin] : '-'} />
                        <Isian label="Universitas" isi={siswa?.universitas?.nama ?? '-'} />
                        <Isian
                            label="Prodi"
                            isi={siswa?.prodi ? `${siswa.prodi.jenjang ? `${siswa.prodi.jenjang} ` : ''}${siswa.prodi.nama}` : '-'}
                        />
                    </dl>
                </section>

                {/* Kartu Badge */}
                <section className="animate-muncul-halus rounded-kartu bg-white px-[26px] py-5 shadow-kartu [animation-delay:160ms] [animation-fill-mode:both]">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-[18px] font-semibold leading-tight text-siswa-judul-seksi">Badge</h2>
                            <p className="text-[12px] text-siswa-teks">
                                {totalBadgeDiperoleh} dari {badges.length} badge diperoleh
                            </p>
                        </div>
                        <Link
                            href="/akun/badge"
                            className="inline-flex items-center gap-1 text-[13px] font-semibold text-edvora-primary transition duration-200 hover:underline"
                        >
                            Lihat Semua
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {/* Grid Tampilan Badge */}
                    <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {badges.slice(0, 4).map((badge) => (
                            <div
                                key={badge.id}
                                className="flex flex-col items-center rounded-subtes border border-siswa-garis-halus p-4 text-center transition duration-200 hover:border-edvora-primary/30 hover:shadow-sm"
                            >
                                <MiniHexagonBadge ikon={badge.ikon} tercapai={badge.tercapai} />

                                <h3 className="mt-3 text-[14px] font-semibold text-siswa-judul-seksi">{badge.nama}</h3>
                                <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-siswa-teks">{badge.deskripsi}</p>

                                {(badge.diraihPada || badge.tanggalDiraih) && (
                                    <span className="mt-3 text-[10px] text-gray-400">
                                        DIRAIH PADA<br />
                                        <span className="font-medium text-gray-500">{badge.diraihPada || badge.tanggalDiraih}</span>
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

ProfilUtama.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;