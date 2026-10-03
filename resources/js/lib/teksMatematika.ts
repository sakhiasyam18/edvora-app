// Satu potong teks soal: teks biasa, atau rumus LaTeX (tanpa tanda $) yang dirender KaTeX.
export interface BagianTeks {
    rumus: boolean;
    isi: string;
}

// Aturan tanda $ harus sama dengan App\Services\TeksMatematika di backend, yang memvalidasi soal saat import:
// - teks di antara sepasang $ adalah rumus, mis. $\frac{1}{2}$;
// - \$ di luar rumus adalah tanda dolar biasa; di dalam rumus, \$ tetap perintah LaTeX dan tidak menutup rumus;
// - $ tanpa pasangan dan $$ ditampilkan apa adanya.
export function pecahTeksMatematika(teks: string): BagianTeks[] {
    const bagian: BagianTeks[] = [];
    let biasa = '';
    let i = 0;

    while (i < teks.length) {
        if (teks[i] === '\\' && teks[i + 1] === '$') {
            biasa += '$';
            i += 2;
            continue;
        }

        if (teks[i] === '$') {
            let j = i + 1;
            let rumus = '';

            // Pasangan \x di dalam rumus dibaca utuh, jadi \$ tidak menutup rumus.
            while (j < teks.length && teks[j] !== '$') {
                const langkah = teks[j] === '\\' && j + 1 < teks.length ? 2 : 1;
                rumus += teks.slice(j, j + langkah);
                j += langkah;
            }

            if (j < teks.length && rumus.trim() !== '') {
                if (biasa !== '') {
                    bagian.push({ rumus: false, isi: biasa });
                    biasa = '';
                }
                bagian.push({ rumus: true, isi: rumus });
                i = j + 1;
                continue;
            }
        }

        biasa += teks[i];
        i++;
    }

    if (biasa !== '') {
        bagian.push({ rumus: false, isi: biasa });
    }

    return bagian;
}
