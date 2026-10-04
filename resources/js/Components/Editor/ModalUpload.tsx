import axios from 'axios';
import { DragEvent, useRef, useState } from 'react';
import Modal from '@/Components/Modal';
import { HasilPeriksaUpload, HasilSimpanUpload, SubtesEditor } from '@/types/editor';

interface ModalUploadProps {
    show: boolean;
    subtes: SubtesEditor;
    adaTemplate: boolean; // file template sudah dipasang di server
    maksBaris: number;
    onTutup: () => void;
    onBerhasil: (hasil: HasilSimpanUpload) => void;
    onGagal: (pesan: string[]) => void; // isi notifikasi gagal di atas halaman
}

type Tahap = 'pilih' | 'memeriksa' | 'hasil' | 'menyimpan';

// Jawaban server yang bukan hasil periksa: pesan validasi Laravel (errors.file) atau pesan umum (pesan).
function pesanDariError(e: unknown): { pesan: string; fileRusak: boolean } {
    if (!axios.isAxiosError(e) || !e.response) {
        return { pesan: 'Gagal terhubung ke server. Periksa koneksi lalu coba lagi.', fileRusak: false };
    }

    const data = e.response.data ?? {};

    if (data.errors?.file?.[0]) {
        return { pesan: data.errors.file[0], fileRusak: false };
    }

    if (typeof data.pesan === 'string') {
        return { pesan: data.pesan, fileRusak: e.response.status === 422 };
    }

    return { pesan: `Terjadi kesalahan di server (HTTP ${e.response.status}). Coba lagi.`, fileRusak: false };
}

/**
 * Modal Upload Bank Soal (massal), desain "dashboard _ bank soal _ upload file". File diperiksa begitu dipilih
 * (editor.soal.upload.periksa); tombol Upload Soal Ke Draft mengirim file yang sama ke editor.soal.upload.
 */
