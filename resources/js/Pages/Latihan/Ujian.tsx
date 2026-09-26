import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { useMemo, useState } from 'react';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import Modal from '@/Components/Modal';
import ArenaPengerjaan, { NavigasiSoal, StatusJawabanSoal } from '@/Components/Ujian/ArenaPengerjaan';
import KartuSoal, { TeksMatematika } from '@/Components/Ujian/KartuSoal';
import TimerMundur from '@/Components/Ujian/TimerMundur';
import TombolOpsi, { StatusOpsi } from '@/Components/Ujian/TombolOpsi';
import { KonfigurasiSesiLatihan, OpsiJawaban } from '@/types/latihan';
import { dummyKonfigurasiSesi, dummyKunciJawaban, dummySoalList } from '@/data/dummyLatihan';

// Sementara: Soal belum punya field hint.
const HINT_SEMENTARA = 'Hint untuk soal ini belum tersedia.';

type ModalAktif = 'hint' | 'keluar' | 'selesai' | null;

type IdOpsi = string | number;

type Jawaban = { soalId: IdOpsi; opsiIds: IdOpsi[]; jawabanIsian?: string };

// Urutan centang tidak boleh mempengaruhi hasil: {A,D,E} sama dengan {E,A,D}.
function samaHimpunan(a: IdOpsi[], b: IdOpsi[]) {
    return a.length === b.length && a.every((x) => b.includes(x));
}

// Terjemahkan respons gagal dari latihan.cek menjadi pesan untuk siswa.
function pesanGagalCek(e: unknown): string {
    if (!axios.isAxiosError(e) || !e.response) return 'Gagal terhubung ke server. Periksa koneksi lalu coba lagi.';

    const { status, data } = e.response;
    if (status === 422) return (Object.values(data?.errors ?? {}) as string[][]).flat()[0] ?? data?.message ?? 'Jawaban tidak valid.';
    if (status === 410) return 'Sesi latihan sudah berakhir. Silakan mulai ulang latihan.';
    if (status === 429) return 'Terlalu sering memeriksa jawaban. Tunggu sebentar lalu coba lagi.';
    if (status === 419) return 'Sesi login kedaluwarsa. Muat ulang halaman.';
    return data?.message ?? 'Gagal memeriksa jawaban. Coba lagi.';
}

