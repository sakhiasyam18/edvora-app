import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import JudulHalaman from '@/Components/Editor/JudulHalaman';
import ToastGagal from '@/Components/Editor/ToastGagal';
import EditorLayout from '@/Components/Layouts/EditorLayout';
import { TeksMatematika } from '@/Components/Ujian/KartuSoal';
import { pesanServer } from '@/lib/pesanServer';
import {
    DaftarModelAI,
    HasilGenerator,
    HasilSimpanGenerator,
    ModelAI,
    RiwayatGenerator,
    SoalAI,
    StatusRiwayatGenerator,
    SubtesGenerator,
    TingkatGenerator,
} from '@/types/generator';

interface GeneratorSoalProps {
    subtesList: SubtesGenerator[];
    adaKunci: boolean;
    maksSoal: number;
    riwayat: RiwayatGenerator[];
}

const KUNCI_LIMIT = 'edvora.generator.modelLimit.v1';
const UMUR_LIMIT = 24 * 60 * 60 * 1000;

const KELAS_KARTU = 'rounded-kartu bg-white p-5 shadow-kartu';
const KELAS_INPUT = 'w-full rounded-[10px] border-siswa-ujian-garis text-sm text-siswa-judul focus:border-edvora-primary focus:ring-edvora-primary';
const KELAS_LABEL = 'text-xs font-semibold uppercase tracking-wide text-siswa-teks';

const URUTAN_TINGKAT: TingkatGenerator[] = ['mudah', 'sedang', 'sulit'];
const LABEL_TINGKAT: Record<TingkatGenerator, string> = {
    mudah: 'Mudah',
    sedang: 'Sedang',
    sulit: 'Sulit',
};

const LABEL_STATUS_RIWAYAT: Record<StatusRiwayatGenerator, string> = {
    dibuat: 'Belum disimpan',
    sebagian: 'Sebagian tersimpan',
    tersimpan: 'Tersimpan',
};

const KELAS_STATUS_RIWAYAT: Record<StatusRiwayatGenerator, string> = {
    dibuat: 'bg-siswa-laman-awal text-siswa-teks',
    sebagian: 'bg-siswa-hint-latar text-siswa-hint-teks',
    tersimpan: 'bg-siswa-umpan-benar text-siswa-umpan-benar-teks',
};

/**
 * Generator soal AI (desain mengikuti halaman editor EDVORA). Soal dibuat per kelompok tipe, ditinjau di kartu,
 * lalu disimpan sebagai Draft lewat endpoint yang memakai pemeriksa soal yang sama dengan formulir/import Excel.
 */
