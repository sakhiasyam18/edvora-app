import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { useMemo, useState } from 'react';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import Modal from '@/Components/Modal';
import ArenaPengerjaan, { NavigasiSoal, StatusJawabanSoal, TombolNavigasiSoal } from '@/Components/Ujian/ArenaPengerjaan';
import KartuSoal, { TeksMatematika } from '@/Components/Ujian/KartuSoal';
import TimerMundur from '@/Components/Ujian/TimerMundur';
import TombolOpsi, { IkonHasil, StatusOpsi } from '@/Components/Ujian/TombolOpsi';
import { KonfigurasiSesiLatihan, OpsiJawaban } from '@/types/latihan';
import { dummyKonfigurasiSesi, dummyKunciJawaban, dummySoalList } from '@/data/dummyLatihan';

type ModalAktif = 'hint' | 'keluar' | 'selesai' | null;

type IdOpsi = string | number;

type Jawaban = { soalId: IdOpsi; opsiIds: IdOpsi[]; jawabanIsian?: string };

// Balasan latihan.cek. kunciJawaban hanya ada saat benar === false.
type HasilIsian = { benar: boolean; kunciJawaban?: string };

// Urutan centang tidak boleh mempengaruhi hasil: {A,D,E} sama dengan {E,A,D}.
function samaHimpunan(a: IdOpsi[], b: IdOpsi[]) {
    return a.length === b.length && a.every((x) => b.includes(x));
}