export default function ModalUpload({ show, subtes, adaTemplate, maksBaris, onTutup, onBerhasil, onGagal }: ModalUploadProps) {
    const inputFile = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [tahap, setTahap] = useState<Tahap>('pilih');
    const [progres, setProgres] = useState(0);
    const [hasil, setHasil] = useState<HasilPeriksaUpload | null>(null);
    const [galat, setGalat] = useState<string | null>(null);
    const [diseret, setDiseret] = useState(false);

    const sibuk = tahap === 'memeriksa' || tahap === 'menyimpan';

    const tutup = () => {
        if (sibuk) {
            return;
        }

        setFile(null);
        setTahap('pilih');
        setHasil(null);
        setGalat(null);
        onTutup();
    };

    // Unggahan dihitung sampai 90%; sisanya selesai saat server selesai memeriksa.
    const kirim = (url: string, f: File) => {
        const data = new FormData();
        data.append('file', f);
        setProgres(0);

        return axios.post(url, data, {
            onUploadProgress: (e) => setProgres(e.total ? Math.round((e.loaded / e.total) * 90) : 45),
        });
    };

    const periksa = async (f: File) => {
        setFile(f);
        setHasil(null);
        setGalat(null);
        setTahap('memeriksa');

        try {
            const { data } = await kirim(route('editor.soal.upload.periksa', subtes.kode), f);
            setHasil(data);
            setProgres(100);
        } catch (e) {
            const { pesan, fileRusak } = pesanDariError(e);
            setGalat(pesan);
            setProgres(0);
            onGagal(fileRusak ? ['Unggah File Gagal!', 'File Gagal Terbaca!'] : ['Unggah File Gagal!']);
        } finally {
            setTahap('hasil');
        }
    };

    const simpan = async () => {
        if (!file || !hasil?.valid) {
            return;
        }

        setTahap('menyimpan');

        try {
            const { data } = await kirim(route('editor.soal.upload', subtes.kode), file);
            setFile(null);
            setHasil(null);
            setTahap('pilih');
            onBerhasil(data);
        } catch (e) {
            // 422 berisi hasil periksa ulang: isi file atau database berubah sejak diperiksa.
            if (axios.isAxiosError(e) && e.response?.status === 422 && typeof e.response.data?.valid === 'boolean') {
                setHasil(e.response.data);
            } else {
                setGalat(pesanDariError(e).pesan);
            }

            setTahap('hasil');
            onGagal(['Unggah File Gagal!']);
        }
    };

    const pilihFile = (f: File | undefined) => {
        if (f && !sibuk) {
            periksa(f);
        }
    };

    const lepas = (e: DragEvent) => {
        e.preventDefault();
        setDiseret(false);
        pilihFile(e.dataTransfer.files[0]);
    };

    const valid = hasil?.valid === true;

    return (
        <Modal show={show} maxWidth="lg" onClose={tutup} panelClassName="rounded-[14px]">
            <div className="font-poppins text-siswa-judul">
                <div className="flex items-center justify-between border-b border-siswa-garis-halus px-6 py-4">
                    <h2 className="text-xl font-medium">Upload Bank Soal (massal)</h2>
                    <button type="button" onClick={tutup} disabled={sibuk} aria-label="Tutup" className="text-xl text-siswa-teks disabled:opacity-40">
                        ×
                    </button>
                </div>

                <div className="space-y-5 px-6 py-5 text-sm">
                    <section>
                        <p className="font-medium">Langkah 1 : Unduh Template</p>
                        {adaTemplate ? (
                            <a
                                href={route('editor.soal.template')}
                                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-siswa-titik-benar px-4 py-2 text-siswa-titik-benar transition hover:bg-siswa-umpan-benar"
                            >
                                <IkonUnduh /> Unduh Template (.xlsx)
                            </a>
                        ) : (
                            <p className="mt-2 rounded-lg bg-siswa-hint-latar px-3 py-2 text-xs text-siswa-hint-teks">
                                Template belum tersedia di server. Hubungi tim BE.
                            </p>
                        )}
                    </section>

                    <section>
                        <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">Langkah 2 : Pilih File</p>
                            <button
                                type="button"
                                onClick={() => inputFile.current?.click()}
                                disabled={sibuk}
                                className="inline-flex items-center gap-2 rounded-md bg-ujian-biru px-3 py-1.5 text-xs text-white shadow-panel disabled:opacity-50"
                            >
                                <IkonUnggah /> Pilih dari Komputer
                            </button>
                        </div>
                        <input
                            ref={inputFile}
                            type="file"
                            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            className="hidden"
                            onChange={(e) => {
                                pilihFile(e.target.files?.[0]);
                                e.target.value = '';
                            }}
                        />
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => !sibuk && inputFile.current?.click()}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !sibuk && inputFile.current?.click()}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDiseret(true);
                            }}
                            onDragLeave={() => setDiseret(false)}
                            onDrop={lepas}
                            className={`mt-2 flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                                diseret ? 'border-edvora-primary bg-siswa-badge-subtes' : 'border-siswa-garis-halus bg-siswa-panel-fleksibel'
                            }`}
                        >
                            {file ? (
                                <>
                                    <IkonExcel />
                                    <p className="mt-2 break-all font-medium">{file.name}</p>
                                </>
                            ) : (
                                <p className="text-xs text-siswa-teks">Tarik &amp; lepas file (.xlsx) Anda di sini, atau klik Pilih dari Komputer.</p>
                            )}
                        </div>
                        <p className="mt-2 text-xs">*Template maks. {maksBaris} baris, ukuran file maks. 2 MB</p>
                    </section>

                    {file && (
                        <section className="space-y-2">
                            <p>File Terpilih : {file.name}</p>
                            <div>
                                <p>
                                    {tahap === 'menyimpan' ? 'Menyimpan' : 'Proses Validasi'} : {progres}%
                                    {sibuk && progres >= 90 && <span className="text-siswa-teks"> (memeriksa isi file, link gambar, dan rumus…)</span>}
                                </p>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-siswa-cincin-dasar">
                                    <div
                                        className={`h-full rounded-full transition-all ${galat || (hasil && !valid) ? 'bg-siswa-titik-salah' : 'bg-siswa-titik-benar'}`}
                                        style={{ width: `${progres}%` }}
                                    />
                                </div>
                            </div>

                            {(hasil || galat) && <DetailValidasi hasil={hasil} galat={galat} />}
                        </section>
                    )}
                </div>

                <div className="flex justify-center px-6 pb-6">
                    <button
                        type="button"
                        onClick={simpan}
                        disabled={!valid || sibuk}
                        className="rounded-lg bg-ujian-biru px-6 py-2 text-xs font-medium text-white shadow-panel transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {tahap === 'menyimpan' ? 'Menyimpan…' : 'Upload Soal Ke Draft'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// Kotak detail di bawah progres: ringkasan bila valid, daftar masalah bila tidak.