export default function GeneratorSoal({ subtesList, adaKunci, maksSoal, riwayat: riwayatAwal }: GeneratorSoalProps) {
    const [subtesKode, setSubtesKode] = useState(subtesList[0]?.kode ?? '');
    const [topikId, setTopikId] = useState('');
    const [tingkat, setTingkat] = useState<TingkatGenerator>('sedang');
    const [jumlah, setJumlah] = useState(5);
    const [pg, setPg] = useState(true);
    const [isian, setIsian] = useState(false);
    const [distribusi, setDistribusi] = useState<'acak' | 'manual'>('acak');
    const [jumlahPg, setJumlahPg] = useState(3);

    const [modeModel, setModeModel] = useState<'auto' | 'manual'>('auto');
    const [modelId, setModelId] = useState<string | null>(null);
    const [models, setModels] = useState<ModelAI[] | null>(null);
    const [sumberModel, setSumberModel] = useState<'openrouter' | 'fallback'>('fallback');
    const [limits, setLimits] = useState<Record<string, number>>(() => muatLimit());

    const [loading, setLoading] = useState(false);
    const [gagal, setGagal] = useState<string[]>([]);
    const [hasil, setHasil] = useState<HasilGenerator | null>(null);
    const [pilihan, setPilihan] = useState<Record<number, boolean>>({});
    const [tersimpanNomor, setTersimpanNomor] = useState<number[]>([]);
    const [menyimpan, setMenyimpan] = useState(false);
    const [sukses, setSukses] = useState<HasilSimpanGenerator | null>(null);
    const [regeneratingNomor, setRegeneratingNomor] = useState<number | null>(null);
    const [riwayat, setRiwayat] = useState<RiwayatGenerator[]>(riwayatAwal);

    const subtes = subtesList.find((s) => s.kode === subtesKode) ?? null;
    const topik = subtes?.topik.find((t) => t.id === topikId) ?? null;
    const bolehIsian = subtes?.bolehIsian ?? false;
    const tipe: 'pg' | 'isian' | 'both' = pg && isian ? 'both' : isian ? 'isian' : 'pg';
    const jumlahIsian = Math.max(1, jumlah - jumlahPg);

    useEffect(() => {
        setTopikId('');
    }, [subtesKode]);

    useEffect(() => {
        if (!bolehIsian) {
            setIsian(false);
        }
    }, [bolehIsian]);

    useEffect(() => {
        if (pg && isian && jumlah < 2) {
            setJumlah(2);
        }
    }, [pg, isian, jumlah]);

    useEffect(() => {
        if (pg && isian) {
            setJumlahPg((lama) => Math.min(Math.max(1, lama), Math.max(1, jumlah - 1)));
        }
    }, [jumlah, pg, isian]);

    useEffect(() => {
        let batal = false;
        setModels(null);

        axios
            .get<DaftarModelAI>(route('editor.generator.model'))
            .then((res) => {
                if (batal) return;
                setModels(res.data.models ?? []);
                setSumberModel(res.data.sumber === 'openrouter' ? 'openrouter' : 'fallback');
            })
            .catch(() => {
                if (!batal) setModels([]);
            });

        return () => {
            batal = true;
        };
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(KUNCI_LIMIT, JSON.stringify(limits));
        } catch {
            // Mode privat: status limit cukup disimpan di memori halaman ini.
        }
    }, [limits]);

    useEffect(() => {
        if (modelId && limits[modelId]) {
            setModelId(null);
        }
    }, [limits, modelId]);

    const modelOtomatis = useMemo(() => models?.find((m) => !limits[m.id]) ?? null, [models, limits]);
    const modelManual = useMemo(() => models?.find((m) => m.id === modelId) ?? null, [models, modelId]);
    const modelAktif = modeModel === 'auto' ? modelOtomatis : modelManual;
    const namaModelHasil = models?.find((m) => m.id === hasil?.model)?.nama ?? hasil?.model?.split('/').pop() ?? '';
    const adaLimit = Object.keys(limits).length > 0;

    const dapatDipilih = hasil ? hasil.soal.filter((s) => !tersimpanNomor.includes(s.nomor)) : [];
    const semuaTerpilih = dapatDipilih.length > 0 && dapatDipilih.every((s) => pilihan[s.nomor]);
    const jumlahDipilih = dapatDipilih.filter((s) => pilihan[s.nomor]).length;

    const bisaGenerate =
        adaKunci &&
        subtes !== null &&
        topik !== null &&
        (pg || isian) &&
        models !== null &&
        modelAktif !== null &&
        !loading &&
        (tipe !== 'both' || (jumlah >= 2 && (distribusi === 'acak' || (jumlahPg >= 1 && jumlahPg < jumlah))));

    const catatanTombol = !adaKunci
        ? 'Isi OPENROUTER_API_KEY di .env server untuk mengaktifkan generator.'
        : models === null
          ? 'Memuat daftar model dari OpenRouter…'
          : models.length === 0
            ? 'Daftar model tidak tersedia. Periksa koneksi lalu muat ulang halaman.'
            : !subtes
              ? 'Pilih subtes.'
              : !topik
                ? 'Pilih topik.'
                : !pg && !isian
                  ? 'Pilih minimal satu tipe soal.'
                  : tipe === 'both' && jumlah < 2
                    ? 'Campuran dua tipe membutuhkan minimal 2 soal.'
                    : modeModel === 'auto' && modelOtomatis === null
                      ? 'Semua model gratis sedang limit. Reset status limit atau pilih model manual.'
                      : modeModel === 'manual' && modelManual === null
                        ? 'Pilih satu model manual.'
                        : 'Soal dibuat AI dan wajib ditinjau sebelum dipublish.';

    const pilihSubtes = (kode: string) => {
        setSubtesKode(kode);
        const baru = subtesList.find((s) => s.kode === kode);
        if (baru && !baru.bolehIsian) setIsian(false);
    };

    const ubahJumlah = (nilai: number) => {
        const baru = Math.min(maksSoal, Math.max(1, Math.trunc(nilai) || 1));
        setJumlah(baru);
        setJumlahPg((lama) => Math.min(Math.max(1, lama), Math.max(1, baru - 1)));
    };

    const aturPilihanPg = (nilai: number) => {
        const maks = Math.max(1, jumlah - 1);
        setJumlahPg(Math.min(maks, Math.max(1, Math.trunc(nilai) || 1)));
    };

    const aturPilihanIsian = (nilai: number) => {
        const maks = Math.max(1, jumlah - 1);
        const baru = Math.min(maks, Math.max(1, Math.trunc(nilai) || 1));
        setJumlahPg(jumlah - baru);
    };

    const tandaiLimit = (id: string) => {
        setLimits((lama) => ({ ...lama, [id]: Date.now() }));
    };

    const resetLimit = () => {
        setLimits({});
        try {
            window.localStorage.removeItem(KUNCI_LIMIT);
        } catch {
            // Abaikan: status limit di memori sudah dihapus.
        }
    };

    const generate = async () => {
        if (!subtes || !topik || loading) return;

        setGagal([]);
        setSukses(null);
        setHasil(null);
        setTersimpanNomor([]);
        setPilihan({});
        setLoading(true);

        const dasar = {
            subtes: subtes.kode,
            topik: topik.nama,
            tingkat,
            jumlah,
            tipe,
            distribusi: tipe === 'both' ? distribusi : 'acak',
            jumlah_pg: tipe === 'both' && distribusi === 'manual' ? jumlahPg : undefined,
            jumlah_isian: tipe === 'both' && distribusi === 'manual' ? jumlah - jumlahPg : undefined,
        };

        const terlarang = { ...limits };
        let calon = modelAktif;

        try {
            for (let percobaan = 0; percobaan < 3; percobaan++) {
                if (!calon) {
                    setGagal(['Semua model gratis sedang limit. Reset status limit atau pilih model manual.']);
                    return;
                }

                const modelDicoba = calon;

                try {
                    const res = await axios.post<HasilGenerator>(route('editor.generator.generate'), {
                        ...dasar,
                        model: modelDicoba.id,
                    });

                    const terpilih: Record<number, boolean> = {};
                    res.data.soal.forEach((s) => {
                        terpilih[s.nomor] = true;
                    });

                    setHasil(res.data);
                    setPilihan(terpilih);
                    setGagal([]);

                    const sesiId = res.data.sesi_id;
                    if (sesiId) {
                        const entriBaru: RiwayatGenerator = {
                            id: sesiId,
                            subtes: res.data.kode_subtes,
                            subtes_nama: res.data.subtes,
                            topik: res.data.topik,
                            tingkat: res.data.tingkat_kesulitan,
                            tipe_soal: res.data.tipe_soal,
                            model: res.data.model,
                            jumlah_soal: res.data.jumlah_soal,
                            jumlah_tersimpan: 0,
                            status: 'dibuat',
                            dibuat: res.data.dibuat,
                        };

                        setRiwayat((lama) => [entriBaru, ...lama].slice(0, 5));
                    }

                    return;
                } catch (e) {
                    const limit = axios.isAxiosError(e) && e.response?.data?.kode === 'model_limit';

                    if (!limit) {
                        setGagal(daftarPesan(e));
                        return;
                    }

                    tandaiLimit(modelDicoba.id);
                    terlarang[modelDicoba.id] = Date.now();

                    if (modeModel === 'manual') {
                        setGagal([`Model ${modelDicoba.nama} sedang limit. Pilih model lain atau reset status limit.`]);
                        return;
                    }

                    calon = models?.find((m) => !terlarang[m.id]) ?? null;

                    if (!calon) {
                        setGagal([`Model ${modelDicoba.nama} sedang limit, dan tidak ada model gratis lain yang tersedia.`]);
                        return;
                    }

                    setGagal([`Model ${modelDicoba.nama} sedang limit. Mencoba ${calon.nama}…`]);
                }
            }

            setGagal(['Tiga model otomatis sudah dicoba dan semuanya gagal. Coba lagi atau pilih model manual.']);
        } finally {
            setLoading(false);
        }
    };

    const regenerateSoal = async (index: number) => {
        if (!hasil || regeneratingNomor !== null) return;

        const soalLama = hasil.soal[index];

        if (!soalLama || tersimpanNomor.includes(soalLama.nomor)) return;

        const dasar = {
            subtes: hasil.kode_subtes,
            topik: hasil.topik,
            tingkat: hasil.tingkat_kesulitan.toLowerCase(),
            jumlah: 1,
            tipe: soalLama.tipe === 'pilihan_ganda' ? 'pg' : 'isian',
            distribusi: 'acak',
            hindari: soalLama.soal,
            regenerate: true,
        };

        const terlarang = { ...limits };
        let calon =
            models?.find((m) => m.id === hasil.model && !terlarang[m.id]) ??
            (modeModel === 'auto' ? modelOtomatis : modelManual);

        setGagal([]);
        setRegeneratingNomor(soalLama.nomor);

        try {
            for (let percobaan = 0; percobaan < 3; percobaan++) {
                if (!calon) {
                    setGagal(['Semua model gratis sedang limit. Reset status limit atau pilih model manual.']);
                    return;
                }

                const modelDicoba = calon;

                try {
                    const res = await axios.post<HasilGenerator>(route('editor.generator.generate'), {
                        ...dasar,
                        model: modelDicoba.id,
                    });

                    const baru = res.data.soal[0];

                    if (!baru) {
                        setGagal(['Model tidak mengembalikan soal pengganti. Coba lagi.']);
                        return;
                    }

                    setHasil((lama) =>
                        lama
                            ? {
                                  ...lama,
                                  model: res.data.model,
                                  soal: lama.soal.map((s, i) => (i === index ? { ...baru, nomor: s.nomor } : s)),
                              }
                            : lama,
                    );

                    return;
                } catch (e) {
                    const limit = axios.isAxiosError(e) && e.response?.data?.kode === 'model_limit';

                    if (!limit) {
                        setGagal(daftarPesan(e));
                        return;
                    }

                    tandaiLimit(modelDicoba.id);
                    terlarang[modelDicoba.id] = Date.now();

                    if (modeModel === 'manual') {
                        setGagal([`Model ${modelDicoba.nama} sedang limit. Pilih model lain atau reset status limit.`]);
                        return;
                    }

                    calon = models?.find((m) => !terlarang[m.id]) ?? null;

                    if (!calon) {
                        setGagal([`Model ${modelDicoba.nama} sedang limit, dan tidak ada model gratis lain yang tersedia.`]);
                        return;
                    }

                    setGagal([`Model ${modelDicoba.nama} sedang limit. Mencoba ${calon.nama}…`]);
                }
            }

            setGagal(['Tiga model otomatis sudah dicoba dan semuanya gagal. Coba lagi atau pilih model manual.']);
        } finally {
            setRegeneratingNomor(null);
        }
    };

    const simpanDraft = async () => {
        if (!hasil || menyimpan) return;

        const dipilih = hasil.soal.filter((s) => pilihan[s.nomor] && !tersimpanNomor.includes(s.nomor));

        if (dipilih.length === 0) {
            setGagal(['Pilih minimal satu soal yang belum tersimpan.']);
            return;
        }

        setMenyimpan(true);
        setGagal([]);

        try {
            const res = await axios.post<HasilSimpanGenerator>(route('editor.generator.simpan'), {
                subtes: hasil.kode_subtes,
                topik_id: hasil.topik_id,
                tingkat: hasil.tingkat_kesulitan.toLowerCase(),
                sesi_id: hasil.sesi_id ?? undefined,
                soal: dipilih.map((s) => ({
                    tipe: s.tipe,
                    soal: s.soal,
                    pilihan: s.pilihan,
                    jawaban: s.jawaban,
                    hint: s.hint,
                    pembahasan: s.pembahasan,
                })),
            });

            const nomorBaru = dipilih.map((s) => s.nomor);

            setTersimpanNomor((lama) => [...lama, ...nomorBaru]);
            setPilihan((lama) => {
                const baru = { ...lama };
                nomorBaru.forEach((nomor) => delete baru[nomor]);
                return baru;
            });
            setSukses(res.data);

            const sesiId = hasil.sesi_id;
            if (sesiId) {
                setRiwayat((lama) =>
                    lama.map((r) => {
                        if (r.id !== sesiId) return r;

                        const total = Math.min(r.jumlah_soal, r.jumlah_tersimpan + res.data.tersimpan);

                        return { ...r, jumlah_tersimpan: total, status: total >= r.jumlah_soal ? 'tersimpan' : 'sebagian' };
                    }),
                );
            }
        } catch (e) {
            setGagal(daftarPesan(e));
        } finally {
            setMenyimpan(false);
        }
    };

    const toggleSemua = () => {
        if (!hasil) return;

        if (semuaTerpilih) {
            setPilihan({});
            return;
        }

        const baru: Record<number, boolean> = {};
        hasil.soal.forEach((s) => {
            if (!tersimpanNomor.includes(s.nomor)) baru[s.nomor] = true;
        });
        setPilihan(baru);
    };

    return (
        <EditorLayout breadcrumb={['Bank Soal', 'Generator AI']}>
            <Head title="Generator Soal AI" />
            <ToastGagal pesan={gagal} onHilang={() => setGagal([])} />

            <JudulHalaman
                atas="Bank Soal . Generator AI"
                judul="Generator Soal AI"
                keterangan="Susun soal UTBK dengan AI, tinjau hasilnya, lalu simpan sebagai Draft."
            />

            {!adaKunci && (
                <div role="alert" className="mb-5 rounded-kartu border border-siswa-hint-garis bg-siswa-hint-latar px-5 py-4 text-sm text-siswa-hint-teks">
                    <p className="font-semibold">OPENROUTER_API_KEY belum diisi.</p>
                    <p className="mt-1">
                        Isi kuncinya di <code className="rounded bg-white/60 px-1">.env</code> server, lalu jalankan{' '}
                        <code className="rounded bg-white/60 px-1">php artisan config:clear</code>.
                    </p>
                </div>
            )}

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                <div className="space-y-5">
                    <section className={KELAS_KARTU}>
                        <div className="mb-4">
                            <h2 className="text-base font-bold text-siswa-judul">Spesifikasi Soal</h2>
                            <p className="text-xs text-siswa-teks">Pilih subtes, topik, dan jumlah soal.</p>
                        </div>

                        <div className="space-y-4">
                            <label className="block">
                                <span className={KELAS_LABEL}>Subtes</span>
                                <select value={subtesKode} onChange={(e) => pilihSubtes(e.target.value)} className={`mt-1 ${KELAS_INPUT}`}>
                                    {subtesList.map((s) => (
                                        <option key={s.kode} value={s.kode}>
                                            {s.kode} — {s.nama}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className={KELAS_LABEL}>Topik</span>
                                <select
                                    value={topikId}
                                    onChange={(e) => setTopikId(e.target.value)}
                                    disabled={!subtes || subtes.topik.length === 0}
                                    className={`mt-1 ${KELAS_INPUT}`}
                                >
                                    <option value="">{subtes && subtes.topik.length > 0 ? 'Pilih topik' : 'Belum ada topik'}</option>
                                    {subtes?.topik.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.nama}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div>
                                <div className="mb-1 flex items-center justify-between gap-2">
                                    <span className={KELAS_LABEL}>Tingkat kesulitan</span>
                                </div>
                                <div className="inline-flex w-full rounded-full bg-siswa-laman-awal p-1">
                                    {URUTAN_TINGKAT.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setTingkat(t)}
                                            aria-pressed={tingkat === t}
                                            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                                                tingkat === t ? 'bg-ujian-biru text-white shadow-panel' : 'text-siswa-teks hover:text-siswa-judul'
                                            }`}
                                        >
                                            {LABEL_TINGKAT[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="mb-1 flex items-center justify-between gap-2">
                                    <span className={KELAS_LABEL}>Jumlah soal</span>
                                    <span className="text-xs text-siswa-teks">1–{maksSoal}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => ubahJumlah(jumlah - 1)}
                                        aria-label="Kurangi jumlah soal"
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-siswa-garis-halus bg-white text-xl font-semibold text-siswa-judul transition hover:bg-siswa-laman-awal"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={maksSoal}
                                        value={jumlah}
                                        onChange={(e) => ubahJumlah(Number(e.target.value))}
                                        aria-label="Jumlah soal"
                                        className={`${KELAS_INPUT} text-center font-semibold`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => ubahJumlah(jumlah + 1)}
                                        aria-label="Tambah jumlah soal"
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-siswa-garis-halus bg-white text-xl font-semibold text-siswa-judul transition hover:bg-siswa-laman-awal"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={KELAS_KARTU}>
                        <div className="mb-4">
                            <h2 className="text-base font-bold text-siswa-judul">Tipe Soal</h2>
                            <p className="text-xs text-siswa-teks">Boleh pilih keduanya.</p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <TombolTipe aktif={pg} judul="Pilihan Ganda" ket="5 opsi jawaban A–E" onKlik={() => setPg((v) => !v)} />
                            <TombolTipe
                                aktif={isian}
                                judul="Isian Singkat"
                                ket={bolehIsian ? 'Jawaban 1–3 kata' : 'Hanya PK/PM'}
                                disabled={!bolehIsian}
                                onKlik={() => setIsian((v) => !v)}
                            />
                        </div>

                        {!bolehIsian && (
                            <p className="mt-2 text-xs text-siswa-teks">Isian singkat hanya tersedia untuk subtes matematika (PK/PM).</p>
                        )}

                        {pg && isian && (
                            <div className="mt-4 rounded-xl border border-siswa-garis-halus bg-siswa-laman-awal p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className={KELAS_LABEL}>Pembagian jumlah</span>
                                    <span className="text-xs font-semibold text-siswa-judul">{jumlah} soal</span>
                                </div>

                                <div className="mt-2 inline-flex w-full rounded-full bg-white p-1 shadow-panel">
                                    {(['acak', 'manual'] as const).map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setDistribusi(d)}
                                            aria-pressed={distribusi === d}
                                            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                                distribusi === d ? 'bg-ujian-biru text-white' : 'text-siswa-teks hover:text-siswa-judul'
                                            }`}
                                        >
                                            {d === 'acak' ? 'Acak' : 'Atur sendiri'}
                                        </button>
                                    ))}
                                </div>

                                {distribusi === 'manual' ? (
                                    <div className="mt-3">
                                        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
                                            <label className="block">
                                                <span className={KELAS_LABEL}>Pilihan ganda</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={jumlah - 1}
                                                    value={jumlahPg}
                                                    onChange={(e) => aturPilihanPg(Number(e.target.value))}
                                                    className={`mt-1 ${KELAS_INPUT}`}
                                                />
                                            </label>
                                            <span className="pb-2 text-lg text-siswa-teks" aria-hidden="true">
                                                +
                                            </span>
                                            <label className="block">
                                                <span className={KELAS_LABEL}>Isian singkat</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={jumlah - 1}
                                                    value={jumlahIsian}
                                                    onChange={(e) => aturPilihanIsian(Number(e.target.value))}
                                                    className={`mt-1 ${KELAS_INPUT}`}
                                                />
                                            </label>
                                        </div>
                                        <p className="mt-2 text-xs text-siswa-teks">
                                            Total {jumlah} soal: {jumlahPg} pilihan ganda + {jumlahIsian} isian singkat.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-xs text-siswa-teks">
                                        Jumlah tiap tipe diacak otomatis; total selalu {jumlah} soal.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    <section className={KELAS_KARTU}>
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-base font-bold text-siswa-judul">Model AI</h2>
                                <p className="text-xs text-siswa-teks">Hanya model gratis dari OpenRouter.</p>
                            </div>
                            {adaLimit && (
                                <button type="button" onClick={resetLimit} className="shrink-0 text-xs font-semibold text-edvora-primary hover:underline">
                                    Reset status limit
                                </button>
                            )}
                        </div>

                        <div className="inline-flex w-full rounded-full bg-siswa-laman-awal p-1">
                            {(['auto', 'manual'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => {
                                        setModeModel(mode);
                                        if (mode === 'manual' && modelId === null && modelOtomatis) {
                                            setModelId(modelOtomatis.id);
                                        }
                                    }}
                                    aria-pressed={modeModel === mode}
                                    className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                                        modeModel === mode ? 'bg-ujian-biru text-white shadow-panel' : 'text-siswa-teks hover:text-siswa-judul'
                                    }`}
                                >
                                    {mode === 'auto' ? 'Otomatis' : 'Pilih sendiri'}
                                </button>
                            ))}
                        </div>

                        {models === null ? (
                            <div className="mt-3 flex items-center gap-2 rounded-xl bg-siswa-laman-awal px-3 py-3 text-sm text-siswa-teks">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-siswa-garis-halus border-t-edvora-primary" />
                                Memuat daftar model…
                            </div>
                        ) : models.length === 0 ? (
                            <div className="mt-3 rounded-xl border border-siswa-umpan-salah bg-siswa-umpan-salah px-3 py-3 text-sm text-siswa-umpan-salah-teks">
                                Daftar model tidak tersedia. Periksa koneksi lalu muat ulang halaman.
                            </div>
                        ) : modeModel === 'auto' ? (
                            <div
                                className={`mt-3 rounded-xl border p-4 ${
                                    modelOtomatis ? 'border-siswa-garis-halus bg-siswa-laman-awal' : 'border-siswa-titik-salah bg-siswa-umpan-salah'
                                }`}
                            >
                                <p className={KELAS_LABEL}>Model terpilih otomatis</p>
                                {modelOtomatis ? (
                                    <>
                                        <p className="mt-1 font-semibold text-siswa-judul">{modelOtomatis.nama}</p>
                                        <p className="text-xs text-siswa-teks">
                                            {modelOtomatis.provider}
                                            {modelOtomatis.konteks ? ` · ${formatKonteks(modelOtomatis.konteks)}` : ''}
                                        </p>
                                        <p className="mt-2 text-xs text-siswa-teks">Model berikutnya dipakai otomatis bila model ini limit.</p>
                                    </>
                                ) : (
                                    <p className="mt-1 text-sm text-siswa-umpan-salah-teks">
                                        Semua model gratis sedang limit. Reset status limit atau pilih model manual.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                                {models.map((m) => {
                                    const terbatas = Boolean(limits[m.id]);
                                    const aktif = m.id === modelId;

                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            disabled={terbatas}
                                            onClick={() => setModelId(m.id)}
                                            aria-pressed={aktif}
                                            className={`w-full rounded-xl border p-3 text-left transition ${
                                                aktif ? 'border-edvora-primary bg-siswa-badge-subtes' : 'border-siswa-garis-halus bg-white'
                                            } ${terbatas ? 'cursor-not-allowed bg-siswa-cincin-dasar/40 opacity-60' : 'hover:border-edvora-primary'}`}
                                        >
                                            <span className="flex items-center justify-between gap-2">
                                                <strong className="min-w-0 truncate text-sm text-siswa-judul">{m.nama}</strong>
                                                {terbatas && (
                                                    <span className="shrink-0 rounded-full bg-siswa-cincin-dasar px-2 py-0.5 text-[10px] font-semibold uppercase text-siswa-teks">
                                                        Model limit
                                                    </span>
                                                )}
                                            </span>
                                            <span className="mt-0.5 block truncate text-xs text-siswa-teks">
                                                {m.provider}
                                                {m.konteks ? ` · ${formatKonteks(m.konteks)}` : ''}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <p className="mt-3 text-xs text-siswa-teks">
                            {sumberModel === 'fallback'
                                ? 'Daftar cadangan dipakai karena OpenRouter tidak bisa dihubungi.'
                                : `${models?.length ?? 0} model gratis tersedia.`}
                        </p>
                    </section>

                    <section className={KELAS_KARTU}>
                        <div className="mb-3">
                            <h2 className="text-base font-bold text-siswa-judul">Riwayat generate</h2>
                            <p className="text-xs text-siswa-teks">Lima generate terakhir milik akun ini.</p>
                        </div>

                        {riwayat.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-siswa-garis-halus bg-siswa-laman-awal px-3 py-4 text-xs text-siswa-teks">
                                Belum ada riwayat. Riwayat tercatat setelah soal berhasil dibuat.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {riwayat.map((r) => (
                                    <li key={r.id} className="rounded-xl border border-siswa-garis-halus p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="min-w-0 truncate text-xs font-semibold text-siswa-judul" title={r.subtes_nama}>
                                                {r.subtes} · {r.topik}
                                            </span>
                                            <span
                                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${KELAS_STATUS_RIWAYAT[r.status]}`}
                                            >
                                                {LABEL_STATUS_RIWAYAT[r.status]}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-siswa-teks">
                                            {r.jumlah_soal} soal · {r.jumlah_tersimpan} tersimpan · {r.tingkat}
                                        </p>
                                        <p className="truncate text-[11px] text-siswa-teks" title={r.model}>
                                            {r.tipe_soal} · {r.model.split('/').pop()}
                                        </p>
                                        <p className="text-[11px] text-siswa-teks">{formatWaktu(r.dibuat)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <div>
                        <button
                            type="button"
                            disabled={!bisaGenerate}
                            onClick={generate}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ujian-biru px-5 py-3 font-semibold text-white shadow-panel transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                                    Menyusun soal…
                                </>
                            ) : (
                                'Generate soal'
                            )}
                        </button>
                        <p className="mt-2 text-center text-xs text-siswa-teks">{catatanTombol}</p>
                    </div>
                </div>

                <section className={KELAS_KARTU}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className={KELAS_LABEL}>Hasil</p>
                            <h2 className="text-lg font-bold text-siswa-judul">
                                {hasil ? `${hasil.jumlah_soal} soal siap ditinjau` : 'Belum ada soal'}
                            </h2>
                        </div>

                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-20 text-center">
                            <span className="h-10 w-10 animate-spin rounded-full border-4 border-siswa-garis-halus border-t-edvora-primary" aria-hidden="true" />
                            <p className="text-sm font-semibold text-siswa-judul">AI sedang menyusun soal…</p>
                            <p className="max-w-sm text-xs text-siswa-teks">
                                Bisa memakan waktu 1–3 menit. Halaman ini tetap terbuka; jangan tutup saat proses berjalan.
                            </p>
                        </div>
                    ) : !hasil ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-siswa-garis-halus bg-siswa-laman-awal px-5 py-16 text-center">
                            <p className="text-sm font-semibold text-siswa-judul">Belum ada soal yang dibuat</p>
                            <p className="mt-1 text-xs text-siswa-teks">Atur spesifikasi di kiri, lalu klik Generate soal.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <Chip>
                                    {hasil.kode_subtes} · {hasil.subtes}
                                </Chip>
                                <Chip>{hasil.topik}</Chip>
                                <Chip>{hasil.tingkat_kesulitan}</Chip>
                                <Chip>
                                    {hasil.jumlah_pg} PG · {hasil.jumlah_isian} isian
                                </Chip>
                                <Chip>Model: {namaModelHasil}</Chip>
                            </div>

                            {sukses && (
                                <div className="mt-4 rounded-2xl border border-siswa-umpan-benar-teks/30 bg-siswa-umpan-benar px-4 py-3 text-sm text-siswa-umpan-benar-teks">
                                    <p className="font-semibold">
                                        {sukses.tersimpan} soal disimpan sebagai Draft ({sukses.kode.join(', ')}).
                                    </p>
                                    <Link
                                        href={route('editor.soal.index', { subtes: sukses.subtes, status: 'draft' })}
                                        className="mt-1 inline-block font-semibold underline"
                                    >
                                        Lihat di Bank Soal
                                    </Link>
                                </div>
                            )}

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-siswa-laman-awal px-3 py-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-siswa-judul">
                                    <input
                                        type="checkbox"
                                        checked={semuaTerpilih}
                                        onChange={toggleSemua}
                                        disabled={dapatDipilih.length === 0}
                                        className="rounded border-siswa-garis-halus text-edvora-primary focus:ring-edvora-primary"
                                    />
                                    Pilih semua
                                </label>

                                <button
                                    type="button"
                                    disabled={jumlahDipilih === 0 || menyimpan || regeneratingNomor !== null}
                                    onClick={simpanDraft}
                                    className="rounded-lg bg-siswa-titik-benar px-4 py-2 text-xs font-semibold text-white shadow-panel transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {menyimpan ? 'Menyimpan…' : `Simpan ${jumlahDipilih} soal sebagai Draft`}
                                </button>
                            </div>

                            <div className="mt-4 space-y-3">
                                {hasil.soal.map((s, index) => (
                                    <KartuSoalAI
                                        key={s.nomor}
                                        soal={s}
                                        dipilih={Boolean(pilihan[s.nomor])}
                                        tersimpan={tersimpanNomor.includes(s.nomor)}
                                        regenerating={regeneratingNomor === s.nomor}
                                        bolehRegenerate={regeneratingNomor === null && !menyimpan}
                                        onPilih={() => setPilihan((lama) => ({ ...lama, [s.nomor]: !lama[s.nomor] }))}
                                        onRegenerate={() => regenerateSoal(index)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </EditorLayout>
    );
}

function TombolTipe({
    aktif,
    judul,
    ket,
    disabled = false,
    onKlik,
}: {
    aktif: boolean;
    judul: string;
    ket: string;
    disabled?: boolean;
    onKlik: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onKlik}
            disabled={disabled}
            aria-pressed={aktif}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                aktif ? 'border-edvora-primary bg-siswa-badge-subtes' : 'border-siswa-garis-halus bg-white'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-edvora-primary'}`}
        >
            <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    aktif ? 'border-edvora-primary bg-edvora-primary text-white' : 'border-siswa-garis-halus bg-white text-transparent'
                }`}
                aria-hidden="true"
            >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
            </span>
            <span className="min-w-0">
                <strong className="block text-sm text-siswa-judul">{judul}</strong>
                <small className="block text-xs text-siswa-teks">{ket}</small>
            </span>
        </button>
    );
}

function Chip({ children }: { children: ReactNode }) {
    return <span className="rounded-full bg-siswa-badge-subtes px-3 py-1 font-medium text-siswa-subtes">{children}</span>;
}

function KartuSoalAI({
    soal,
    dipilih,
    tersimpan,
    regenerating,
    bolehRegenerate,
    onPilih,
    onRegenerate,
}: {
    soal: SoalAI;
    dipilih: boolean;
    tersimpan: boolean;
    regenerating: boolean;
    bolehRegenerate: boolean;
    onPilih: () => void;
    onRegenerate: () => void;
}) {
    return (
        <article
            className={`relative rounded-2xl border bg-white p-4 shadow-kartu ${
                tersimpan ? 'border-siswa-umpan-benar-teks/40' : 'border-siswa-garis-halus'
            } ${regenerating ? 'border-dashed' : ''}`}
        >
            {regenerating && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/85" role="status">
                    <span
                        className="h-6 w-6 animate-spin rounded-full border-[3px] border-siswa-garis-halus border-t-edvora-primary"
                        aria-hidden="true"
                    />
                    <span className="text-xs font-semibold text-siswa-teks">Meregenerasi soal…</span>
                </div>
            )}

            <div className={`flex items-start gap-3 ${regenerating ? 'pointer-events-none opacity-30' : ''}`}>
                <input
                    type="checkbox"
                    checked={dipilih}
                    disabled={tersimpan || regenerating}
                    onChange={onPilih}
                    aria-label={`Pilih soal ${soal.nomor}`}
                    className="mt-1 rounded border-siswa-garis-halus text-edvora-primary focus:ring-edvora-primary disabled:opacity-50"
                />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-edvora-brand px-2.5 py-0.5 text-[11px] font-semibold text-white">Soal {soal.nomor}</span>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                soal.tipe === 'isian_singkat' ? 'bg-siswa-ikon-tryout text-siswa-judul' : 'bg-siswa-badge-subtes text-siswa-subtes'
                            }`}
                        >
                            {soal.tipe_soal}
                        </span>
                        {tersimpan && (
                            <span className="rounded-full bg-siswa-umpan-benar px-2.5 py-0.5 text-[11px] font-semibold text-siswa-umpan-benar-teks">
                                Tersimpan
                            </span>
                        )}
                        {!tersimpan && (
                            <button
                                type="button"
                                onClick={onRegenerate}
                                disabled={regenerating || !bolehRegenerate}
                                title={regenerating ? 'Sedang meregenerasi soal' : 'Buat ulang soal ini'}
                                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-siswa-garis-halus bg-white px-2.5 py-1 text-[11px] font-semibold text-siswa-judul transition hover:border-edvora-primary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <svg
                                    className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                                    <path d="M21 3v6h-6" />
                                </svg>
                                {regenerating ? 'Meregenerasi…' : 'Regenerate'}
                            </button>
                        )}
                    </div>

                    <div className="mt-2 text-sm leading-7 text-siswa-judul">
                        <TeksMatematika teks={soal.soal} />
                    </div>

                    {soal.pilihan ? (
                        <div className="mt-3 space-y-1.5">
                            {Object.entries(soal.pilihan).map(([label, teks]) => {
                                const kunci = label === soal.jawaban;

                                return (
                                    <div
                                        key={label}
                                        className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${
                                            kunci
                                                ? 'border-siswa-umpan-benar-teks bg-siswa-umpan-benar text-siswa-umpan-benar-teks'
                                                : 'border-siswa-garis-halus text-siswa-judul'
                                        }`}
                                    >
                                        <span className="shrink-0 font-semibold">{label}.</span>
                                        <span className="min-w-0 flex-1">
                                            <TeksMatematika teks={teks} />
                                        </span>
                                        {kunci && <span className="shrink-0 text-[10px] font-bold uppercase">Kunci</span>}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="mt-3 rounded-lg bg-siswa-badge-subtes px-3 py-2 text-sm text-siswa-judul">
                            <span className="font-semibold">Jawaban: </span>
                            <TeksMatematika teks={soal.jawaban} />
                        </div>
                    )}

                    {soal.hint !== '' && (
                        <details className="mt-3 text-sm">
                            <summary className="cursor-pointer font-semibold text-edvora-primary">Hint</summary>
                            <div className="mt-2 rounded-lg bg-siswa-laman-awal px-3 py-2 leading-6 text-siswa-teks">
                                <TeksMatematika teks={soal.hint} />
                            </div>
                        </details>
                    )}

                    <details className="mt-3 text-sm">
                        <summary className="cursor-pointer font-semibold text-edvora-primary">Pembahasan</summary>
                        <div className="mt-2 rounded-lg bg-siswa-laman-awal px-3 py-2 leading-6 text-siswa-teks">
                            <TeksMatematika teks={soal.pembahasan} />
                        </div>
                    </details>
                </div>
            </div>
        </article>
    );
}

function muatLimit(): Record<string, number> {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const data: unknown = JSON.parse(window.localStorage.getItem(KUNCI_LIMIT) ?? '{}');

        if (!data || typeof data !== 'object') {
            return {};
        }

        const sekarang = Date.now();
        const bersih: Record<string, number> = {};

        for (const [id, waktu] of Object.entries(data as Record<string, unknown>)) {
            if (typeof waktu === 'number' && sekarang - waktu < UMUR_LIMIT) {
                bersih[id] = waktu;
            }
        }

        return bersih;
    } catch {
        return {};
    }
}

function formatKonteks(konteks: number): string {
    return `${new Intl.NumberFormat('id-ID').format(konteks)} token`;
}

function formatWaktu(iso: string | null): string {
    if (!iso) {
        return '-';
    }

    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

// Pesan dari axios: semua pesan validasi yang tampil di halaman, atau pesan server/umum.
function daftarPesan(e: unknown): string[] {
    if (axios.isAxiosError(e) && e.response?.data && typeof e.response.data === 'object') {
        const data = e.response.data as { errors?: Record<string, unknown> };

        if (data.errors && typeof data.errors === 'object') {
            const pesan = Object.values(data.errors)
                .flatMap((nilai) => (Array.isArray(nilai) ? nilai : [nilai]))
                .filter((nilai): nilai is string => typeof nilai === 'string' && nilai !== '');

            if (pesan.length > 0) {
                return [...new Set(pesan)].slice(0, 4);
            }
        }
    }

    return [pesanServer(e)];
}
