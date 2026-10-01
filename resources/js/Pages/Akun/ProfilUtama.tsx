import { Head, Link, usePage } from '@inertiajs/react';

import MainLayout from '@/Components/Layouts/MainLayout';

interface Universitas {
    id: string | number;
    nama: string;
    singkatan?: string | null;
}

interface Prodi {
    id: string | number;
    nama: string;
    jenjang?: string | null;
}

interface UserData {
    id: string;
    name: string;
    email: string;
}

interface SiswaData {
    namaLengkap: string;
    kelas?: string | null;
    jenisKelamin?: string | null;
    xp: number;
    point: number;
    universitasTujuanId?: string | number | null;
    prodiTujuanId?: string | number | null;
    universitas?: Universitas | null;
    prodi?: Prodi | null;
}

interface ProfilUtamaProps extends Record<string, any> {
    user: UserData;
    siswa: SiswaData;
}

export default function ProfilUtama() {
    const { user, siswa } = usePage<ProfilUtamaProps>().props;

    const nama =
        siswa?.namaLengkap ||
        user?.name ||
        'Pengguna';

    const email = user?.email || '-';

    const jenisKelamin =
        siswa?.jenisKelamin === 'laki-laki'
            ? 'Laki-laki'
            : siswa?.jenisKelamin === 'perempuan'
                ? 'Perempuan'
                : '-';

    const kelasMap: Record<string, string> = {
        '10': 'Kelas 10 SMA/SMK',
        '11': 'Kelas 11 SMA/SMK',
        '12': 'Kelas 12 SMA/SMK',
        'kuliah-awal': 'Tingkat 1 - 2 (Semester Awal)',
        'kuliah-akhir': 'Tingkat 3 - 4 (Semester Akhir)',
        'umum': 'Alumni / Mahasiswa Pasca',
    };

    const kelas = siswa?.kelas
        ? kelasMap[siswa.kelas] || siswa.kelas
        : '-';

    const totalXp = Number(siswa?.xp || 0).toLocaleString('id-ID');

    const inisial = nama
        .trim()
        .charAt(0)
        .toUpperCase() || 'A';

    return (
        <MainLayout>
            <Head title="Akun Pribadi" />

            <div className="min-h-screen bg-[#E8F4FF] px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">

                    {/* Breadcrumb */}
                    <div className="mb-5 flex items-center gap-3 text-sm">
                        <div className="flex h-8 w-8 items-center justify-center text-[#8C8C8C]">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-5 w-5"
                            >
                                <path d="M11.47 2.53a.75.75 0 0 1 1.06 0l8.25 8.25a.75.75 0 0 1-1.06 1.06l-.47-.47V20a2 2 0 0 1-2 2h-3.5a.75.75 0 0 1-.75-.75v-5.5h-2v5.5a.75.75 0 0 1-.75.75H6.75a2 2 0 0 1-2-2v-8.63l-.47.47a.75.75 0 0 1-1.06-1.06l8.25-8.25Z" />
                            </svg>
                        </div>

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4 text-[#9B9B9B]"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>

                        <span className="font-semibold text-[#68728A]">
                            Akun Pribadi
                        </span>
                    </div>

                    {/* Header */}
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-[#26355D] sm:text-5xl">
                                Akun Pribadi
                            </h1>

                            <p className="mt-1 text-sm font-semibold text-[#68728A] sm:text-base">
                                Kelola informasi akunmu dan lihat pencapaianmu di EDVORA!
                            </p>
                        </div>

                        {/* Total XP */}
                        <div className="flex w-fit items-center gap-3 rounded-2xl border border-[#F4B86A] bg-white px-5 py-3 shadow-sm">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3D6]">
                                <span className="text-2xl">⭐</span>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-[#F0A43B]">
                                    Total XP
                                </p>

                                <p className="text-xl font-extrabold leading-none text-[#26355D]">
                                    {totalXp} XP
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Profile Card */}
                    <div className="overflow-hidden rounded-2xl border border-[#C8CED8] bg-white shadow-[0_8px_25px_rgba(38,53,93,0.12)]">

                        {/* Profile Information */}
                        <div className="p-6 sm:p-8">

                            <div className="grid gap-6 lg:grid-cols-[140px_1fr_180px] lg:items-start">

                                {/* Avatar */}
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#5D88DE] text-5xl font-semibold text-white shadow-sm">
                                            {inisial}
                                        </div>

                                        {/* Online badge */}
                                        <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#A5E9C8] bg-[#D8FBE9] px-3 py-1 text-[10px] font-bold text-[#15945A] shadow-sm">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#20C879]" />
                                            Online
                                        </div>
                                    </div>
                                </div>

                                {/* User Information */}
                                <div>
                                    <div className="mb-4 flex flex-wrap items-center gap-2">
                                        <h2 className="text-2xl font-extrabold text-[#171D2F]">
                                            {nama}
                                        </h2>

                                        <span className="rounded-full bg-[#E4E7FF] px-3 py-1 text-[10px] font-bold text-[#5147D8]">
                                            {kelas === 'Kelas 12 SMA/SMK'
                                                ? 'Tingkat 12'
                                                : kelas || 'Siswa'}
                                        </span>
                                    </div>

                                    {/* Email */}
                                    <div className="mb-4 flex items-center gap-2 text-sm text-[#68728A]">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            className="h-4 w-4 text-[#8B9BB5]"
                                        >
                                            <rect
                                                width="20"
                                                height="16"
                                                x="2"
                                                y="4"
                                                rx="2"
                                            />
                                            <path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7" />
                                        </svg>

                                        <span>{email}</span>
                                    </div>

                                    {/* Information Grid */}
                                    <div className="grid gap-3 sm:grid-cols-2">

                                        {/* Jenis Kelamin */}
                                        <div className="flex min-h-[62px] items-center gap-3 rounded-xl border border-[#E6EAF1] bg-white px-4 shadow-sm">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF0F5] text-[#D94C87]">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    className="h-5 w-5"
                                                >
                                                    <circle cx="12" cy="8" r="3" />
                                                    <path d="M12 11v9" />
                                                    <path d="M9 17h6" />
                                                </svg>
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-[#9AA5B8]">
                                                    Jenis Kelamin
                                                </p>

                                                <p className="text-sm font-bold text-[#263042]">
                                                    {jenisKelamin}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Kelas */}
                                        <div className="flex min-h-[62px] items-center gap-3 rounded-xl border border-[#E6EAF1] bg-white px-4 shadow-sm">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF1FF] text-[#5147D8]">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    className="h-5 w-5"
                                                >
                                                    <path d="m3 8 9-5 9 5-9 5-9-5Z" />
                                                    <path d="M7 10.2V16c0 1.7 2.2 3 5 3s5-1.3 5-3v-5.8" />
                                                    <path d="M21 9v6" />
                                                </svg>
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-[#9AA5B8]">
                                                    Kelas
                                                </p>

                                                <p className="text-sm font-bold text-[#263042]">
                                                    {kelas}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Universitas */}
                                        <div className="flex min-h-[62px] items-center gap-3 rounded-xl border border-[#E6EAF1] bg-white px-4 shadow-sm">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF4FF] text-[#4E82E8]">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    className="h-5 w-5"
                                                >
                                                    <path d="M3 21h18" />
                                                    <path d="M5 21V9l7-4 7 4v12" />
                                                    <path d="M9 21v-4h6v4" />
                                                    <path d="M8 11h.01M12 11h.01M16 11h.01M8 14h.01M12 14h.01M16 14h.01" />
                                                </svg>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-[#9AA5B8]">
                                                    Universitas
                                                </p>

                                                <p className="truncate text-sm font-bold text-[#263042]">
                                                    {siswa?.universitas?.nama || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Prodi */}
                                        <div className="flex min-h-[62px] items-center gap-3 rounded-xl border border-[#E6EAF1] bg-white px-4 shadow-sm">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF5E6] text-[#E89A20]">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    className="h-5 w-5"
                                                >
                                                    <path d="M4 5h16v14H4z" />
                                                    <path d="M8 9h8M8 13h5" />
                                                    <path d="M16 17h.01" />
                                                </svg>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-[#9AA5B8]">
                                                    Prodi
                                                </p>

                                                <p className="truncate text-sm font-bold text-[#263042]">
                                                    {siswa?.prodi
                                                        ? `${siswa.prodi.jenjang ? `${siswa.prodi.jenjang} ` : ''}${siswa.prodi.nama}`
                                                        : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Button */}
                                <div className="flex justify-center lg:justify-end">
                                    <Link
                                        href="/akun/profil"
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5B87DE] px-5 py-3 text-sm font-bold text-white shadow-[0_5px_12px_rgba(91,135,222,0.25)] transition hover:bg-[#4E79CE] active:scale-[0.98] lg:w-auto lg:min-w-[158px]"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="h-4 w-4"
                                        >
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                                        </svg>

                                        EDIT PROFILE
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Bottom spacing / separator */}
                        <div className="border-t border-[#EEF1F5] px-6 py-5 sm:px-8">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-[#9AA5B8]">
                                        Total Point
                                    </p>

                                    <p className="text-lg font-extrabold text-[#26355D]">
                                        {Number(siswa?.point || 0).toLocaleString('id-ID')} Point
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs font-semibold text-[#9AA5B8]">
                                        Status Akun
                                    </p>

                                    <p className="text-sm font-bold text-[#15945A]">
                                        Aktif
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}