function DetailValidasi({ hasil, galat }: { hasil: HasilPeriksaUpload | null; galat: string | null }) {
    if (galat || !hasil) {
        return (
            <div className="rounded-lg border border-dashed border-siswa-titik-salah px-4 py-2 text-xs text-siswa-titik-salah">
                <p>Detail Validasi : {galat}</p>
                <p>Ketentuan Mengisi File : Salah</p>
            </div>
        );
    }

    if (hasil.valid) {
        return (
            <div className="space-y-1 rounded-lg border border-dashed border-siswa-garis-halus px-4 py-2 text-xs">
                <p className="text-siswa-titik-benar">Detail Validasi : {hasil.jumlahSoal} baris valid</p>
                <p className="text-siswa-titik-benar">Ketentuan Mengisi File : Valid</p>
                <p className="text-siswa-teks">
                    {hasil.baru} soal baru (masuk sebagai Draft)
                    {hasil.diperbarui > 0 && `, ${hasil.diperbarui} soal sudah ada dan akan diperbarui (statusnya tidak berubah)`}
                    {hasil.jumlahTopik > 0 && `, ${hasil.jumlahTopik} topik di sheet Topik`}.
                </p>
                {hasil.kodeDiperbarui.length > 0 && (
                    <p className="text-siswa-teks">
                        Diperbarui: {hasil.kodeDiperbarui.join(', ')}
                        {hasil.diperbarui > hasil.kodeDiperbarui.length && ', …'}
                    </p>
                )}
                <DaftarPeringatan peringatan={hasil.peringatan} />
            </div>
        );
    }

    return (
        <div className="space-y-1 rounded-lg border border-dashed border-siswa-titik-salah px-4 py-2 text-xs text-siswa-titik-salah">
            <p>
                Detail Validasi : {hasil.pesan ?? `${hasil.jumlahMasalah} masalah di ${hasil.barisError} baris. Tidak ada soal yang disimpan sebelum semuanya diperbaiki.`}
            </p>
            <p>Ketentuan Mengisi File : Salah</p>
            {hasil.masalah.length > 0 && (
                <ul className="max-h-48 space-y-1 overflow-y-auto pr-1 text-siswa-judul">
                    {hasil.masalah.map((m, i) => (
                        <li key={i} className="rounded bg-siswa-umpan-salah px-2 py-1">
                            <span className="font-semibold">
                                Baris {m.baris}
                                {m.kolom !== '-' && ` · ${m.kolom}`}:
                            </span>{' '}
                            {m.pesan}
                        </li>
                    ))}
                </ul>
            )}
            {hasil.jumlahMasalah > hasil.masalah.length && <p>…dan {hasil.jumlahMasalah - hasil.masalah.length} masalah lain.</p>}
            <DaftarPeringatan peringatan={hasil.peringatan} />
        </div>
    );
}

function DaftarPeringatan({ peringatan }: { peringatan: string[] }) {
    if (peringatan.length === 0) {
        return null;
    }

    return (
        <ul className="space-y-1 text-siswa-hint-teks">
            {peringatan.map((p, i) => (
                <li key={i} className="rounded bg-siswa-hint-latar px-2 py-1">
                    Peringatan: {p}
                </li>
            ))}
        </ul>
    );
}

function IkonUnduh() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
    );
}

function IkonUnggah() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 16V5M7 10l5-5 5 5M5 20h14" />
        </svg>
    );
}

function IkonExcel() {
    return (
        <svg className="h-12 w-12" viewBox="0 0 48 48" aria-hidden="true">
            <rect x="14" y="6" width="28" height="36" rx="3" fill="#21A366" />
            <rect x="14" y="6" width="28" height="12" rx="3" fill="#33C481" />
            <rect x="6" y="14" width="20" height="20" rx="3" fill="#107C41" />
            <path d="M11 19l10 10M21 19L11 29" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
        </svg>
    );
}
