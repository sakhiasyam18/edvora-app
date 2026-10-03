import { Head, router } from '@inertiajs/react';
import { ReactNode } from 'react';
import LingkaranTahap, { keteranganSkor, TEKS_LABEL } from '@/Components/Gamifikasi/LingkaranTahap';
import LatihanLayout from '@/Components/Layouts/LatihanLayout';
import { HasilLatihan, ModeLatihan, RingkasanTopikHasil, TopikPenguasaan } from '@/types/latihan';
import { dummyHasilLatihan } from '@/data/dummyLatihan';

interface HasilProps {
    // Sementara controller belum kirim props, jadi fallback ke dummy.
    hasil?: HasilLatihan;
    pengerjaan?: {
        id: string;
        subtes_id: string;
        jumlah_soal_dipilih: number;
        tipe: string;
        mode_latihan: ModeLatihan | null;
        started_at: string | null;
        finished_at: string | null;
    };
    // Satu per topik yang dikerjakan di sesi fleksibel; kosong untuk simulasi.
    ringkasanTopik?: RingkasanTopikHasil[];
    // Maks 3 topik subtes ini yang disarankan dilatih berikutnya (UCS1).
    rekomendasiTopik?: TopikPenguasaan[];
}

// Keadaan satu topik setelah sesi ini. Belum ada di desain; gayanya mengikuti kartu Hasil.
function KartuTopik({ topik }: { topik: RingkasanTopikHasil }) {
    const naik = topik.perubahan !== null && topik.perubahan.ke > topik.perubahan.dari;

    return (
        <div className="flex w-full items-center gap-4 rounded-[20px] border border-siswa-ujian-garis bg-white px-5 py-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-kartu">
            <LingkaranTahap topik={topik} ukuran={56} />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-siswa-teks">Topik</p>
                <p className="text-base font-semibold text-siswa-judul md:text-lg">{topik.nama}</p>
                <p className="text-sm text-siswa-teks">
                    Tahap {topik.tahap} · {TEKS_LABEL[topik.label]} · {keteranganSkor(topik)}
                </p>
            </div>
            {topik.perubahan && (
                <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
                        naik ? 'bg-siswa-umpan-benar text-siswa-umpan-benar-teks' : 'bg-siswa-umpan-salah text-siswa-umpan-salah-teks'
                    }`}
                >
                    {naik ? 'Naik' : 'Turun'} ke tahap {topik.perubahan.ke}
                </span>
            )}
        </div>
    );
}

// Ubin statistik (Figma: Hasil Pengerjaan): ikon kecil, angka besar, label di bawahnya. Muncul bergiliran.
function KartuStat({ ikon, label, nilai, urutan }: { ikon: ReactNode; label: string; nilai: string | number; urutan: number }) {
    return (
        <div
            className="flex animate-muncul-halus flex-col items-center rounded-[20px] border border-siswa-ujian-garis bg-white px-3 py-4 text-center transition duration-200 [animation-fill-mode:both] hover:-translate-y-1 hover:shadow-kartu md:py-5"
            style={{ animationDelay: `${150 + urutan * 70}ms` }}
        >
            {ikon}
            <p className="mt-2 text-2xl font-bold text-siswa-judul md:text-[28px]">{nilai}</p>
            <p className="mt-1 text-[11px] font-medium text-siswa-judul md:text-xs">{label}</p>
        </div>
    );
}

// Bulatan ikon kecil di atas angka statistik.
function BulatanIkon({ latar, children }: { latar: string; children: ReactNode }) {
    return <span className={`flex h-7 w-7 items-center justify-center rounded-full ${latar}`}>{children}</span>;
}

// Selisih mulai–selesai dalam format "3m 20s"; "-" bila salah satunya belum tercatat.
function formatDurasi(mulai?: string | null, selesai?: string | null): string {
    if (!mulai || !selesai) {
        return '-';
    }

    const detikTotal = Math.max(0, Math.floor((new Date(selesai).getTime() - new Date(mulai).getTime()) / 1000));
    const menit = Math.floor(detikTotal / 60);
    const detik = detikTotal % 60;

    return menit > 0 ? `${menit}m ${detik}s` : `${detik}s`;
}

export default function Hasil({ hasil = dummyHasilLatihan, pengerjaan, ringkasanTopik = [], rekomendasiTopik = [] }: HasilProps) {
    // Soal yang dilewati tidak dicatat di jawaban_pengerjaan, jadi sisanya dihitung kosong.
    const jumlahKosong = pengerjaan
        ? Math.max(0, pengerjaan.jumlah_soal_dipilih - hasil.jumlahBenar - hasil.jumlahSalah)
        : 0;

    const namaMode = pengerjaan?.mode_latihan
        ? { fleksibel: 'Fleksibel', simulasi: 'Simulasi', remedial: 'Remedial' }[pengerjaan.mode_latihan]
        : null;
    const kelasGlif = 'h-4 w-4';

    return (
        <LatihanLayout
            breadcrumb={[
                { label: 'Latihan Soal', href: route('latihan.index') },
                namaMode ? `Hasil Pengerjaan (Mode ${namaMode})` : 'Hasil Pengerjaan',
            ]}
        >
            <Head title="Hasil Pengerjaan Soal" />

            <div className="mx-auto w-full max-w-[1150px] px-4 py-8 md:px-8 lg:py-[70px]">
                <section className="animate-muncul-halus overflow-hidden rounded-[24px] bg-white shadow-kartu">
                    {/* Pita biru di atas kartu; trofi menumpang di garis bawahnya. */}
                    <div className="h-20 bg-gradient-to-r from-[#9BBCF2] to-[#4A6CB0] md:h-[100px]" />

                    <div className="px-5 pb-8 md:px-[70px] md:pb-12">
                        <div className="-mt-10 flex justify-center md:-mt-[62px]">
                            <span className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-white shadow-kartu md:h-[124px] md:w-[124px] md:rounded-[24px]">
                                <Trofi />
                            </span>
                        </div>

                        <h1 className="mt-4 text-center text-2xl font-bold text-siswa-judul md:text-[38px] md:leading-tight">Hasil Pengerjaan Soal</h1>
                        <p className="mt-2 text-center text-sm font-medium text-siswa-teks md:text-base">
                            Kerja Bagus! Terus tingkatkan kemampuanmu dan berkembang setiap harinya!
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:mt-8 lg:grid-cols-6 lg:gap-[18px]">
                            <KartuStat
                                urutan={0}
                                label="Jawaban Benar"
                                nilai={hasil.jumlahBenar}
                                ikon={
                                    <BulatanIkon latar="bg-siswa-titik-benar text-white">
                                        <svg className={kelasGlif} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12.5l4.5 4.5L19 7.5" />
                                        </svg>
                                    </BulatanIkon>
                                }
                            />
                            <KartuStat
                                urutan={1}
                                label="Jawaban Salah"
                                nilai={hasil.jumlahSalah}
                                ikon={
                                    <BulatanIkon latar="bg-siswa-titik-salah text-white">
                                        <svg className={kelasGlif} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                                            <path d="M7 7l10 10M17 7L7 17" />
                                        </svg>
                                    </BulatanIkon>
                                }
                            />
                            <KartuStat
                                urutan={2}
                                label="Jawaban Kosong"
                                nilai={jumlahKosong}
                                ikon={
                                    <BulatanIkon latar="bg-siswa-titik-terisi text-white">
                                        <svg className={kelasGlif} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                                            <path d="M6 12h12" />
                                        </svg>
                                    </BulatanIkon>
                                }
                            />
                            <KartuStat
                                urutan={3}
                                label="Waktu Pengerjaan"
                                nilai={formatDurasi(pengerjaan?.started_at, pengerjaan?.finished_at)}
                                ikon={
                                    <BulatanIkon latar="bg-edvora-primary text-white">
                                        <svg className={kelasGlif} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                                            <circle cx="12" cy="12" r="8" />
                                            <path d="M12 8v4l2.5 1.5" />
                                        </svg>
                                    </BulatanIkon>
                                }
                            />
                            <KartuStat
                                urutan={4}
                                label="Poin"
                                nilai={hasil.poin}
                                ikon={
                                    <BulatanIkon latar="bg-siswa-badge-subtes text-edvora-primary">
                                        <svg className={kelasGlif} viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7 2h10l-2 6H9L7 2zm5 7a6.5 6.5 0 110 13 6.5 6.5 0 010-13zm0 2.8l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4 1.2-2.4z" />
                                        </svg>
                                    </BulatanIkon>
                                }
                            />
                            <KartuStat
                                urutan={5}
                                label="XP Diperoleh"
                                nilai={`+${hasil.xpDidapat} XP`}
                                ikon={<BulatanIkon latar="bg-[#DCDDF7] text-[10px] font-bold text-siswa-judul">XP</BulatanIkon>}
                            />
                        </div>

                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between md:mt-12">
                            <button
                                type="button"
                                onClick={() => router.visit(route('latihan.index'))}
                                className="h-11 rounded-[10px] border border-siswa-ujian-garis bg-siswa-panel-fleksibel px-6 text-sm font-semibold text-siswa-judul shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md md:text-base"
                            >
                                ← Kembali ke Menu Latihan Soal
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    router.visit(
                                        pengerjaan
                                            ? route('riwayat.detail', { pengerjaanId: pengerjaan.id })
                                            : route('riwayat.index'),
                                    )
                                }
                                className="h-11 rounded-[10px] bg-ujian-biru px-8 text-sm font-semibold text-white shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-md md:text-base"
                            >
                                Lihat Pembahasan Soal →
                            </button>
                        </div>
                    </div>
                </section>

                {ringkasanTopik.length > 0 && (
                    <section className="mt-6 animate-muncul-halus rounded-[24px] bg-white px-5 py-5 shadow-kartu [animation-delay:200ms] [animation-fill-mode:both] md:px-8">
                        <h2 className="text-base font-semibold text-siswa-judul md:text-lg">Perubahan Penguasaan Topik</h2>
                        <div className="mt-4 space-y-3">
                            {ringkasanTopik.map((topik) => (
                                <KartuTopik key={topik.id} topik={topik} />
                            ))}
                        </div>
                    </section>
                )}

                {rekomendasiTopik.length > 0 && (
                    <section className="mt-6 animate-muncul-halus rounded-[24px] bg-white px-5 py-5 shadow-kartu [animation-delay:300ms] [animation-fill-mode:both] md:px-8">
                        <h2 className="text-base font-semibold text-siswa-judul md:text-lg">Topik yang disarankan untuk dilatih berikutnya</h2>
                        <ul className="mt-3 space-y-2">
                            {rekomendasiTopik.map((topik) => (
                                <li key={topik.id} className="rounded-[14px] bg-siswa-panel-fleksibel px-4 py-3 text-sm text-siswa-judul">
                                    <span className="font-semibold">{topik.nama}</span>
                                    <span className="text-siswa-teks"> · Tahap {topik.tahap} · {TEKS_LABEL[topik.label]}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </LatihanLayout>
    );
}

function Trofi() {
    return (
        <svg className="h-14 w-14 md:h-[88px] md:w-[88px]" viewBox="0 0 120 120" aria-hidden="true">
            <path d="M30 22c-14 0-18 8-16 17 2 10 12 16 22 17" fill="none" stroke="#F2B233" strokeWidth="7" strokeLinecap="round" />
            <path d="M90 22c14 0 18 8 16 17-2 10-12 16-22 17" fill="none" stroke="#F2B233" strokeWidth="7" strokeLinecap="round" />
            <path d="M28 14h64v22c0 20-14 36-32 36S28 56 28 36V14z" fill="#F7C548" />
            <path d="M60 14h32v22c0 20-14 36-32 36V14z" fill="#F2B233" />
            <rect x="53" y="70" width="14" height="16" fill="#E0A020" />
            <path d="M40 86h40l4 14H36l4-14z" fill="#F2B233" />
            <rect x="32" y="98" width="56" height="9" rx="2" fill="#E0A020" />
            <circle cx="60" cy="38" r="13" fill="#FFE08A" stroke="#E0A020" strokeWidth="2" />
            <text x="60" y="44" textAnchor="middle" fontSize="16" fontWeight="700" fill="#C98A10" fontFamily="Poppins, sans-serif">1</text>
        </svg>
    );
}
