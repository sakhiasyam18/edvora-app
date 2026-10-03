<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        // Mengambil user dengan role 'admin_editor' sesuai isi database
        $editors = User::where('role', 'admin_editor')
            ->orderBy('created_at', 'desc')
            ->get();

        // Query Siswa dengan role 'siswa'
        $siswaQuery = User::where('role', 'siswa');
        if ($search) {
            $siswaQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }
        $siswa = $siswaQuery->orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/KelolaUser', [
            'editors' => $editors,
            'siswa' => $siswa,
            'filters' => ['search' => $search],
        ]);
    }

    public function storeEditor(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => 'required|string|min:6',
            ]);

            User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'admin_editor',
                'is_active' => true,
                'email_verified_at' => now(), // Langsung terverifikasi saat dibuat
            ]);

            return back()->with('success', 'Editor baru berhasil ditambahkan');
        } catch (ValidationException $e) {
            if (isset($e->errors()['email'])) {
                return back()->with('error', 'E-mail sudah digunakan');
            }
            return back()->with('error', 'User editor gagal ditambahkan');
        } catch (\Exception $e) {
            return back()->with('error', 'User editor gagal ditambahkan');
        }
    }

    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return back()->with('success', 'Password berhasil direset');
    }

    public function toggleStatus(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            return back()->with('error', 'Tidak dapat menonaktifkan akun sendiri');
        }

        $user->update(['is_active' => !$user->is_active]);

        return back()->with('success', 'Status user berhasil diperbarui');
    }

    public function destroy(Request $request, User $user)
    {
        try {
            if ($request->user()->id === $user->id) {
                return back()->with('error', 'User gagal dihapus');
            }

            $user->delete();
            return back()->with('success', 'User berhasil dihapus');
        } catch (\Exception $e) {
            return back()->with('error', 'User gagal dihapus');
        }
    }
}
