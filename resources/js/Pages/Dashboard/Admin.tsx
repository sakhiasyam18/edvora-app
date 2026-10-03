import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function DashboardAdmin() {
    return (
        <>
            <Head title="Dashboard Admin" />
            <div className="flex min-h-screen bg-[#F0F4F9] font-sans text-slate-800">
                {/* SIDEBAR */}
                <aside className="w-64 bg-[#2B4184] p-6 text-white flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-black text-xl">E</div>
                            <span className="font-bold text-xl tracking-wider">EDVORA</span>
                        </div>
                        <nav className="space-y-2">
                            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600/50 font-semibold text-white">
                                📊 Dashboard
                            </Link>
                            <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-200 hover:bg-blue-800/40 transition">
                                👥 Kelola User
                            </Link>
                        </nav>
                    </div>
                </aside>

                {/* CONTENT AREA */}
                <main className="flex-1 p-8">
                    {/* TOPBAR */}
                    <header className="flex justify-between items-center mb-6">
                        <span className="text-2xl">🏠</span>
                        <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center">A</div>
                    </header>

                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ADMIN</p>
                    <h1 className="text-3xl font-black text-slate-800 mb-1">DASHBOARD</h1>
                    <p className="text-sm text-slate-500 mb-8">Ringkasan pengguna dan aktivitas sistem</p>

                    {/* STAT CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-slate-500 font-semibold">Siswa</p>
                                <h3 className="text-3xl font-black text-slate-800">1.503</h3>
                                <p className="text-xs text-slate-400 mt-1">1503 baru minggu ini</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl">👥</div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-slate-500 font-semibold">Aktif Hari Ini</p>
                                <h3 className="text-3xl font-black text-slate-800">248</h3>
                                <p className="text-xs text-slate-400 mt-1">1039 aktif minggu ini</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">👤</div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-slate-500 font-semibold">Editor</p>
                                <h3 className="text-3xl font-black text-slate-800">11</h3>
                                <p className="text-xs text-slate-400 mt-1">0 akun nonaktif</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xl">⚙️</div>
                        </div>
                    </div>

                    {/* AUDIT LOGS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-800">Audit Log</h4>
                                    <p className="text-xs text-slate-400">ADMIN</p>
                                </div>
                                <span className="p-2 rounded-full bg-blue-50 text-blue-500">🛡️</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm">
                                        <span className="text-blue-600">•</span>
                                        <div>
                                            <p className="font-medium text-slate-700">menghapus user</p>
                                            <p className="text-xs text-slate-400">Admin Demo · 29 sep, 13.29</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-800">Audit Log</h4>
                                    <p className="text-xs text-slate-400">EDITOR</p>
                                </div>
                                <span className="p-2 rounded-full bg-blue-50 text-blue-500">🛡️</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm">
                                        <span className="text-blue-600">•</span>
                                        <div>
                                            <p className="font-medium text-slate-700">unpublished soal</p>
                                            <p className="text-xs text-slate-400">Admin Editor · 29 sep, 13.29</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}