export default function Ujian({ subtes, soalList, konfigurasi }: { subtes: any; soalList: any[]; konfigurasi: any }) {
    const simulasi = konfigurasi.mode === 'simulasi';

    // Semua tipe berbasis opsi memakai array; pilihan ganda = array beranggota satu.
    // Soal isian_singkat memakai jawabanIsian dengan opsiIds kosong.
    const form = useForm({
        ...konfigurasi,
        jawaban: [] as Jawaban[],
    });

    const [indeksAktif, setIndeksAktif] = useState(0);
    // Mode fleksibel: pilihan belum final sampai "Simpan Jawaban" ditekan.
    const [pilihanSementara, setPilihanSementara] = useState<Record<string | number, IdOpsi[]>>({});
    const [isianSementara, setIsianSementara] = useState<Record<string | number, string>>({});
    // Hasil penilaian isian dari server (latihan.cek), per soal. Hanya dipakai di mode fleksibel.
    const [hasilIsian, setHasilIsian] = useState<Record<string | number, boolean>>({});
    const [mengecek, setMengecek] = useState(false);
    const [pesanCek, setPesanCek] = useState<{ soalId: IdOpsi; pesan: string } | null>(null);
    const [modal, setModal] = useState<ModalAktif>(null);

    const soal = soalList[indeksAktif];
    const isian = soal.tipe === 'isian_singkat';
    const cariJawaban = (soalId: IdOpsi): Jawaban | undefined => form.data.jawaban.find((j: Jawaban) => j.soalId === soalId);
    const tersimpan = cariJawaban(soal.id);
    const terkunci = !simulasi && tersimpan !== undefined;
    const opsiTerpilih: IdOpsi[] = (simulasi || terkunci ? tersimpan?.opsiIds : pilihanSementara[soal.id]) ?? [];
    const teksIsian: string = (simulasi || terkunci ? tersimpan?.jawabanIsian : isianSementara[soal.id]) ?? '';
    const belumDiisi = isian ? teksIsian.trim() === '' : opsiTerpilih.length === 0;

    // Jawaban kosong (tanpa opsi dan tanpa teks) berarti soal kembali belum dijawab.
    const simpanJawaban = (soalId: IdOpsi, opsiIds: IdOpsi[], jawabanIsian = '') => {
        const lainnya = form.data.jawaban.filter((j: Jawaban) => j.soalId !== soalId);
        const kosong = opsiIds.length === 0 && jawabanIsian.trim() === '';
        form.setData('jawaban', kosong ? lainnya : [...lainnya, { soalId, opsiIds, jawabanIsian }]);
    };

    const ubahIsian = (teks: string) => {
        if (simulasi) simpanJawaban(soal.id, [], teks);
        else setIsianSementara((p) => ({ ...p, [soal.id]: teks }));
    };

    // Mode fleksibel: isian dinilai di server. Soal baru dikunci setelah server menjawab,
    // jadi kalau gagal (mis. koneksi putus) siswa masih bisa mencoba lagi.
    const cekIsian = async () => {
        const soalId = soal.id;
        setMengecek(true);
        setPesanCek(null);
        try {
            const { data } = await axios.post(route('latihan.cek'), { sesiId: konfigurasi.sesiId, soalId, jawabanIsian: teksIsian });
            setHasilIsian((p) => ({ ...p, [soalId]: data.benar }));
            simpanJawaban(soalId, [], teksIsian);
        } catch (e) {
            setPesanCek({ soalId, pesan: pesanGagalCek(e) });
        } finally {
            setMengecek(false);
        }
    };

    // Pilihan ganda: ganti dengan satu opsi. Benar/salah: centang atau lepas centang.
    const pilihOpsi = (opsi: OpsiJawaban) => {
        const baru =
            soal.tipe === 'benar_salah'
                ? opsiTerpilih.includes(opsi.id)
                    ? opsiTerpilih.filter((id) => id !== opsi.id)
                    : [...opsiTerpilih, opsi.id]
                : [opsi.id];

        if (simulasi) simpanJawaban(soal.id, baru);
        else setPilihanSementara((p) => ({ ...p, [soal.id]: baru }));
    };

    // Mode fleksibel: jawaban yang sudah dikunci boleh ketahuan benar/salahnya di navigasi.
    // Mode simulasi tidak memakai ini, supaya hasil belum terlihat sebelum latihan selesai.
    // Aturannya sama dengan backend: semua-atau-nol terhadap himpunan is_kunci.
    const statusJawabanSoal = (indeks: number): StatusJawabanSoal => {
        const soalKe = soalList[indeks];
        // Isian dinilai di server (latihan.cek); frontend hanya menampilkan hasilnya.
        // Belum dicek = null, jadi bulatan tetap biru "sudah dijawab".
        if (soalKe.tipe === 'isian_singkat') {
            const benar = hasilIsian[soalKe.id];
            return benar === undefined ? null : benar ? 'benar' : 'salah';
        }

        const dipilih = cariJawaban(soalKe.id)?.opsiIds;
        if (dipilih === undefined) return null;

        const kunci = soalKe.opsi_jawaban.filter((o: any) => o.is_kunci).map((o: any) => o.id);
        return kunci.length > 0 && samaHimpunan(dipilih, kunci) ? 'benar' : 'salah';
    };

    const statusOpsi = (opsi: OpsiJawaban): StatusOpsi => {
        const dipilih = opsiTerpilih.includes(opsi.id);
        if (terkunci) {
            if (opsi.is_kunci) return 'benar';
            if (dipilih) return 'salah';
            return 'default';
        }
        return dipilih ? 'selected' : 'default';
    };

    const kirimJawaban = (tujuan: string) => {
        if (form.processing) return;
        
        const aksi = tujuan === route('dashboard') ? 'keluar' : 'selesai';
        
        form.transform((data) => ({
            ...data,
            aksi
        }));
        
        form.post(route('latihan.simpan'));
    };

    const tombolKecil = 'rounded-md px-4 py-1.5 text-xs font-medium shadow transition disabled:opacity-50';

    return (
        <LatihanLayout
            breadcrumb={['Latihan Soal', konfigurasi.namaSubtes]}
            sidebar={
                <NavigasiSoal
                    jumlahSoal={soalList.length}
                    indeksAktif={indeksAktif}
                    sudahDijawab={(i) => cariJawaban(soalList[i].id) !== undefined}
                    statusJawaban={simulasi ? undefined : statusJawabanSoal}
                    onPilih={setIndeksAktif}
                    aksiBawah={
                        !simulasi && (
                            <button type="button" onClick={() => setModal('keluar')} className={`${tombolKecil} bg-[#F07B7B] text-white hover:bg-[#E86565]`}>
                                Keluar
                            </button>
                        )
                    }
                />
            }
        >
            <Head title={`Latihan ${konfigurasi.namaSubtes}`} />

            <ArenaPengerjaan
                judul={konfigurasi.namaSubtes}
                aksiHeader={
                    simulasi && konfigurasi.waktuPengerjaanMenit ? (
                        <TimerMundur durasiMenit={konfigurasi.waktuPengerjaanMenit} onHabis={() => kirimJawaban(route('latihan.hasil', { ...konfigurasi }))} />
                    ) : null
                }
                footerKiri={
                    !simulasi && !terkunci && (
                        <button type="button" onClick={() => setModal('hint')} className={`${tombolKecil} flex items-center gap-1 border border-[#E5D98A] bg-[#FBF1B8] text-[#6B5B12]`}>
                            <IkonLampu className="h-3.5 w-3.5" /> Hint
                        </button>
                    )
                }
                footerKanan={
                    simulasi ? (
                        <button type="button" onClick={() => setModal('selesai')} disabled={form.processing} className={`${tombolKecil} bg-[#C5EBA8] text-[#2F5E1A] hover:bg-[#B5E194]`}>
                            Selesaikan Sekarang
                        </button>
                    ) : (
                        !terkunci ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (belumDiisi || mengecek) return;
                                    if (isian) cekIsian();
                                    else simpanJawaban(soal.id, opsiTerpilih, teksIsian);
                                }}
                                disabled={belumDiisi || mengecek}
                                className={`${tombolKecil} bg-[#C5EBA8] text-[#2F5E1A] hover:bg-[#B5E194]`}
                            >
                                {mengecek ? 'Memeriksa…' : 'Simpan Jawaban'}
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                {indeksAktif < soalList.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setIndeksAktif(indeksAktif + 1)}
                                        className={`${tombolKecil} border border-gray-300 bg-white text-[#1F2D5C] hover:bg-gray-50`}
                                    >
                                        Lanjut Soal Berikutnya &rarr;
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setModal('selesai')}
                                    className={`${tombolKecil} bg-[#5B86DB] text-white hover:bg-[#4673CD]`}
                                >
                                    Selesaikan Latihan
                                </button>
                            </div>
                        )
                    )
                }
            >
                <KartuSoal nomor={indeksAktif + 1} teksSoal={soal.teks_soal} gambarUrl={soal.gambar_soal} />

                <div className="mt-4 space-y-2.5">
                    {soal.opsi_jawaban.map((opsi: any) => (
                        <TombolOpsi key={opsi.id} opsi={opsi} status={statusOpsi(opsi)} disabled={terkunci} onPilih={pilihOpsi} />
                    ))}
                </div>

                {/* Field dasar isian_singkat, belum didesain. Batas 100 karakter mengikuti validasi backend. */}
                {isian && (
                    <input
                        type="text"
                        value={teksIsian}
                        onChange={(e) => ubahIsian(e.target.value)}
                        disabled={terkunci || mengecek}
                        maxLength={100}
                        placeholder="Tulis jawaban"
                        aria-label="Jawaban isian singkat"
                        className="mt-4 w-full max-w-md rounded border border-gray-300 px-3 py-2"
                    />
                )}

                {/* Hasil dan pesan dari latihan.cek; tampilan dasar, belum didesain. */}
                {isian && terkunci && hasilIsian[soal.id] !== undefined && (
                    <div className="mt-2">
                        <span
                            className={`inline-block rounded-md border px-3 py-1 text-sm font-medium text-[#1F2D5C] ${
                                hasilIsian[soal.id] ? 'border-[#A9DC85] bg-[#C5EBA8]' : 'border-[#E86565] bg-[#F07B7B]'
                            }`}
                        >
                            {hasilIsian[soal.id] ? 'Jawaban benar' : 'Jawaban salah'}
                        </span>
                    </div>
                )}
                {isian && pesanCek && pesanCek.soalId === soal.id && (
                    <p role="alert" className="mt-2 text-sm text-[#B94040]">
                        {pesanCek.pesan}
                    </p>
                )}

                {terkunci && (
                    <div className="relative mt-8">
                        <span className="absolute -top-3 left-4 rounded-md bg-[#2E3F85] px-3 py-1 text-sm font-medium text-white shadow">Pembahasan</span>
                        <div className="rounded-lg bg-white px-4 pb-4 pt-6 text-sm leading-relaxed text-[#1F2D5C] shadow">
                            <TeksMatematika teks={soal.pembahasan} />
                        </div>
                    </div>
                )}
            </ArenaPengerjaan>

            <Modal show={modal === 'hint'} maxWidth="md" onClose={() => setModal(null)}>
                <div className="p-5 font-['Poppins',sans-serif] text-[#1F2D5C]">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <IkonLampu className="h-5 w-5 text-[#D4A017]" /> Hint
                    </h3>
                    <p className="mt-2 text-sm text-gray-700">{HINT_SEMENTARA}</p>
                    <div className="mt-4 flex justify-end">
                        <button type="button" onClick={() => setModal(null)} className={`${tombolKecil} bg-[#5B86DB] text-sm text-white`}>
                            Kembali
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={modal === 'keluar'} maxWidth="md" onClose={() => setModal(null)}>
                <div className="p-5 font-['Poppins',sans-serif] text-[#1F2D5C]">
                    <h3 className="text-lg font-semibold">Keluar</h3>
                    <p className="mt-1 text-sm text-gray-700">Anda akan meninggalkan halaman latihan soal. Jawaban anda akan disimpan oleh sistem.</p>
                    <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={() => setModal(null)} className={`${tombolKecil} border border-gray-300 bg-white text-sm`}>
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => kirimJawaban(route('dashboard'))}
                            disabled={form.processing}
                            className={`${tombolKecil} bg-[#F07B7B] text-sm text-white`}
                        >
                            Keluar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={modal === 'selesai'} maxWidth="md" onClose={() => setModal(null)}>
                <div className="p-5 font-['Poppins',sans-serif] text-[#1F2D5C]">
                    <h3 className="text-lg font-semibold">Selesaikan Sekarang</h3>
                    <p className="mt-1 text-sm text-gray-700">Anda yakin ingin menyimpan jawaban?</p>
                    <div className="mt-6 flex justify-end gap-2">
                        <button type="button" onClick={() => setModal(null)} className={`${tombolKecil} bg-[#F07B7B] text-sm text-white`}>
                            Tidak
                        </button>
                        <button
                            type="button"
                            onClick={() => kirimJawaban(route('latihan.hasil', { ...konfigurasi }))}
                            disabled={form.processing}
                            className={`${tombolKecil} bg-[#C5EBA8] text-sm text-[#2F5E1A]`}
                        >
                            Ya
                        </button>
                    </div>
                </div>
            </Modal>
        </LatihanLayout>
    );
}

function IkonLampu({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" />
        </svg>
    );
}
