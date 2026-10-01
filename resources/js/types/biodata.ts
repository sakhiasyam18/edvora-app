// resources/js/types/biodata.ts
// Props halaman Auth/Biodata dari BiodataController@index
// (kontrak: kebutuhan-konteks/RANCANGAN-universitas-prodi-leaderboard.md bagian 10.7).

export type Jenjang = 'S1' | 'D3' | 'D4';

export interface ProdiPilihan {
    id: string;
    nama: string;
    jenjang: Jenjang;
}

export interface UniversitasPilihan {
    id: string;
    nama: string;
    prodi: ProdiPilihan[]; // hanya prodi aktif, urut jenjang lalu nama
}

export interface PilihanKelas {
    nilai: string; // yang dikirim ke server
    label: string; // yang ditampilkan
}

// Juga bentuk payload POST biodata.simpan. Memakai type (bukan interface) agar cocok dengan useForm.
export type BiodataSiswa = {
    namaLengkap: string;
    kelas: string | null;
    jenisKelamin: 'laki-laki' | 'perempuan' | null;
    universitasTujuanId: string | null;
    prodiTujuanId: string | null;
};
