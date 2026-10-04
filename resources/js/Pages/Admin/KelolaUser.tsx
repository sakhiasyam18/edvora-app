import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import AdminLayout from '@/Components/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { formatWaktuWib } from '@/lib/waktu';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, ReactNode, useState } from 'react';

interface SiswaItem {
    id: string;
    namaLengkap: string;
    email: string;
    kelasLabel: string | null;
    jenisKelamin: 'laki-laki' | 'perempuan' | null;
    isActive: boolean;
    tanggalDaftar: string | null; // ISO, UTC
    terakhirLogin: string | null; // ISO, UTC; null = belum pernah login sejak kolom ini ada
}

interface EditorItem {
    id: string;
    namaLengkap: string;
    email: string;
    tanggalDaftar: string | null;
    terakhirLogin: string | null;
}

interface KelolaUserProps {
    siswaList: SiswaItem[];
    editorList: EditorItem[];
}

// Pop-up yang sedang terbuka; hanya satu dalam satu waktu (UCS6 bagian 6).
type PopUp =
    | { jenis: 'tambahEditor' }
    | { jenis: 'infoEditor'; editor: EditorItem }
    | { jenis: 'konfirmasiReset'; editor: EditorItem }
    | { jenis: 'formReset'; editor: EditorItem }
    | { jenis: 'infoSiswa'; siswa: SiswaItem }
    | { jenis: 'konfirmasiNonaktifkan'; siswa: SiswaItem }
    | { jenis: 'konfirmasiHapus'; siswa: SiswaItem };

const LABEL_JENIS_KELAMIN = { 'laki-laki': 'Laki-laki', perempuan: 'Perempuan' } as const;

const formatWaktu = (iso: string | null) => (iso ? formatWaktuWib(iso) : '-');

// Satu baris informasi akun di pop-up. Belum didesain.
function Isian({ label, isi }: { label: string; isi: ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="text-gray-800">{isi}</dd>
        </div>
    );
}

// Konfirmasi aksi hapus, nonaktifkan, dan reset password, dengan tombol 'Iya' dan 'Tidak' (UCS6 bagian 3).
function Konfirmasi({ pesan, memproses, onIya, onTidak }: { pesan: string; memproses: boolean; onIya: () => void; onTidak: () => void }) {
    return (
        <div className="space-y-4">
            <p className="text-gray-800">{pesan}</p>
            <div className="flex justify-end gap-2">
                <SecondaryButton onClick={onTidak} disabled={memproses}>
                    Tidak
                </SecondaryButton>
                <DangerButton onClick={onIya} disabled={memproses}>
                    Iya
                </DangerButton>
            </div>
        </div>
    );
}

