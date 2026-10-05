import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx,ts,tsx}',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
                jakarta: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
                poppins: ['Poppins', ...defaultTheme.fontFamily.sans],
                figtree: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                edvora: {
                    brand: '#2E4C93',
                    primary: '#5B88DD',
                    'primary-hover': '#4a75c7',
                    gradientStart: '#9DC5EE',
                    gradientEnd: '#5B88DD',
                },

                // Token desain Figma EDVORA — frame Beranda (node 641:3423).
                // Dipakai sidebar, topbar, dan kartu-kartu Beranda. Jangan hardcode warnanya lagi di komponen.
                siswa: {
                    // Latar halaman dan sidebar
                    'laman-awal': '#F2F7FD',
                    'laman-akhir': '#E5EAF0',
                    'sidebar-awal': '#495FA0',
                    'sidebar-tengah': '#2C3F73',
                    'sidebar-akhir': '#202E51',
                    // Pil menu sidebar yang sedang aktif
                    'nav-awal': '#6690DF',
                    'nav-tengah': '#5B88DD',
                    'nav-akhir': '#4F77C1',
                    // Banner sapaan
                    'banner-awal': '#B2D2FF',
                    'banner-akhir': '#6285C5',
                    // Teks
                    judul: '#26355D',
                    'judul-kartu': 'rgba(0,0,0,0.7)',
                    teks: '#6B7285',
                    'judul-seksi': '#4D4D4D',
                    subtes: '#4E84C1',
                    // Latar ikon dan badge
                    'badge-subtes': '#E7F2FF',
                    'ikon-latihan': '#CAE9FD',
                    'ikon-tryout': '#D2F4BB',
                    // Cincin penguasaan
                    'cincin-dasar': '#D9D9D9',
                    'cincin-naik': '#FFAE4C',
                    'cincin-rendah': '#E75E7E',
                    // Teks keterangan kecil, mis. "10 Topik" di kartu Pilih Subtes
                    'teks-redup': '#B5B5B5',

                    // Pilih Mode (Figma node 665:6549, 667:6666, 667:6718, 667:6769)
                    // Garis tipis kotak kecil (centang, kotak ikon, kotak info, tombol −/+).
                    // Figma memakai #A5ABB0; dilunakkan supaya senada dengan kartu subtes yang tanpa garis.
                    'garis-halus': '#D6DCE4',
                    'panel-fleksibel': '#E6F2FF', // latar panel Fleksibel, daftar topik, kotak jumlah soal
                    'panel-terkunci': '#E2E2E2', // latar panel Remedial Belum Tersedia
                    'ubin-simulasi': '#7D1919', // kotak ikon di info Simulasi
                    'ubin-remedial': '#B89130', // kotak ikon di info Remedial
                    'tab-teks': '#5078C3', // tab mode yang tidak aktif
                    'tab-nonaktif': '#999999', // tab Remedial saat belum ada soal remedial
                    centang: '#537BC7', // kotak centang topik yang terpilih
                    // Latar kotak ikon panel mode saat di-hover: versi pucat warna tiap mode,
                    // supaya ikon yang warnanya tetap (navy, merah tua, emas, abu) masih terlihat jelas.
                    'ikon-hover-fleksibel': '#D4E6FF',
                    'ikon-hover-simulasi': '#F6DADB',
                    'ikon-hover-remedial': '#F3EACB',
                    'ikon-hover-terkunci': '#EDEDED',

                    // Halaman pengerjaan Latihan (Figma node 669:7082, 706:7304, 725:8081, 759:784).
                    'ujian-garis': '#D3D8E0', // garis bulatan nomor soal dan kotak opsi
                    'ujian-redup': '#BFC3C8', // tombol Simpan Jawaban saat belum ada pilihan
                    'hint-latar': '#FFF3B8',
                    'hint-garis': '#F2E08C',
                    'hint-teks': '#6B5B12',
                    'umpan-benar': '#EAFADF', // kartu "Jawaban Benar"
                    'umpan-benar-teks': '#4C9A3A',
                    'umpan-salah': '#FFE3E3', // kartu "Jawaban Salah"
                    'umpan-salah-teks': '#D64545',
                    'umpan-kosong': '#EEF0F3', // kartu "Tidak Dijawab" di Pembahasan
                    'ikon-salah': '#9B1C1C', // bulatan × merah tua di label Salah dan kartu Jawaban Salah
                    // Titik keterangan di kartu Navigasi Soal
                    'titik-benar': '#34C759',
                    'titik-salah': '#E04848',
                    'titik-terisi': '#A0A4AB',
                },

                // Warna identitas tiap subtes (Figma frame Pilih Subtes, node 641:3459):
                // dipakai untuk garis atas kartu sekaligus lingkaran kodenya.
                subtes: {
                    pu: '#B5D8EF',
                    ppu: '#F3AAAA',
                    pbm: '#9BC840',
                    pk: '#AFB8F0',
                    lbi: '#EEBB4E',
                    lbe: '#EFB4E7',
                    pm: '#5BCC88',
                },
                brand: {
                    navy: '#22385D',
                    blue: '#5B88DD',
                    blueHover: '#4974c7',
                    lightBlue: '#C9E6FA',
                    inputBg: '#E9F3FC',
                    inputBorder: '#D2E3F4',
                    grayText: '#556A86',
                },
                "on-tertiary-container": "#fefcff",
                "inverse-primary": "#adc6ff",
                "secondary": "#39637d",
                "surface-bright": "#faf8ff",
                "on-secondary-fixed-variant": "#1e4b64",
                "primary-container": "#4473c6",
                "inverse-on-surface": "#eef0ff",
                "on-secondary": "#ffffff",
                "on-error": "#ffffff",
                "surface": "#faf8ff",
                "secondary-fixed": "#c7e7ff",
                "background": "#faf8ff",
                "surface-container-lowest": "#ffffff",
                "on-error-container": "#93000a",
                "secondary-fixed-dim": "#a2ccea",
                "tertiary-container": "#3d74c7",
                "on-tertiary": "#ffffff",
                "outline": "#737783",
                "surface-container-highest": "#dae1ff",
                "on-primary-fixed-variant": "#004494",
                "surface-container-high": "#e2e7ff",
                "error": "#ba1a1a",
                "tertiary-fixed": "#d7e3ff",
                "on-tertiary-fixed-variant": "#00458e",
                "on-surface": "#081940",
                "on-primary-container": "#fefcff",
                "on-secondary-container": "#3a647e",
                "outline-variant": "#c3c6d3",
                "primary": "#275aac",
                "secondary-container": "#b5dffe",
                "on-primary": "#ffffff",
                "surface-container-low": "#f2f3ff",
                "primary-fixed": "#d8e2ff",
                "surface-dim": "#cfd9ff",
                "tertiary": "#1c5bac",
                "primary-fixed-dim": "#adc6ff",
                "on-background": "#081940",
                "on-surface-variant": "#434751",
                "on-tertiary-fixed": "#001b3f",
                "tertiary-fixed-dim": "#abc7ff",
                "surface-variant": "#dae1ff",
                "inverse-surface": "#202f56",
                "on-primary-fixed": "#001a41",
                "on-secondary-fixed": "#001e2e",
                "surface-tint": "#2a5cae",
                "error-container": "#ffdad6",
                "surface-container": "#eaedff",
            },
            spacing: {
                "space-xs": "0.25rem",
                "margin": "2.5rem",
                "margin-mobile": "1.25rem",
                "space-lg": "1.5rem",
                "gutter": "1.5rem",
                "gutter-mobile": "1rem",
                "space-sm": "0.5rem",
                "space-xl": "2.5rem",
                "space-md": "1rem",
                // Lebar sidebar siswa (Figma: 254px).
                sidebar: '254px',
            },
            borderRadius: {
                "DEFAULT": "1rem",
                // Radius dari desain Beranda.
                kartu: '17px',
                nav: '16px',
                item: '9px',
                subtes: '12.839px',
                panel: '21px', // panel besar Pilih Mode
                tombol: '20px', // pil tab aktif dan tombol Mulai Mengerjakan
            },
            boxShadow: {
                // Bayangan kartu & topbar dari desain Beranda.
                kartu: '0 0 10px 10px rgba(0,0,0,0.05)',
                // Bayangan panel, tab, dan tombol di Pilih Mode.
                panel: '1.2px 1.2px 3.42px 0 rgba(0,0,0,0.17)',
                // Bayangan kotak kecil (kotak ikon, kotak info, kotak centang) di Pilih Mode.
                ubin: '1.51px 1.51px 4.305px 0 rgba(0,0,0,0.17)',
            },
            keyframes: {
                // Daftar dropdown muncul memudar sambil sedikit membesar dari atas.
                'buka-menu': {
                    from: { opacity: '0', transform: 'translateY(-4px) scale(0.97)' },
                    to: { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                // Garis Grafik Try Out tergambar dari kiri ke kanan (dipakai dengan pathLength 1).
                'gambar-garis': {
                    to: { strokeDashoffset: '0' },
                },
                // Isi tab yang baru dibuka muncul pelan sambil sedikit naik.
                'muncul-halus': {
                    from: { opacity: '0', transform: 'translateY(8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                // Garis cahaya miring bergerak dari luar kiri ke luar kanan, lalu diam di luar (sisa 43%) sebagai jeda.
                kilau: {
                    '0%': { transform: 'translateX(-150%) skewX(-40deg)' },
                    '57%, 100%': { transform: 'translateX(350%) skewX(-40deg)' },
                },
            },
            animation: {
                'buka-menu': 'buka-menu 160ms ease-out',
                'gambar-garis': 'gambar-garis 900ms ease-out forwards',
                'muncul-halus': 'muncul-halus 350ms ease-out',
                // Pantulan cahaya yang lewat di lencana "Direkomendasikan": 1,6 detik bergerak, lalu jeda sebelum lewat lagi.
                kilau: 'kilau 2.8s ease-in-out infinite',
            },
            backgroundImage: {
                // Gradasi Pilih Mode, persis dari Figma.
                'tab-aktif': 'linear-gradient(to right, #658FDF, #4F77C2)',
                'tombol-mulai': 'linear-gradient(176deg, #658FDF 32.91%, #4B71BA 74.222%)',
                'panel-simulasi': 'linear-gradient(to right, #F6E5E5, #EED1D2)',
                'panel-remedial': 'linear-gradient(92.69deg, #F1EBD4 0.599%, #EFE8CB 99.511%)',
                'ubin-fleksibel': 'linear-gradient(to bottom, #2F569F, #5877B1)',
                'lencana-rekomendasi': 'linear-gradient(to right, #3CDE64, #34C759)',
                // Halaman pengerjaan Latihan: opsi terpilih/benar/salah dan tombol-tombolnya.
                'ujian-biru': 'linear-gradient(to right, #658FDF, #4F77C2)',
                'ujian-hijau': 'linear-gradient(to right, #74C255, #4C9A3A)',
                'ujian-merah': 'linear-gradient(to right, #EE7B7B, #D55252)',
                // Lencana peringkat 1, 2, dan 3 di podium Peringkat Try Out (Figma node 1234:2372).
                'podium-perak': 'linear-gradient(to bottom, #D7D9DD, #8F949B)',
                'podium-perunggu': 'linear-gradient(to bottom, #F2A15E, #C4532A)',
                'podium-emas': 'linear-gradient(to bottom, #FFD66B, #E9A010)',
            },
            fontSize: {
                "label-md": ["13px", { "lineHeight": "18px", "fontWeight": "600" }],
                "headline-xl": ["36px", { "lineHeight": "44px", "fontWeight": "700" }],
                "body-sm": ["12px", { "lineHeight": "18px", "fontWeight": "400" }],
                "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
                "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "700" }],
                "label-sm": ["11px", { "lineHeight": "16px", "fontWeight": "600" }],
                "display-lg": ["48px", { "lineHeight": "56px", "fontWeight": "800" }],
                "body-md": ["14px", { "lineHeight": "22px", "fontWeight": "400" }],
                "headline-xl-mobile": ["26px", { "lineHeight": "34px", "fontWeight": "700" }],
                "display-lg-mobile": ["32px", { "lineHeight": "40px", "fontWeight": "800" }],
                "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "500" }],
                "label-lg": ["15px", { "lineHeight": "20px", "fontWeight": "600" }],
            },
        },
    },

    plugins: [forms],
};
