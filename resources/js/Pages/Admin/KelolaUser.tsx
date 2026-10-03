import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

interface UserItem {
    id: string;
    name: string;
    email: string;
    peran: string;
    is_active: boolean;
    created_at?: string;
}

interface PageProps {
    editors: UserItem[];
    siswa: UserItem[];
    flash: { success?: string; error?: string };
}

export default function KelolaUser() {
    const { editors, siswa, flash } = usePage<any>().props as PageProps;

    const [search, setSearch] = useState('');
    const [modalType, setModalType] = useState<'tambahEditor' | 'infoEditor' | 'resetPassword' | 'infoSiswa' | 'nonaktifkan' | 'hapus' | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

    // Form state
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/users', { search }, { preserveState: true });
    };

    const submitTambahEditor = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/users/editor', formData, {
            onSuccess: () => {
                setModalType(null);
                setFormData({ name: '', email: '', password: '' });
            },
        });
    };

    const submitResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        router.put(`/admin/users/${selectedUser.id}/reset-password`, { password: formData.password }, {
            onSuccess: () => setModalType(null),
        });
    };

    const handleToggleStatus = () => {
        if (!selectedUser) return;
        router.put(`/admin/users/${selectedUser.id}/toggle-status`, {}, {
            onSuccess: () => setModalType(null),
        });
    };

    const handleHapusUser = () => {
        if (!selectedUser) return;
        router.delete(`/admin/users/${selectedUser.id}`, {
            onSuccess: () => setModalType(null),
        });
    };

    return (
        <>
            <Head title="Kelola User" />
            <div className="flex min-h-screen bg-[#F0F4F9] font-sans text-slate-800 relative">
                
                {/* POP-UP NOTIFIKASI FLASH MESSAGE (GAMBAR 5) */}
                {flash?.success && (
                    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-6 py-3 shadow-lg text-emerald-600 font-bold text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-red-300 bg-white px-6 py-3 shadow-lg text-red-500 font-bold text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-500">!</span>
                        {flash.error}
                    </div>
                )}

                {/* SIDEBAR */}
                <aside className="w-64 bg-[#2B4184] p-6 text-white flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-black text-xl">E</div>
                            <span className="font-bold text-xl tracking-wider">EDVORA</span>
                        </div>
                        <nav className="space-y-2">
                            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-200 hover:bg-blue-800/40 transition">
                                📊 Dashboard
                            </Link>
                            <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600/50 font-semibold text-white">
                                👥 Kelola User
                            </Link>
                        </nav>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 p-8">
                    <header className="flex justify-between items-center mb-6">
                        <span className="text-2xl">🏠</span>
                        <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center">A</div>
                    </header>

                    <h1 className="text-3xl font-black text-slate-800 mb-6">Daftar User</h1>

                    {/* DAFTAR EDITOR */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-800">Daftar Editor</h2>
                            <button
                                onClick={() => setModalType('tambahEditor')}
                                className="bg-[#2B4184] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-900 transition"
                            >
                                + Tambah Editor
                            </button>
                        </div>

                        <div className="space-y-3">
                            {editors.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-2xl hover:bg-slate-50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">👤</div>
                                        <span className="font-bold text-slate-700 text-sm">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-medium text-slate-500">{item.email}</span>
                                    <button
                                        onClick={() => { setSelectedUser(item); setModalType('infoEditor'); }}
                                        className="bg-[#3B5299] text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                                    >
                                        Informasi Akun
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DAFTAR SISWA */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-800">Daftar Siswa</h2>
                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    placeholder="cari siswa..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-64 rounded-full border border-slate-200 pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                                />
                                <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
                            </form>
                        </div>

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#2B4184] text-white text-xs">
                                    <th className="p-3 rounded-l-xl">Nama Lengkap</th>
                                    <th className="p-3">E-mail</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3 text-center rounded-r-xl">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                                {siswa.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50">
                                        <td className="p-3">{s.name}</td>
                                        <td className="p-3 text-slate-500">{s.email}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold text-white ${s.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}>
                                                {s.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => { setSelectedUser(s); setModalType('infoSiswa'); }}
                                                className="bg-[#3B5299] text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                                            >
                                                Informasi Akun
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>

                {/* MODAL TAMBAH EDITOR (GAMBAR 3) */}
                {modalType === 'tambahEditor' && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#2B4184] text-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                            <button onClick={() => setModalType(null)} className="absolute top-4 right-4 text-red-400 font-bold">✖</button>
                            <h3 className="text-center font-bold text-lg mb-6">Tambah Editor</h3>
                            <form onSubmit={submitTambahEditor} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold block mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        placeholder="Masukkan nama lengkap"
                                        className="w-full rounded-xl bg-slate-100 text-slate-800 p-3 text-xs focus:outline-none"
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold block mb-1">E-mail</label>
                                    <input
                                        type="email"
                                        placeholder="Masukkan e-mail"
                                        className="w-full rounded-xl bg-slate-100 text-slate-800 p-3 text-xs focus:outline-none"
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold block mb-1">Password</label>
                                    <input
                                        type="password"
                                        placeholder="Masukkan password"
                                        className="w-full rounded-xl bg-slate-100 text-slate-800 p-3 text-xs focus:outline-none"
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setModalType(null)} className="flex-1 bg-slate-400 py-2.5 rounded-xl text-xs font-bold">Batal</button>
                                    <button type="submit" className="flex-1 bg-emerald-500 py-2.5 rounded-xl text-xs font-bold">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL INFORMASI AKUN SISWA / EDITOR (GAMBAR 3 & 4) */}
                {(modalType === 'infoEditor' || modalType === 'infoSiswa') && selectedUser && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#2B4184] text-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                            <button onClick={() => setModalType(null)} className="absolute top-4 right-4 text-red-400 font-bold">✖</button>
                            <h3 className="text-center font-bold text-lg mb-6">Informasi Akun {modalType === 'infoEditor' ? 'Editor' : 'Siswa'}</h3>
                            <div className="bg-white text-slate-800 rounded-2xl p-4 text-xs space-y-3 mb-6">
                                <div><p className="font-bold text-slate-400">Nama Lengkap</p><p className="font-bold">{selectedUser.name}</p></div>
                                <div><p className="font-bold text-slate-400">E-mail</p><p className="font-bold">{selectedUser.email}</p></div>
                                <div>
                                    <p className="font-bold text-slate-400">Status Akun</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white mt-1 ${selectedUser.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}>
                                        {selectedUser.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {modalType === 'infoEditor' ? (
                                    <button onClick={() => setModalType('resetPassword')} className="w-full bg-slate-400 py-2.5 rounded-xl text-xs font-bold">Reset Password</button>
                                ) : (
                                    <>
                                        <button onClick={() => setModalType('nonaktifkan')} className="flex-1 bg-slate-400 py-2.5 rounded-xl text-xs font-bold">Nonaktifkan</button>
                                        <button onClick={() => setModalType('hapus')} className="flex-1 bg-red-500 py-2.5 rounded-xl text-xs font-bold">Hapus</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL NONAKTIFKAN / HAPUS (GAMBAR 4) */}
                {(modalType === 'nonaktifkan' || modalType === 'hapus') && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#2B4184] text-white w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl">
                            <div className="text-3xl mb-2">{modalType === 'nonaktifkan' ? '⚠️' : '🗑️'}</div>
                            <h3 className="font-bold text-base mb-2">{modalType === 'nonaktifkan' ? 'Nonaktifkan User Ini?' : 'Hapus User Ini?'}</h3>
                            <p className="text-xs text-red-300 mb-6">
                                {modalType === 'nonaktifkan' ? 'User tidak dapat login hingga diaktifkan kembali' : 'Data akun akan dihapus permanen.'}
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setModalType(null)} className="flex-1 bg-slate-400 py-2.5 rounded-xl text-xs font-bold">Batal</button>
                                <button
                                    onClick={modalType === 'nonaktifkan' ? handleToggleStatus : handleHapusUser}
                                    className="flex-1 bg-red-500 py-2.5 rounded-xl text-xs font-bold"
                                >
                                    Ya
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}