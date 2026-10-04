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
    searchPlaceholder?: string;
    disabled?: boolean;
    // false: tanpa kolom pencarian, untuk pilihan pendek (Kelas, Jenis Kelamin).
    pencarian?: boolean;
}

// Kolom isian seragam di halaman ini: tinggi, sudut, garis, dan cincin fokus yang sama.
const KELAS_KOLOM =
    'h-11 w-full rounded-[10px] border border-siswa-garis-halus bg-white px-3.5 text-[14px] text-siswa-judul-seksi transition duration-200';
const KELAS_LABEL = 'mb-1.5 block text-[14px] font-medium text-siswa-judul-seksi';

// Dropdown bergaya sama untuk semua pilihan; daftar panjang (Universitas, Prodi) diberi kolom pencarian.
function SearchableDropdown({ label, options, value, onChange, placeholder, searchPlaceholder = 'Cari...', disabled = false, pencarian = true }: SearchableDropdownProps) {
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
    const terbuka = isOpen && !disabled;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <span className={KELAS_LABEL}>{label}</span>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={terbuka}
                aria-label={`${label}: ${selectedLabel}`}
                className={`${KELAS_KOLOM} flex items-center justify-between gap-3 text-left ${
                    disabled
                        ? 'cursor-not-allowed bg-siswa-laman-awal opacity-70'
                        : `hover:border-edvora-primary/60 ${terbuka ? 'border-edvora-primary ring-2 ring-edvora-primary/20' : ''}`
                }`}
            >
                <span className={`truncate ${selectedOption ? '' : 'text-siswa-teks-redup'}`}>{selectedLabel}</span>
                <svg
                    className={`h-4 w-4 shrink-0 text-siswa-teks transition-transform duration-300 ${terbuka ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Hanya dirender saat terbuka: daftar yang tersembunyi tetap memanjangkan halaman (latar putih di bawah).
                    Muncul dengan memudar dan sedikit membesar (animate-buka-menu). */}
            {terbuka && (
                <div className="absolute z-20 mt-1.5 w-full origin-top animate-buka-menu overflow-hidden rounded-[12px] border border-siswa-garis-halus bg-white shadow-kartu">
                    {pencarian && (
                        <div className="border-b border-siswa-garis-halus p-2">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-siswa-teks" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    autoFocus
                                    className="h-9 w-full rounded-[8px] border-none bg-siswa-laman-awal pl-9 pr-3 text-[13px] text-siswa-judul-seksi placeholder:text-siswa-teks-redup focus:outline-none focus:ring-2 focus:ring-edvora-primary/20"
                                    placeholder={searchPlaceholder}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const terpilih = opt.value === value;
                                return (
                                    <li
                                        key={opt.value}
                                        role="option"
                                        aria-selected={terpilih}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-[14px] transition-colors duration-150 hover:bg-siswa-panel-fleksibel ${
                                            terpilih ? 'font-semibold text-edvora-primary' : 'text-siswa-judul-seksi'
                                        }`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {terpilih && (
                                            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12.5l4.5 4.5L19 7" />
                                            </svg>
                                        )}
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-3.5 py-3 text-center text-[13px] text-siswa-teks">Tidak ditemukan</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

// Pesan validasi dari server (SimpanBiodataRequest) di bawah field.
function PesanError({ pesan }: { pesan?: string }) {
    return pesan ? <p className="mt-1.5 text-[13px] text-siswa-umpan-salah-teks">{pesan}</p> : null;
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

            {/* Kartu dan huruf mengikuti Beranda; lebar dibatasi supaya kolom isian tidak terlalu panjang. */}
            <div className="mx-auto w-full max-w-[880px] font-poppins">
                <div className="animate-muncul-halus rounded-kartu bg-white px-[26px] py-6 shadow-kartu md:px-8 md:py-7">
                    <h2 className="text-[18px] font-semibold leading-tight text-siswa-judul-seksi">Biodata</h2>

                    <form onSubmit={submit} className="mt-5 space-y-5">
                        <div>
                            <label htmlFor="nama-lengkap" className={KELAS_LABEL}>
                                Nama Lengkap
                            </label>
                            <input
                                id="nama-lengkap"
                                type="text"
                                maxLength={50}
                                value={data.namaLengkap}
                                onChange={(e) => setData('namaLengkap', e.target.value)}
                                className={`${KELAS_KOLOM} placeholder:text-siswa-teks-redup hover:border-edvora-primary/60 focus:border-edvora-primary focus:outline-none focus:ring-2 focus:ring-edvora-primary/20`}
                                placeholder="Masukkan nama lengkap"
                            />
                            <PesanError pesan={errors.namaLengkap} />
                        </div>

                        <div>
                            <label htmlFor="email" className={KELAS_LABEL}>
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className={`${KELAS_KOLOM} cursor-not-allowed bg-siswa-laman-awal text-siswa-teks`}
                            />
                            <p className="mt-1.5 text-[12px] text-siswa-teks">Email tidak dapat diubah.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                {/* Daftar dari Siswa::PILIHAN_KELAS, sama dengan yang divalidasi server. */}
                                <SearchableDropdown
                                    label="Kelas"
                                    placeholder="Pilih Kelas"
                                    pencarian={false}
                                    options={pilihanKelas.map((item) => ({ label: item.label, value: item.nilai }))}
                                    value={data.kelas}
                                    onChange={(val) => setData('kelas', val)}
                                />
                                <PesanError pesan={errors.kelas} />
                            </div>
                            <div>
                                <SearchableDropdown
                                    label="Jenis Kelamin"
                                    placeholder="Pilih Jenis Kelamin"
                                    pencarian={false}
                                    options={[
                                        { label: 'Laki-laki', value: 'laki-laki' },
                                        { label: 'Perempuan', value: 'perempuan' },
                                    ]}
                                    value={data.jenisKelamin}
                                    onChange={(val) => setData('jenisKelamin', val)}
                                />
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

                        <div className="mt-2 flex justify-end gap-3 border-t border-siswa-garis-halus pt-5">
                            {/* Batal: kembali ke Akun Pribadi tanpa menyimpan. */}
                            <Link
                                href={route('akun.profil.utama')}
                                className="inline-flex h-10 items-center rounded-[10px] border border-siswa-garis-halus bg-white px-6 text-[14px] font-semibold text-siswa-judul-seksi shadow-panel transition duration-200 hover:-translate-y-0.5 hover:bg-siswa-panel-fleksibel"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className={`inline-flex h-10 items-center rounded-[10px] bg-ujian-biru px-7 text-[14px] font-semibold text-white shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                    processing ? 'cursor-wait opacity-70' : ''
                                }`}
                            >
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Pop-up berhasil: hanya bisa ditutup lewat OK, yang menuju Akun Pribadi. */}
            <Modal show={pesanSukses !== null} maxWidth="sm" closeable={false} backdropClassName="bg-siswa-judul/30 backdrop-blur-[2px]" panelClassName="rounded-[24px]">
                <div className="flex flex-col items-center p-7 text-center font-poppins">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-siswa-umpan-benar text-siswa-umpan-benar-teks">
                        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12.5l4.5 4.5L19 7" />
                        </svg>
                    </span>
                    <h3 className="mt-3 text-[20px] font-semibold text-siswa-judul-seksi">Berhasil!</h3>
                    <p className="mt-1 text-[14px] text-siswa-teks">{pesanSukses}</p>
                    <button
                        type="button"
                        onClick={() => router.visit(route('akun.profil.utama'))}
                        className="mt-5 h-10 rounded-[10px] bg-ujian-biru px-10 text-[14px] font-semibold text-white shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
