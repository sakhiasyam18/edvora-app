import InputError from '@/Components/InputError';
import AdminLayout from '@/Components/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import { formatWaktuWib } from '@/lib/waktu';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, ReactNode, useState } from 'react';

interface SiswaItem {
    id: string;
    namaLengkap: string;
    email: string;
    kelasLabel: string | null;
    jenisKelamin: 'laki-laki' | 'perempuan' | null;
    isActive: boolean;
    tanggalDaftar: string | null; // ISO, UTC
    terakhirLogin: string | null; // ISO, UTC; null = belum pernah login
}

interface EditorItem {
    id: string;
    namaLengkap: string;
    email: string;
    tanggalDaftar: string | null;
    terakhirLogin: string | null;
}

// Hasil paginate() Laravel; hanya field yang dipakai halaman ini.
interface Halaman<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    total: number;
}

interface KelolaUserProps {
    siswaList: Halaman<SiswaItem>;
    editorList: EditorItem[];
    cari: string;
}

type PopUp =
    | { jenis: 'tambahEditor' }
    | { jenis: 'infoEditor'; editor: EditorItem }
    | { jenis: 'konfirmasiReset'; editor: EditorItem }
    | { jenis: 'formReset'; editor: EditorItem }
    | { jenis: 'infoSiswa'; siswa: SiswaItem }
    | { jenis: 'konfirmasiNonaktifkan'; siswa: SiswaItem }
    | { jenis: 'konfirmasiAktifkan'; siswa: SiswaItem }
    | { jenis: 'konfirmasiHapus'; siswa: SiswaItem };

const LABEL_JENIS_KELAMIN = { 'laki-laki': 'Laki-laki', perempuan: 'Perempuan' } as const;

const formatWaktu = (iso: string | null) => (iso ? formatWaktuWib(iso) : '-');

