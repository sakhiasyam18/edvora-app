// Memeriksa rumus LaTeX dengan KaTeX dari node_modules, versi yang sama dengan yang merender soal di frontend.
// Dipanggil App\Services\PemeriksaRumus saat import soal: php tidak bisa membaca LaTeX sendiri.
//
// Masukan (stdin):   array JSON berisi rumus tanpa tanda $, mis. ["\\frac{1}{2}", "\\sqrt{x"]
// Keluaran (stdout): array JSON dengan urutan yang sama; null bila rumus bisa ditampilkan, atau pesan error KaTeX.
//
// throwOnError mengikuti InlineMath di react-katex: rumus yang gagal di sini juga gagal di layar siswa.
const katex = require('katex');

let masukan = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (potongan) => {
    masukan += potongan;
});
process.stdin.on('end', () => {
    const hasil = JSON.parse(masukan).map((rumus) => {
        try {
            katex.renderToString(String(rumus), { displayMode: false, throwOnError: true, strict: 'ignore' });

            return null;
        } catch (e) {
            // rawMessage tidak memuat potongan rumus bergaris bawah yang sulit dibaca di terminal.
            return e.rawMessage || e.message;
        }
    });
    process.stdout.write(JSON.stringify(hasil));
});
