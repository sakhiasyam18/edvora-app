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
            },
            boxShadow: {
                // Bayangan kartu & topbar dari desain Beranda.
                kartu: '0 0 10px 10px rgba(0,0,0,0.05)',
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
