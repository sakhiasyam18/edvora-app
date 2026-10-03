import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { useMemo, useState } from 'react';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import Modal from '@/Components/Modal';
import ArenaPengerjaan, { NavigasiSoal, StatusJawabanSoal } from '@/Components/Ujian/ArenaPengerjaan';
import KartuPembahasan from '@/Components/Ujian/KartuPembahasan';
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

    // Teks "Kunci Jawaban" di kartu umpan balik; formatnya sama dengan PembahasanPengerjaan::teksKunci di backend.
    const teksKunci = (): string | null => {
        if (isian) {
            const hasil = hasilIsian[soal.id];
            // Server hanya mengirim kunci saat salah; saat benar, jawaban siswa itulah kuncinya.
            return hasil?.kunciJawaban ?? (hasil?.benar ? teksIsian : null);
        }
        const kunci = soal.opsi_jawaban.filter((o: any) => o.is_kunci);
        if (kunci.length === 0) return null;
        if (soal.tipe !== 'benar_salah') return `${kunci[0].label}. ${kunci[0].teks_opsi}`;
        const teks = kunci.map((o: any) => o.teks_opsi);
        const terakhir = teks.pop();
        return teks.length === 0 ? terakhir : `${teks.join(', ')} dan ${terakhir}`;
    };

    const namaMode = { fleksibel: 'Fleksibel', simulasi: 'Simulasi', remedial: 'Remedial' }[konfigurasi.mode as string] ?? '';
    const statusAktif = terkunci ? statusJawabanSoal(indeksAktif) : null;

    // Tombol besar di bawah opsi (Simpan Jawaban, Selesaikan) dan tombol di modal.
    const tombolBesar =
        'h-11 min-w-[200px] rounded-[10px] px-6 text-sm font-semibold shadow-panel transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-md enabled:active:translate-y-0 md:min-w-[240px] lg:min-w-[300px]';
    const tombolModal = 'h-9 min-w-[100px] rounded-[10px] px-5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 disabled:opacity-50';
    const kelasModal = { backdropClassName: 'bg-siswa-laman-akhir/70 backdrop-blur-[2px]', panelClassName: 'rounded-[24px]' };

    return (
        <LatihanLayout
            breadcrumb={[
                { label: 'Latihan Soal', href: route('latihan.index') },
                // Subtes → halaman Pilih Mode subtes itu, langsung di tab mode yang sedang dikerjakan.
                {
                    label: konfigurasi.namaSubtes,
                    href: subtes?.kode_subtes ? route('latihan.mode', { subtes: subtes.kode_subtes, tab: konfigurasi.mode }) : undefined,
                },
                ...(namaMode ? [`Mode ${namaMode}`] : []),
            ]}
            sidebar={
                <NavigasiSoal
                    judul={konfigurasi.namaSubtes}
                    jumlahSoal={soalList.length}
                    indeksAktif={indeksAktif}
                    sudahDijawab={(i) => cariJawaban(soalList[i].id) !== undefined}
                    statusJawaban={simulasi ? undefined : statusJawabanSoal}
                    onPilih={setIndeksAktif}
                    aksiBawah={
                        // Desain Figma menampilkan Keluar Halaman di semua mode, termasuk simulasi.
                        <button
                            type="button"
                            onClick={() => setModal('keluar')}
                            className="h-10 w-full rounded-lg bg-ujian-merah text-[13px] font-semibold text-white shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                        >
                            ← Keluar Halaman
                        </button>
                    }
                />
            }
        >
            <Head title={`Latihan ${konfigurasi.namaSubtes}`} />

            <ArenaPengerjaan
                judul={`Soal ${indeksAktif + 1} dari ${soalList.length}`}
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
                            className="flex h-11 items-center gap-1.5 rounded-[10px] border border-siswa-hint-garis bg-siswa-hint-latar px-5 text-sm font-semibold text-siswa-hint-teks shadow-panel transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-md disabled:opacity-50"
                        >
                            <IkonLampu className="h-[18px] w-[18px]" /> Hint
                        </button>
                    )
                }
                footerKanan={
                    simulasi ? (
                        <button type="button" onClick={() => setModal('selesai')} disabled={form.processing} className={`${tombolBesar} bg-ujian-hijau text-white disabled:opacity-60`}>
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
                            className={`${tombolBesar} ${belumDiisi ? 'bg-siswa-ujian-redup text-white/80 shadow-none' : 'bg-ujian-hijau text-white'}`}
                        >
                            {mengecek ? 'Memeriksa…' : 'Simpan Jawaban'}
                        </button>
                    ) : (
                        <button type="button" onClick={() => setModal('selesai')} className={`${tombolBesar} bg-ujian-biru text-white`}>
                            Selesaikan Latihan
                        </button>
                    )
                }
            >
                {/* key: isi soal muncul pelan setiap pindah nomor. */}
                <div key={soal.id} className="animate-muncul-halus">
                    <KartuSoal nomor={indeksAktif + 1} teksSoal={soal.teks_soal} gambarUrl={soal.gambar_soal} />

                    <div className="mt-3 space-y-2.5">
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
                            placeholder="Tulis Jawabanmu Disini..."
                            aria-label="Jawaban isian singkat"
                            className="mt-3 h-11 w-full rounded-[10px] border-transparent bg-white px-4 text-sm font-medium text-siswa-judul shadow-panel transition duration-200 placeholder:text-siswa-teks-redup focus:border-edvora-primary focus:ring-2 focus:ring-edvora-primary/30 disabled:opacity-60"
                        />
                    )}

                    {/* Setelah dikunci: jawaban siswa diganti bilah hasil dari latihan.cek. */}
                    {isian && hasilIsian[soal.id] && (
                        <div
                            className={`mt-3 flex min-h-11 animate-muncul-halus items-center justify-between gap-3 rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white shadow-panel ${
                                hasilIsian[soal.id].benar ? 'bg-ujian-hijau' : 'bg-ujian-merah'
                            }`}
                        >
                            <span className="break-all">{teksIsian}</span>
                            <span className="flex shrink-0 items-center gap-1.5 font-medium">
                                <IkonHasil benar={hasilIsian[soal.id].benar} />
                                {hasilIsian[soal.id].benar ? 'Benar' : 'Salah'}
                            </span>
                        </div>
                    )}
                    {isian && pesanCek && pesanCek.soalId === soal.id && (
                        <p role="alert" className="mt-2 text-sm text-siswa-umpan-salah-teks">
                            {pesanCek.pesan}
                        </p>
                    )}

                    {terkunci && <KartuPembahasan status={statusAktif ?? 'kosong'} kunci={teksKunci()} pembahasan={soal.pembahasan} />}
                </div>
            </ArenaPengerjaan>

            <Modal show={modal === 'hint'} maxWidth="md" onClose={() => setModal(null)} {...kelasModal}>
                <div className="p-6 font-poppins text-siswa-judul md:px-8 md:py-7">
                    <h3 className="flex items-center gap-2 text-xl font-semibold">
                        <IkonLampu className="h-6 w-6 text-[#D4A017]" /> Hint
                    </h3>
                    {hintTerbuka[soal.id] !== undefined ? (
                        <div className="mt-2 text-[15px] font-medium leading-relaxed text-siswa-teks">
                            <TeksMatematika teks={hintTerbuka[soal.id]} />
                        </div>
                    ) : (
                        // Siswa diberi tahu dulu, karena begitu dibuka nilainya langsung tercatat di server.
                        <p className="mt-2 text-[15px] font-medium leading-relaxed text-siswa-teks">
                            Kalau jawabanmu benar setelah membuka hint, XP dan poin soal ini dihitung setengah, begitu juga nilainya untuk skor topik.
                        </p>
                    )}
                    {pesanHint && (
                        <p role="alert" className="mt-2 text-sm text-siswa-umpan-salah-teks">
                            {pesanHint}
                        </p>
                    )}
                    <div className="mt-5 flex justify-end gap-2">
                        {hintTerbuka[soal.id] !== undefined ? (
                            <button type="button" onClick={() => setModal(null)} className={`${tombolModal} bg-ujian-biru text-white shadow-panel`}>
                                Kembali
                            </button>
                        ) : (
                            <>
                                <button type="button" onClick={() => setModal(null)} className={`${tombolModal} border border-siswa-teks/40 bg-white text-siswa-judul`}>
                                    Batal
                                </button>
                                <button type="button" onClick={bukaHint} disabled={memuatHint} className={`${tombolModal} bg-ujian-biru text-white shadow-panel`}>
                                    {memuatHint ? 'Membuka…' : 'Buka Hint'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal show={modal === 'keluar'} maxWidth="md" onClose={() => setModal(null)} {...kelasModal}>
                <div className="p-6 font-poppins md:px-8 md:py-7">
                    <h3 className="text-xl font-semibold text-siswa-umpan-salah-teks">Keluar</h3>
                    <p className="mt-2 text-[15px] font-medium leading-relaxed text-siswa-teks">
                        Anda akan meninggalkan halaman latihan soal dan jawaban anda akan disimpan oleh sistem.
                    </p>
                    <div className="mt-5 flex justify-end gap-2">
                        <button type="button" onClick={() => setModal(null)} className={`${tombolModal} border border-siswa-teks/40 bg-white text-siswa-judul`}>
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => kirimJawaban(route('dashboard'))}
                            disabled={form.processing}
                            className={`${tombolModal} bg-ujian-merah text-white shadow-panel`}
                        >
                            Keluar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={modal === 'selesai'} maxWidth="md" onClose={() => setModal(null)} {...kelasModal}>
                <div className="p-6 font-poppins md:px-8 md:py-7">
                    <h3 className="text-xl font-semibold text-siswa-umpan-benar-teks">Selesaikan Sekarang</h3>
                    <p className="mt-2 text-[15px] font-medium leading-relaxed text-siswa-teks">
                        Anda akan menyelesaikan latihan soal dan jawaban yang sudah diisi tidak dapat diubah kembali.
                    </p>
                    <div className="mt-5 flex justify-end gap-2">
                        <button type="button" onClick={() => setModal(null)} className={`${tombolModal} border border-siswa-teks/40 bg-white text-siswa-judul`}>
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => kirimJawaban(route('latihan.hasil', { ...konfigurasi }))}
                            disabled={form.processing}
                            className={`${tombolModal} bg-ujian-hijau text-white shadow-panel`}
                        >
                            Selesaikan
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
