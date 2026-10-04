import AdminLayout from '@/Components/Layouts/AdminLayout';
import { formatWaktuWib } from '@/lib/waktu';
import { Head } from '@inertiajs/react';

interface LogItem {
    id: string;
    aksi: string;
    keterangan: string | null;
    namaPelaku: string;
    waktu: string; // ISO, UTC
}

interface AdminProps {
    totalSiswa: number;
    aktifHariIni: number; // siswa yang login sejak 00.00 WIB
    jumlahEditor: number;
    auditLogAdmin: LogItem[];
    auditLogEditor: LogItem[];
}

export default function Admin({ totalSiswa, aktifHariIni, jumlahEditor, auditLogAdmin, auditLogEditor }: AdminProps) {
    return (
        <AdminLayout judul="Dashboard">
            <Head title="Dashboard Admin" />

            <div className="max-w-[1360px] mx-auto space-y-6">
                {/* Section: Page Title & Subtitle */}
                <div className="mb-6">
                    <p className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-1">ADMIN</p>
                    <h2 className="text-3xl font-extrabold text-[#1b2c4e] tracking-tight">DASHBOARD</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Ringkasan pengguna dan aktivitas sistem</p>
                </div>

                {/* BEGIN: MetricsCardsGrid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Ringkasan Statistik">
                    {/* Card 1: Siswa */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm flex items-start justify-between relative overflow-hidden transition hover:shadow-md">
                        <div className="space-y-1">
                            <span className="text-sm font-semibold text-slate-600">Siswa</span>
                            <p className="text-3xl font-extrabold text-[#1b2c4e] tracking-tight">{totalSiswa.toLocaleString('id-ID')}</p>
                            <p className="text-xs font-medium text-slate-400 pt-1">Total siswa terdaftar</p>
                        </div>
                        {/* Siswa Icon Bubble */}
                        <div className="w-14 h-14 rounded-full bg-slate-100/90 flex items-center justify-center shrink-0 text-slate-500">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 2: Aktif Hari Ini */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm flex items-start justify-between relative overflow-hidden transition hover:shadow-md">
                        <div className="space-y-1">
                            <span className="text-sm font-semibold text-slate-600">Aktif Hari Ini</span>
                            <p className="text-3xl font-extrabold text-[#1b2c4e] tracking-tight">{aktifHariIni.toLocaleString('id-ID')}</p>
                            <p className="text-xs font-medium text-slate-400 pt-1">Siswa aktif sejak 00.00 WIB</p>
                        </div>
                        {/* User Active / Checkmark Bubble */}
                        <div className="w-14 h-14 rounded-full bg-emerald-100/70 flex items-center justify-center shrink-0 text-emerald-600">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <polyline points="16 11 18 13 22 9" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 3: Editor */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm flex items-start justify-between relative overflow-hidden transition hover:shadow-md">
                        <div className="space-y-1">
                            <span className="text-sm font-semibold text-slate-600">Editor</span>
                            <p className="text-3xl font-extrabold text-[#1b2c4e] tracking-tight">{jumlahEditor.toLocaleString('id-ID')}</p>
                            <p className="text-xs font-medium text-slate-400 pt-1">Total akun admin editor</p>
                        </div>
                        {/* Editor / Settings Bubble */}
                        <div className="w-14 h-14 rounded-full bg-amber-100/70 flex items-center justify-center shrink-0 text-amber-600">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                                <circle cx="19" cy="11" r="2" />
                            </svg>
                        </div>
                    </div>
                </section>
                {/* END: MetricsCardsGrid */}

                {/* BEGIN: AuditLogsPanels */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2" aria-label="Aktivitas Audit Log">
                    {/* Panel 1: Audit Log ADMIN */}
                    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/70 shadow-sm flex flex-col min-h-[460px]">
                        {/* Header */}
                        <div className="flex items-start justify-between pb-5">
                            <div>
                                <h3 className="text-xl font-bold text-[#1b2c4e]">Audit Log</h3>
                                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase mt-0.5">ADMIN</p>
                            </div>
                            {/* Shield Icon Badge */}
                            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                        </div>

                        {/* Inner Log Container */}
                        <div className="border border-slate-200/90 rounded-2xl p-5 flex-1 bg-white">
                            {auditLogAdmin.length === 0 ? (
                                <p className="text-sm text-slate-400 italic py-8 text-center">Belum ada aktivitas admin.</p>
                            ) : (
                                <ul className="space-y-5">
                                    {auditLogAdmin.map((log) => (
                                        <li key={log.id} className="flex items-start gap-3.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 mt-1.5 shrink-0" />
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-slate-800">
                                                    {log.aksi}
                                                    {log.keterangan ? `: ${log.keterangan}` : ''}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    {log.namaPelaku} · {formatWaktuWib(log.waktu)}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Panel 2: Audit Log EDITOR */}
                    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/70 shadow-sm flex flex-col min-h-[460px]">
                        {/* Header */}
                        <div className="flex items-start justify-between pb-5">
                            <div>
                                <h3 className="text-xl font-bold text-[#1b2c4e]">Audit Log</h3>
                                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase mt-0.5">EDITOR</p>
                            </div>
                            {/* Shield Icon Badge */}
                            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                        </div>

                        {/* Inner Log Container */}
                        <div className="border border-slate-200/90 rounded-2xl p-5 flex-1 bg-white">
                            {auditLogEditor.length === 0 ? (
                                <p className="text-sm text-slate-400 italic py-8 text-center">Belum ada aktivitas editor.</p>
                            ) : (
                                <ul className="space-y-5">
                                    {auditLogEditor.map((log) => (
                                        <li key={log.id} className="flex items-start gap-3.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 mt-1.5 shrink-0" />
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-slate-800">
                                                    {log.aksi}
                                                    {log.keterangan ? `: ${log.keterangan}` : ''}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    {log.namaPelaku} · {formatWaktuWib(log.waktu)}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </section>
                {/* END: AuditLogsPanels */}
            </div>
        </AdminLayout>
    );
}
