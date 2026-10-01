import { Head, Link } from '@inertiajs/react';
import { TeksMatematika } from '@/Components/Ujian/KartuSoal'; // Pastikan path import ini sesuai dengan lokasi komponen Anda

interface OpsiJawaban {
    id: string;
    teks_opsi: string;
    is_kunci: boolean;
}

interface DetailJawaban {
    nomor: number;
    is_correct: boolean;
    skor: number;
    soal: {
        id: string;
        tipe: string;
        teks_soal: string;
        gambar_soal?: string;
        pembahasan: string;
        kunci_jawaban?: string;
    };
    jawaban_user: {
        opsi_dipilih_id?: string;
        opsi_dipilih_ids?: string;
        jawaban_isian?: string;
    };
    opsi_jawaban: OpsiJawaban[];
}

interface PembahasanProps {
    pengerjaan: {
        id: string;
        mode_latihan: string;
        nama_materi: string;
        total_skor: number;
        waktu_selesai: string;
        total_soal: number;
        total_benar: number;
        total_salah: number;
    };
    detailJawaban: DetailJawaban[];
}

export default function Pembahasan({ pengerjaan, detailJawaban }: PembahasanProps) {
    return (
        <>
            <Head title={`Pembahasan - ${pengerjaan.nama_materi}`} />

            <div className="min-h-screen bg-[#F5F8FF] font-['Poppins',sans-serif]">
                {/* Navbar / Header */}
                <header className="sticky top-0 z-40 flex h-20 items-center justify-between bg-[#344A91] px-6 shadow-md md:px-12">
                    <div className="flex items-center gap-4 text-white">
                        <Link href={route('riwayat.index')} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </Link>
                        <h1 className="text-xl font-bold tracking-wide">Kembali ke Riwayat</h1>
                    </div>
                    <div className="hidden text-right text-white md:block">
                        <p className="text-sm font-medium opacity-80">Skor Akhir</p>
                        <p className="text-2xl font-bold text-[#FFD700]">{pengerjaan.total_skor}</p>
                    </div>
                </header>

                <main className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
                    
                    {/* Panel Ringkasan */}
                    <div className="mb-10 rounded-3xl bg-white p-6 shadow-sm border border-gray-100 md:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <span className="inline-block rounded-lg bg-[#E8F0FE] px-3 py-1 text-xs font-semibold text-[#344A91]">
                                    Mode: {pengerjaan.mode_latihan}
                                </span>
                                <h2 className="mt-3 text-2xl font-bold text-[#1F2D5C]">{pengerjaan.nama_materi}</h2>
                                <p className="mt-1 text-sm font-medium text-gray-500">Diselesaikan pada: {pengerjaan.waktu_selesai}</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center rounded-2xl bg-[#F0FDF4] px-6 py-3 border border-[#DCFCE7]">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Benar</span>
                                    <span className="text-2xl font-bold text-[#22C55E]">{pengerjaan.total_benar}</span>
                                </div>
                                <div className="flex flex-col items-center rounded-2xl bg-[#FEF2F2] px-6 py-3 border border-[#FEE2E2]">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Salah</span>
                                    <span className="text-2xl font-bold text-[#EF4444]">{pengerjaan.total_salah}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Daftar Pembahasan Soal */}
                    <div className="space-y-8">
                        {detailJawaban.map((item) => (
                            <div key={item.soal.id} className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 md:p-8">
                                
                                {/* Header Soal (Nomor & Status) */}
                                <div className="mb-6 flex items-center justify-between border-b pb-4">
                                    <h3 className="text-lg font-bold text-[#344A91]">Soal No. {item.nomor}</h3>
                                    <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${item.is_correct ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEE2E2] text-[#991B1B]'}`}>
                                        {item.is_correct ? (
                                            <>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                Benar
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                Salah
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Teks Soal & Gambar */}
                                <div className="mb-6 text-base text-gray-800">
                                    <TeksMatematika teks={item.soal.teks_soal} />
                                    {item.soal.gambar_soal && (
                                        <img src={item.soal.gambar_soal} alt={`Gambar Soal ${item.nomor}`} className="mt-4 max-h-64 rounded-xl object-contain" />
                                    )}
                                </div>

                                {/* Opsi Jawaban (Pilihan Ganda) */}
                                {item.soal.tipe === 'pilihan_ganda' && (
                                    <div className="mb-8 space-y-3">
                                        {item.opsi_jawaban.map((opsi, idx) => {
                                            const isSelected = item.jawaban_user.opsi_dipilih_id === opsi.id;
                                            const isKunci = opsi.is_kunci;
                                            
                                            // Menentukan style border dan background berdasarkan jawaban user
                                            let boxStyle = 'border-gray-200 bg-white text-gray-700'; // Default
                                            
                                            if (isKunci) {
                                                boxStyle = 'border-[#4CAF50] bg-[#F0FDF4] text-[#1F2D5C] ring-1 ring-[#4CAF50]'; // Kunci Jawaban (Hijau)
                                            } else if (isSelected && !isKunci) {
                                                boxStyle = 'border-[#F07676] bg-[#FEF2F2] text-[#991B1B]'; // User milih salah (Merah)
                                            }

                                            return (
                                                <div key={opsi.id} className={`flex items-start gap-4 rounded-xl border p-4 transition ${boxStyle}`}>
                                                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isKunci ? 'bg-[#4CAF50] text-white' : isSelected && !isKunci ? 'bg-[#F07676] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <div className="flex-1 pt-0.5">
                                                        <TeksMatematika teks={opsi.teks_opsi} />
                                                    </div>
                                                    {isKunci && (
                                                        <span className="shrink-0 rounded bg-[#4CAF50] px-2 py-1 text-xs font-bold text-white shadow-sm">KUNCI</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Opsi Jawaban (Isian Singkat) */}
                                {item.soal.tipe === 'isian_singkat' && (
                                    <div className="mb-8 space-y-4">
                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Jawaban Anda</span>
                                            <span className={`mt-1 block text-lg font-medium ${item.is_correct ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                                                {item.jawaban_user.jawaban_isian || <span className="italic text-gray-400">Tidak dijawab</span>}
                                            </span>
                                        </div>
                                        {!item.is_correct && item.soal.kunci_jawaban && (
                                            <div className="rounded-xl border border-[#4CAF50] bg-[#F0FDF4] p-4">
                                                <span className="block text-xs font-bold text-[#166534] uppercase tracking-wider">Jawaban yang Benar</span>
                                                <span className="mt-1 block text-lg font-medium text-[#1F2D5C]">{item.soal.kunci_jawaban}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Teks Pembahasan Lengkap */}
                                <div className="relative mt-4">
                                    <span className="absolute -top-3 left-4 rounded-md bg-[#2E3F85] px-3 py-1 text-xs font-bold tracking-wide text-white shadow">
                                        PEMBAHASAN
                                    </span>
                                    <div className="rounded-xl bg-[#F8FAFC] px-5 pb-5 pt-7 text-sm leading-relaxed text-gray-700 shadow-inner border border-gray-100">
                                        {item.soal.pembahasan ? (
                                            <TeksMatematika teks={item.soal.pembahasan} />
                                        ) : (
                                            <p className="italic text-gray-400">Pembahasan untuk soal ini belum tersedia.</p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </>
    );
}