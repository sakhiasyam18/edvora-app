import { ChangeEvent, FormEventHandler, ReactNode } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import { BiodataSiswa, PilihanKelas, UniversitasPilihan } from '@/types/biodata';

interface BiodataProps {
    universitasList: UniversitasPilihan[];
    pilihanKelas: PilihanKelas[];
    biodata: BiodataSiswa;
}

const KELAS_LABEL = 'block text-sm font-semibold text-brand-navy mb-1.5 ml-2.5';

// Gaya kolom isian sama dengan Login: latar biru muda, garis tipis, fokus bercincin biru.
const KELAS_KOLOM =
    'w-full rounded-xl border border-brand-inputBorder bg-brand-inputBg text-sm text-brand-navy placeholder-[#8ea6c2] shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent';

interface PilihanProps {
    id: string;
    value: string | null;
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    placeholder: string;
    disabled?: boolean;
    children: ReactNode;
}

// <select> dengan panah bawah dari desain; teks abu-abu selama yang tampil masih placeholder.
function Pilihan({ id, value, onChange, placeholder, disabled = false, children }: PilihanProps) {
    return (
        <div className="relative">
            <select
                id={id}
                required
                disabled={disabled}
                value={value ?? ''}
                onChange={onChange}
                className={`${KELAS_KOLOM} h-10 cursor-pointer appearance-none pl-4 pr-10 disabled:cursor-not-allowed disabled:opacity-60 ${value ? '' : 'text-[#8ea6c2]'}`}
            >
                <option disabled value="">
                    {placeholder}
                </option>
                {children}
            </select>
            <svg
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-navy"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
}

// Lengkapi Biodata setelah verifikasi email, dengan konsep tampilan yang sama dengan Login dan Register.
export default function Biodata({ universitasList, pilihanKelas, biodata }: BiodataProps) {
    const { data, setData, post, processing, errors } = useForm<BiodataSiswa>({ ...biodata });

    // Prodi diambil dari data universitas yang sudah ada di props, tanpa request ke server.
    const prodiList = universitasList.find((u) => u.id === data.universitasTujuanId)?.prodi ?? [];

    const pilihUniversitas = (universitasTujuanId: string) => {
        // Prodi lama milik universitas sebelumnya, jadi dikosongkan setiap kali universitas diganti.
        setData((prev) => ({ ...prev, universitasTujuanId, prodiTujuanId: null }));
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        // Jika valid, server mengalihkan ke halaman yang tadi dituju atau ke dashboard.
        post(route('biodata.simpan'));
    };

    return (
        <div className="bg-gradient-edvora flex min-h-screen flex-col items-center justify-center p-4 font-poppins antialiased selection:bg-[#5B88DD] selection:text-white sm:p-6">
            <Head title="Lengkapi Biodata - EDVORA" />

            <main className="flex w-full max-w-[480px] flex-col items-center">
                <header className="mb-5 text-center sm:mb-6">
                    <Link href="/">
                        <h1 className="brand-title-shadow text-3xl font-extrabold tracking-widest text-white sm:text-4xl md:text-[40px]">EDVORA</h1>
                    </Link>
                </header>

                <section className="main-card-shadow w-full rounded-2xl border border-white/60 bg-brand-lightBlue px-6 py-8 sm:rounded-3xl sm:px-10 sm:py-9">
                    <h2 className="mb-6 text-center text-2xl font-bold tracking-wide text-brand-navy sm:text-[26px]">BIODATA</h2>

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {/* Nama Lengkap */}
                        <div>
                            <label className={KELAS_LABEL} htmlFor="nama-lengkap">
                                Nama Lengkap
                            </label>
                            <input
                                className={`${KELAS_KOLOM} h-12 px-4`}
                                id="nama-lengkap"
                                placeholder="Masukkan Nama Lengkap"
                                required
                                type="text"
                                value={data.namaLengkap}
                                onChange={(e) => setData('namaLengkap', e.target.value)}
                            />
                            <InputError message={errors.namaLengkap} className="mt-1.5" />
                        </div>

                        {/* Kelas & Jenis Kelamin */}
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-3">
                            <div>
                                <label className={KELAS_LABEL} htmlFor="kelas">
                                    Kelas
                                </label>
                                <Pilihan id="kelas" value={data.kelas} placeholder="Pilih Tingkatan" onChange={(e) => setData('kelas', e.target.value)}>
                                    {pilihanKelas.map((k) => (
                                        <option key={k.nilai} value={k.nilai}>
                                            {k.label}
                                        </option>
                                    ))}
                                </Pilihan>
                                <InputError message={errors.kelas} className="mt-1.5" />
                            </div>

                            <div>
                                <label className={KELAS_LABEL} htmlFor="jenis-kelamin">
                                    Jenis Kelamin
                                </label>
                                <Pilihan
                                    id="jenis-kelamin"
                                    value={data.jenisKelamin}
                                    placeholder="Pilih"
                                    onChange={(e) => setData('jenisKelamin', e.target.value as BiodataSiswa['jenisKelamin'])}
                                >
                                    <option value="laki-laki">Laki-laki</option>
                                    <option value="perempuan">Perempuan</option>
                                </Pilihan>
                                <InputError message={errors.jenisKelamin} className="mt-1.5" />
                            </div>
                        </div>

                        {/* Universitas: <select> karena yang dikirim ke server adalah id, bukan teks nama */}
                        <div>
                            <label className={KELAS_LABEL} htmlFor="universitas">
                                Universitas
                            </label>
                            <Pilihan
                                id="universitas"
                                value={data.universitasTujuanId}
                                placeholder={universitasList.length === 0 ? 'Data universitas belum tersedia. Hubungi admin.' : 'Pilih Universitas'}
                                disabled={universitasList.length === 0}
                                onChange={(e) => pilihUniversitas(e.target.value)}
                            >
                                {universitasList.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.nama}
                                    </option>
                                ))}
                            </Pilihan>
                            <InputError message={errors.universitasTujuanId} className="mt-1.5" />
                        </div>

                        {/* Prodi: isinya mengikuti universitas yang dipilih */}
                        <div>
                            <label className={KELAS_LABEL} htmlFor="prodi">
                                Prodi
                            </label>
                            <Pilihan
                                id="prodi"
                                value={data.prodiTujuanId}
                                placeholder="Pilih Prodi"
                                disabled={prodiList.length === 0}
                                onChange={(e) => setData('prodiTujuanId', e.target.value)}
                            >
                                {prodiList.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nama} ({p.jenjang})
                                    </option>
                                ))}
                            </Pilihan>
                            <InputError message={errors.prodiTujuanId} className="mt-1.5" />
                        </div>

                        <div className="flex justify-center pt-3">
                            <button
                                className="w-44 rounded-xl bg-brand-blue py-2.5 text-sm font-bold tracking-wider text-white shadow-[0_4px_12px_rgba(91,136,221,0.45)] transition-all duration-150 hover:bg-brand-blueHover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={processing}
                                type="submit"
                            >
                                {processing ? 'MENYIMPAN...' : 'SIMPAN'}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
