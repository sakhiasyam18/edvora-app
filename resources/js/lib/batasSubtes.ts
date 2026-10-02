// Timer subtes Try Out di browser. Semua waktu dalam milidetik jam browser; server tetap patokan akhirnya.

// Batas subtes: yang lebih awal antara sisaDetik dari server dan batas yang pernah disimpan untuk subtes yang sama.
// Halaman yang dipulihkan dari riwayat browser (Back lalu Forward) tidak meminta data baru ke server, jadi
// sisaDetik-nya lama; tanpa batas tersimpan, hitung mundur akan dimulai ulang dan kirim otomatis terlambat.
export function batasEfektif(sisaDetik: number, sekarangMs: number, batasTersimpanMs: number | null): number {
    const dariServer = sekarangMs + sisaDetik * 1000;

    return batasTersimpanMs !== null && batasTersimpanMs < dariServer ? batasTersimpanMs : dariServer;
}

// Sisa detik untuk tampilan: dibulatkan ke atas agar 00:00 baru tampil saat waktu benar-benar habis.
export function sisaDetikDari(batasMs: number, sekarangMs: number): number {
    return Math.max(0, Math.ceil((batasMs - sekarangMs) / 1000));
}
