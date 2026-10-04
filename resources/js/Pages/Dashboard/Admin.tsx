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

// Satu angka ringkasan. Belum didesain.
function KartuAngka({ label, nilai }: { label: string; nilai: number }) {
    return (
        <div className="rounded border bg-white p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{nilai.toLocaleString('id-ID')}</p>
        </div>
    );
}

// Beberapa entri audit log terbaru untuk satu peran. Belum didesain.
function DaftarLog({ judul, logList }: { judul: string; logList: LogItem[] }) {
    return (
        <div className="rounded border bg-white p-4">
            <h2 className="mb-3 font-semibold text-gray-800">{judul}</h2>

            {logList.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada aktivitas.</p>
            ) : (
                <ul className="space-y-3 text-sm">
                    {logList.map((log) => (
                        <li key={log.id}>
                            <p className="text-gray-800">
                                {log.aksi}
                                {log.keterangan && `: ${log.keterangan}`}
                            </p>
                            <p className="text-xs text-gray-500">
                                {log.namaPelaku} · {formatWaktuWib(log.waktu)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Dashboard Admin (rute admin.index). Semua angka dan log dari Admin\DashboardController.
export default function Admin({ totalSiswa, aktifHariIni, jumlahEditor, auditLogAdmin, auditLogEditor }: AdminProps) {
    return (
        <AdminLayout judul="Dashboard">
            <Head title="Dashboard Admin" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <KartuAngka label="Total Siswa" nilai={totalSiswa} />
                <KartuAngka label="Siswa Aktif Hari Ini" nilai={aktifHariIni} />
                <KartuAngka label="Jumlah Editor" nilai={jumlahEditor} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DaftarLog judul="Audit Log Admin" logList={auditLogAdmin} />
                <DaftarLog judul="Audit Log Editor" logList={auditLogEditor} />
            </div>
        </AdminLayout>
    );
}
