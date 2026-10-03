import { FormEventHandler, ReactNode, useEffect, useRef, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import SiswaLayout from '@/Components/Layouts/SiswaLayout';
import Modal from '@/Components/Modal';

interface ProgramStudi {
    id: string;
    nama: string;
    jenjang?: string | null;
}

interface Universitas {
    id: string;
    nama: string;
    prodi: ProgramStudi[];
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
    } | null;
    prodi: {
        id: string;
        nama: string;
        jenjang?: string | null;
    } | null;
}

// Props dari ProfileController::show.
interface ProfilProps {
    title?: string;
    user: UserData;
    siswa: SiswaData;
    universitasList: Universitas[];
    pilihanKelas: PilihanKelas[];
}

interface Option {
    label: string;
    value: string;
}

interface SearchableDropdownProps {
    label: string;
    options: Option[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    disabled?: boolean;
}

// Dropdown dengan kolom pencarian, untuk daftar Universitas dan Prodi yang panjang.
function SearchableDropdown({ label, options, value, onChange, placeholder, searchPlaceholder, disabled = false }: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));

    const selectedOption = options.find((opt) => opt.value === value);
    const selectedLabel = selectedOption ? selectedOption.label : placeholder;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full p-3 border border-gray-200 rounded-lg flex justify-between items-center bg-white transition-all duration-300 ease-in-out ${
                    disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-blue-400 focus:ring-2 focus:ring-blue-100'
                }`}
            >
                <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>{selectedLabel}</span>
                <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden transition-all duration-300 origin-top">
                    <div className="p-2 border-b border-gray-50">
                        <div className="relative">
                            <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                className="w-full pl-9 p-2 text-sm border-none bg-gray-50 rounded-md focus:ring-0 focus:outline-none text-gray-800"
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <li
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className="p-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors duration-200"
                                >
                                    {opt.label}
                                </li>
                            ))
                        ) : (
                            <li className="p-3 text-sm text-gray-500 text-center">Tidak ditemukan</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

// Pesan validasi dari server (SimpanBiodataRequest) di bawah field.
function PesanError({ pesan }: { pesan?: string }) {
    return pesan ? <p className="mt-1.5 text-sm text-red-600">{pesan}</p> : null;
}

// Edit Biodata dari Akun Pribadi. Simpan berhasil → pop-up "Berhasil!", lalu OK menuju Akun Pribadi.
export default function Profil({ title = 'Edit Biodata', user, siswa, universitasList, pilihanKelas }: ProfilProps) {
    // Nama field sama dengan aturan SimpanBiodataRequest; email tidak dikirim karena tidak bisa diubah.
    const { data, setData, patch, processing, errors } = useForm({
        namaLengkap: siswa?.namaLengkap || user?.name || '',
        kelas: siswa?.kelas || '',
        jenisKelamin: siswa?.jenisKelamin || '',
        universitasTujuanId: siswa?.universitasTujuanId || '',
        prodiTujuanId: siswa?.prodiTujuanId || '',
    });

    // Pesan sekali tampil dari ProfileController::updateBiodata; ada = biodata baru saja tersimpan.
    const { flash } = usePage();
    const pesanSukses = typeof flash.sukses === 'string' ? flash.sukses : null;

    const universitasTerpilih = universitasList.find((u) => u.id === data.universitasTujuanId);
    const daftarProdi = universitasTerpilih?.prodi ?? [];

    // Universitas berganti: kosongkan prodi bila tidak tersedia di universitas yang baru.
    useEffect(() => {
        if (!data.universitasTujuanId) {
            setData('prodiTujuanId', '');
            return;
        }
        if (!daftarProdi.some((p) => p.id === data.prodiTujuanId)) {
            setData('prodiTujuanId', '');
        }
    }, [data.universitasTujuanId]);

    // Valid → server kembali ke halaman ini dengan flash sukses (pop-up); tidak valid → pesan error di bawah field.
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('akun.profil.update'), { preserveScroll: true });
    };

    return (
        <>
            <Head title={title} />

            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-8">Biodata</h2>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label htmlFor="nama-lengkap" className="block text-sm font-semibold text-gray-800 mb-2">
                                Nama Lengkap
                            </label>
                            <input
                                id="nama-lengkap"
                                type="text"
                                maxLength={50}
                                value={data.namaLengkap}
                                onChange={(e) => setData('namaLengkap', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 outline-none text-gray-900"
                                placeholder="Masukkan nama lengkap"
                            />
                            <PesanError pesan={errors.namaLengkap} />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full p-3 border border-gray-100 bg-gray-50 text-gray-400 rounded-lg cursor-not-allowed outline-none"
                            />
                            <p className="mt-1.5 text-xs text-gray-400 font-medium">Email tidak dapat diubah.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="kelas" className="block text-sm font-semibold text-gray-800 mb-2">
                                    Kelas
                                </label>
                                <select
                                    id="kelas"
                                    value={data.kelas}
                                    onChange={(e) => setData('kelas', e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 outline-none bg-white text-gray-900"
                                >
                                    <option value="" disabled>
                                        Pilih Kelas
                                    </option>
                                    {/* Daftar dari Siswa::PILIHAN_KELAS, sama dengan yang divalidasi server. */}
                                    {pilihanKelas.map((item) => (
                                        <option key={item.nilai} value={item.nilai}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                                <PesanError pesan={errors.kelas} />
                            </div>
                            <div>
                                <label htmlFor="jenis-kelamin" className="block text-sm font-semibold text-gray-800 mb-2">
                                    Jenis Kelamin
                                </label>
                                <select
                                    id="jenis-kelamin"
                                    value={data.jenisKelamin}
                                    onChange={(e) => setData('jenisKelamin', e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 outline-none bg-white text-gray-900"
                                >
                                    <option value="" disabled>
                                        Pilih Jenis Kelamin
                                    </option>
                                    <option value="laki-laki">Laki-laki</option>
                                    <option value="perempuan">Perempuan</option>
                                </select>
                                <PesanError pesan={errors.jenisKelamin} />
                            </div>
                        </div>

                        <div>
                            <SearchableDropdown
                                label="Universitas"
                                placeholder="Pilih Universitas"
                                searchPlaceholder="Cari universitas..."
                                options={universitasList.map((u) => ({ label: u.nama, value: u.id }))}
                                value={data.universitasTujuanId}
                                onChange={(val) => setData('universitasTujuanId', val)}
                            />
                            <PesanError pesan={errors.universitasTujuanId} />
                        </div>

                        <div>
                            <SearchableDropdown
                                label="Prodi"
                                placeholder={data.universitasTujuanId ? 'Pilih Program Studi' : 'Pilih Universitas Terlebih Dahulu'}
                                searchPlaceholder="Cari program studi..."
                                options={daftarProdi.map((p) => ({
                                    label: `${p.nama}${p.jenjang ? ` (${p.jenjang})` : ''}`,
                                    value: p.id,
                                }))}
                                value={data.prodiTujuanId}
                                onChange={(val) => setData('prodiTujuanId', val)}
                                disabled={!data.universitasTujuanId || daftarProdi.length === 0}
                            />
                            <PesanError pesan={errors.prodiTujuanId} />
                        </div>

                        <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
                            {/* Batal: kembali ke Akun Pribadi tanpa menyimpan. */}
                            <Link
                                href={route('akun.profil.utama')}
                                className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all duration-200"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className={`px-6 py-2.5 text-sm font-semibold text-white bg-[#4285F4] rounded-lg hover:bg-blue-600 active:scale-95 transition-all duration-200 shadow-sm shadow-blue-200 ${
                                    processing ? 'opacity-70 cursor-wait' : ''
                                }`}
                            >
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Pop-up berhasil: hanya bisa ditutup lewat OK, yang menuju Akun Pribadi. Desain menyusul. */}
            <Modal show={pesanSukses !== null} maxWidth="sm" closeable={false}>
                <div className="p-6 text-center text-[#26355D]">
                    <h3 className="text-xl font-bold">Berhasil!</h3>
                    <p className="mt-2 text-sm">{pesanSukses}</p>
                    <button
                        type="button"
                        onClick={() => router.visit(route('akun.profil.utama'))}
                        className="mt-5 rounded-lg bg-[#5B88DD] px-8 py-2 font-medium text-white"
                    >
                        OK
                    </button>
                </div>
            </Modal>
        </>
    );
}

// Persistent layout: sidebar tidak dirender ulang saat pindah dari/ke Akun Pribadi.
Profil.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;
