<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    // Banyak entri audit log terbaru yang ditampilkan per peran.
    private const JUMLAH_LOG = 5;

    public function index(): Response
    {
        // Aktif hari ini = siswa yang login sejak pukul 00.00 WIB. Database menyimpan waktu dalam UTC.
        $awalHariIni = CarbonImmutable::now('Asia/Jakarta')->startOfDay()->utc();

        return Inertia::render('Dashboard/Admin', [
            'totalSiswa' => User::where('role', 'siswa')->count(),
            'aktifHariIni' => User::where('role', 'siswa')->where('terakhir_login_at', '>=', $awalHariIni)->count(),
            'jumlahEditor' => User::where('role', 'admin_editor')->count(),
            'auditLogAdmin' => $this->logTerbaru('admin'),
            'auditLogEditor' => $this->logTerbaru('admin_editor'),
        ]);
    }

    private function logTerbaru(string $peran): Collection
    {
        return AuditLog::with('user:id,name')
            ->where('peran', $peran)
            ->orderByDesc('created_at')
            ->limit(self::JUMLAH_LOG)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'aksi' => $log->aksi,
                'keterangan' => $log->keterangan,
                'namaPelaku' => $log->user?->name ?? 'Akun sudah dihapus',
                'waktu' => $log->created_at->toIso8601String(),
            ]);
    }
}
