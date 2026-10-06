// Penilaian kekuatan kata sandi untuk indikator di halaman Daftar dan Ubah Sandi.
// Hanya petunjuk visual; aturan yang mengikat tetap validasi server (Password::defaults(), min. 8 karakter).
export function kekuatanSandi(pwd: string): { label: string; width: string; color: string } {
    if (!pwd) return { label: 'Lemah', width: 'w-1/4', color: 'bg-[#CC1010]' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score >= 3 && pwd.length >= 8) {
        return { label: 'Kuat', width: 'w-full', color: 'bg-[#10B981]' };
    } else if (score >= 2 || pwd.length >= 6) {
        return { label: 'Sedang', width: 'w-3/5', color: 'bg-[#EAA315]' };
    } else {
        return { label: 'Lemah', width: 'w-1/4', color: 'bg-[#CC1010]' };
    }
}
