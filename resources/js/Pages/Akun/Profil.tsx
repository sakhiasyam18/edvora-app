import { FormEventHandler, ReactNode, useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import SiswaLayout from '@/Components/Layouts/SiswaLayout';

interface Universitas {
    id: string;
    nama: string;
    prodi: ProgramStudi[];
}

interface ProgramStudi {
    id: string;
    nama: string;
    jenjang?: string | null;
}

interface PilihanKelas {
    nilai: string;
    label: string;
}

interface UserData {
    id: string;
    name: string;
    email: string;
}

interface SiswaData {
    namaLengkap: string;
    kelas: string | null;
    jenisKelamin: string | null;
    xp: number;
    point: number;
    universitasTujuanId: string | null;
    prodiTujuanId: string | null;
    universitas: {
        id: string;
        nama: string;
    } | null;
    prodi: {
        id: string;
        nama: string;
        jenjang?: string | null;
    } | null;
}

interface ProfilProps {
    title?: string;

    user: UserData;

    siswa: SiswaData;

    universitasList: Universitas[];

    pilihanKelas: PilihanKelas[];

    errors?: {
        namaLengkap?: string;
        kelas?: string;
        jenisKelamin?: string;
        universitasTujuanId?: string;
        prodiTujuanId?: string;
        [key: string]: string | undefined;
    };
}

// Edit Biodata dari Akun Pribadi. Simpan berhasil → server mengarahkan kembali ke Akun Pribadi.
export default function Profil({
    title = 'Edit Biodata',
    user,
    siswa,
    universitasList,
    pilihanKelas,
    errors = {},
}: ProfilProps) {
    const { auth } = usePage<any>().props;

    /*
    |--------------------------------------------------------------------------
    | State Form
    |--------------------------------------------------------------------------
    */

    const [namaLengkap, setNamaLengkap] = useState(
        siswa?.namaLengkap || user?.name || auth?.user?.name || ''
    );

    const [kelas, setKelas] = useState(
        siswa?.kelas || ''
    );

    const [jenisKelamin, setJenisKelamin] = useState(
        siswa?.jenisKelamin || ''
    );

    const [universitasId, setUniversitasId] = useState(
        siswa?.universitasTujuanId || ''
    );

    const [prodiId, setProdiId] = useState(
        siswa?.prodiTujuanId || ''
    );

    const [isSubmitting, setIsSubmitting] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Universitas yang sedang dipilih
    |--------------------------------------------------------------------------
    */

    const universitasTerpilih = universitasList.find(
        (universitas) => String(universitas.id) === String(universitasId)
    );

    /*
    |--------------------------------------------------------------------------
    | Daftar Program Studi berdasarkan Universitas
    |--------------------------------------------------------------------------
    */

    const daftarProdi = universitasTerpilih?.prodi ?? [];

    /*
    |--------------------------------------------------------------------------
    | Jika Universitas berubah
    |--------------------------------------------------------------------------
    |
    | Pastikan prodi yang sebelumnya dipilih masih tersedia di universitas
    | yang baru. Jika tidak tersedia, kosongkan pilihan prodi.
    |
    */

    useEffect(() => {
        if (!universitasId) {
            setProdiId('');
            return;
        }

        const prodiMasihTersedia = daftarProdi.some(
            (prodi) => String(prodi.id) === String(prodiId)
        );

        if (!prodiMasihTersedia) {
            setProdiId('');
        }
    }, [universitasId]);

    /*
    |--------------------------------------------------------------------------
    | Submit Form
    |--------------------------------------------------------------------------
    |
    | Email tidak ikut dikirim karena tidak bisa diubah. Jika valid, server
    | mengarahkan ke Akun Pribadi; jika tidak, pesan error tampil di bawah field.
    |
    */

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        router.patch(
            route('akun.profil.update'),
            {
                namaLengkap,
                kelas,
                jenisKelamin,
                universitasTujuanId: universitasId || null,
                prodiTujuanId: prodiId || null,
            },
            {
                preserveScroll: true,
                onStart: () => setIsSubmitting(true),
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title={title} />

            <div className="max-w-3xl mx-auto py-4">

                {/* Center Card Container */}
                <div className="w-full bg-[#CAE9FD] rounded-lg shadow-[0_20px_48px_-8px_rgba(38,53,93,0.22)] p-space-md sm:p-space-xl relative overflow-hidden">

                    {/* Subtle Decorative Top Edge Glow */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary-container via-primary-container to-secondary-container opacity-60">
                    </div>

                    {/* Card Header */}
                    <div className="flex items-center justify-between pb-space-md">
                        <h2 className="font-headline-xl text-headline-xl tracking-tight text-[#26355D] font-extrabold mt-0.5">
                            Biodata
                        </h2>
                    </div>

                    {/* Form Container */}
                    <form
                        className="space-y-space-md mt-space-xs"
                        id="biodata-form"
                        onSubmit={handleSubmit}
                    >

                        {/* 1. Nama Lengkap */}
                        <div className="flex flex-col gap-1.5">

                            <label
                                className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5"
                                htmlFor="nama-lengkap"
                            >
                                Nama Lengkap
                            </label>

                            <div className="relative">

                                <input
                                    className="w-full h-12 px-space-md rounded-DEFAULT bg-[#E6F2FF] text-[#26355D] placeholder-[#26355D]/45 font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#5B88DD] transition-all shadow-[inset_0_1px_3px_rgba(38,53,93,0.06)]"
                                    id="nama-lengkap"
                                    placeholder="Masukkan Nama Lengkap"
                                    required
                                    maxLength={50}
                                    type="text"
                                    value={namaLengkap}
                                    onChange={(e) => setNamaLengkap(e.target.value)}
                                />

                            </div>

                            {errors.namaLengkap && (
                                <span className="text-sm text-red-600">
                                    {errors.namaLengkap}
                                </span>
                            )}
                        </div>

                        {/* 2. Email (tidak bisa diubah) */}
                        <div className="flex flex-col gap-1.5">

                            <label
                                className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5"
                                htmlFor="email"
                            >
                                Email
                            </label>

                            <input
                                className="w-full h-12 px-space-md rounded-DEFAULT bg-[#E6F2FF]/60 text-[#26355D]/60 font-body-md text-body-md cursor-not-allowed"
                                id="email"
                                type="email"
                                value={user.email}
                                disabled
                                readOnly
                            />

                            <span className="text-xs text-[#26355D]/60">
                                Email tidak dapat diubah.
                            </span>
                        </div>

                        {/* 3. Two-Column Grid: Kelas & Jenis Kelamin */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">

                            {/* Kelas */}
                            <div className="flex flex-col gap-1.5">

                                <label
                                    className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5"
                                    htmlFor="kelas-select"
                                >
                                    Kelas
                                </label>

                                <div className="relative">

                                    <select
                                        className="w-full h-12 pl-space-md pr-10 rounded-DEFAULT bg-[#E6F2FF] text-[#26355D] font-body-md text-body-md appearance-none cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#5B88DD] transition-all shadow-[inset_0_1px_3px_rgba(38,53,93,0.06)]"
                                        id="kelas-select"
                                        required
                                        value={kelas}
                                        onChange={(e) => setKelas(e.target.value)}
                                    >

                                        <option
                                            className="text-[#26355D]/45"
                                            disabled
                                            value=""
                                        >
                                            Pilih Kelas
                                        </option>

                                        {pilihanKelas.map((item) => (
                                            <option
                                                key={item.nilai}
                                                value={item.nilai}
                                            >
                                                {item.label}
                                            </option>
                                        ))}

                                    </select>

                                </div>

                                {errors.kelas && (
                                    <span className="text-sm text-red-600">
                                        {errors.kelas}
                                    </span>
                                )}
                            </div>

                            {/* Jenis Kelamin */}
                            <div className="flex flex-col gap-1.5">

                                <label
                                    className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5"
                                    htmlFor="gender-select"
                                >
                                    Jenis Kelamin
                                </label>

                                <div className="relative">

                                    <select
                                        className="w-full h-12 pl-space-md pr-10 rounded-DEFAULT bg-[#E6F2FF] text-[#26355D] font-body-md text-body-md appearance-none cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#5B88DD] transition-all shadow-[inset_0_1px_3px_rgba(38,53,93,0.06)]"
                                        id="gender-select"
                                        required
                                        value={jenisKelamin}
                                        onChange={(e) => setJenisKelamin(e.target.value)}
                                    >

                                        <option
                                            className="text-[#26355D]/45"
                                            disabled
                                            value=""
                                        >
                                            Pilih Jenis Kelamin
                                        </option>

                                        <option value="laki-laki">
                                            Laki-laki
                                        </option>

                                        <option value="perempuan">
                                            Perempuan
                                        </option>

                                    </select>

                                </div>

                                {errors.jenisKelamin && (
                                    <span className="text-sm text-red-600">
                                        {errors.jenisKelamin}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 4. Universitas */}
                        <div className="flex flex-col gap-1.5">

                            <label
                                className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5"
                                htmlFor="institusi-select"
                            >
                                Universitas
                            </label>

                            <div className="relative">

                                <select
                                    className="w-full h-12 pl-space-md pr-10 rounded-DEFAULT bg-[#E6F2FF] text-[#26355D] font-body-md text-body-md appearance-none cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#5B88DD] transition-all shadow-[inset_0_1px_3px_rgba(38,53,93,0.06)]"
                                    id="institusi-select"
                                    required
                                    value={universitasId}
                                    onChange={(e) => {
                                        setUniversitasId(e.target.value);
                                    }}
                                >

                                    <option
                                        className="text-[#26355D]/45"
                                        disabled
                                        value=""
                                    >
                                        Pilih Universitas
                                    </option>

                                    {universitasList.map((universitas) => (
                                        <option
                                            key={universitas.id}
                                            value={universitas.id}
                                        >
                                            {universitas.nama}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            {errors.universitasTujuanId && (
                                <span className="text-sm text-red-600">
                                    {errors.universitasTujuanId}
                                </span>
                            )}
                        </div>

                        {/* 5. Program Studi */}
                        <div className="flex flex-col gap-1.5">

                            <label
                                className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5"
                                htmlFor="prodi-select"
                            >
                                Program Studi
                            </label>

                            <div className="relative">

                                <select
                                    className="w-full h-12 pl-space-md pr-10 rounded-DEFAULT bg-[#E6F2FF] text-[#26355D] font-body-md text-body-md appearance-none cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#5B88DD] transition-all shadow-[inset_0_1px_3px_rgba(38,53,93,0.06)] disabled:opacity-60 disabled:cursor-not-allowed"
                                    id="prodi-select"
                                    required
                                    value={prodiId}
                                    disabled={!universitasId || daftarProdi.length === 0}
                                    onChange={(e) => setProdiId(e.target.value)}
                                >

                                    <option
                                        className="text-[#26355D]/45"
                                        disabled
                                        value=""
                                    >
                                        {universitasId
                                            ? 'Pilih Program Studi'
                                            : 'Pilih Universitas Terlebih Dahulu'}
                                    </option>

                                    {daftarProdi.map((prodi) => (
                                        <option
                                            key={prodi.id}
                                            value={prodi.id}
                                        >
                                            {prodi.nama}
                                            {prodi.jenjang
                                                ? ` (${prodi.jenjang})`
                                                : ''}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            {errors.prodiTujuanId && (
                                <span className="text-sm text-red-600">
                                    {errors.prodiTujuanId}
                                </span>
                            )}
                        </div>

                        {/* Tombol: Batal kembali ke Akun Pribadi tanpa menyimpan */}
                        <div className="flex justify-end gap-3 border-t border-[#26355D]/10 pt-space-sm">

                            <Link
                                href={route('akun.profil.utama')}
                                className="rounded-lg border border-[#26355D]/20 bg-white px-5 py-2 font-medium text-[#26355D]"
                            >
                                Batal
                            </Link>

                            <button
                                className="rounded-lg bg-[#5B88DD] px-5 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isSubmitting}
                                id="btn-simpan"
                                type="submit"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>

                        </div>

                    </form>

                </div>
            </div>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah dari/ke Akun Pribadi.
Profil.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
