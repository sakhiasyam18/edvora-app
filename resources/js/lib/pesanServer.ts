import axios from 'axios';

// Pesan dari error axios untuk ditampilkan ke editor: pesan validasi Laravel (errors.*) yang pertama, pesan dari
// server (pesan), atau pesan koneksi. Dipakai halaman editor yang memanggil endpoint JSON.
export function pesanServer(e: unknown): string {
    if (!axios.isAxiosError(e) || !e.response) {
        return 'Gagal terhubung ke server. Periksa koneksi lalu coba lagi.';
    }

    const data = e.response.data ?? {};
    const validasi = data.errors ? Object.values<string[]>(data.errors)[0]?.[0] : undefined;

    if (typeof validasi === 'string') {
        return validasi;
    }

    if (typeof data.pesan === 'string') {
        return data.pesan;
    }

    // Melebihi post_max_size PHP: Laravel menolak sebelum validasi.
    if (e.response.status === 413) {
        return 'File terlalu besar.';
    }

    return `Terjadi kesalahan di server (HTTP ${e.response.status}). Coba lagi.`;
}