// Terjemahkan respons gagal dari latihan.cek dan latihan.hint menjadi pesan untuk siswa.
// aksi melengkapi kalimat, mis. "memeriksa jawaban" atau "membuka hint".
function pesanGagal(e: unknown, aksi: string): string {
    if (!axios.isAxiosError(e) || !e.response) return 'Gagal terhubung ke server. Periksa koneksi lalu coba lagi.';

    const { status, data } = e.response;
    if (status === 422) return (Object.values(data?.errors ?? {}) as string[][]).flat()[0] ?? data?.message ?? 'Permintaan tidak valid.';
    if (status === 410) return 'Sesi latihan sudah berakhir. Silakan mulai ulang latihan.';
    if (status === 429) return `Terlalu sering ${aksi}. Tunggu sebentar lalu coba lagi.`;
    if (status === 419) return 'Sesi login kedaluwarsa. Muat ulang halaman.';
    return data?.message ?? `Gagal ${aksi}. Coba lagi.`;
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
    // kunci hanya dikirim server saat jawaban salah, untuk ditampilkan sebagai "Jawaban yang benar".
    const [hasilIsian, setHasilIsian] = useState<Record<string | number, HasilIsian>>({});
    const [mengecek, setMengecek] = useState(false);
    const [pesanCek, setPesanCek] = useState<{ soalId: IdOpsi; pesan: string } | null>(null);
    // Teks hint dari latihan.hint, per soal. Soal yang ada di sini sudah tercatat di server memakai hint.
    const [hintTerbuka, setHintTerbuka] = useState<Record<string | number, string>>({});
    const [memuatHint, setMemuatHint] = useState(false);
    const [pesanHint, setPesanHint] = useState<string | null>(null);
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
            setHasilIsian((p) => ({ ...p, [soalId]: { benar: data.benar, kunciJawaban: data.kunciJawaban } }));
            simpanJawaban(soalId, [], teksIsian);
        } catch (e) {
            setPesanCek({ soalId, pesan: pesanGagal(e, 'memeriksa jawaban') });
        } finally {
            setMengecek(false);
        }
    };

    // Mode fleksibel: server mencatat hint dibuka, lalu jawaban benar untuk soal ini bernilai setengah
    // di skor topik. Teksnya disimpan per soal supaya membuka ulang tidak meminta ke server lagi.
    const bukaHint = async () => {
        const soalId = soal.id;
        setMemuatHint(true);
        setPesanHint(null);
        try {
            const { data } = await axios.post(route('latihan.hint'), { sesiId: konfigurasi.sesiId, soalId });
            setHintTerbuka((p) => ({ ...p, [soalId]: data.hint }));
        } catch (e) {
            setPesanHint(pesanGagal(e, 'membuka hint'));
        } finally {
            setMemuatHint(false);
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
            const hasil = hasilIsian[soalKe.id];
            return hasil === undefined ? null : hasil.benar ? 'benar' : 'salah';
        }

        const dipilih = cariJawaban(soalKe.id)?.opsiIds;
        if (dipilih === undefined) return null;

        const kunci = soalKe.opsi_jawaban.filter((o: any) => o.is_kunci).map((o: any) => o.id);
        return kunci.length > 0 && samaHimpunan(dipilih, kunci) ? 'benar' : 'salah';
    };

    const statusOpsi = (opsi: OpsiJawaban): StatusOpsi => {
        const dipilih = opsiTerpilih.includes(opsi.id);
        if (terkunci) {
            // Benar_salah: tiap pernyataan punya nilai kebenarannya sendiri, jadi semua opsi
            // diberi warna — bukan hanya yang dipilih — supaya siswa melihat jawaban lengkapnya.
            if (soal.tipe === 'benar_salah') return opsi.is_kunci ? 'benar' : 'salah';
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
            breadcrumb={['Latihan Soal', konfigurasi.namaSubtes, ...(konfigurasi.namaTopik ? [konfigurasi.namaTopik] : [])]}
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
                        <button
                            type="button"
                            onClick={() => {
                                setPesanHint(null);
                                setModal('hint');
                            }}
                            disabled={!soal.ada_hint}
                            title={soal.ada_hint ? undefined : 'Soal ini belum punya hint'}
                            className={`${tombolKecil} flex items-center gap-1 border border-[#E5D98A] bg-[#FBF1B8] text-[#6B5B12]`}
                        >
                            <IkonLampu className="h-3.5 w-3.5" /> Hint
                        </button>
                    )
                }
                footerKanan={
                    <div className="flex gap-2">
                        <TombolNavigasiSoal jumlahSoal={soalList.length} indeksAktif={indeksAktif} onPilih={setIndeksAktif} />

                        {simulasi ? (
                            <button type="button" onClick={() => setModal('selesai')} disabled={form.processing} className={`${tombolKecil} bg-[#C5EBA8] text-[#2F5E1A] hover:bg-[#B5E194]`}>
                                Selesaikan Sekarang
                            </button>
                        ) : !terkunci ? (
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
                            <button
                                type="button"
                                onClick={() => setModal('selesai')}
                                className={`${tombolKecil} bg-[#5B86DB] text-white hover:bg-[#4673CD]`}
                            >
                                Selesaikan Latihan
                            </button>
                        )}
                    </div>
                }
            >
                <KartuSoal nomor={indeksAktif + 1} teksSoal={soal.teks_soal} gambarUrl={soal.gambar_soal} />

                <div className="mt-4 space-y-2.5">
                    {soal.opsi_jawaban.map((opsi: any) => (
                        <TombolOpsi
                            key={opsi.id}
                            opsi={opsi}
                            status={statusOpsi(opsi)}
                            disabled={terkunci}
                            onPilih={pilihOpsi}
                            kotakCentang={soal.tipe === 'benar_salah'}
                            dipilih={opsiTerpilih.includes(opsi.id)}
                        />
                    ))}
                </div>

                {/* Sebelum dikunci: field isian. Batas 100 karakter mengikuti validasi backend. */}
                {isian && !hasilIsian[soal.id] && (
                    <input
                        type="text"
                        value={teksIsian}
                        onChange={(e) => ubahIsian(e.target.value)}
                        disabled={terkunci || mengecek}
                        maxLength={100}
                        placeholder="Tulis jawaban"
                        aria-label="Jawaban isian singkat"
                        className="mt-4 w-full rounded border border-gray-300 px-3 py-2"
                    />
                )}

                {/* Setelah dikunci: jawaban siswa diganti bilah hasil dari latihan.cek. */}
                {isian && hasilIsian[soal.id] && (
                    <>
                        <div
                            className={`mt-5 flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-lg shadow-sm ${
                                hasilIsian[soal.id].benar ? 'bg-[#C5EBA8] text-[#1F2D5C]' : 'bg-[#F07676] text-white'
                            }`}
                        >
                            <span className="break-all">{teksIsian}</span>
                            <span className="flex shrink-0 items-center gap-2 font-medium">
                                <IkonHasil benar={hasilIsian[soal.id].benar} />
                                {hasilIsian[soal.id].benar ? 'Benar' : 'Salah'}
                            </span>
                        </div>

                        {/* Kunci hanya dikirim server saat jawaban salah. */}
                        {hasilIsian[soal.id].kunciJawaban && (
                            <div className="relative mt-7">
                                <span className="absolute -top-3 left-4 rounded-md bg-[#2E3F85] px-3 py-1 text-sm font-medium text-white shadow">
                                    Jawaban yang benar
                                </span>
                                <div className="rounded-lg bg-[#C5EBA8] px-4 pb-3 pt-6 text-lg text-[#1F2D5C] shadow-sm">
                                    {hasilIsian[soal.id].kunciJawaban}
                                </div>
                            </div>
                        )}
                    </>
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
                    {hintTerbuka[soal.id] !== undefined ? (
                        <div className="mt-2 text-sm leading-relaxed text-gray-700">
                            <TeksMatematika teks={hintTerbuka[soal.id]} />
                        </div>
                    ) : (
                        // Siswa diberi tahu dulu, karena begitu dibuka nilainya langsung tercatat di server.
                        <p className="mt-2 text-sm text-gray-700">Kalau jawabanmu benar setelah membuka hint, nilainya dihitung setengah untuk skor topik.</p>
                    )}
                    {pesanHint && (
                        <p role="alert" className="mt-2 text-sm text-[#B94040]">
                            {pesanHint}
                        </p>
                    )}
                    <div className="mt-4 flex justify-end gap-2">
                        {hintTerbuka[soal.id] !== undefined ? (
                            <button type="button" onClick={() => setModal(null)} className={`${tombolKecil} bg-[#5B86DB] text-sm text-white`}>
                                Kembali
                            </button>
                        ) : (
                            <>
                                <button type="button" onClick={() => setModal(null)} className={`${tombolKecil} border border-gray-300 bg-white text-sm`}>
                                    Batal
                                </button>
                                <button type="button" onClick={bukaHint} disabled={memuatHint} className={`${tombolKecil} bg-[#5B86DB] text-sm text-white`}>
                                    {memuatHint ? 'Membuka…' : 'Buka Hint'}
                                </button>
                            </>
                        )}
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
