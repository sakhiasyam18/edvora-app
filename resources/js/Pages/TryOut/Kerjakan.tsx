import { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import Modal from '@/Components/Modal';
import ArenaPengerjaan, { NavigasiSoal } from '@/Components/Ujian/ArenaPengerjaan';
import KartuSoal from '@/Components/Ujian/KartuSoal';
import TombolOpsi from '@/Components/Ujian/TombolOpsi';
import { batasEfektif, sisaDetikDari } from '@/lib/batasSubtes';
import { JawabanTryOut, SoalTryOut, SubtesAktifTryOut } from '@/types/tryout';

interface KerjakanProps {
    paket: { id: string; judul: string };
    pengerjaanId: string;
    subtes: SubtesAktifTryOut;
    soalList: SoalTryOut[];
    sisaDetik: number;
}

// Jawaban dan tanda ragu subtes yang sedang dikerjakan. Hanya ada di browser (cadangan localStorage)
// sampai Simpan Soal / Simpan Jawaban / waktu habis mengirimnya ke server.
interface Draf {
    jawaban: Record<string, JawabanTryOut>;
    ragu: Record<string, boolean>;
}

const DRAF_KOSONG: Draf = { jawaban: {}, ragu: {} };

function bacaDraf(kunci: string): Draf {
    try {
        const isi = window.localStorage.getItem(kunci);
        return isi ? { ...DRAF_KOSONG, ...JSON.parse(isi) } : DRAF_KOSONG;
    } catch {
        return DRAF_KOSONG;
    }
}

// Batas subtes yang pernah dipakai di browser ini (ms). Tidak dihapus setelah kirim, supaya halaman subtes lama
// yang dibuka lagi lewat tombol Back langsung habis waktunya, bukan mulai menghitung dari awal.
function bacaBatas(kunci: string): number | null {
    try {
        const isi = Number(window.localStorage.getItem(kunci));
        return isi > 0 ? isi : null;
    } catch {
        return null;
    }
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

// Setiap subtes dirender ulang dari awal (key), sehingga draf, nomor aktif, dan timer tidak terbawa ke subtes berikutnya.
export default function Kerjakan(props: KerjakanProps) {
    return <PengerjaanSubtes key={props.subtes.id} {...props} />;
}

function PengerjaanSubtes({ paket, pengerjaanId, subtes, soalList, sisaDetik }: KerjakanProps) {
    const kunciDraf = `tryout:${pengerjaanId}:${subtes.id}`;
    const kunciBatas = `${kunciDraf}:batas`;

    const [draf, setDraf] = useState<Draf>(() => bacaDraf(kunciDraf));
    const [indeksAktif, setIndeksAktif] = useState(0);
    const [modal, setModal] = useState<'subtes' | 'selesai' | null>(null);
    const [timeLeft, setTimeLeft] = useState(sisaDetik);
    const [waktuHabis, setWaktuHabis] = useState(false);
    const mengirim = useRef(false);

    const soal = soalList[indeksAktif];
    const jawaban = draf.jawaban[soal.id];

    // Cadangan agar jawaban tidak hilang saat halaman dimuat ulang.
    useEffect(() => {
        try {
            window.localStorage.setItem(kunciDraf, JSON.stringify(draf));
        } catch {
            // Tanpa cadangan (mode privat / penyimpanan diblokir).
        }
    }, [draf, kunciDraf]);

    const kirim = () => {
        if (mengirim.current) return;
        mengirim.current = true;
        setModal(null);

        router.post(
            route('tryout.kirim', paket.id),
            {
                tryOutSubtesId: subtes.id,
                jawaban: Object.entries(draf.jawaban).map(([soalId, j]) => ({ soalId, ...j })),
            },
            {
                onSuccess: () => {
                    try {
                        window.localStorage.removeItem(kunciDraf);
                    } catch {
                        // Abaikan.
                    }
                },
                onFinish: () => {
                    mengirim.current = false;
                },
            },
        );
    };

    // Timer dihitung dari waktu batas, bukan dikurangi per detik. Server tetap patokannya: kiriman yang terlambat
    // lebih dari 30 detik ditolak, jadi kirim otomatis harus tepat waktu walaupun tab disembunyikan.
    useEffect(() => {
        const batas = batasEfektif(sisaDetik, Date.now(), bacaBatas(kunciBatas));
        try {
            window.localStorage.setItem(kunciBatas, String(batas));
        } catch {
            // Tanpa cadangan batas; Back lalu Forward memakai sisaDetik dari halaman lama.
        }

        const tampilkan = () => {
            const sisa = sisaDetikDari(batas, Date.now());
            setTimeLeft(sisa);
            return sisa;
        };
        tampilkan();

        // Kirim otomatis memakai satu setTimeout, bukan interval: Chrome memperlambat interval di tab yang
        // tersembunyi lama sampai sekali per menit, sehingga kiriman bisa melewati toleransi server.
        const timeout = window.setTimeout(() => setWaktuHabis(true), Math.max(0, batas - Date.now()));
        const interval = window.setInterval(() => {
            if (tampilkan() === 0) window.clearInterval(interval);
        }, 1000);
        // Tab yang baru terlihat lagi setelah batas lewat langsung mengirim.
        const saatTerlihat = () => {
            if (document.visibilityState === 'visible' && tampilkan() === 0) setWaktuHabis(true);
        };
        document.addEventListener('visibilitychange', saatTerlihat);

        return () => {
            window.clearTimeout(timeout);
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', saatTerlihat);
        };
    }, [sisaDetik, kunciBatas]);

    // Waktu habis: kirim tanpa konfirmasi (= Simpan Soal, atau Simpan Jawaban di subtes terakhir).
    useEffect(() => {
        if (waktuHabis) kirim();
    }, [waktuHabis]);

    // Jawaban kosong (tanpa opsi dan tanpa teks) berarti soal kembali belum dijawab.
    const aturJawaban = (soalId: string, isi: JawabanTryOut | null) =>
        setDraf((d) => {
            const lain = { ...d.jawaban };
            delete lain[soalId];
            return { ...d, jawaban: isi ? { ...lain, [soalId]: isi } : lain };
        });

    const pilihOpsi = (opsiId: string) => {
        if (soal.tipe === 'benar_salah') {
            const sekarang = jawaban?.opsiIds ?? [];
            const baru = sekarang.includes(opsiId) ? sekarang.filter((id) => id !== opsiId) : [...sekarang, opsiId];
            aturJawaban(soal.id, baru.length ? { opsiIds: baru, jawabanIsian: null } : null);
        } else {
            aturJawaban(soal.id, { opsiIds: [opsiId], jawabanIsian: null });
        }
    };

    const isiIsian = (teks: string) => aturJawaban(soal.id, teks.trim() ? { opsiIds: [], jawabanIsian: teks } : null);

    const toggleRaguRagu = () => setDraf((d) => ({ ...d, ragu: { ...d.ragu, [soal.id]: !d.ragu[soal.id] } }));

    const terjawab = (i: number) => !!draf.jawaban[soalList[i].id];
    const raguAktif = !!draf.ragu[soal.id];
    const tombolModal = 'h-10 w-32 rounded-[10px] text-sm font-semibold text-white shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md';
    const kelasModal = { backdropClassName: 'bg-siswa-laman-akhir/70 backdrop-blur-[2px]', panelClassName: 'rounded-[24px]' };

    return (
        <LatihanLayout
            judulTengah={paket.judul}
            sidebar={
                <NavigasiSoal
                    judul={subtes.nama}
                    judulKanan={
                        <span
                            role="timer"
                            aria-label="Sisa waktu subtes"
                            className={`min-w-[96px] shrink-0 rounded-lg bg-ujian-merah px-4 py-1.5 text-center text-sm font-semibold tabular-nums text-white lg:min-w-[150px] ${
                                timeLeft <= 60 ? 'animate-pulse' : ''
                            }`}
                        >
                            {formatTime(timeLeft)}
                        </span>
                    }
                    jumlahSoal={soalList.length}
                    indeksAktif={indeksAktif}
                    sudahDijawab={terjawab}
                    onPilih={setIndeksAktif}
                    tanpaKeterangan
                    // Ragu-ragu kuning lebih diutamakan daripada biru "sudah dijawab".
                    gayaNomor={(i) =>
                        draf.ragu[soalList[i].id]
                            ? 'border-transparent bg-gradient-to-b from-[#F7D23E] to-[#E2AE1C] text-white'
                            : terjawab(i)
                              ? 'border-transparent bg-ujian-biru text-white'
                              : undefined
                    }
                    aksiTengah={
                        <button
                            type="button"
                            onClick={toggleRaguRagu}
                            aria-pressed={raguAktif}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-b from-[#F7D23E] to-[#E2AE1C] px-4 text-xs font-semibold text-white shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md lg:text-[13px]"
                        >
                            <span className="flex h-4 w-4 items-center justify-center rounded-[3px] border-2 border-white">
                                <svg
                                    className={`h-3 w-3 transition duration-200 ${raguAktif ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M5 12.5l4.5 4.5L19 7" />
                                </svg>
                            </span>
                            Ragu-ragu
                        </button>
                    }
                    aksiBawah={
                        // SIMPAN JAWABAN: hanya aktif di subtes terakhir; mengakhiri Try Out.
                        <button
                            type="button"
                            disabled={!subtes.terakhir}
                            onClick={() => setModal('selesai')}
                            className={`h-10 w-full rounded-lg text-[13px] font-semibold text-white transition duration-200 ${
                                subtes.terakhir
                                    ? 'bg-ujian-hijau shadow-panel hover:-translate-y-0.5 hover:shadow-md'
                                    : 'cursor-not-allowed bg-siswa-ujian-redup text-white/80'
                            }`}
                        >
                            Simpan Jawaban
                        </button>
                    }
                />
            }
        >
            <Head title={`Pengerjaan Try Out - ${subtes.nama}`} />

            <ArenaPengerjaan
                judul={`Soal ${indeksAktif + 1} dari ${soalList.length}`}
                footerKanan={
                    // SIMPAN SOAL: menyelesaikan subtes ini dan pindah ke subtes berikutnya (tidak ada di subtes terakhir).
                    !subtes.terakhir && (
                        <button
                            type="button"
                            onClick={() => setModal('subtes')}
                            className="h-11 min-w-[200px] rounded-[10px] bg-ujian-hijau px-6 text-sm font-semibold text-white shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 md:min-w-[260px] lg:min-w-[380px]"
                        >
                            Simpan Soal
                        </button>
                    )
                }
            >
                {/* key: isi soal muncul pelan setiap pindah nomor. */}
                <div key={soal.id} className="animate-muncul-halus">
                    <KartuSoal nomor={indeksAktif + 1} teksSoal={soal.teks_soal} gambarUrl={soal.gambar_soal} />

                    {soal.tipe === 'benar_salah' && <p className="mt-3 px-1 text-xs font-medium text-siswa-teks">Pilih semua pernyataan yang benar.</p>}

                    {/* JAWABAN: kolom isian, atau opsi (pilihan ganda: satu; benar-salah: centang banyak) */}
                    {soal.tipe === 'isian_singkat' ? (
                        <input
                            type="text"
                            maxLength={100}
                            value={jawaban?.jawabanIsian ?? ''}
                            onChange={(e) => isiIsian(e.target.value)}
                            placeholder="Tulis Jawabanmu Disini..."
                            aria-label="Jawaban isian singkat"
                            className="mt-3 h-11 w-full rounded-[10px] border-transparent bg-white px-4 text-sm font-medium text-siswa-judul shadow-panel transition duration-200 placeholder:text-siswa-teks-redup focus:border-edvora-primary focus:ring-2 focus:ring-edvora-primary/30"
                        />
                    ) : (
                        <div className="mt-3 space-y-2.5">
                            {soal.opsi.map((opsi) => {
                                const dipilih = jawaban?.opsiIds.includes(opsi.id) ?? false;
                                return (
                                    <TombolOpsi
                                        key={opsi.id}
                                        opsi={opsi}
                                        status={dipilih ? 'selected' : 'default'}
                                        onPilih={(o) => pilihOpsi(o.id)}
                                        kotakCentang={soal.tipe === 'benar_salah'}
                                        dipilih={dipilih}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </ArenaPengerjaan>

            {/* POP UP KONFIRMASI */}
            <Modal show={modal !== null} maxWidth="md" onClose={() => setModal(null)} {...kelasModal}>
                <div className="px-6 py-8 text-center font-poppins md:px-10">
                    <h2 className="text-xl font-semibold text-siswa-judul md:text-2xl">Yakin Menyimpan Jawaban?</h2>
                    <p className="mt-2 text-sm font-medium text-siswa-teks md:text-[15px]">
                        {modal === 'subtes' ? 'Kamu akan lanjut ke subtest berikutnya' : 'Try Out akan diakhiri dan jawaban dikirim.'}
                    </p>

                    <div className="mt-6 flex justify-center gap-4">
                        <button type="button" onClick={kirim} className={`${tombolModal} bg-ujian-hijau`}>
                            IYA
                        </button>
                        <button type="button" onClick={() => setModal(null)} className={`${tombolModal} bg-ujian-merah`}>
                            TIDAK
                        </button>
                    </div>
                </div>
            </Modal>

            {/* WAKTU HABIS: tidak bisa ditutup, jawaban sedang dikirim. */}
            <Modal show={waktuHabis} maxWidth="md" closeable={false} {...kelasModal}>
                <div className="px-6 py-8 text-center font-poppins md:px-10">
                    <h2 className="text-xl font-semibold text-siswa-judul md:text-2xl">Waktu habis</h2>
                    <p className="mt-2 text-sm font-medium text-siswa-teks md:text-[15px]">Menyimpan jawaban…</p>
                    {/* Jika koneksi terputus, kirim ulang secara manual. */}
                    <button
                        type="button"
                        onClick={kirim}
                        className="mt-6 h-10 rounded-[10px] bg-ujian-biru px-6 text-sm font-semibold text-white shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                        Kirim ulang
                    </button>
                </div>
            </Modal>
        </LatihanLayout>
    );
}
