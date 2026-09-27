import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import { BiodataSiswa, PilihanKelas, UniversitasPilihan } from '@/types/biodata';

interface BiodataProps {
    universitasList: UniversitasPilihan[];
    pilihanKelas: PilihanKelas[];
    biodata: BiodataSiswa;
}

export default function Biodata({ universitasList, pilihanKelas, biodata }: BiodataProps) {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm<BiodataSiswa>({ ...biodata });

    // Prodi diambil dari data universitas yang sudah ada di props, tanpa request ke server.
    const prodiList = universitasList.find((u) => u.id === data.universitasTujuanId)?.prodi ?? [];

    const pilihUniversitas = (universitasTujuanId: string) => {
        // Prodi lama milik universitas sebelumnya, jadi dikosongkan setiap kali universitas diganti.
        setData((prev) => ({ ...prev, universitasTujuanId, prodiTujuanId: null }));
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        // Jika valid, server mengalihkan ke halaman yang tadi dituju atau ke dashboard.
        post(route('biodata.simpan'));
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#A4CEEC] to-[#5B88DD] font-body-md text-body-md text-on-surface flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-container antialiased">
            <Head title="Lengkapi Biodata - EDVORA" />

            {/* Header */}
            <header className="w-full pt-margin-mobile md:pt-margin px-margin-mobile md:px-margin">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-space-sm focus:outline-none">
                        <div className="w-10 h-10 rounded-DEFAULT bg-surface-container-lowest flex items-center justify-center shadow-[0_6px_16px_-2px_rgba(38,53,93,0.15)]">
                            <span className="material-symbols-outlined text-primary text-[24px]">school</span>
                        </div>
                        <span className="font-headline-lg text-headline-lg tracking-tight text-on-primary font-bold">
                            EDVORA
                        </span>
                    </Link>
                    <div className="flex items-center gap-space-xs text-on-primary/90 font-label-md text-label-md"></div>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full flex-1 flex items-center justify-center px-margin-mobile md:px-margin py-margin-mobile md:py-margin">
                <div className="flex flex-col w-full items-center justify-center">
                    <div className="relative w-full max-w-[500px] flex flex-col items-center">
                        {/* Top Branding Wordmark (Edvora) */}
                        <div className="mb-space-lg text-center flex flex-col items-center select-none">
                            <h1 className="font-display-lg text-display-lg tracking-wider text-on-primary drop-shadow-[0_4px_16px_rgba(8,25,64,0.3)] font-extrabold uppercase">
                                EDVORA
                            </h1>
                            <p className="font-body-sm text-body-sm text-on-primary/90 mt-space-xs tracking-wide font-medium">
                                Lengkapi profil pembelajaran untuk pengalaman personal
                            </p>
                        </div>

                        {/* Center Card Container (#CAE9FD tone / rounded-2xl feel) */}
                        <div className="w-full bg-[#CAE9FD] rounded-lg shadow-[0_20px_48px_-8px_rgba(38,53,93,0.22)] p-space-md sm:p-space-xl relative overflow-hidden">
                            {/* Subtle Decorative Top Edge Glow */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary-container via-primary-container to-secondary-container opacity-60"></div>

                            {/* Card Header: Navy BIODATA */}
                            <div className="flex items-center justify-between pb-space-md">
                                <div>
                                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-[#26355D]/70 block font-semibold">
                                        Langkah 1 dari 2
                                    </span>
                                    <h2 className="font-headline-xl text-headline-xl tracking-tight text-[#26355D] font-extrabold mt-0.5">
                                        BIODATA
                                    </h2>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-surface-container-lowest/80 flex items-center justify-center shadow-sm text-primary">
                                    <span className="material-symbols-outlined text-[26px]">badge</span>
                                </div>
                            </div>

                            {/* Form Container */}
                            <form className="space-y-space-md mt-space-xs" id="biodata-form" onSubmit={handleSubmit}>
                                {/* 1. Nama Lengkap */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5" htmlFor="nama-lengkap">
                                        <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                                        Nama Lengkap
                                    </label>
                                    <div className="relative">
                                        <input
                                            className="w-full h-12 px-space-md rounded-DEFAULT bg-[#E6F2FF] text-[#26355D] placeholder-[#26355D]/45 font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#5B88DD] transition-all shadow-[inset_0_1px_3px_rgba(38,53,93,0.06)]"
                                            id="nama-lengkap"
                                            placeholder="Masukkan Nama Lengkap"
                                            required
                                            type="text"
                                            value={data.namaLengkap}
                                            onChange={(e) => setData('namaLengkap', e.target.value)}
                                        />
                                    </div>
                                    <InputError message={errors.namaLengkap} />
                                </div>

                                {/* 2. Two-Column Grid: Kelas & Jenis Kelamin */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                                    {/* Kelas */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5" htmlFor="kelas-select">
                                            <span className="material-symbols-outlined text-[16px] text-primary">school</span>
                                            Kelas
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="w-full h-12 pl-space-md pr-10 rounded-DEFAULT bg-[#E6F2FF] text-[#26355D] font-body-md text-body-md appearance-none cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#5B88DD] transition-all shadow-[inset_0_1px_3px_rgba(38,53,93,0.06)]"
                                                id="kelas-select"
                                                required
                                                value={data.kelas ?? ''}
                                                onChange={(e) => setData('kelas', e.target.value)}
                                            >
                                                <option className="text-[#26355D]/45" disabled value="">
                                                    Pilih Kelas
                                                </option>
                                                {pilihanKelas.map((k) => (
                                                    <option key={k.nilai} value={k.nilai}>
                                                        {k.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#26355D]/70 flex items-center">
                                                <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
                                            </div>
                                        </div>
                                        <InputError message={errors.kelas} />
                                    </div>

                                    {/* Jenis Kelamin */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5" htmlFor="gender-select">
                                            <span className="material-symbols-outlined text-[16px] text-primary">wc</span>
                                            Jenis Kelamin
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="w-full h-12 pl-space-md pr-10 rounded-DEFAULT bg-[#E6F2FF] text-[#26355D] font-body-md text-body-md appearance-none cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#5B88DD] transition-all shadow-[inset_0_1px_3px_rgba(38,53,93,0.06)]"
                                                id="gender-select"
                                                required
                                                value={data.jenisKelamin ?? ''}
                                                onChange={(e) => setData('jenisKelamin', e.target.value as BiodataSiswa['jenisKelamin'])}
                                            >
                                                <option className="text-[#26355D]/45" disabled value="">
                                                    Pilih Jenis Kelamin
                                                </option>
                                                <option value="laki-laki">Laki-laki</option>
                                                <option value="perempuan">Perempuan</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#26355D]/70 flex items-center">
                                                <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
                                            </div>
                                        </div>
                                        <InputError message={errors.jenisKelamin} />
                                    </div>
                                </div>

                                {/* 3. Universitas Tujuan: <select> karena yang dikirim ke server adalah id, bukan teks nama */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5" htmlFor="universitas-select">
                                        <span className="material-symbols-outlined text-[16px] text-primary">apartment</span>
                                        Universitas Tujuan
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-12 pl-space-md pr-10 rounded-DEFAULT bg-[#E6F2FF] text-[#26355D] font-body-md text-body-md appearance-none cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#5B88DD] transition-all shadow-[inset_0_1px_3px_rgba(38,53,93,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
                                            id="universitas-select"
                                            required
                                            disabled={universitasList.length === 0}
                                            value={data.universitasTujuanId ?? ''}
                                            onChange={(e) => pilihUniversitas(e.target.value)}
                                        >
                                            <option className="text-[#26355D]/45" disabled value="">
                                                {universitasList.length === 0
                                                    ? 'Data universitas belum tersedia. Hubungi admin.'
                                                    : 'Pilih Universitas Tujuan'}
                                            </option>
                                            {universitasList.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.nama} ({u.singkatan})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#26355D]/70 flex items-center">
                                            <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
                                        </div>
                                    </div>
                                    <InputError message={errors.universitasTujuanId} />
                                </div>

                                {/* 4. Program Studi: isinya mengikuti universitas yang dipilih */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-md text-label-md text-[#26355D] font-semibold flex items-center gap-1.5" htmlFor="prodi-select">
                                        <span className="material-symbols-outlined text-[16px] text-primary">menu_book</span>
                                        Program Studi
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-12 pl-space-md pr-10 rounded-DEFAULT bg-[#E6F2FF] text-[#26355D] font-body-md text-body-md appearance-none cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#5B88DD] transition-all shadow-[inset_0_1px_3px_rgba(38,53,93,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
                                            id="prodi-select"
                                            required
                                            disabled={prodiList.length === 0}
                                            value={data.prodiTujuanId ?? ''}
                                            onChange={(e) => setData('prodiTujuanId', e.target.value)}
                                        >
                                            <option className="text-[#26355D]/45" disabled value="">
                                                {data.universitasTujuanId ? 'Pilih Program Studi' : 'Pilih universitas terlebih dahulu'}
                                            </option>
                                            {prodiList.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nama} ({p.jenjang})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#26355D]/70 flex items-center">
                                            <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
                                        </div>
                                    </div>
                                    <InputError message={errors.prodiTujuanId} />
                                </div>

                                {/* Action Button: SIMPAN */}
                                <div className="pt-space-sm">
                                    <button
                                        className={`w-full h-12 text-on-primary font-headline-md text-headline-md tracking-wider uppercase rounded-DEFAULT shadow-[0_8px_20px_-4px_rgba(91,136,221,0.5)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer ${wasSuccessful ? 'bg-[#275aac]' : 'bg-[#5B88DD] hover:bg-primary'
                                            }`}
                                        disabled={processing}
                                        id="btn-simpan"
                                        type="submit"
                                    >
                                        {processing ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                                <span>MENYIMPAN...</span>
                                            </>
                                        ) : wasSuccessful ? (
                                            <>
                                                <span className="material-symbols-outlined text-[20px]">done</span>
                                                <span>TERSINKRONISASI</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>SIMPAN</span>
                                                <span className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-1">
                                                    arrow_forward
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Feedback Toast */}
                            {wasSuccessful && (
                                <div className="mt-space-md p-space-sm bg-surface-container-lowest text-[#26355D] rounded-DEFAULT shadow-md flex items-center gap-space-sm animate-fade-in" id="toast-success">
                                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                    <span className="font-body-sm text-body-sm font-medium">
                                        Data biodata berhasil tersimpan! Mengalihkan ke dasbor...
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full pb-margin-mobile md:pb-margin px-margin-mobile md:px-margin">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-space-sm text-center sm:text-left">
                    <span className="font-label-sm text-label-sm text-on-primary/80">
                        © 2024 Edvora Educational Platform. Hak Cipta Dilindungi.
                    </span>
                    <div className="flex items-center gap-space-md font-label-sm text-label-sm text-on-primary/80"></div>
                </div>
            </footer>
        </div>
    );
}
