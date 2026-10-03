import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useForm } from '@inertiajs/react';
import SiswaLayout from '../../Components/Layouts/SiswaLayout';

interface ProgramStudi {
    id: string | number;
    nama: string;
    jenjang?: string | null;
}

interface Universitas {
    id: string | number;
    nama: string;
    prodi?: ProgramStudi[];
}

interface Option {
    label: string;
    value: string | number;
}

interface SearchableDropdownProps {
    label: string;
    options: Option[];
    value: string | number;
    onChange: (val: string | number) => void;
    placeholder: string;
    searchPlaceholder: string;
    disabled?: boolean;
}

interface User {
    nama_lengkap?: string;
    email: string;
    kelas?: string;
    jenis_kelamin?: string;
    universitas_id?: string | number;
    prodi_id?: string | number;
}

interface ProfilProps {
    user: User;
    universitasList?: Universitas[];
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    disabled = false,
}) => {
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

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find((opt) => String(opt.value) === String(value));
    const selectedLabel = selectedOption ? selectedOption.label : placeholder;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full p-3 border border-gray-200 rounded-lg flex justify-between items-center bg-white transition-all duration-300 ease-in-out ${
                    disabled
                        ? 'bg-gray-100 cursor-not-allowed opacity-60'
                        : 'cursor-pointer hover:border-blue-400 focus:ring-2 focus:ring-blue-100'
                }`}
            >
                <span className={value ? 'text-gray-900' : 'text-gray-400'}>{selectedLabel}</span>
                <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
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
};

export default function Profil({ user, universitasList = [] }: ProfilProps) {
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const { data, setData, patch, processing } = useForm({
        nama_lengkap: user?.nama_lengkap || '',
        kelas: user?.kelas || '',
        jenis_kelamin: user?.jenis_kelamin || '',
        universitas_id: user?.universitas_id || '',
        prodi_id: user?.prodi_id || '',
    });

    const universitasTerpilih = universitasList.find(
        (u) => String(u.id) === String(data.universitas_id)
    );

    const daftarProdi = universitasTerpilih?.prodi ?? [];

    useEffect(() => {
        if (!data.universitas_id) {
            setData('prodi_id', '');
            return;
        }
        const prodiTersedia = daftarProdi.some((p) => String(p.id) === String(data.prodi_id));
        if (!prodiTersedia) {
            setData('prodi_id', '');
        }
    }, [data.universitas_id]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setShowSuccessModal(true);
            },
        };

        // @ts-ignore
        if (typeof route !== 'undefined') {
            // @ts-ignore
            patch(route('akun.profil.update'), options);
        } else {
            patch('/akun/profil', options);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-8">Biodata</h2>

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Nama Lengkap</label>
                        <input
                            type="text"
                            value={data.nama_lengkap}
                            onChange={(e) => setData('nama_lengkap', e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 outline-none text-gray-900"
                            placeholder="Masukkan nama lengkap"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full p-3 border border-gray-100 bg-gray-50 text-gray-400 rounded-lg cursor-not-allowed outline-none"
                        />
                        <p className="mt-1.5 text-xs text-gray-400 font-medium">Email tidak dapat diubah.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">Kelas</label>
                            <select
                                value={data.kelas}
                                onChange={(e) => setData('kelas', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 outline-none bg-white text-gray-900"
                            >
                                <option value="" disabled>Pilih Kelas</option>
                                <option value="10_sma">Kelas 10 (SMA)</option>
                                <option value="11_sma">Kelas 11 (SMA)</option>
                                <option value="12_sma">Kelas 12 (SMA)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">Jenis Kelamin</label>
                            <select
                                value={data.jenis_kelamin}
                                onChange={(e) => setData('jenis_kelamin', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 outline-none bg-white text-gray-900"
                            >
                                <option value="" disabled>Pilih Jenis Kelamin</option>
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                            </select>
                        </div>
                    </div>

                    <SearchableDropdown
                        label="Universitas"
                        placeholder="Pilih Universitas"
                        searchPlaceholder="Cari universitas..."
                        options={universitasList.map((u) => ({ label: u.nama, value: u.id }))}
                        value={data.universitas_id}
                        onChange={(val) => setData('universitas_id', val)}
                    />

                    <SearchableDropdown
                        label="Prodi"
                        placeholder={
                            data.universitas_id
                                ? 'Pilih Program Studi'
                                : 'Pilih Universitas Terlebih Dahulu'
                        }
                        searchPlaceholder="Cari program studi..."
                        options={daftarProdi.map((p) => ({
                            label: `${p.nama}${p.jenjang ? ` (${p.jenjang})` : ''}`,
                            value: p.id,
                        }))}
                        value={data.prodi_id}
                        onChange={(val) => setData('prodi_id', val)}
                        disabled={!data.universitas_id || daftarProdi.length === 0}
                    />

                    <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
                        <button
                            type="button"
                            className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all duration-200"
                            onClick={() => window.history.back()}
                        >
                            Batal
                        </button>
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

            {/* Modal Pop-up Berhasil */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity p-4">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200">
                        {/* Circle Green Icon */}
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <div className="w-12 h-12 bg-emerald-100/80 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-7 h-7 text-emerald-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-xl font-bold text-emerald-500 mb-1">Berhasil!</h3>
                        <p className="text-sm text-gray-500 mb-6">Biodata anda berhasil diperbarui</p>

                        {/* Button OK */}
                        <button
                            type="button"
                            onClick={() => setShowSuccessModal(false)}
                            className="w-28 py-2.5 bg-[#4285F4] hover:bg-blue-600 active:scale-95 text-white font-medium text-sm rounded-lg shadow-md transition-all duration-200 mx-auto block"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

Profil.layout = (page: ReactNode) => <SiswaLayout>{page}</SiswaLayout>;