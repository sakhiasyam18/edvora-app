import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import Modal from '@/Components/Modal';
import ArenaPengerjaan, { NavigasiSoal } from '@/Components/Ujian/ArenaPengerjaan';
import KartuSoal, { TeksMatematika } from '@/Components/Ujian/KartuSoal';
import TimerMundur from '@/Components/Ujian/TimerMundur';
import TombolOpsi, { StatusOpsi } from '@/Components/Ujian/TombolOpsi';
import { KonfigurasiSesiLatihan, OpsiJawaban } from '@/types/latihan';
import { dummyKonfigurasiSesi, dummyKunciJawaban, dummySoalList } from '@/data/dummyLatihan';

// Sementara: Soal belum punya field hint.
const HINT_SEMENTARA = 'Hint untuk soal ini belum tersedia.';

// Konfigurasi dikirim Persiapan lewat query param; fallback ke dummy kalau kosong.
function bacaKonfigurasiDariUrl(): KonfigurasiSesiLatihan {
    const query = new URLSearchParams(window.location.search);
    const subtesId = Number(query.get('subtesId'));
    if (!subtesId) return dummyKonfigurasiSesi;

    const mode = query.get('mode') === 'simulasi' ? 'simulasi' : 'fleksibel';
    const jumlahSoal = Math.min(dummySoalList.length, Math.max(1, Number(query.get('jumlahSoal')) || dummySoalList.length));
    const namaSubtes = query.get('namaSubtes') ?? '';

    if (mode === 'simulasi') {
        return { subtesId, namaSubtes, mode, jumlahSoal, waktuPengerjaanMenit: Number(query.get('waktuPengerjaanMenit')) || 20 };
    }
    return { subtesId, namaSubtes, mode, jumlahSoal, iceBreakingAktif: query.get('iceBreakingAktif') === 'true' };
}

type ModalAktif = 'hint' | 'keluar' | 'selesai' | null;

export default function Ujian() {
    const konfigurasi = useMemo(bacaKonfigurasiDariUrl, []);
    // Dummy: semua soal PK, jadi cukup ambil sejumlah jumlahSoal.
    const soalList = useMemo(() => dummySoalList.slice(0, konfigurasi.jumlahSoal), [konfigurasi]);
    const simulasi = konfigurasi.mode === 'simulasi';

    const form = useForm({
        ...konfigurasi,
        jawaban: [] as { soalId: number; opsiId: number }[],
    });

    const [indeksAktif, setIndeksAktif] = useState(0);
    // Mode fleksibel: pilihan belum final sampai "Simpan Jawaban" ditekan.
    const [pilihanSementara, setPilihanSementara] = useState<Record<number, number>>({});
    const [modal, setModal] = useState<ModalAktif>(null);

    const soal = soalList[indeksAktif];
    const jawabanTersimpan = (soalId: number) => form.data.jawaban.find((j) => j.soalId === soalId)?.opsiId;
    const opsiTersimpan = jawabanTersimpan(soal.id);
    const terkunci = !simulasi && opsiTersimpan !== undefined;
    const opsiTerpilih = simulasi || terkunci ? opsiTersimpan : pilihanSementara[soal.id];

    const simpanJawaban = (soalId: number, opsiId: number) => {
        form.setData('jawaban', [...form.data.jawaban.filter((j) => j.soalId !== soalId), { soalId, opsiId }]);
    };

    const pilihOpsi = (opsi: OpsiJawaban) => {
        if (simulasi) simpanJawaban(soal.id, opsi.id);
        else setPilihanSementara((p) => ({ ...p, [soal.id]: opsi.id }));
    };

    const statusOpsi = (opsi: OpsiJawaban): StatusOpsi => {
        if (terkunci) {
            if (opsi.id === dummyKunciJawaban[soal.id]) return 'benar';
            if (opsi.id === opsiTerpilih) return 'salah';
            return 'default';
        }
        return opsi.id === opsiTerpilih ? 'selected' : 'default';
    };

    const kirimJawaban = (tujuan: string) => {
        if (form.processing) return;
        form.post(route('latihan.simpan'), {
            // Controller masih return back(); pindah halaman dari sisi frontend dulu.
            onSuccess: () => router.visit(tujuan),
        });
    };

    const tombolKecil = 'rounded-md px-4 py-1.5 text-xs font-medium shadow transition disabled:opacity-50';

    return (
        <LatihanLayout
            breadcrumb={['Latihan Soal', konfigurasi.namaSubtes]}
            sidebar={
                <NavigasiSoal
                    jumlahSoal={soalList.length}
                    indeksAktif={indeksAktif}
                    sudahDijawab={(i) => jawabanTersimpan(soalList[i].id) !== undefined}
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
                        !terkunci && (
                            <button
                                type="button"
                                onClick={() => opsiTerpilih !== undefined && simpanJawaban(soal.id, opsiTerpilih)}
                                disabled={opsiTerpilih === undefined}
                                className={`${tombolKecil} bg-[#C5EBA8] text-[#2F5E1A] hover:bg-[#B5E194]`}
                            >
                                Simpan Jawaban
                            </button>
                        )
                    )
                }
            >
                <KartuSoal nomor={indeksAktif + 1} teksSoal={soal.teksSoal} gambarUrl={soal.gambarUrl} />

                <div className="mt-4 space-y-2.5">
                    {soal.opsi.map((opsi) => (
                        <TombolOpsi key={opsi.id} opsi={opsi} status={statusOpsi(opsi)} disabled={terkunci} onPilih={pilihOpsi} />
                    ))}
                </div>

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