// Daftar User (UCS6): daftar editor (list) dan daftar siswa (tabel), beserta pop-up aksinya. Belum didesain.
export default function KelolaUser({ siswaList, editorList }: KelolaUserProps) {
    const [popUp, setPopUp] = useState<PopUp | null>(null);

    // Nama field sama dengan aturan validasi di Admin\UserController.
    const formEditor = useForm({ namaLengkap: '', email: '', password: '' });
    const formReset = useForm({ password: '' });
    // Aksi tanpa isian (nonaktifkan, hapus); dipakai untuk status memproses.
    const aksi = useForm({});

    const tutup = () => {
        setPopUp(null);
        formEditor.reset();
        formEditor.clearErrors();
        formReset.reset();
        formReset.clearErrors();
    };

    // Berhasil maupun gagal di server, pop-up ditutup dan pesannya tampil dari flash. Error validasi tetap di form.
    const simpanEditor: FormEventHandler = (e) => {
        e.preventDefault();
        formEditor.post(route('admin.user.tambahEditor'), { preserveScroll: true, onSuccess: tutup });
    };

    const simpanReset = (editor: EditorItem): FormEventHandler => (e) => {
        e.preventDefault();
        formReset.put(route('admin.user.resetPassword', editor.id), { preserveScroll: true, onSuccess: tutup });
    };

    const nonaktifkan = (siswa: SiswaItem) =>
        aksi.put(route('admin.user.nonaktifkan', siswa.id), { preserveScroll: true, onSuccess: tutup });

    const hapus = (siswa: SiswaItem) =>
        aksi.delete(route('admin.user.hapus', siswa.id), { preserveScroll: true, onSuccess: tutup });

    const isiPopUp = (p: PopUp) => {
        switch (p.jenis) {
            case 'tambahEditor':
                return (
                    <form onSubmit={simpanEditor} className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800">Tambah Editor</h2>

                        <div>
                            <InputLabel htmlFor="namaLengkap" value="Nama" />
                            <TextInput
                                id="namaLengkap"
                                value={formEditor.data.namaLengkap}
                                onChange={(e) => formEditor.setData('namaLengkap', e.target.value)}
                                className="mt-1 block w-full"
                                isFocused
                            />
                            <InputError message={formEditor.errors.namaLengkap} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                type="email"
                                value={formEditor.data.email}
                                onChange={(e) => formEditor.setData('email', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={formEditor.errors.email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password" value="Password" />
                            <TextInput
                                id="password"
                                type="password"
                                value={formEditor.data.password}
                                onChange={(e) => formEditor.setData('password', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={formEditor.errors.password} className="mt-1" />
                        </div>

                        <div className="flex justify-end gap-2">
                            <SecondaryButton onClick={tutup}>Tutup</SecondaryButton>
                            <PrimaryButton type="submit" disabled={formEditor.processing}>
                                Simpan
                            </PrimaryButton>
                        </div>
                    </form>
                );

            case 'infoEditor':
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800">Informasi Akun Editor</h2>
                        <dl className="space-y-2 text-sm">
                            <Isian label="Nama Lengkap" isi={p.editor.namaLengkap} />
                            <Isian label="Email" isi={p.editor.email} />
                            <Isian label="Tanggal Daftar" isi={formatWaktu(p.editor.tanggalDaftar)} />
                            <Isian label="Terakhir Login" isi={formatWaktu(p.editor.terakhirLogin)} />
                        </dl>
                        <div className="flex justify-end gap-2">
                            <SecondaryButton onClick={tutup}>Tutup</SecondaryButton>
                            <PrimaryButton onClick={() => setPopUp({ jenis: 'konfirmasiReset', editor: p.editor })}>
                                Reset Password
                            </PrimaryButton>
                        </div>
                    </div>
                );

            case 'konfirmasiReset':
                return (
                    <Konfirmasi
                        pesan="Reset password editor ini?"
                        memproses={false}
                        onIya={() => setPopUp({ jenis: 'formReset', editor: p.editor })}
                        onTidak={() => setPopUp({ jenis: 'infoEditor', editor: p.editor })}
                    />
                );

            case 'formReset':
                return (
                    <form onSubmit={simpanReset(p.editor)} className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800">Reset Password</h2>
                        <p className="text-sm text-gray-500">{p.editor.namaLengkap}</p>

                        <div>
                            <InputLabel htmlFor="passwordSementara" value="Password Sementara" />
                            <TextInput
                                id="passwordSementara"
                                type="password"
                                value={formReset.data.password}
                                onChange={(e) => formReset.setData('password', e.target.value)}
                                className="mt-1 block w-full"
                                isFocused
                            />
                            <InputError message={formReset.errors.password} className="mt-1" />
                        </div>

                        <div className="flex justify-end gap-2">
                            <SecondaryButton onClick={tutup}>Tutup</SecondaryButton>
                            <PrimaryButton type="submit" disabled={formReset.processing}>
                                Simpan
                            </PrimaryButton>
                        </div>
                    </form>
                );

            case 'infoSiswa':
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800">Informasi Akun Siswa</h2>
                        <dl className="space-y-2 text-sm">
                            <Isian label="Nama Lengkap" isi={p.siswa.namaLengkap} />
                            <Isian label="Email" isi={p.siswa.email} />
                            <Isian label="Status Akun" isi={p.siswa.isActive ? 'Aktif' : 'Nonaktif'} />
                            <Isian label="Kelas" isi={p.siswa.kelasLabel ?? '-'} />
                            <Isian label="Jenis Kelamin" isi={p.siswa.jenisKelamin ? LABEL_JENIS_KELAMIN[p.siswa.jenisKelamin] : '-'} />
                            <Isian label="Tanggal Daftar" isi={formatWaktu(p.siswa.tanggalDaftar)} />
                            <Isian label="Terakhir Login" isi={formatWaktu(p.siswa.terakhirLogin)} />
                        </dl>
                        <div className="flex justify-end gap-2">
                            <SecondaryButton onClick={tutup}>Tutup</SecondaryButton>
                            {p.siswa.isActive && (
                                <SecondaryButton onClick={() => setPopUp({ jenis: 'konfirmasiNonaktifkan', siswa: p.siswa })}>
                                    Nonaktifkan User
                                </SecondaryButton>
                            )}
                            <DangerButton onClick={() => setPopUp({ jenis: 'konfirmasiHapus', siswa: p.siswa })}>
                                Hapus User
                            </DangerButton>
                        </div>
                    </div>
                );

            case 'konfirmasiNonaktifkan':
                return (
                    <Konfirmasi
                        pesan="Nonaktifkan user ini? User tidak dapat login hingga diaktifkan kembali."
                        memproses={aksi.processing}
                        onIya={() => nonaktifkan(p.siswa)}
                        onTidak={() => setPopUp({ jenis: 'infoSiswa', siswa: p.siswa })}
                    />
                );

            case 'konfirmasiHapus':
                return (
                    <Konfirmasi
                        pesan="Hapus user ini? Data pribadi akan dihapus permanen."
                        memproses={aksi.processing}
                        onIya={() => hapus(p.siswa)}
                        onTidak={() => setPopUp({ jenis: 'infoSiswa', siswa: p.siswa })}
                    />
                );
        }
    };

    return (
        <AdminLayout judul="Daftar User">
            <Head title="Daftar User" />

            {/* Daftar editor: komponen List (UCS6 bagian 3). */}
            <div className="rounded border bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Daftar Editor</h2>
                    <PrimaryButton onClick={() => setPopUp({ jenis: 'tambahEditor' })}>Tambah Editor</PrimaryButton>
                </div>

                {editorList.length === 0 ? (
                    <p className="text-sm text-gray-500">Belum ada editor.</p>
                ) : (
                    <ul className="divide-y text-sm">
                        {editorList.map((editor) => (
                            <li key={editor.id} className="flex items-center justify-between gap-4 py-2">
                                <span className="text-gray-800">{editor.namaLengkap}</span>
                                <span className="text-gray-500">{editor.email}</span>
                                <SecondaryButton onClick={() => setPopUp({ jenis: 'infoEditor', editor })}>
                                    Informasi Akun
                                </SecondaryButton>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Daftar siswa: komponen Tabel (UCS6 bagian 3). */}
            <div className="rounded border bg-white p-4">
                <h2 className="mb-3 font-semibold text-gray-800">Daftar Siswa</h2>

                {siswaList.length === 0 ? (
                    <p className="text-sm text-gray-500">Belum ada siswa.</p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b text-gray-500">
                            <tr>
                                <th className="py-2">Nama</th>
                                <th className="py-2">Kelas</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-gray-800">
                            {siswaList.map((siswa) => (
                                <tr key={siswa.id}>
                                    <td className="py-2">{siswa.namaLengkap}</td>
                                    <td className="py-2">{siswa.kelasLabel ?? '-'}</td>
                                    <td className="py-2">{siswa.isActive ? 'Aktif' : 'Nonaktif'}</td>
                                    <td className="py-2">
                                        <SecondaryButton onClick={() => setPopUp({ jenis: 'infoSiswa', siswa })}>
                                            Informasi Akun
                                        </SecondaryButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal show={popUp !== null} onClose={tutup} maxWidth="md">
                <div className="p-6">{popUp && isiPopUp(popUp)}</div>
            </Modal>
        </AdminLayout>
    );
}