export default function KelolaUser({ siswaList, editorList, cari }: KelolaUserProps) {
    const [popUp, setPopUp] = useState<PopUp | null>(null);
    const [searchQuery, setSearchQuery] = useState(cari);

    const formEditor = useForm({ namaLengkap: '', email: '', password: '' });
    const formReset = useForm({ password: '' });
    const aksi = useForm({});

    const tutup = () => {
        setPopUp(null);
        formEditor.reset();
        formEditor.clearErrors();
        formReset.reset();
        formReset.clearErrors();
    };

    const simpanEditor: FormEventHandler = (e) => {
        e.preventDefault();
        formEditor.post(route('admin.user.tambahEditor'), {
            preserveScroll: true,
            onSuccess: tutup,
        });
    };

    const simpanReset = (editor: EditorItem): FormEventHandler => (e) => {
        e.preventDefault();
        formReset.put(route('admin.user.resetPassword', editor.id), {
            preserveScroll: true,
            onSuccess: tutup,
        });
    };

    const nonaktifkan = (siswa: SiswaItem) => {
        aksi.put(route('admin.user.nonaktifkan', siswa.id), {
            preserveScroll: true,
            onSuccess: tutup,
        });
    };

    const aktifkan = (siswa: SiswaItem) => {
        aksi.put(route('admin.user.aktifkan', siswa.id), {
            preserveScroll: true,
            onSuccess: tutup,
        });
    };

    const hapus = (siswa: SiswaItem) => {
        aksi.delete(route('admin.user.hapus', siswa.id), {
            preserveScroll: true,
            onSuccess: tutup,
        });
    };

    // Pencarian dijalankan di server (nama, email, atau kelas) saat Enter, lalu hasilnya kembali ke halaman 1.
    const kirimPencarian: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route('admin.user.index'), { cari: searchQuery.trim() || undefined }, { preserveState: true });
    };

    const isiPopUp = (p: PopUp) => {
        switch (p.jenis) {
            case 'tambahEditor':
                return (
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/50">
                        {/* Header */}
                        <div className="bg-[#2a4175] px-6 py-5 flex items-center justify-between text-white relative">
                            <h3 className="text-xl font-bold mx-auto tracking-wide">Tambah Editor</h3>
                            <button
                                type="button"
                                onClick={tutup}
                                className="absolute right-5 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold transition"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Body */}
                        <form onSubmit={simpanEditor} className="p-8 space-y-4 bg-white">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1.5">Nama Lengkap</label>
                                <input
                                    id="namaLengkap"
                                    type="text"
                                    value={formEditor.data.namaLengkap}
                                    onChange={(e) => formEditor.setData('namaLengkap', e.target.value)}
                                    className="w-full px-4 py-3 bg-[#cfd4dc]/30 border border-slate-200/80 rounded-2xl text-sm placeholder-slate-400 text-slate-800 focus:ring-2 focus:ring-[#2a4175] focus:bg-white transition"
                                    placeholder="Masukkan nama lengkap"
                                    autoFocus
                                />
                                <InputError message={formEditor.errors.namaLengkap} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1.5">E-mail</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={formEditor.data.email}
                                    onChange={(e) => formEditor.setData('email', e.target.value)}
                                    className="w-full px-4 py-3 bg-[#cfd4dc]/30 border border-slate-200/80 rounded-2xl text-sm placeholder-slate-400 text-slate-800 focus:ring-2 focus:ring-[#2a4175] focus:bg-white transition"
                                    placeholder="Masukkan e-mail"
                                />
                                <InputError message={formEditor.errors.email} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1.5">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={formEditor.data.password}
                                    onChange={(e) => formEditor.setData('password', e.target.value)}
                                    className="w-full px-4 py-3 bg-[#cfd4dc]/30 border border-slate-200/80 rounded-2xl text-sm placeholder-slate-400 text-slate-800 focus:ring-2 focus:ring-[#2a4175] focus:bg-white transition"
                                    placeholder="Masukkan password (min. 8 karakter)"
                                />
                                <InputError message={formEditor.errors.password} className="mt-1" />
                            </div>

                            <div className="pt-4 flex items-center justify-between space-x-4">
                                <button
                                    type="button"
                                    onClick={tutup}
                                    className="w-1/2 py-3 rounded-2xl font-bold text-sm btn-metallic-gray"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formEditor.processing}
                                    className="w-1/2 py-3 rounded-2xl font-bold text-sm btn-vibrant-green disabled:opacity-50"
                                >
                                    {formEditor.processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                );

            case 'infoEditor':
                return (
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/50">
                        {/* Header */}
                        <div className="bg-[#2a4175] px-6 py-5 flex items-center justify-between text-white relative">
                            <h3 className="text-xl font-bold mx-auto tracking-wide">Informasi Akun Editor</h3>
                            <button
                                type="button"
                                onClick={tutup}
                                className="absolute right-5 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold transition"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-8 space-y-4 bg-white text-left">
                            <div>
                                <span className="block text-xs font-bold text-slate-800">Nama Lengkap</span>
                                <span className="text-sm text-slate-700 font-medium">{p.editor.namaLengkap}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-800">E-mail</span>
                                <span className="text-sm text-slate-700 font-medium">{p.editor.email}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-800">Tanggal Daftar</span>
                                <span className="text-sm text-slate-700 font-medium">{formatWaktu(p.editor.tanggalDaftar)}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-800">Terakhir Login</span>
                                <span className="text-sm text-slate-700 font-medium">{formatWaktu(p.editor.terakhirLogin)}</span>
                            </div>
                            <div className="pt-6 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setPopUp({ jenis: 'konfirmasiReset', editor: p.editor })}
                                    className="w-full py-3 rounded-2xl font-bold text-sm btn-metallic-gray"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'konfirmasiReset':
                return (
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/50">
                        {/* Header */}
                        <div className="bg-[#2a4175] px-6 py-6 flex items-center justify-center space-x-3 text-white">
                            <svg className="w-8 h-8 text-yellow-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <h3 className="text-xl font-bold tracking-wide">Reset Password?</h3>
                        </div>
                        {/* Content */}
                        <div className="p-8 text-center bg-white space-y-6">
                            <p className="text-slate-700 font-semibold text-sm leading-relaxed px-2">
                                Apakah Anda yakin ingin mereset password untuk editor{' '}
                                <span className="font-bold text-slate-900">{p.editor.namaLengkap}</span>?
                            </p>
                            <div className="flex items-center justify-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setPopUp({ jenis: 'infoEditor', editor: p.editor })}
                                    className="w-28 py-2.5 rounded-2xl font-extrabold text-sm btn-metallic-gray"
                                >
                                    TIDAK
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPopUp({ jenis: 'formReset', editor: p.editor })}
                                    className="w-28 py-2.5 rounded-2xl font-extrabold text-sm btn-vibrant-red"
                                >
                                    IYA
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'formReset':
                return (
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/50">
                        {/* Header */}
                        <div className="bg-[#2a4175] px-6 py-5 flex items-center justify-between text-white relative">
                            <h3 className="text-xl font-bold mx-auto tracking-wide">Reset Password</h3>
                            <button
                                type="button"
                                onClick={tutup}
                                className="absolute right-5 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold transition"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Body */}
                        <form onSubmit={simpanReset(p.editor)} className="p-8 space-y-4 bg-white">
                            <div>
                                <p className="text-sm font-semibold text-slate-600 mb-3">
                                    {p.editor.namaLengkap} ({p.editor.email})
                                </p>
                                <label className="block text-xs font-bold text-slate-800 mb-1.5">Password Baru</label>
                                <input
                                    id="passwordSementara"
                                    type="password"
                                    value={formReset.data.password}
                                    onChange={(e) => formReset.setData('password', e.target.value)}
                                    className="w-full px-4 py-3 bg-[#cfd4dc]/30 border border-slate-200/80 rounded-2xl text-sm placeholder-slate-400 text-slate-800 focus:ring-2 focus:ring-[#2a4175] focus:bg-white transition"
                                    placeholder="Masukkan password terbaru (min. 8 karakter)"
                                    autoFocus
                                />
                                <InputError message={formReset.errors.password} className="mt-1" />
                            </div>

                            <div className="pt-6 flex items-center justify-between space-x-4">
                                <button
                                    type="button"
                                    onClick={tutup}
                                    className="w-1/2 py-3 rounded-2xl font-bold text-sm btn-metallic-gray"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formReset.processing}
                                    className="w-1/2 py-3 rounded-2xl font-bold text-sm btn-vibrant-green disabled:opacity-50"
                                >
                                    {formReset.processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                );

            case 'infoSiswa':
                return (
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/50">
                        {/* Header */}
                        <div className="bg-[#2a4175] px-6 py-5 flex items-center justify-between text-white relative">
                            <h3 className="text-xl font-bold mx-auto tracking-wide">Informasi Akun Siswa</h3>
                            <button
                                type="button"
                                onClick={tutup}
                                className="absolute right-5 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold transition"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-8 space-y-3.5 bg-white text-left">
                            <div>
                                <span className="block text-xs font-bold text-slate-800">Nama Lengkap</span>
                                <span className="text-sm text-slate-700 font-medium">{p.siswa.namaLengkap}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-800">Jenis Kelamin</span>
                                <span className="text-sm text-slate-700 font-medium">
                                    {p.siswa.jenisKelamin ? LABEL_JENIS_KELAMIN[p.siswa.jenisKelamin] : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-800">Kelas</span>
                                <span className="text-sm text-slate-700 font-medium">{p.siswa.kelasLabel ?? '-'}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-800">E-mail</span>
                                <span className="text-sm text-slate-700 font-medium">{p.siswa.email}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-800 mb-1">Status Akun</span>
                                <span
                                    className={`inline-block text-white text-xs font-bold px-4 py-0.5 rounded-full ${
                                        p.siswa.isActive ? 'bg-[#1aa34a]' : 'bg-[#54595e]'
                                    }`}
                                >
                                    {p.siswa.isActive ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-800">Tanggal Daftar</span>
                                <span className="text-sm text-slate-700 font-medium">{formatWaktu(p.siswa.tanggalDaftar)}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-800">Terakhir Login</span>
                                <span className="text-sm text-slate-700 font-medium">{formatWaktu(p.siswa.terakhirLogin)}</span>
                            </div>
                            <div className="pt-6 flex items-center justify-between space-x-4">
                                {p.siswa.isActive ? (
                                    <button
                                        type="button"
                                        onClick={() => setPopUp({ jenis: 'konfirmasiNonaktifkan', siswa: p.siswa })}
                                        className="w-1/2 py-3 rounded-2xl font-bold text-sm btn-metallic-gray"
                                    >
                                        Nonaktifkan
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setPopUp({ jenis: 'konfirmasiAktifkan', siswa: p.siswa })}
                                        className="w-1/2 py-3 rounded-2xl font-bold text-sm btn-metallic-gray"
                                    >
                                        Aktifkan
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setPopUp({ jenis: 'konfirmasiHapus', siswa: p.siswa })}
                                    className="w-1/2 py-3 rounded-2xl font-bold text-sm btn-vibrant-red"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'konfirmasiNonaktifkan':
                return (
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/50">
                        {/* Header */}
                        <div className="bg-[#2a4175] px-6 py-6 flex items-center justify-center space-x-3 text-white">
                            <svg className="w-8 h-8 text-yellow-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <h3 className="text-xl font-bold tracking-wide">Nonaktifkan User Ini?</h3>
                        </div>
                        {/* Content */}
                        <div className="p-8 text-center bg-white space-y-6">
                            <p className="text-red-500 font-bold text-sm leading-relaxed px-2">
                                User tidak dapat login hingga diaktifkan kembali.
                            </p>
                            <div className="flex items-center justify-center space-x-4">
                                <button
                                    type="button"
                                    disabled={aksi.processing}
                                    onClick={() => setPopUp({ jenis: 'infoSiswa', siswa: p.siswa })}
                                    className="w-28 py-2.5 rounded-2xl font-extrabold text-sm btn-metallic-gray"
                                >
                                    TIDAK
                                </button>
                                <button
                                    type="button"
                                    disabled={aksi.processing}
                                    onClick={() => nonaktifkan(p.siswa)}
                                    className="w-28 py-2.5 rounded-2xl font-extrabold text-sm btn-vibrant-red disabled:opacity-50"
                                >
                                    {aksi.processing ? '...' : 'IYA'}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'konfirmasiAktifkan':
                return (
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/50">
                        {/* Header */}
                        <div className="bg-[#2a4175] px-6 py-6 flex items-center justify-center text-white">
                            <h3 className="text-xl font-bold tracking-wide">Aktifkan User Ini?</h3>
                        </div>
                        {/* Content */}
                        <div className="p-8 text-center bg-white space-y-6">
                            <p className="text-slate-700 font-semibold text-sm leading-relaxed px-2">
                                User dapat login kembali.
                            </p>
                            <div className="flex items-center justify-center space-x-4">
                                <button
                                    type="button"
                                    disabled={aksi.processing}
                                    onClick={() => setPopUp({ jenis: 'infoSiswa', siswa: p.siswa })}
                                    className="w-28 py-2.5 rounded-2xl font-extrabold text-sm btn-metallic-gray"
                                >
                                    TIDAK
                                </button>
                                <button
                                    type="button"
                                    disabled={aksi.processing}
                                    onClick={() => aktifkan(p.siswa)}
                                    className="w-28 py-2.5 rounded-2xl font-extrabold text-sm btn-vibrant-green disabled:opacity-50"
                                >
                                    {aksi.processing ? '...' : 'IYA'}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'konfirmasiHapus':
                return (
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/50">
                        {/* Header */}
                        <div className="bg-[#2a4175] px-6 py-6 flex items-center justify-center space-x-3 text-white">
                            <svg className="w-8 h-8 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            <h3 className="text-xl font-bold tracking-wide">Hapus User Ini?</h3>
                        </div>
                        {/* Content */}
                        <div className="p-8 text-center bg-white space-y-6">
                            <p className="text-red-500 font-bold text-sm leading-relaxed px-2">
                                Data pribadi akan dihapus permanen.
                            </p>
                            <div className="flex items-center justify-center space-x-4">
                                <button
                                    type="button"
                                    disabled={aksi.processing}
                                    onClick={() => setPopUp({ jenis: 'infoSiswa', siswa: p.siswa })}
                                    className="w-28 py-2.5 rounded-2xl font-extrabold text-sm btn-metallic-gray"
                                >
                                    TIDAK
                                </button>
                                <button
                                    type="button"
                                    disabled={aksi.processing}
                                    onClick={() => hapus(p.siswa)}
                                    className="w-28 py-2.5 rounded-2xl font-extrabold text-sm btn-vibrant-red disabled:opacity-50"
                                >
                                    {aksi.processing ? '...' : 'IYA'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <AdminLayout judul="Daftar User">
            <Head title="Kelola User - EDVORA" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Title */}
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Daftar User</h1>
                </div>

                {/* BEGIN: Section 1 - Daftar Editor */}
                <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100">
                    {/* Section Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
                        <h2 className="text-lg font-bold text-slate-800">Daftar Editor</h2>
                        <button
                            type="button"
                            onClick={() => setPopUp({ jenis: 'tambahEditor' })}
                            className="inline-flex items-center gap-2 bg-[#203461] hover:bg-[#1a2b50] text-white px-5 py-2.5 rounded-full font-semibold text-sm transition shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span>Tambah Editor</span>
                        </button>
                    </div>

                    {/* Editor Items List */}
                    {editorList.length === 0 ? (
                        <p className="text-sm text-slate-400 italic py-6 text-center">Belum ada editor terdaftar.</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {editorList.map((editor) => (
                                <div
                                    key={editor.id}
                                    className="flex items-center justify-between py-3.5 px-2 hover:bg-slate-50/70 rounded-xl transition"
                                >
                                    <div className="flex items-center space-x-4">
                                        <svg className="w-8 h-8 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z" />
                                        </svg>
                                        <span className="font-semibold text-slate-800 text-sm">{editor.namaLengkap}</span>
                                    </div>
                                    <div className="text-slate-600 text-sm hidden md:block">
                                        {editor.email}
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setPopUp({ jenis: 'infoEditor', editor })}
                                            className="bg-[#385ea8] hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 rounded-full transition shadow-sm"
                                        >
                                            Informasi Akun
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                {/* END: Section 1 - Daftar Editor */}

                {/* BEGIN: Section 2 - Daftar Siswa */}
                <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100">
                    {/* Section Header with Search Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-2">
                        <h2 className="text-lg font-bold text-slate-800">Daftar Siswa</h2>
                        {/* Search Input Pill; dikirim saat Enter */}
                        <form onSubmit={kirimPencarian} className="relative w-full sm:w-72">
                            <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="cari siswa..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200/80 rounded-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                            />
                        </form>
                    </div>

                    {/* Student Data Table */}
                    {siswaList.data.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm italic">
                            {cari === '' ? 'Belum ada siswa terdaftar.' : 'Tidak ada siswa yang cocok dengan pencarian.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs bg-white">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#2a4175] text-white text-sm font-bold">
                                        <th className="py-3 px-5">Nama Lengkap</th>
                                        <th className="py-3 px-4 text-center">Kelas</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-5 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {siswaList.data.map((siswa) => (
                                        <tr key={siswa.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3.5 px-5 text-xs md:text-sm font-semibold text-slate-800 truncate max-w-xs" title={siswa.namaLengkap}>
                                                {siswa.namaLengkap}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs md:text-sm font-semibold text-slate-700 text-center">
                                                {siswa.kelasLabel ?? '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span
                                                    className={`inline-block text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs ${
                                                        siswa.isActive ? 'bg-[#1aa34a]' : 'bg-[#54595e]'
                                                    }`}
                                                >
                                                    {siswa.isActive ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setPopUp({ jenis: 'infoSiswa', siswa })}
                                                    className="bg-[#385ea8] hover:bg-blue-700 text-white text-xs font-semibold px-5 py-1.5 rounded-full transition shadow-sm"
                                                >
                                                    Informasi Akun
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination 20 siswa per halaman; tautannya sudah membawa pencarian (withQueryString). */}
                    {siswaList.last_page > 1 && (
                        <nav aria-label="Halaman daftar siswa" className="flex flex-wrap items-center justify-center gap-2 pt-4">
                            {siswaList.links.map((link, i) => {
                                const label = i === 0 ? 'Sebelumnya' : i === siswaList.links.length - 1 ? 'Berikutnya' : link.label;
                                const gaya = `min-w-9 px-3 py-1.5 rounded-lg border text-sm font-semibold text-center ${
                                    link.active ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'
                                }`;

                                return link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        preserveState
                                        preserveScroll
                                        aria-current={link.active ? 'page' : undefined}
                                        className={`${gaya} ${link.active ? '' : 'hover:bg-slate-50'}`}
                                    >
                                        {label}
                                    </Link>
                                ) : (
                                    <span key={i} className={`${gaya} cursor-not-allowed opacity-50`}>
                                        {label}
                                    </span>
                                );
                            })}
                        </nav>
                    )}
                </section>
                {/* END: Section 2 - Daftar Siswa */}
            </div>

            {/* Modal Container */}
            <Modal
                show={popUp !== null}
                onClose={tutup}
                maxWidth="md"
                panelClassName="rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/50 bg-white"
                backdropClassName="bg-slate-900/45 backdrop-blur-[2px]"
            >
                {popUp && isiPopUp(popUp)}
            </Modal>
        </AdminLayout>
    );
}
