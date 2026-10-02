// Tanggal dari server (ISO, UTC) ditampilkan dalam WIB, sama di perangkat mana pun.
// Contoh: "10 Oktober 2026, 23.59 WIB".
export function formatWaktuWib(iso: string): string {
    const bagian = Object.fromEntries(
        new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        })
            .formatToParts(new Date(iso))
            .map((p) => [p.type, p.value]),
    );

    return `${bagian.day} ${bagian.month} ${bagian.year}, ${bagian.hour}.${bagian.minute} WIB`;
}
