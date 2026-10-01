import { FormEventHandler, useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';

import MainLayout from '@/Components/Layouts/MainLayout';

interface Universitas {
    id: string;
    nama: string;
    singkatan?: string | null;
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
        singkatan?: string | null;
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

export default function Profil({
    title = 'Profil & Biodata Siswa',
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

    /*
    |--------------------------------------------------------------------------
    | State UI
    |--------------------------------------------------------------------------
    */

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isSaved, setIsSaved] = useState(false);

    const [showToast, setShowToast] = useState(false);

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
    */

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        setIsSubmitting(true);
        setIsSaved(false);
        setShowToast(false);

        router.patch(
            '/akun/profil',
            {
                namaLengkap,
                kelas,
                jenisKelamin,
                universitasTujuanId: universitasId || null,
                prodiTujuanId: prodiId || null,
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setIsSubmitting(false);
                    setIsSaved(true);
                    setShowToast(true);

                    setTimeout(() => {
                        setIsSaved(false);
                        setShowToast(false);
                    }, 3000);
                },

                onError: () => {
                    setIsSubmitting(false);
                    setIsSaved(false);
                },

                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <MainLayout>
            <Head title={title} />

            <div className="max-w-3xl mx-auto py-4">

                {/* Center Card Container */}
                <div className="w-full bg-[#CAE9FD] rounded-lg shadow-[0_20px_48px_-8px_rgba(38,53,93,0.22)] p-space-md sm:p-space-xl relative overflow-hidden">

                    {/* Subtle Decorative Top Edge Glow */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary-container via-primary-container to-secondary-container opacity-60">
                    </div>

                    {/* Card Header */}
                    <div className="flex items-center justify-between pb-space-md">

                        <div>
                            <span className="font-label-sm text-label-sm uppercase tracking-widest text-[#26355D]/70 block font-semibold">
                                Informasi Pembelajaran
                            </span>

                            <h2 className="font-headline-xl text-headline-xl tracking-tight text-[#26355D] font-extrabold mt-0.5">
                                BIODATA SISWA
                            </h2>
                        </div>

                        <div className="w-12 h-12 rounded-full bg-surface-container-lowest/80 flex items-center justify-center shadow-sm text-primary">
                            <span className="material-symbols-outlined text-[26px]">
                                badge
                            </span>
                        </div>
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
                                <span className="material-symbols-outlined text-[16px] text-primary">
                                    person
                                </span>

                                Nama Lengkap
                            </label>

                            <div className="relative">

                                <input
                                    className="w-full h-12 px-space-md rounded-DEFAULT bg-[#E6F2FF] text-[#26355D] placeholder-[#26355D]/45 font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#5B88DD] transition-all shadow-[inset_0_1px_3px_rgba(38,53,93,0.06)]"
                                    id="nama-lengkap"
                                    placeholder="Masukkan Nama Lengkap"
                                    required
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

                        {/* 2. Two-Column Grid: Kelas & Jenis Kelamin */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">

                            {/* Kelas */}
                            <div className="flex flex-col gap-1.5">

                                <label
                                    className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5"
                                    htmlFor="kelas-select"
                                >
                                    <span className="material-symbols-outlined text-[16px] text-primary">
                                        school
                                    </span>

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

                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#26355D]/70 flex items-center">
                                        <span className="material-symbols-outlined text-[20px]">
                                            keyboard_arrow_down
                                        </span>
                                    </div>

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
                                    <span className="material-symbols-outlined text-[16px] text-primary">
                                        wc
                                    </span>

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

                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#26355D]/70 flex items-center">
                                        <span className="material-symbols-outlined text-[20px]">
                                            keyboard_arrow_down
                                        </span>
                                    </div>

                                </div>

                                {errors.jenisKelamin && (
                                    <span className="text-sm text-red-600">
                                        {errors.jenisKelamin}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 3. Universitas / Sekolah */}
                        <div className="flex flex-col gap-1.5">

                            <label
                                className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5"
                                htmlFor="institusi-select"
                            >
                                <span className="material-symbols-outlined text-[16px] text-primary">
                                    apartment
                                </span>

                                Universitas / Sekolah
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
                                        Pilih Universitas / Sekolah
                                    </option>

                                    {universitasList.map((universitas) => (
                                        <option
                                            key={universitas.id}
                                            value={universitas.id}
                                        >
                                            {universitas.nama}
                                            {universitas.singkatan
                                                ? ` (${universitas.singkatan})`
                                                : ''}
                                        </option>
                                    ))}

                                </select>

                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#26355D]/70 flex items-center">
                                    <span className="material-symbols-outlined text-[20px]">
                                        keyboard_arrow_down
                                    </span>
                                </div>

                            </div>

                            {errors.universitasTujuanId && (
                                <span className="text-sm text-red-600">
                                    {errors.universitasTujuanId}
                                </span>
                            )}
                        </div>

                        {/* 4. Program Studi */}
                        <div className="flex flex-col gap-1.5">

                            <label
                                className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5"
                                htmlFor="prodi-select"
                            >
                                <span className="material-symbols-outlined text-[16px] text-primary">
                                    menu_book
                                </span>

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

                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#26355D]/70 flex items-center">
                                    <span className="material-symbols-outlined text-[20px]">
                                        keyboard_arrow_down
                                    </span>
                                </div>

                            </div>

                            {errors.prodiTujuanId && (
                                <span className="text-sm text-red-600">
                                    {errors.prodiTujuanId}
                                </span>
                            )}
                        </div>

                        {/* Verification / Status Notice Tag */}
                        <div className="pt-space-xs flex items-center gap-2 px-space-sm py-2 rounded-DEFAULT bg-surface-container-lowest/60 text-[#26355D]">

                            <span className="material-symbols-outlined text-[18px] text-primary">
                                info
                            </span>

                            <span className="font-body-sm text-body-sm text-[#26355D]/80">
                                Data ini akan dicantumkan pada sertifikat dan profil resmi Anda.
                            </span>

                        </div>

                        {/* Action Button: SIMPAN */}
                        <div className="pt-space-sm">

                            <button
                                className={`w-full h-12 text-on-primary font-headline-md text-headline-md tracking-wider uppercase rounded-DEFAULT shadow-[0_8px_20px_-4px_rgba(91,136,221,0.5)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                                    isSaved
                                        ? 'bg-[#275aac]'
                                        : 'bg-[#5B88DD] hover:bg-primary'
                                }`}
                                disabled={isSubmitting}
                                id="btn-simpan"
                                type="submit"
                            >

                                {isSubmitting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[20px]">
                                            progress_activity
                                        </span>

                                        <span>
                                            MENYIMPAN...
                                        </span>
                                    </>
                                ) : isSaved ? (
                                    <>
                                        <span className="material-symbols-outlined text-[20px]">
                                            done
                                        </span>

                                        <span>
                                            TERSINKRONISASI
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span>
                                            SIMPAN PERUBAHAN
                                        </span>

                                        <span className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-1">
                                            arrow_forward
                                        </span>
                                    </>
                                )}

                            </button>

                        </div>

                    </form>

                    {/* Feedback Toast */}
                    {showToast && (
                        <div
                            className="mt-space-md p-space-sm bg-surface-container-lowest text-[#26355D] rounded-DEFAULT shadow-md flex items-center gap-space-sm animate-fade-in"
                            id="toast-success"
                        >

                            <span className="material-symbols-outlined text-primary text-[20px]">
                                check_circle
                            </span>

                            <span className="font-body-sm text-body-sm font-medium">
                                Data biodata berhasil diperbarui!
                            </span>

                        </div>
                    )}

                </div>
            </div>
        </MainLayout>
    );
}